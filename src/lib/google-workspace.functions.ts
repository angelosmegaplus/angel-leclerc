import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const DRIVE_API = "https://www.googleapis.com/drive/v3";

async function googleToken(userId: string) {
  const { getAccessToken } = await import("./oauth/oauth.server");
  const token = await getAccessToken(userId, "google");
  if (!token) throw new Error("Google Workspace n’est pas connecté ou doit être reconnecté.");
  return token;
}

async function googleFetch(base: string, path: string, token: string, query?: Record<string, string>) {
  const url = new URL(`${base}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, value);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const text = await response.text();
  if (!response.ok) {
    console.error("[google-workspace]", url.hostname, response.status, text.slice(0, 600));
    throw new Error(`Google Workspace a refusé la requête (${response.status}).`);
  }
  return text ? JSON.parse(text) as any : {};
}

export type GoogleCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string | null;
  location: string | null;
  htmlLink: string | null;
};

export const listGoogleCalendarEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GoogleCalendarEvent[]> => {
    const token = await googleToken(context.userId);
    const now = new Date();
    const until = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const json = await googleFetch(CALENDAR_API, "/calendars/primary/events", token, {
      timeMin: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      timeMax: until.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "75",
    });

    return (json.items ?? [])
      .filter((event: any) => event?.status !== "cancelled" && (event?.start?.dateTime || event?.start?.date))
      .map((event: any) => ({
        id: String(event.id),
        title: String(event.summary || "Événement Google"),
        start: String(event.start.dateTime || `${event.start.date}T00:00:00`),
        end: event.end?.dateTime || (event.end?.date ? `${event.end.date}T00:00:00` : null),
        location: event.location ? String(event.location) : null,
        htmlLink: event.htmlLink ? String(event.htmlLink) : null,
      }));
  });

export type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  modifiedTime: string | null;
  webViewLink: string | null;
};

export const listGoogleDriveFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GoogleDriveFile[]> => {
    const token = await googleToken(context.userId);
    const json = await googleFetch(DRIVE_API, "/files", token, {
      pageSize: "50",
      orderBy: "modifiedTime desc",
      q: "trashed = false",
      fields: "files(id,name,mimeType,size,modifiedTime,webViewLink)",
    });

    return (json.files ?? []).map((file: any) => ({
      id: String(file.id),
      name: String(file.name || "Fichier Google Drive"),
      mimeType: String(file.mimeType || "application/octet-stream"),
      size: file.size ? Number(file.size) : null,
      modifiedTime: file.modifiedTime ? String(file.modifiedTime) : null,
      webViewLink: file.webViewLink ? String(file.webViewLink) : null,
    }));
  });

export const getGoogleWorkspaceHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const token = await googleToken(context.userId);
    const checks = await Promise.allSettled([
      googleFetch("https://gmail.googleapis.com/gmail/v1", "/users/me/profile", token),
      googleFetch(CALENDAR_API, "/calendars/primary", token),
      googleFetch(DRIVE_API, "/files", token, { pageSize: "1", fields: "files(id)" }),
    ]);
    return {
      connected: true,
      gmail: checks[0].status === "fulfilled",
      calendar: checks[1].status === "fulfilled",
      drive: checks[2].status === "fulfilled",
    };
  });
