import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  buildSiteStats,
  parseUserAgent,
  toCsv,
  type AnalyticsFilters,
  type SiteStats,
  type ViewRow,
} from "./analytics.server-utils";

const SELECT_COLUMNS =
  "path, referrer, device, country, session_id, created_at, visitor_id, event_type, event_name, title, referrer_host, source, utm_source, utm_medium, utm_campaign, browser, os, language, screen_width, screen_height, city, metadata, user_id";

const filtersSchema = z
  .object({
    path: z.string().max(300).optional(),
    source: z.string().max(120).optional(),
    utmSource: z.string().max(120).optional(),
    utmMedium: z.string().max(120).optional(),
    campaign: z.string().max(120).optional(),
    device: z.string().max(40).optional(),
    browser: z.string().max(40).optional(),
    os: z.string().max(40).optional(),
    language: z.string().max(20).optional(),
    country: z.string().max(60).optional(),
    city: z.string().max(80).optional(),
    eventType: z.string().max(30).optional(),
  })
  .optional();

const statsInputSchema = z.object({
  days: z.number().int().min(1).max(365).default(30),
  filters: filtersSchema,
});

const trackSchema = z.object({
  eventType: z.enum(["pageview", "click", "scroll", "engagement"]).default("pageview"),
  eventName: z.string().trim().max(60).optional(),
  path: z.string().trim().min(1).max(300),
  title: z.string().trim().max(200).optional(),
  referrer: z.string().trim().max(500).optional().or(z.literal("")),
  device: z.enum(["mobile", "tablette", "ordinateur"]).optional(),
  visitorId: z.string().trim().max(64).optional().or(z.literal("")),
  sessionId: z.string().trim().max(64).optional().or(z.literal("")),
  language: z.string().trim().max(20).optional(),
  screenWidth: z.number().int().min(0).max(20000).optional(),
  screenHeight: z.number().int().min(0).max(20000).optional(),
  viewportWidth: z.number().int().min(0).max(20000).optional(),
  viewportHeight: z.number().int().min(0).max(20000).optional(),
  source: z.string().trim().max(120).optional(),
  referrerHost: z.string().trim().max(160).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
  utmTerm: z.string().trim().max(120).optional(),
  utmContent: z.string().trim().max(120).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type { SiteStats };

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => trackSchema.parse(data))
  .handler(async ({ data }) => {
    const ua = getRequestHeader("user-agent") ?? "";
    if (/bot|crawler|spider|preview|headless|lighthouse/i.test(ua)) {
      return { ok: true as const };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { browser, os } = parseUserAgent(ua);
    const rawMeta = data.metadata ?? {};
    const metadata: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(rawMeta).slice(0, 12)) {
      metadata[k.slice(0, 32)] = typeof v === "string" ? v.slice(0, 200) : v;
    }
    await supabaseAdmin.from("page_views").insert({
      path: data.path.slice(0, 300),
      referrer: data.referrer ? data.referrer.slice(0, 500) : null,
      referrer_host: data.referrerHost || null,
      device: data.device ?? null,
      country: getRequestHeader("cf-ipcountry") ?? null,
      city: getRequestHeader("cf-ipcity") ?? getRequestHeader("x-vercel-ip-city") ?? null,
      session_id: data.sessionId || null,
      visitor_id: data.visitorId || null,
      event_type: data.eventType,
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
    });
    return { ok: true as const };
  });

/** Compatibilité : ancien point d'entrée de suivi de page. */
export const trackPageView = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => trackSchema.parse(data))
  .handler(async ({ data }) => {
    const ua = getRequestHeader("user-agent") ?? "";
    if (/bot|crawler|spider|preview|headless|lighthouse/i.test(ua)) return { ok: true as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { browser, os } = parseUserAgent(ua);
    await supabaseAdmin.from("page_views").insert({
      path: data.path.slice(0, 300),
      referrer: data.referrer ? data.referrer.slice(0, 500) : null,
      device: data.device ?? null,
      country: getRequestHeader("cf-ipcountry") ?? null,
      session_id: data.sessionId || null,
      event_type: "pageview",
      browser,
      os,
    });
    return { ok: true as const };
  });

export const getSiteStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => statsInputSchema.parse(data ?? {}))
  .handler(async ({ context, data }): Promise<SiteStats> => {
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Accès refusé.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - data.days * 24 * 3600 * 1000).toISOString();

    const [views, articles, subscribers, messages] = await Promise.all([
      supabaseAdmin
        .from("page_views")
        .select(SELECT_COLUMNS)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50000),
      supabaseAdmin.from("articles").select("id, title, slug, published, is_private, created_at"),
      supabaseAdmin.from("blog_subscribers").select("id, active, created_at"),
      supabaseAdmin.from("contact_requests").select("id, is_read, created_at"),
    ]);

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

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data } = await supabaseAdmin
      .from("page_views")
      .select(SELECT_COLUMNS)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);

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
  .inputValidator((data: unknown) => statsInputSchema.parse(data ?? {}))
  .handler(async ({ context, data }) => {
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Accès refusé.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { matchesFilters } = await import("./analytics.server-utils");
    const since = new Date(Date.now() - data.days * 24 * 3600 * 1000).toISOString();
    const { data: rows } = await supabaseAdmin
      .from("page_views")
      .select(SELECT_COLUMNS)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20000);
    const filtered = ((rows ?? []) as unknown as ViewRow[]).filter((r) =>
      matchesFilters(r, (data.filters ?? {}) as AnalyticsFilters),
    );
    return { csv: toCsv(filtered), count: filtered.length };
  });
