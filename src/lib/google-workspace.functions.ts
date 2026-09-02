import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const FLAMME_GOOGLE_ACCOUNT = "angelleclerc2006@gmail.com";

export type GoogleCalendarEvent = {
  id: string;
  calendarId: string;
  calendarName: string;
  title: string;
  start: string;
  end: string | null;
  location: string | null;
  htmlLink: string | null;
  allDay: boolean;
};

type CalendarRef = { id: string; name: string };

async function readCalendarEvents(
  gatewayRequest: (connector: "google_calendar", path: string, init?: any) => Promise<any>,
  calendar: CalendarRef,
  timeMin: string,
  timeMax: string,
): Promise<GoogleCalendarEvent[]> {
  const json = await gatewayRequest(
    "google_calendar",
    `/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events`,
    {
      query: {
        timeMin,
        timeMax,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: 250,
      },
    },
  );

  return (json.items ?? [])
    .filter((event: any) => event?.status !== "cancelled" && (event?.start?.dateTime || event?.start?.date))
    .map((event: any): GoogleCalendarEvent => ({
      id: `${calendar.id}:${String(event.id)}`,
      calendarId: calendar.id,
      calendarName: calendar.name,
      title: String(event.summary || "Événement Google"),
      start: String(event.start.dateTime || `${event.start.date}T00:00:00`),
      end: event.end?.dateTime || (event.end?.date ? `${event.end.date}T00:00:00` : null),
      location: event.location ? String(event.location) : null,
      htmlLink: event.htmlLink ? String(event.htmlLink) : null,
      allDay: Boolean(event.start.date && !event.start.dateTime),
    }));
}

export const listGoogleCalendarEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<GoogleCalendarEvent[]> => {
    const { gatewayRequest } = await import("./connectors/lovable-gateway.server");
    const now = new Date();
    const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // Le calendrier personnel connu est lu en premier. Cette lecture directe évite
    // qu'une permission calendarList manquante fasse apparaître un faux agenda vide.
    const primaryCalendar: CalendarRef = {
      id: process.env["GOOGLE_PRIMARY_CALENDAR_ID"]?.trim() || FLAMME_GOOGLE_ACCOUNT,
      name: FLAMME_GOOGLE_ACCOUNT,
    };

    const calendars: CalendarRef[] = [primaryCalendar];

    try {
      const calendarsJson = await gatewayRequest("google_calendar", "/calendar/v3/users/me/calendarList", {
        query: { maxResults: 100 },
      });
      for (const calendar of calendarsJson.items ?? []) {
        if (!calendar?.id || calendar?.selected === false) continue;
        const id = String(calendar.id);
        if (calendars.some((existing) => existing.id === id)) continue;
        calendars.push({
          id,
          name: String(calendar.summaryOverride || calendar.summary || "Google Agenda"),
        });
      }
    } catch {
      // La lecture du calendrier principal reste possible même lorsque calendarList
      // n'est pas autorisé par le connecteur OAuth.
    }

    const results = await Promise.allSettled(
      calendars.map((calendar) => readCalendarEvents(gatewayRequest, calendar, timeMin, timeMax)),
    );

    const events = results
      .flatMap((result) => result.status === "fulfilled" ? result.value : [])
      .sort((a, b) => a.start.localeCompare(b.start));

    const primaryResult = results[0];
    if (primaryResult?.status === "rejected") {
      const reason = primaryResult.reason instanceof Error ? primaryResult.reason.message : String(primaryResult.reason ?? "");
      throw new Error(`Agenda ${FLAMME_GOOGLE_ACCOUNT} inaccessible. ${reason}`.trim());
    }

    return events;
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
  .handler(async (): Promise<GoogleDriveFile[]> => {
    const { gatewayRequest } = await import("./connectors/lovable-gateway.server");
    const json = await gatewayRequest("google_drive", "/drive/v3/files", {
      query: {
        pageSize: 50,
        orderBy: "modifiedTime desc",
        q: "trashed = false",
        fields: "files(id,name,mimeType,size,modifiedTime,webViewLink)",
      },
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
  .handler(async () => {
    const { probeGatewayConnector } = await import("./connectors/lovable-gateway.server");
    const [gmail, calendar, drive] = await Promise.all([
      probeGatewayConnector("google_mail"),
      probeGatewayConnector("google_calendar"),
      probeGatewayConnector("google_drive"),
    ]);
    return {
      account: FLAMME_GOOGLE_ACCOUNT,
      connected: gmail.ok || calendar.ok || drive.ok,
      gmail: gmail.ok,
      calendar: calendar.ok,
      drive: drive.ok,
      gmailDetail: gmail.detail,
      calendarDetail: calendar.detail,
      driveDetail: drive.detail,
      checkedAt: new Date().toISOString(),
    };
  });
