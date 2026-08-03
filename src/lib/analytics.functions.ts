import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { buildSiteStats, type SiteStats } from "./analytics.server-utils";

const trackSchema = z.object({
  path: z.string().trim().min(1).max(300),
  referrer: z.string().trim().max(500).optional().or(z.literal("")),
  device: z.enum(["mobile", "tablette", "ordinateur"]).optional(),
  sessionId: z.string().trim().max(64).optional().or(z.literal("")),
});

export const trackPageView = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => trackSchema.parse(data))
  .handler(async ({ data }) => {
    const ua = getRequestHeader("user-agent") ?? "";
    if (/bot|crawler|spider|preview|headless|lighthouse/i.test(ua)) {
      return { ok: true as const };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const country = getRequestHeader("cf-ipcountry") ?? null;
    await supabaseAdmin.from("page_views").insert({
      path: data.path.slice(0, 300),
      referrer: data.referrer ? data.referrer.slice(0, 500) : null,
      device: data.device ?? null,
      country,
      session_id: data.sessionId || null,
    });
    return { ok: true as const };
  });

export type { SiteStats };

export const getSiteStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SiteStats> => {
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Accès refusé.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();

    const [views, articles, subscribers, messages] = await Promise.all([
      supabaseAdmin
        .from("page_views")
        .select("path, referrer, device, country, session_id, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50000),
      supabaseAdmin.from("articles").select("id, title, slug, published, is_private, created_at"),
      supabaseAdmin.from("blog_subscribers").select("id, active, created_at"),
      supabaseAdmin.from("contact_requests").select("id, is_read, created_at"),
    ]);

    return buildSiteStats({
      views: views.data ?? [],
      articles: articles.data ?? [],
      subscribers: subscribers.data ?? [],
      messages: messages.data ?? [],
    });
  });
