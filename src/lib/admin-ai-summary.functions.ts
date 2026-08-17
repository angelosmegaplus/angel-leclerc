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

    const [applicationsResult, reportsResult, cacheResult, actionsResult, operational, memory] = await Promise.all([
      supabase.from("applications").select("company,city,position,status,response,follow_up_at,sent_at").order("sent_at", { ascending: false }).limit(80),
      supabase.from("hourly_mail_reports").select("generated_at,summary,counts,recommendations").order("generated_at", { ascending: false }).limit(2),
      supabase.from("angel_os_cache").select("key,payload,updated_at").in("key", ["gmail_dashboard", "google_calendar_dashboard", "news_dashboard", "admin_cockpit_summary"]),
      supabase.from("ai_actions").select("title,status,sensitive,created_at").in("status", ["pending", "awaiting_operator"]).order("created_at", { ascending: false }).limit(12),
      readOperationalContext({ refreshIfStale: true }),
      aiMemoryPrompt("private"),
    ]);

    const applications = applicationsResult.data ?? [];
    const today = localDateKey();
    const active = applications.filter((app: any) => !["refusee", "acceptee", "acceptée"].includes(app.status ?? ""));
    const followUps = active.filter((app: any) => app.follow_up_at && app.follow_up_at <= today).length;
    const recentResponses = applications.filter((app: any) => app.response).slice(0, 5).map((app: any) => ({ company: clip(app.company, 100), status: app.status, response: clip(app.response, 240) }));

    const cacheRows = Object.fromEntries((cacheResult.data ?? []).map((row: any) => [row.key, row]));
    const gmail = cacheRows.gmail_dashboard?.payload ?? {};
    const calendar = cacheRows.google_calendar_dashboard?.payload ?? {};
    const news = cacheRows.news_dashboard?.payload ?? {};
    const existingCockpit = cacheRows.admin_cockpit_summary?.payload ?? {};
    const latestReport = reportsResult.data?.[0] ?? null;

    const snapshot = {
      applications: { total: applications.length, active: active.length, followUps, recentResponses },
      mail: {
        important: Array.isArray(gmail.important) ? gmail.important.length : Number(gmail?.counts?.important ?? 0),
        summary: clip(gmail.summary ?? gmail.otherSummary ?? latestReport?.summary, 900),
        recommendations: Array.isArray(latestReport?.recommendations) ? latestReport.recommendations.slice(0, 4) : [],
      },
      agenda: { nextTitle: clip(calendar?.nextEvent?.title, 180), nextStart: clip(calendar?.nextEvent?.start, 80), summary: clip(calendar.summary, 500) },
      news: {
        count: Array.isArray(news.items) ? news.items.length : Array.isArray(news.top_stories) ? news.top_stories.length : 0,
        changed: clip(news.changedSinceLastRun ?? news.summary, 600),
        top: (Array.isArray(news.items) ? news.items : Array.isArray(news.top_stories) ? news.top_stories : []).slice(0, 6).map((item: any) => clip(item?.title ?? item, 180)),
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
      previousCockpit: clip(existingCockpit.generalText ?? existingCockpit.summary, 700),
    };

    await Promise.all([
      rememberPersonalContext({ id: "applications-current", domain: "applications", title: "État actuel des candidatures", text: JSON.stringify(snapshot.applications), metadata: { total: snapshot.applications.total, active: snapshot.applications.active, followUps } }),
      rememberPersonalContext({ id: "mail-current", domain: "mail", title: "État actuel des mails", text: JSON.stringify(snapshot.mail), metadata: { important: snapshot.mail.important } }),
      rememberPersonalContext({ id: "agenda-current", domain: "agenda", title: "État actuel de l’agenda", text: JSON.stringify(snapshot.agenda) }),
      rememberPersonalContext({ id: "news-current", domain: "news", title: "Actualités personnalisées actuelles", text: JSON.stringify(snapshot.news), metadata: { count: snapshot.news.count } }),
      rememberPersonalContext({ id: "angel-os-operational-current", domain: "system", title: "Contexte opérationnel Angel OS", text: JSON.stringify(snapshot.operational ?? {}), metadata: { generatedAt: operational?.generatedAt ?? null } }),
    ]);

    const ai = await resilientAngelAi({
      priority: "important",
      maxTokens: 520,
      temperature: 0.2,
      cacheKey: `angel-os-ia:admin-summary:${JSON.stringify(snapshot)}`,
      cacheTtlMs: SUMMARY_TTL_MS,
      messages: [
        {
          role: "system",
          content: "Tu es la couche de synthèse personnelle d’Angel OS IA sur la page d’accueil de l’administration privée. Angel OS fournit les données et primitives système ; toi, tu interprètes uniquement les données fournies. N’invente aucun fait, chiffre, mail, rendez-vous ou statut. Écris en français naturel, clair et concis, 4 à 7 phrases maximum. Commence directement par l’information utile. Priorise les alertes, échéances et actions réellement utiles, puis candidatures, mails, agenda, projets et actualités. Utilise le contexte opérationnel horaire pour signaler aussi une source périmée ou une action bloquée. Tu peux proposer spontanément une prochaine action sûre et réversible. Ne prétends jamais qu’une action sensible a été exécutée sans validation. Aucun markdown, aucune liste, aucun jargon technique.",
        },
        { role: "user", content: `${JSON.stringify(snapshot)}${memory}${operationalContextPrompt(operational)}` },
      ],
    });

    if (!ai.text) {
      if (cachedPayload?.text && cachedPayload.source === "openai") return { ...cachedPayload, stale: true };
      return {
        text: "Angel OS IA est temporairement indisponible. Les données et fonctions système restent accessibles, mais aucune synthèse locale ne remplace OpenAI dans l’administration.",
        generatedAt: new Date().toISOString(),
        source: "unavailable",
        stale: true,
        operationalContextAt: operational?.generatedAt ?? null,
      };
    }

    const payload: AdminAiSummaryResult = {
      text: ai.text.slice(0, 2_200),
      generatedAt: new Date().toISOString(),
      source: "openai",
      stale: false,
      operationalContextAt: operational?.generatedAt ?? null,
    };
    await supabase.from("angel_os_cache").upsert({ key: CACHE_KEY, payload, updated_at: payload.generatedAt }, { onConflict: "key" });
    return payload;
  });
