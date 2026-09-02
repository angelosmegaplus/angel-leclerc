import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export const listGoogleCalendarEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<GoogleCalendarEvent[]> => {
    const { gatewayRequest } = await import("./connectors/lovable-gateway.server");
    const now = new Date();
    const timeMin = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();

    const calendarsJson = await gatewayRequest("google_calendar", "/calendar/v3/users/me/calendarList", {
      query: { maxResults: 100 },
    });

    const calendars = (calendarsJson.items ?? [])
      .filter((calendar: any) => calendar?.id && calendar?.selected !== false)
      .map((calendar: any) => ({
        id: String(calendar.id),
        name: String(calendar.summaryOverride || calendar.summary || "Google Agenda"),
      }));

    if (calendars.length === 0) calendars.push({ id: "primary", name: "Agenda principal" });

    const results = await Promise.allSettled(
      calendars.map(async (calendar: { id: string; name: string }) => {
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
      }),
    );

    return results
      .flatMap((result) => result.status === "fulfilled" ? result.value : [])
      .sort((a, b) => a.start.localeCompare(b.start));
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
