import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  SELECT_COLUMNS,
  statsInputSchema,
  trackSchema,
} from "./analytics.schemas";
import {
  buildSiteStats,
  parseUserAgent,
  toCsv,
  type AnalyticsFilters,
  type SiteStats,
  type ViewRow,
} from "./analytics.server-utils";

export type { SiteStats };

type AnalyticsInsert = Record<string, unknown>;

function getPublicSupabaseConfig() {
  const env = import.meta.env as Record<string, string | undefined>;
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    env["VITE_SUPABASE_URL"];
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    env["VITE_SUPABASE_ANON_KEY"];
  if (!url || !key) {
    throw new Error("Configuration Supabase publique indisponible pour le suivi analytics.");
  }
  return { url: url.replace(/\/$/, ""), key };
}

async function insertAnalyticsRow(row: AnalyticsInsert) {
  const { url, key } = getPublicSupabaseConfig();
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  if (!key.startsWith("sb_publishable_") && !key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`;
  }

  const response = await fetch(`${url}/rest/v1/page_views`, {
    method: "POST",
    headers,
    body: JSON.stringify(row),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Échec du suivi analytics (${response.status})${detail ? ` : ${detail.slice(0, 300)}` : ""}`);
  }
}

function analyticsRowFromInput(data: ReturnType<typeof trackSchema.parse>, eventType?: string) {
  const ua = getRequestHeader("user-agent") ?? "";
  const { browser, os } = parseUserAgent(ua);
  const rawMeta = data.metadata ?? {};
  const metadata: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(rawMeta).slice(0, 12)) {
    metadata[k.slice(0, 32)] = typeof v === "string" ? v.slice(0, 200) : v;
  }

  return {
    path: data.path.slice(0, 300),
    referrer: data.referrer ? data.referrer.slice(0, 500) : null,
    referrer_host: data.referrerHost || null,
    device: data.device ?? null,
    country: getRequestHeader("cf-ipcountry") ?? getRequestHeader("x-vercel-ip-country") ?? null,
    city: getRequestHeader("cf-ipcity") ?? getRequestHeader("x-vercel-ip-city") ?? null,
    session_id: data.sessionId || null,
    visitor_id: data.visitorId || null,
    event_type: eventType ?? data.eventType,
    event_name: data.eventName ?? null,
    title: data.title ?? null,
    source: data.source ?? null,
    utm_source: data.utmSource ?? null,
    utm_medium: data.utmMedium ?? null,
    utm_campaign: data.utmCampaign ?? null,
    utm_term: data.utmTerm ?? null,
    utm_content: data.utmContent ?? null,
    browser,
    os,
    language: data.language ?? null,
    screen_width: data.screenWidth ?? null,
    screen_height: data.screenHeight ?? null,
    viewport_width: data.viewportWidth ?? null,
    viewport_height: data.viewportHeight ?? null,
    metadata,
    user_id: null,
  };
}

export const trackEvent = createServerFn({ method: "POST" })
  .validator((data: unknown) => trackSchema.parse(data))
  .handler(async ({ data }) => {
    const ua = getRequestHeader("user-agent") ?? "";
    if (/bot|crawler|spider|preview|headless|lighthouse/i.test(ua)) {
      return { ok: true as const };
    }
    await insertAnalyticsRow(analyticsRowFromInput(data));
    return { ok: true as const };
  });

/** Compatibilité : ancien point d'entrée de suivi de page. */
export const trackPageView = createServerFn({ method: "POST" })
  .validator((data: unknown) => trackSchema.parse(data))
  .handler(async ({ data }) => {
    const ua = getRequestHeader("user-agent") ?? "";
    if (/bot|crawler|spider|preview|headless|lighthouse/i.test(ua)) return { ok: true as const };
    await insertAnalyticsRow(analyticsRowFromInput(data, "pageview"));
    return { ok: true as const };
  });

export const getSiteStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => statsInputSchema.parse(data ?? {}))
  .handler(async ({ context, data }): Promise<SiteStats> => {
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Accès refusé.");

    const since = new Date(Date.now() - data.days * 24 * 3600 * 1000).toISOString();

    const [views, articles, subscribers, messages] = await Promise.all([
      context.supabase
        .from("page_views")
        .select(SELECT_COLUMNS)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50000),
      context.supabase.from("articles").select("id, title, slug, published, is_private, created_at"),
      context.supabase.from("blog_subscribers").select("id, active, created_at"),
      context.supabase.from("contact_requests").select("id, is_read, created_at"),
    ]);

    const firstError = views.error ?? articles.error ?? subscribers.error ?? messages.error;
    if (firstError) throw firstError;

    return buildSiteStats({
      views: (views.data ?? []) as unknown as ViewRow[],
      articles: articles.data ?? [],
      subscribers: subscribers.data ?? [],
      messages: messages.data ?? [],
      filters: (data.filters ?? {}) as AnalyticsFilters,
      days: data.days,
    });
  });

export const getRealtimeActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Accès refusé.");

    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data, error } = await context.supabase
      .from("page_views")
      .select(SELECT_COLUMNS)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;

    const rows = (data ?? []) as unknown as ViewRow[];
    const sessions = new Set(rows.map((r) => r.session_id).filter(Boolean) as string[]);
    const visitors = new Set(
      rows.map((r) => r.visitor_id ?? r.session_id).filter(Boolean) as string[],
    );
    const pages = new Map<string, number>();
    for (const r of rows) {
      if ((r.event_type ?? "pageview") !== "pageview") continue;
      pages.set(r.path, (pages.get(r.path) ?? 0) + 1);
    }
    return {
      activeSessions: sessions.size,
      activeVisitors: visitors.size,
      pages: [...pages.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
      recent: rows.slice(0, 12).map((r) => ({
        at: r.created_at,
        type: r.event_type ?? "pageview",
        path: r.path,
        label: String((r.metadata as Record<string, unknown> | null)?.["label"] ?? r.event_name ?? ""),
        visitor: (r.visitor_id ?? r.session_id ?? "????").slice(0, 4),
      })),
    };
  });

export const exportAnalyticsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => statsInputSchema.parse(data ?? {}))
  .handler(async ({ context, data }) => {
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Accès refusé.");

    const { matchesFilters } = await import("./analytics.server-utils");
    const since = new Date(Date.now() - data.days * 24 * 3600 * 1000).toISOString();
    const { data: rows, error } = await context.supabase
      .from("page_views")
      .select(SELECT_COLUMNS)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20000);
    if (error) throw error;

    const filtered = ((rows ?? []) as unknown as ViewRow[]).filter((r) =>
      matchesFilters(r, (data.filters ?? {}) as AnalyticsFilters),
    );
    return { csv: toCsv(filtered), count: filtered.length };
  });
