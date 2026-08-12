/**
 * Boîte mail Angel OS.
 * Priorité : OAuth Google natif stocké dans oauth_connections.
 * Secours : ancien connecteur Lovable Gmail s'il est encore configuré.
 * Aucune donnée n'est simulée.
 */

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";
const LOVABLE_GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

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
  provider?: "google" | "lovable-google" | null;
  reconnectRequired?: boolean;
};

type RequestInitLite = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | undefined>;
};

type Transport = {
  provider: "google" | "lovable-google";
  request: (path: string, init?: RequestInitLite) => Promise<any>;
};

function buildUrl(base: string, path: string, query?: Record<string, string | undefined>) {
  const url = new URL(`${base}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }
  return url;
}

async function nativeGoogleTransport(userId: string): Promise<Transport | null> {
  try {
    const { getAccessToken } = await import("./oauth/oauth.server");
    const token = await getAccessToken(userId, "google");
    if (!token) return null;
    return {
      provider: "google",
      request: async (path, init) => {
        const response = await fetch(buildUrl(GMAIL_API, path, init?.query), {
          method: init?.method ?? "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(init?.body ? { "Content-Type": "application/json" } : {}),
          },
          ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
        });
        const text = await response.text();
        if (!response.ok) {
          console.error(`[mailbox] Google ${response.status}: ${text}`);
          throw new Error(`Google Mail a refusé la requête (${response.status}).`);
        }
        return text ? JSON.parse(text) : {};
      },
    };
  } catch (error) {
    console.error("[mailbox] OAuth Google natif indisponible", error);
    return null;
  }
}

function lovableTransport(): Transport | null {
  const lovable = process.env["LOVABLE_API_KEY"];
  const connection = process.env["GOOGLE_MAIL_API_KEY"];
  if (!lovable || !connection) return null;
  return {
    provider: "lovable-google",
    request: async (path, init) => {
      const response = await fetch(buildUrl(LOVABLE_GATEWAY, path, init?.query), {
        method: init?.method ?? "GET",
        headers: {
          Authorization: `Bearer ${lovable}`,
          "X-Connection-Api-Key": connection,
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
        },
        ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
      });
      const text = await response.text();
      if (!response.ok) {
        console.error(`[mailbox] Lovable Gmail ${response.status}: ${text}`);
        throw new Error(`Connecteur Gmail Lovable indisponible (${response.status}).`);
      }
      return text ? JSON.parse(text) : {};
    },
  };
}

async function getTransport(userId: string): Promise<Transport> {
  const native = await nativeGoogleTransport(userId);
  if (native) return native;
  const fallback = lovableTransport();
  if (fallback) return fallback;
  throw new Error("Aucune connexion Google Mail active. Connectez ou reconnectez Google depuis Angel OS → Connexions.");
}

export async function getStatus(userId: string): Promise<MailboxStatus> {
  const native = await nativeGoogleTransport(userId);
  if (native) {
    try {
      const profile = await native.request("/users/me/profile");
      return { connected: true, missing: [], address: profile.emailAddress ?? null, provider: "google", reconnectRequired: false };
    } catch (error) {
      return { connected: false, missing: [error instanceof Error ? error.message : "Connexion Google à vérifier"], address: null, provider: "google", reconnectRequired: true };
    }
  }

  const fallback = lovableTransport();
  if (fallback) {
    try {
      const profile = await fallback.request("/users/me/profile");
      return { connected: true, missing: [], address: profile.emailAddress ?? null, provider: "lovable-google", reconnectRequired: false };
    } catch (error) {
      return { connected: false, missing: [error instanceof Error ? error.message : "Connecteur Gmail Lovable à vérifier"], address: null, provider: "lovable-google", reconnectRequired: true };
    }
  }

  return {
    connected: false,
    missing: ["Connexion Google Workspace requise dans Angel OS"],
    address: null,
    provider: null,
    reconnectRequired: false,
  };
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

export async function listMail(userId: string, folder: MailFolder, search: string): Promise<MailSummary[]> {
  const mail = await getTransport(userId);
  const list = await mail.request("/users/me/messages", {
    query: {
      maxResults: "25",
      q: folderQuery(folder, search),
      includeSpamTrash: folder === "trash" || folder === "spam" ? "true" : undefined,
    },
  });
  const ids: Array<{ id: string }> = list.messages ?? [];
  const details = await Promise.all(
    ids.map((m) => mail.request(`/users/me/messages/${m.id}`, { query: { format: "metadata" } }).catch(() => null)),
  );
  return details.filter(Boolean).map(toSummary);
}

export async function readMail(userId: string, id: string): Promise<MailDetail> {
  const mail = await getTransport(userId);
  const message = await mail.request(`/users/me/messages/${id}`, { query: { format: "full" } });
  return { ...toSummary(message), body: extractBody(message.payload) };
}

export type MailAction = "read" | "unread" | "archive" | "trash" | "untrash" | "spam" | "unspam";

export async function actOnMail(userId: string, id: string, action: MailAction): Promise<void> {
  const mail = await getTransport(userId);
  if (action === "trash") {
    await mail.request(`/users/me/messages/${id}/trash`, { method: "POST" });
    return;
  }
  if (action === "untrash") {
    await mail.request(`/users/me/messages/${id}/untrash`, { method: "POST" });
    return;
  }
  const map: Record<string, { addLabelIds?: string[]; removeLabelIds?: string[] }> = {
    read: { removeLabelIds: ["UNREAD"] },
    unread: { addLabelIds: ["UNREAD"] },
    archive: { removeLabelIds: ["INBOX"] },
    spam: { addLabelIds: ["SPAM"], removeLabelIds: ["INBOX"] },
    unspam: { removeLabelIds: ["SPAM"], addLabelIds: ["INBOX"] },
  };
  await mail.request(`/users/me/messages/${id}/modify`, { method: "POST", body: map[action] });
}

function encodeRaw(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sendMail(
  userId: string,
  input: { to: string; subject: string; body: string; threadId?: string | undefined },
): Promise<void> {
  const mail = await getTransport(userId);
  const mime = [
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "MIME-Version: 1.0",
    "",
    input.body,
  ].join("\r\n");
  await mail.request("/users/me/messages/send", {
    method: "POST",
    body: input.threadId ? { raw: encodeRaw(mime), threadId: input.threadId } : { raw: encodeRaw(mime) },
  });
}
