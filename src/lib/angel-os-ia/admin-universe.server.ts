import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Db = SupabaseClient<Database>;

type SafeResult = { source: string; rows: unknown[]; error?: string };

async function safeRows(source: string, query: PromiseLike<any>): Promise<SafeResult> {
  try {
    const result = await query;
    if (result?.error) return { source, rows: [], error: String(result.error.message ?? result.error) };
    return { source, rows: result?.data ?? [] };
  } catch (error) {
    return { source, rows: [], error: error instanceof Error ? error.message : String(error) };
  }
}

function cleanHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function readMailContext(userId: string) {
  try {
    const { getStatus, listMail, readMail } = await import("@/lib/mailbox.server");
    const status = await getStatus(userId);
    if (!status.connected) {
      return { connected: false, provider: status.provider ?? null, address: status.address, error: status.missing.join("; ") };
    }

    const [inbox, sent] = await Promise.all([
      listMail(userId, "inbox", "").catch(() => []),
      listMail(userId, "sent", "").catch(() => []),
    ]);

    const hydrate = async (rows: typeof inbox, limit: number) =>
      Promise.all(
        rows.slice(0, limit).map(async (row) => {
          try {
            const detail = await readMail(userId, row.id);
            return { ...row, bodyText: cleanHtml(detail.body).slice(0, 3500) };
          } catch {
            return { ...row, bodyText: row.snippet };
          }
        }),
      );

    const [inboxDetailed, sentDetailed] = await Promise.all([hydrate(inbox, 12), hydrate(sent, 24)]);
    return {
      connected: true,
      provider: status.provider ?? null,
      address: status.address,
      inbox: inboxDetailed,
      sent: sentDetailed,
    };
  } catch (error) {
    return { connected: false, provider: null, address: null, error: error instanceof Error ? error.message : String(error) };
  }
}

async function readCalendarContext(userId: string) {
  try {
    const { getAccessToken } = await import("@/lib/oauth/oauth.server");
    const token = await getAccessToken(userId, "google");
    if (!token) return { connected: false, events: [], error: "Google Workspace n’est pas connecté ou doit être reconnecté." };

    const now = new Date();
    const until = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    url.searchParams.set("timeMin", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
    url.searchParams.set("timeMax", until.toISOString());
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "75");

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    const text = await response.text();
    if (!response.ok) return { connected: false, events: [], error: `Google Agenda a refusé la requête (${response.status}).` };
    const json = text ? JSON.parse(text) : {};
    const events = (json.items ?? [])
      .filter((event: any) => event?.status !== "cancelled" && (event?.start?.dateTime || event?.start?.date))
      .map((event: any) => ({
        id: String(event.id),
        title: String(event.summary || "Événement Google"),
        start: String(event.start.dateTime || `${event.start.date}T00:00:00`),
        end: event.end?.dateTime || (event.end?.date ? `${event.end.date}T00:00:00` : null),
        location: event.location ? String(event.location) : null,
      }));
    return { connected: true, events };
  } catch (error) {
    return { connected: false, events: [], error: error instanceof Error ? error.message : String(error) };
  }
}

export async function readAdminUniverse(db: Db, userId: string) {
  const anyDb = db as unknown as { from: (table: string) => any };

  const sources = await Promise.all([
    safeRows("applications", anyDb.from("applications").select("*").order("created_at", { ascending: false }).limit(250)),
    safeRows("projects", anyDb.from("projects").select("*").order("created_at", { ascending: false }).limit(150)),
    safeRows("project_tasks", anyDb.from("project_tasks").select("*").order("created_at", { ascending: false }).limit(250)),
    safeRows("articles", anyDb.from("articles").select("*").order("created_at", { ascending: false }).limit(150)),
    safeRows("interviews", anyDb.from("interviews").select("*").order("scheduled_at", { ascending: false }).limit(100)),
    safeRows("contact_requests", anyDb.from("contact_requests").select("*").order("created_at", { ascending: false }).limit(120)),
    safeRows("blog_subscribers", anyDb.from("blog_subscribers").select("*").order("created_at", { ascending: false }).limit(120)),
    safeRows("ai_actions", anyDb.from("ai_actions").select("*").order("updated_at", { ascending: false }).limit(150)),
    safeRows("hourly_mail_reports", anyDb.from("hourly_mail_reports").select("*").order("period_end", { ascending: false }).limit(72)),
    safeRows("angel_os_cache", anyDb.from("angel_os_cache").select("key,payload,updated_at").order("updated_at", { ascending: false }).limit(60)),
  ]);

  const [mail, calendar] = await Promise.all([readMailContext(userId), readCalendarContext(userId)]);
  const errors = sources.filter((source) => source.error).map((source) => `${source.source}: ${source.error}`);
  if (!mail.connected && mail.error) errors.push(`mail: ${mail.error}`);
  if (!calendar.connected && calendar.error) errors.push(`calendar: ${calendar.error}`);

  return {
    generatedAt: new Date().toISOString(),
    policy: {
      scope: "private-admin-read",
      note: "Ce contexte représente les données accessibles aux pages privées Angel OS. Les données absentes ou en erreur ne doivent jamais être inventées.",
    },
    pages: Object.fromEntries(sources.map((source) => [source.source, source.rows])),
    mail,
    calendar,
    errors,
  };
}

export function adminUniversePrompt(universe: Awaited<ReturnType<typeof readAdminUniverse>>) {
  return `\n\nUNIVERS ADMINISTRATEUR ANGEL OS — lecture privée ${universe.generatedAt}\nTu as accès en lecture au contexte des pages privées fourni ci-dessous, y compris les mails reçus ET envoyés lorsque la connexion mail fonctionne, ainsi que l’agenda Google lorsqu’il est connecté. Utilise les mails envoyés comme source de vérité pour reconstruire les candidatures réellement envoyées, leurs dates, destinataires, objets et fils ; croise avec les réponses reçues et la table applications. Utilise l’agenda pour les rendez-vous, échéances et entretiens à venir. Ne confonds jamais absence de réponse et refus. Si un mail envoyé prouve une candidature absente ou obsolète dans applications, signale clairement l'écart et propose/autorise une synchronisation interne sûre. Pour un mail ouvert ou un fil présent dans ce contexte, tu peux rédiger un brouillon précis à partir du fil et des données privées. N'affirme jamais avoir lu une page, un message ou un événement non présent dans ce contexte.\n${JSON.stringify(universe)}`;
}
