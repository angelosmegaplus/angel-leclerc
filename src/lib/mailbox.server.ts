/**
 * Boîte mail native Angel OS.
 *
 * Aucun proxy Lovable :
 * - Google -> Gmail API officielle
 * - Microsoft -> Microsoft Graph officiel
 *
 * Les access tokens sont obtenus côté serveur via le moteur OAuth Angel OS et
 * ne sont jamais exposés au navigateur.
 */

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";
const GRAPH_API = "https://graph.microsoft.com/v1.0";

export type MailFolder = "inbox" | "sent" | "archive" | "trash" | "spam" | "unread";

export type MailSummary = {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
};

export type MailDetail = MailSummary & { body: string };

export type MailboxStatus = {
  connected: boolean;
  missing: string[];
  address: string | null;
  provider?: "google" | "microsoft" | null;
  reconnectRequired?: boolean;
};

export type MailAction = "read" | "unread" | "archive" | "trash" | "untrash" | "spam" | "unspam";

type Provider = "google" | "microsoft";

type NativeTransport = {
  provider: Provider;
  token: string;
};

async function getNativeTransport(userId: string): Promise<NativeTransport | null> {
  const { getAccessToken } = await import("./oauth/oauth.server");

  const google = await getAccessToken(userId, "google").catch(() => null);
  if (google) return { provider: "google", token: google };

  const microsoft = await getAccessToken(userId, "microsoft").catch(() => null);
  if (microsoft) return { provider: "microsoft", token: microsoft };

  return null;
}

async function getTransport(userId: string): Promise<NativeTransport> {
  const transport = await getNativeTransport(userId);
  if (transport) return transport;
  throw new Error(
    "Aucune boîte mail native active. Connectez Google Workspace ou Microsoft 365 depuis Angel OS → Connexions.",
  );
}

async function apiRequest(
  base: string,
  path: string,
  token: string,
  init?: { method?: string; body?: unknown; query?: Record<string, string | undefined>; headers?: Record<string, string> },
) {
  const url = new URL(`${base}${path}`);
  for (const [key, value] of Object.entries(init?.query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`[mailbox] ${url.hostname} ${response.status}: ${text.slice(0, 500)}`);
    throw new Error(`Le fournisseur mail a refusé la requête (${response.status}).`);
  }
  return text ? (JSON.parse(text) as any) : {};
}

function gmailRequest(transport: NativeTransport, path: string, init?: Parameters<typeof apiRequest>[3]) {
  return apiRequest(GMAIL_API, path, transport.token, init);
}

function graphRequest(transport: NativeTransport, path: string, init?: Parameters<typeof apiRequest>[3]) {
  return apiRequest(GRAPH_API, path, transport.token, init);
}

export async function getStatus(userId: string): Promise<MailboxStatus> {
  const transport = await getNativeTransport(userId);
  if (!transport) {
    return {
      connected: false,
      missing: ["Connexion Google Workspace ou Microsoft 365 requise dans Angel OS"],
      address: null,
      provider: null,
      reconnectRequired: false,
    };
  }

  try {
    if (transport.provider === "google") {
      const profile = await gmailRequest(transport, "/users/me/profile");
      return {
        connected: true,
        missing: [],
        address: profile.emailAddress ?? null,
        provider: "google",
        reconnectRequired: false,
      };
    }

    const profile = await graphRequest(transport, "/me", {
      query: { "$select": "mail,userPrincipalName,displayName" },
    });
    return {
      connected: true,
      missing: [],
      address: profile.mail ?? profile.userPrincipalName ?? null,
      provider: "microsoft",
      reconnectRequired: false,
    };
  } catch (error) {
    return {
      connected: false,
      missing: [error instanceof Error ? error.message : "Connexion mail à vérifier"],
      address: null,
      provider: transport.provider,
      reconnectRequired: true,
    };
  }
}

/* ---------------------------------------------------------------- Gmail */

function gmailFolderQuery(folder: MailFolder, search: string): string {
  const base: Record<MailFolder, string> = {
    inbox: "in:inbox",
    sent: "in:sent",
    archive: "-in:inbox -in:sent -in:trash -in:spam -in:drafts",
    trash: "in:trash",
    spam: "in:spam",
    unread: "is:unread",
  };
  return [base[folder], search.trim()].filter(Boolean).join(" ");
}

function gmailHeader(headers: any[], name: string): string {
  return headers?.find((h) => String(h.name).toLowerCase() === name.toLowerCase())?.value ?? "";
}

function decodeB64(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    const bin = atob(normalized);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
}

function extractGmailBody(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data) return decodeB64(payload.body.data);
  const parts: any[] = payload.parts ?? [];
  const html = parts.find((p) => p.mimeType === "text/html");
  if (html?.body?.data) return decodeB64(html.body.data);
  const text = parts.find((p) => p.mimeType === "text/plain");
  if (text?.body?.data) {
    return decodeB64(text.body.data)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/\n/g, "<br/>");
  }
  for (const part of parts) {
    const nested = extractGmailBody(part);
    if (nested) return nested;
  }
  return "";
}

function gmailSummary(message: any): MailSummary {
  const headers = message.payload?.headers ?? [];
  return {
    id: message.id,
    threadId: message.threadId,
    from: gmailHeader(headers, "From"),
    to: gmailHeader(headers, "To"),
    subject: gmailHeader(headers, "Subject") || "(sans objet)",
    snippet: message.snippet ?? "",
    date: gmailHeader(headers, "Date"),
    unread: (message.labelIds ?? []).includes("UNREAD"),
  };
}

/* -------------------------------------------------------------- Microsoft */

const GRAPH_FOLDER: Record<Exclude<MailFolder, "unread">, string> = {
  inbox: "inbox",
  sent: "sentitems",
  archive: "archive",
  trash: "deleteditems",
  spam: "junkemail",
};

function graphAddress(value: any): string {
  const address = value?.emailAddress?.address ?? "";
  const name = value?.emailAddress?.name ?? "";
  return name && address ? `${name} <${address}>` : address || name;
}

function graphRecipients(values: any[]): string {
  return (values ?? []).map(graphAddress).filter(Boolean).join(", ");
}

function graphSummary(message: any): MailSummary {
  return {
    id: message.id,
    threadId: message.conversationId ?? message.id,
    from: graphAddress(message.from),
    to: graphRecipients(message.toRecipients ?? []),
    subject: message.subject || "(sans objet)",
    snippet: message.bodyPreview ?? "",
    date: message.receivedDateTime ?? message.sentDateTime ?? "",
    unread: message.isRead === false,
  };
}

async function graphList(
  transport: NativeTransport,
  folder: MailFolder,
  search: string,
): Promise<MailSummary[]> {
  const folderId = folder === "unread" ? "inbox" : GRAPH_FOLDER[folder];
  const result = await graphRequest(transport, `/me/mailFolders/${folderId}/messages`, {
    query: {
      "$top": "50",
      "$select": "id,conversationId,from,toRecipients,subject,bodyPreview,receivedDateTime,sentDateTime,isRead",
      "$orderby": "receivedDateTime desc",
      ...(folder === "unread" ? { "$filter": "isRead eq false" } : {}),
    },
  });
  let rows = (result.value ?? []).map(graphSummary) as MailSummary[];
  const needle = search.trim().toLocaleLowerCase("fr");
  if (needle) {
    rows = rows.filter((row) =>
      `${row.from} ${row.to} ${row.subject} ${row.snippet}`.toLocaleLowerCase("fr").includes(needle),
    );
  }
  return rows.slice(0, 25);
}

/* ---------------------------------------------------------------- Public */

export async function listMail(userId: string, folder: MailFolder, search: string): Promise<MailSummary[]> {
  const transport = await getTransport(userId);
  if (transport.provider === "microsoft") return graphList(transport, folder, search);

  const list = await gmailRequest(transport, "/users/me/messages", {
    query: {
      maxResults: "25",
      q: gmailFolderQuery(folder, search),
      includeSpamTrash: folder === "trash" || folder === "spam" ? "true" : undefined,
    },
  });
  const ids: Array<{ id: string }> = list.messages ?? [];
  const details = await Promise.all(
    ids.map((m) =>
      gmailRequest(transport, `/users/me/messages/${m.id}`, { query: { format: "metadata" } }).catch(() => null),
    ),
  );
  return details.filter(Boolean).map(gmailSummary);
}

export async function readMail(userId: string, id: string): Promise<MailDetail> {
  const transport = await getTransport(userId);
  if (transport.provider === "microsoft") {
    const message = await graphRequest(transport, `/me/messages/${encodeURIComponent(id)}`, {
      query: {
        "$select": "id,conversationId,from,toRecipients,subject,bodyPreview,body,receivedDateTime,sentDateTime,isRead",
      },
    });
    return { ...graphSummary(message), body: message.body?.content ?? "" };
  }

  const message = await gmailRequest(transport, `/users/me/messages/${id}`, { query: { format: "full" } });
  return { ...gmailSummary(message), body: extractGmailBody(message.payload) };
}

export async function actOnMail(userId: string, id: string, action: MailAction): Promise<void> {
  const transport = await getTransport(userId);

  if (transport.provider === "microsoft") {
    if (action === "read" || action === "unread") {
      await graphRequest(transport, `/me/messages/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: { isRead: action === "read" },
      });
      return;
    }
    const destinationId: Record<Exclude<MailAction, "read" | "unread">, string> = {
      archive: "archive",
      trash: "deleteditems",
      untrash: "inbox",
      spam: "junkemail",
      unspam: "inbox",
    };
    await graphRequest(transport, `/me/messages/${encodeURIComponent(id)}/move`, {
      method: "POST",
      body: { destinationId: destinationId[action] },
    });
    return;
  }

  if (action === "trash") {
    await gmailRequest(transport, `/users/me/messages/${id}/trash`, { method: "POST" });
    return;
  }
  if (action === "untrash") {
    await gmailRequest(transport, `/users/me/messages/${id}/untrash`, { method: "POST" });
    return;
  }
  const map: Record<string, { addLabelIds?: string[]; removeLabelIds?: string[] }> = {
    read: { removeLabelIds: ["UNREAD"] },
    unread: { addLabelIds: ["UNREAD"] },
    archive: { removeLabelIds: ["INBOX"] },
    spam: { addLabelIds: ["SPAM"], removeLabelIds: ["INBOX"] },
    unspam: { removeLabelIds: ["SPAM"], addLabelIds: ["INBOX"] },
  };
  await gmailRequest(transport, `/users/me/messages/${id}/modify`, { method: "POST", body: map[action] });
}

function encodeRaw(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sendMail(
  userId: string,
  input: { to: string; subject: string; body: string; threadId?: string | undefined },
): Promise<void> {
  const transport = await getTransport(userId);

  if (transport.provider === "microsoft") {
    if (input.threadId) {
      const result = await graphRequest(transport, "/me/messages", {
        query: {
          "$top": "1",
          "$select": "id,conversationId,receivedDateTime",
          "$filter": `conversationId eq '${input.threadId.replace(/'/g, "''")}'`,
          "$orderby": "receivedDateTime desc",
        },
      }).catch(() => ({ value: [] }));
      const target = result.value?.[0]?.id as string | undefined;
      if (target) {
        await graphRequest(transport, `/me/messages/${encodeURIComponent(target)}/reply`, {
          method: "POST",
          body: { comment: input.body },
        });
        return;
      }
    }

    await graphRequest(transport, "/me/sendMail", {
      method: "POST",
      body: {
        message: {
          subject: input.subject,
          body: { contentType: "Text", content: input.body },
          toRecipients: [{ emailAddress: { address: input.to } }],
        },
        saveToSentItems: true,
      },
    });
    return;
  }

  const mime = [
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "MIME-Version: 1.0",
    "",
    input.body,
  ].join("\r\n");
  await gmailRequest(transport, "/users/me/messages/send", {
    method: "POST",
    body: input.threadId ? { raw: encodeRaw(mime), threadId: input.threadId } : { raw: encodeRaw(mime) },
  });
}
