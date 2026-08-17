import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const PEOPLE_API = "https://people.googleapis.com/v1";
const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_ANALYTICS_API = "https://youtubeanalytics.googleapis.com/v2";

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

export type GoogleContact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  organization: string | null;
};

export const listGoogleContacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GoogleContact[]> => {
    const token = await googleToken(context.userId);
    const json = await googleFetch(PEOPLE_API, "/people/me/connections", token, {
      personFields: "names,emailAddresses,phoneNumbers,organizations",
      pageSize: "50",
      sortOrder: "LAST_MODIFIED_DESCENDING",
    });

    return (json.connections ?? []).map((person: any) => ({
      id: String(person.resourceName || crypto.randomUUID()),
      name: String(person.names?.[0]?.displayName || person.emailAddresses?.[0]?.value || "Contact Google"),
      email: person.emailAddresses?.[0]?.value ? String(person.emailAddresses[0].value) : null,
      phone: person.phoneNumbers?.[0]?.value ? String(person.phoneNumbers[0].value) : null,
      organization: person.organizations?.[0]?.name ? String(person.organizations[0].name) : null,
    }));
  });

export type GoogleYouTubeChannel = {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  subscribers: number | null;
  views: number | null;
  videos: number | null;
};

export const getGoogleYouTubeChannel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GoogleYouTubeChannel | null> => {
    const token = await googleToken(context.userId);
    const json = await googleFetch(YOUTUBE_API, "/channels", token, {
      part: "snippet,statistics",
      mine: "true",
      maxResults: "1",
    });
    const channel = json.items?.[0];
    if (!channel) return null;
    const stats = channel.statistics ?? {};
    return {
      id: String(channel.id),
      title: String(channel.snippet?.title || "Chaîne YouTube"),
      description: String(channel.snippet?.description || ""),
      thumbnail: channel.snippet?.thumbnails?.medium?.url || channel.snippet?.thumbnails?.default?.url || null,
      subscribers: stats.hiddenSubscriberCount ? null : Number(stats.subscriberCount ?? 0),
      views: Number(stats.viewCount ?? 0),
      videos: Number(stats.videoCount ?? 0),
    };
  });

export type GoogleYouTubeAnalytics = {
  startDate: string;
  endDate: string;
  views: number;
  estimatedMinutesWatched: number;
  subscribersGained: number;
};

export const getGoogleYouTubeAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GoogleYouTubeAnalytics> => {
    const token = await googleToken(context.userId);
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 1);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 27);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);
    const json = await googleFetch(YOUTUBE_ANALYTICS_API, "/reports", token, {
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched,subscribersGained",
    });
    const values = json.rows?.[0] ?? [0, 0, 0];
    return {
      startDate,
      endDate,
      views: Number(values[0] ?? 0),
      estimatedMinutesWatched: Number(values[1] ?? 0),
      subscribersGained: Number(values[2] ?? 0),
    };
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
