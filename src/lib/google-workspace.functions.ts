import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Agenda et Drive passent par la passerelle connecteurs Lovable.
 * Aucun client OAuth Google à héberger, aucun jeton stocké côté projet.
 * Les services sans connecteur réel (Contacts, YouTube) ont été retirés :
 * ils n'étaient plus reliés à aucune fonction utilisable dans Angel OS.
 */

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
  .handler(async (): Promise<GoogleCalendarEvent[]> => {
    const { gatewayRequest } = await import("./connectors/lovable-gateway.server");
    const now = new Date();
    const json = await gatewayRequest("google_calendar", "/calendar/v3/calendars/primary/events", {
      query: {
        timeMin: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        timeMax: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: 75,
      },
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
    };
  });
