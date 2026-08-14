import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resilientAngelAi } from "./ai-resilient.server";

type AdminAiSummaryResult = {
  text: string;
  generatedAt: string;
  source: "openai" | "local";
  stale: boolean;
};

const SUMMARY_TTL_MS = 5 * 60_000;
const CACHE_KEY = "admin_openai_summary";

function clip(value: unknown, max = 1_200) {
  if (typeof value !== "string") return value;
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function localSummary(snapshot: Record<string, any>) {
  const applications = snapshot.applications ?? {};
  const mail = snapshot.mail ?? {};
  const agenda = snapshot.agenda ?? {};
  const news = snapshot.news ?? {};
  const parts = [
    `${applications.active ?? 0} candidature${applications.active === 1 ? "" : "s"} active${applications.active === 1 ? "" : "s"}${applications.followUps ? `, dont ${applications.followUps} relance${applications.followUps === 1 ? "" : "s"} à traiter` : ""}.`,
    mail.important ? `${mail.important} mail${mail.important === 1 ? "" : "s"} important${mail.important === 1 ? "" : "s"} à regarder.` : "Pas de mail important signalé.",
    agenda.nextTitle ? `Prochain rendez-vous : ${agenda.nextTitle}${agenda.nextStart ? ` (${agenda.nextStart})` : ""}.` : "Aucun rendez-vous proche signalé.",
    news.count ? `${news.count} actualité${news.count === 1 ? "" : "s"} disponible${news.count === 1 ? "" : "s"} dans la veille.` : "La veille actualités n’a rien de nouveau à signaler.",
  ];
  return parts.join(" ");
}

export const getAdminAiSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAiSummaryResult> => {
    const supabase = context.supabase as any;
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Accès réservé à l’administrateur.");

    const { data: cachedRow } = await supabase
      .from("angel_os_cache")
      .select("payload,updated_at")
      .eq("key", CACHE_KEY)
      .maybeSingle();

    const cachedPayload = cachedRow?.payload as AdminAiSummaryResult | undefined;
    const cachedAt = cachedRow?.updated_at ? new Date(cachedRow.updated_at).getTime() : 0;
    if (cachedPayload?.text && Date.now() - cachedAt < SUMMARY_TTL_MS) {
      return { ...cachedPayload, stale: false };
    }

    const [applicationsResult, reportsResult, cacheResult, actionsResult] = await Promise.all([
      supabase.from("applications").select("company,city,position,status,response,follow_up_at,sent_at").order("sent_at", { ascending: false }).limit(80),
      supabase.from("hourly_mail_reports").select("generated_at,summary,counts,recommendations").order("generated_at", { ascending: false }).limit(2),
      supabase.from("angel_os_cache").select("key,payload,updated_at").in("key", ["gmail_dashboard", "google_calendar_dashboard", "news_dashboard", "admin_cockpit_summary"]),
      supabase.from("ai_actions").select("title,status,sensitive,created_at").in("status", ["pending", "awaiting_operator"]).order("created_at", { ascending: false }).limit(12),
    ]);

    const applications = applicationsResult.data ?? [];
    const today = new Date().toISOString().slice(0, 10);
    const active = applications.filter((app: any) => !["refusee", "acceptee", "acceptée"].includes(app.status ?? ""));
    const followUps = active.filter((app: any) => app.follow_up_at && app.follow_up_at <= today).length;
    const recentResponses = applications
      .filter((app: any) => app.response)
      .slice(0, 5)
      .map((app: any) => ({ company: clip(app.company, 100), status: app.status, response: clip(app.response, 240) }));

    const cacheRows = Object.fromEntries((cacheResult.data ?? []).map((row: any) => [row.key, row]));
    const gmail = cacheRows.gmail_dashboard?.payload ?? {};
    const calendar = cacheRows.google_calendar_dashboard?.payload ?? {};
    const news = cacheRows.news_dashboard?.payload ?? {};
    const existingCockpit = cacheRows.admin_cockpit_summary?.payload ?? {};
    const latestReport = reportsResult.data?.[0] ?? null;

    const snapshot = {
      applications: {
        total: applications.length,
        active: active.length,
        followUps,
        recentResponses,
      },
      mail: {
        important: Array.isArray(gmail.important) ? gmail.important.length : Number(gmail?.counts?.important ?? 0),
        summary: clip(gmail.summary ?? gmail.otherSummary ?? latestReport?.summary, 900),
        recommendations: Array.isArray(latestReport?.recommendations) ? latestReport.recommendations.slice(0, 4) : [],
      },
      agenda: {
        nextTitle: clip(calendar?.nextEvent?.title, 180),
        nextStart: clip(calendar?.nextEvent?.start, 80),
        summary: clip(calendar.summary, 500),
      },
      news: {
        count: Array.isArray(news.items) ? news.items.length : Array.isArray(news.top_stories) ? news.top_stories.length : 0,
        changed: clip(news.changedSinceLastRun ?? news.summary, 600),
        top: (Array.isArray(news.items) ? news.items : Array.isArray(news.top_stories) ? news.top_stories : []).slice(0, 6).map((item: any) => clip(item?.title ?? item, 180)),
      },
      actions: (actionsResult.data ?? []).map((item: any) => ({ title: clip(item.title, 180), status: item.status, sensitive: Boolean(item.sensitive) })),
      previousCockpit: clip(existingCockpit.generalText ?? existingCockpit.summary, 700),
    };

    const fallback = localSummary(snapshot);
    const ai = await resilientAngelAi({
      priority: "important",
      maxTokens: 360,
      temperature: 0.2,
      cacheKey: `admin-summary:${JSON.stringify(snapshot)}`,
      cacheTtlMs: SUMMARY_TTL_MS,
      messages: [
        {
          role: "system",
          content: "Tu es la couche de synthèse d’Angel OS. Résume uniquement les données JSON fournies. N’invente aucun fait, chiffre, mail, rendez-vous ou statut. Écris en français naturel, clair et très concis, 3 à 6 phrases maximum. Commence directement par l’information utile. Priorise ce qui nécessite une action, puis candidatures, mails, agenda et actualités. Si rien n’est urgent, dis-le simplement. Aucun markdown, aucune liste, aucun jargon technique.",
        },
        { role: "user", content: JSON.stringify(snapshot) },
      ],
    });

    const payload: AdminAiSummaryResult = {
      text: (ai.text || fallback).slice(0, 1_800),
      generatedAt: new Date().toISOString(),
      source: ai.text ? "openai" : "local",
      stale: false,
    };

    await supabase.from("angel_os_cache").upsert(
      { key: CACHE_KEY, payload, updated_at: payload.generatedAt },
      { onConflict: "key" },
    );

    return payload;
  });
