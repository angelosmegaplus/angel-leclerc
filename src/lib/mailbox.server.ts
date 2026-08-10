/**
 * Boîte mail contact@angel-leclerc.fr — couche d'intégration Gmail via le
 * connecteur Lovable (connector gateway). Aucune donnée n'est simulée :
 * si la connexion n'est pas reliée au projet, les fonctions renvoient un
 * statut « non connecté » et l'interface l'affiche explicitement.
 */

const GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

export type MailFolder =
  | "inbox"
  | "sent"
  | "archive"
  | "trash"
  | "spam"
  | "unread";

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
};

function keys() {
  return {
    lovable: process.env["LOVABLE_API_KEY"],
    connection: process.env["GOOGLE_MAIL_API_KEY"],
  };
}

export function mailboxMissing(): string[] {
  const { lovable, connection } = keys();
  const missing: string[] = [];
  if (!lovable) missing.push("LOVABLE_API_KEY");
  if (!connection) missing.push("GOOGLE_MAIL_API_KEY (connecteur Gmail à relier au projet)");
  return missing;
}

async function gmail(
  path: string,
  init?: { method?: string; body?: unknown; query?: Record<string, string | undefined> },
): Promise<any> {
  const { lovable, connection } = keys();
  if (!lovable || !connection) {
    throw new Error("Boîte mail non connectée.");
  }
  const url = new URL(`${GATEWAY}${path}`);
  for (const [k, v] of Object.entries(init?.query ?? {})) {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${lovable}`,
      "X-Connection-Api-Key": connection,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`[mailbox] Gmail ${res.status}: ${text}`);
    throw new Error(`Gmail a refusé la requête (${res.status}) : ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : {};
}

export async function getStatus(): Promise<MailboxStatus> {
  const missing = mailboxMissing();
  if (missing.length > 0) return { connected: false, missing, address: null };
  try {
    const profile = await gmail("/users/me/profile");
    return { connected: true, missing: [], address: profile.emailAddress ?? null };
  } catch (e) {
    return {
      connected: false,
      missing: [e instanceof Error ? e.message : "Erreur inconnue"],
      address: null,
    };
  }
}

function folderQuery(folder: MailFolder, search: string): string {
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

function header(headers: any[], name: string): string {
  const found = headers?.find(
    (h) => String(h.name).toLowerCase() === name.toLowerCase(),
  );
  return found?.value ?? "";
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

function extractBody(payload: any): string {
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
    const nested = extractBody(part);
    if (nested) return nested;
  }
  return "";
}

function toSummary(message: any): MailSummary {
  const headers = message.payload?.headers ?? [];
  return {
    id: message.id,
    threadId: message.threadId,
    from: header(headers, "From"),
    to: header(headers, "To"),
    subject: header(headers, "Subject") || "(sans objet)",
    snippet: message.snippet ?? "",
    date: header(headers, "Date"),
    unread: (message.labelIds ?? []).includes("UNREAD"),
  };
}

export async function listMail(
  folder: MailFolder,
  search: string,
): Promise<MailSummary[]> {
  const list = await gmail("/users/me/messages", {
    query: {
      maxResults: "25",
      q: folderQuery(folder, search),
      includeSpamTrash: folder === "trash" || folder === "spam" ? "true" : undefined,
    },
  });
  const ids: Array<{ id: string }> = list.messages ?? [];
  const details = await Promise.all(
    ids.map((m) =>
      gmail(`/users/me/messages/${m.id}`, {
        query: { format: "metadata" },
      }).catch(() => null),
    ),
  );
  return details.filter(Boolean).map(toSummary);
}

export async function readMail(id: string): Promise<MailDetail> {
  const message = await gmail(`/users/me/messages/${id}`, {
    query: { format: "full" },
  });
  return { ...toSummary(message), body: extractBody(message.payload) };
}

export type MailAction =
  | "read"
  | "unread"
  | "archive"
  | "trash"
  | "untrash"
  | "spam"
  | "unspam";

export async function actOnMail(id: string, action: MailAction): Promise<void> {
  if (action === "trash") {
    await gmail(`/users/me/messages/${id}/trash`, { method: "POST" });
    return;
  }
  if (action === "untrash") {
    await gmail(`/users/me/messages/${id}/untrash`, { method: "POST" });
    return;
  }
  const map: Record<string, { addLabelIds?: string[]; removeLabelIds?: string[] }> = {
    read: { removeLabelIds: ["UNREAD"] },
    unread: { addLabelIds: ["UNREAD"] },
    archive: { removeLabelIds: ["INBOX"] },
    spam: { addLabelIds: ["SPAM"], removeLabelIds: ["INBOX"] },
    unspam: { removeLabelIds: ["SPAM"], addLabelIds: ["INBOX"] },
  };
  await gmail(`/users/me/messages/${id}/modify`, {
    method: "POST",
    body: map[action],
  });
}

function encodeRaw(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sendMail(input: {
  to: string;
  subject: string;
  body: string;
  threadId?: string | undefined;
}): Promise<void> {
  const mime = [
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "MIME-Version: 1.0",
    "",
    input.body,
  ].join("\r\n");
  await gmail("/users/me/messages/send", {
    method: "POST",
    body: input.threadId
      ? { raw: encodeRaw(mime), threadId: input.threadId }
      : { raw: encodeRaw(mime) },
  });
}
