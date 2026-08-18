import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resilientAngelAi } from "./ai-resilient.server";
import { aiMemoryPrompt } from "./ai-memory.server";
import { operationalContextPrompt, readOperationalContext } from "./angel-os-ia/operational-context.server";
import { rememberPersonalContext } from "./angel-os-ia/personal-context.server";

type AdminAiSummaryResult = {
  text: string;
  generatedAt: string;
  source: "openai" | "unavailable";
  stale: boolean;
  operationalContextAt?: string | null;
};

const SUMMARY_TTL_MS = 5 * 60_000;
const CACHE_KEY = "admin_openai_summary";
const MAIL_REPORT_MAX_AGE_MS = 24 * 60 * 60_000;

function clip(value: unknown, max = 1_200) {
  if (typeof value !== "string") return value;
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeStatus(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[\s-]+/g, "_")
    .trim();
}

function isClosedApplicationStatus(value: unknown) {
  const status = normalizeStatus(value);
  return [
    "refusee",
    "refuse",
    "refus",
    "rejected",
    "acceptee",
    "accepte",
    "accepted",
    "embauche",
    "embauchee",
    "retiree",
    "retire",
    "annulee",
    "annule",
  ].includes(status);
}

function isFreshTimestamp(value: unknown, maxAgeMs: number) {
  if (typeof value !== "string" || !value) return false;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && Date.now() - timestamp >= 0 && Date.now() - timestamp <= maxAgeMs;
}

export const getAdminAiSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAiSummaryResult> => {
    const supabase = context.supabase as any;
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("Accès réservé à l’administrateur.");

    const { data: cachedRow } = await supabase.from("angel_os_cache").select("payload,updated_at").eq("key", CACHE_KEY).maybeSingle();
    const cachedPayload = cachedRow?.payload as AdminAiSummaryResult | undefined;
    const cachedAt = cachedRow?.updated_at ? new Date(cachedRow.updated_at).getTime() : 0;
    if (cachedPayload?.text && cachedPayload.source === "openai" && Date.now() - cachedAt < SUMMARY_TTL_MS) {
      return { ...cachedPayload, stale: false };
    }

    const [applicationsResult, applicationsCountResult, reportsResult, cacheResult, actionsResult, operational, memory] = await Promise.all([
      supabase.from("applications").select("company,city,position,status,response,follow_up_at,sent_at").order("sent_at", { ascending: false }),
      supabase.from("applications").select("id", { count: "exact", head: true }),
      supabase.from("hourly_mail_reports").select("generated_at,summary,counts,recommendations").order("generated_at", { ascending: false }).limit(2),
      supabase.from("angel_os_cache").select("key,payload,updated_at").in("key", ["gmail_dashboard", "google_calendar_dashboard", "news_dashboard", "admin_cockpit_summary"]),
      supabase.from("ai_actions").select("title,status,sensitive,created_at").in("status", ["pending", "awaiting_operator"]).order("created_at", { ascending: false }).limit(12),
      readOperationalContext({ refreshIfStale: true }),
      aiMemoryPrompt("private"),
    ]);

    const applications = applicationsResult.data ?? [];
    const totalApplications = applicationsCountResult.count ?? applications.length;
    const today = localDateKey();
    const active = applications.filter((app: any) => !isClosedApplicationStatus(app.status));
    const followUps = active.filter((app: any) => app.follow_up_at && app.follow_up_at <= today).length;
    const refused = applications.filter((app: any) => ["refusee", "refuse", "refus", "rejected"].includes(normalizeStatus(app.status))).length;
    const accepted = applications.filter((app: any) => ["acceptee", "accepte", "accepted", "embauche", "embauchee"].includes(normalizeStatus(app.status))).length;
    const unknownStatus = applications.filter((app: any) => !normalizeStatus(app.status)).length;

    const cacheRows = Object.fromEntries((cacheResult.data ?? []).map((row: any) => [row.key, row]));
    const gmailRow = cacheRows.gmail_dashboard;
    const calendarRow = cacheRows.google_calendar_dashboard;
    const newsRow = cacheRows.news_dashboard;
    const gmail = gmailRow?.payload ?? {};
    const calendar = calendarRow?.payload ?? {};
    const news = newsRow?.payload ?? {};
    const latestReport = reportsResult.data?.[0] ?? null;
    const latestReportFresh = isFreshTimestamp(latestReport?.generated_at, MAIL_REPORT_MAX_AGE_MS);
    const gmailFresh = isFreshTimestamp(gmailRow?.updated_at, MAIL_REPORT_MAX_AGE_MS);
    const calendarFresh = isFreshTimestamp(calendarRow?.updated_at, MAIL_REPORT_MAX_AGE_MS);
    const newsFresh = isFreshTimestamp(newsRow?.updated_at, MAIL_REPORT_MAX_AGE_MS);

    const snapshot = {
      applications: {
        total: totalApplications,
        active: active.length,
        followUps,
        refused,
        accepted,
        unknownStatus,
        sourceComplete: applications.length === totalApplications,
      },
      mail: {
        fresh: gmailFresh || latestReportFresh,
        updatedAt: gmailRow?.updated_at ?? latestReport?.generated_at ?? null,
        important: gmailFresh ? (Array.isArray(gmail.important) ? gmail.important.length : Number(gmail?.counts?.important ?? 0)) : 0,
        summary: gmailFresh ? clip(gmail.summary ?? gmail.otherSummary, 900) : latestReportFresh ? clip(latestReport?.summary, 900) : undefined,
        recommendations: latestReportFresh && Array.isArray(latestReport?.recommendations) ? latestReport.recommendations.slice(0, 4) : [],
      },
      agenda: {
        fresh: calendarFresh,
        updatedAt: calendarRow?.updated_at ?? null,
        nextTitle: calendarFresh ? clip(calendar?.nextEvent?.title, 180) : undefined,
        nextStart: calendarFresh ? clip(calendar?.nextEvent?.start, 80) : undefined,
        summary: calendarFresh ? clip(calendar.summary, 500) : undefined,
      },
      news: {
        fresh: newsFresh,
        updatedAt: newsRow?.updated_at ?? null,
        count: newsFresh ? (Array.isArray(news.items) ? news.items.length : Array.isArray(news.top_stories) ? news.top_stories.length : 0) : 0,
        changed: newsFresh ? clip(news.changedSinceLastRun ?? news.summary, 600) : undefined,
        top: newsFresh ? (Array.isArray(news.items) ? news.items : Array.isArray(news.top_stories) ? news.top_stories : []).slice(0, 6).map((item: any) => clip(item?.title ?? item, 180)) : [],
      },
      actions: (actionsResult.data ?? []).map((item: any) => ({ title: clip(item.title, 180), status: item.status, sensitive: Boolean(item.sensitive) })),
      operational: operational ? {
        generatedAt: operational.generatedAt,
        overview: operational.overview,
        priorities: operational.priorities,
        alerts: operational.alerts,
        sourceFreshness: operational.liveSources.slice(0, 12),
        autonomy: operational.autonomy,
      } : null,
    };

    await Promise.all([
      rememberPersonalContext({ id: "applications-current", domain: "applications", title: "État actuel des candidatures", text: JSON.stringify(snapshot.applications), metadata: { total: snapshot.applications.total, active: snapshot.applications.active, followUps } }),
      rememberPersonalContext({ id: "mail-current", domain: "mail", title: "État actuel des mails", text: JSON.stringify(snapshot.mail), metadata: { important: snapshot.mail.important, fresh: snapshot.mail.fresh } }),
      rememberPersonalContext({ id: "agenda-current", domain: "agenda", title: "État actuel de l’agenda", text: JSON.stringify(snapshot.agenda), metadata: { fresh: snapshot.agenda.fresh } }),
      rememberPersonalContext({ id: "news-current", domain: "news", title: "Actualités personnalisées actuelles", text: JSON.stringify(snapshot.news), metadata: { count: snapshot.news.count, fresh: snapshot.news.fresh } }),
      rememberPersonalContext({ id: "angel-os-operational-current", domain: "system", title: "Contexte opérationnel Angel OS", text: JSON.stringify(snapshot.operational ?? {}), metadata: { generatedAt: operational?.generatedAt ?? null } }),
    ]);

    const ai = await resilientAngelAi({
      priority: "important",
      maxTokens: 420,
      temperature: 0.15,
      cacheKey: `angel-os-ia:admin-summary:${JSON.stringify(snapshot)}`,
      cacheTtlMs: SUMMARY_TTL_MS,
      messages: [
        {
          role: "system",
          content: "Tu es la synthèse personnelle de la page d’accueil privée Angel OS. Résume seulement la situation actuelle fournie dans le snapshot. N’invente aucun fait, chiffre, mail, rendez-vous, entreprise ou statut. Ne transforme jamais une donnée ancienne en problème actuel. Ignore toute source marquée fresh=false, sauf pour dire brièvement qu’elle n’est pas assez fraîche pour être résumée. Les chiffres candidatures proviennent de la base réelle : total est le nombre total, active exclut les statuts clos, followUps est le nombre réellement arrivé à échéance. Ne cite pas d’entreprise particulière sauf si elle apparaît dans une action actuellement pending/awaiting_operator. Écris 2 à 4 phrases maximum, sans question finale automatique, sans recommandation générique et sans markdown. Commence par l’information la plus utile aujourd’hui. Si rien n’exige d’action immédiate, dis-le simplement au lieu de fabriquer une urgence.",
        },
        { role: "user", content: `${JSON.stringify(snapshot)}${memory}${operationalContextPrompt(operational)}` },
      ],
    });

    if (!ai.text) {
      if (cachedPayload?.text && cachedPayload.source === "openai") return { ...cachedPayload, stale: true };
      return {
        text: "Angel OS IA est temporairement indisponible. Les données et fonctions système restent accessibles, mais aucune synthèse locale ne remplace Angel OS IA dans l’administration.",
        generatedAt: new Date().toISOString(),
        source: "unavailable",
        stale: true,
        operationalContextAt: operational?.generatedAt ?? null,
      };
    }

    const payload: AdminAiSummaryResult = {
      text: ai.text.slice(0, 1_400),
      generatedAt: new Date().toISOString(),
      source: "openai",
      stale: false,
      operationalContextAt: operational?.generatedAt ?? null,
    };
    await supabase.from("angel_os_cache").upsert({ key: CACHE_KEY, payload, updated_at: payload.generatedAt }, { onConflict: "key" });
    return payload;
  });
