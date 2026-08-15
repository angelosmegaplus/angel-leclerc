import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { FeedbackContext } from "./feedback";

const contentTypes = ["article", "service", "parcours", "page"] as const;

const contextSchema = z.object({
  contentKey: z.string().trim().min(1).max(300),
});

export const getFeedbackContext = createServerFn({ method: "POST" })
  .validator((data: unknown) => contextSchema.parse(data))
  .handler(async ({ data }): Promise<FeedbackContext> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { toPublicSettings, disabledPathsOf } = await import("./feedback.server");

    const [{ data: row }, { data: ratings }] = await Promise.all([
      supabaseAdmin.from("feedback_settings").select("*").eq("id", true).maybeSingle(),
      supabaseAdmin.from("content_feedback").select("rating").eq("content_key", data.contentKey),
    ]);

    if (!row) {
      throw new Error("Configuration des avis indisponible.");
    }

    const settings = toPublicSettings(row);
    const list = ratings ?? [];
    const count = list.length;
    const average = count
      ? Math.round((list.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
      : null;

    return {
      settings,
      average,
      count,
      visible: settings.enabled && !disabledPathsOf(row).includes(data.contentKey),
    };
  });

const submitSchema = z.object({
  contentType: z.enum(contentTypes),
  contentKey: z.string().trim().min(1).max(300),
  contentTitle: z.string().trim().max(300).optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().or(z.literal("")),
  email: z.string().trim().max(255).optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
});

export const submitFeedback = createServerFn({ method: "POST" })
  .validator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const, id: null };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sanitizeComment, visitorHash, toPublicSettings } = await import("./feedback.server");

    const { data: row } = await supabaseAdmin
      .from("feedback_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();
    if (!row || !row.enabled) throw new Error("Les avis sont momentanément désactivés.");
    const settings = toPublicSettings(row);

    const ua = (getRequestHeader("user-agent") ?? "").slice(0, 300);
    const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
    const hash = await visitorHash(ip, ua);

    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const { count: recent } = await supabaseAdmin
      .from("content_feedback")
      .select("*", { count: "exact", head: true })
      .eq("visitor_hash", hash)
      .gte("created_at", hourAgo);
    if ((recent ?? 0) >= 5) {
      throw new Error("Trop d'avis envoyés récemment. Merci de réessayer plus tard.");
    }

    const monthAgo = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
    const { data: duplicate } = await supabaseAdmin
      .from("content_feedback")
      .select("id")
      .eq("visitor_hash", hash)
      .eq("content_key", data.contentKey)
      .gte("created_at", monthAgo)
      .limit(1);
    if (duplicate && duplicate.length > 0) {
      throw new Error(
        "Vous avez déjà donné votre avis sur ce contenu. Vous pourrez le modifier dans 30 jours.",
      );
    }

    const comment = settings.commentEnabled && data.comment ? sanitizeComment(data.comment) : "";
    const email = data.email ? data.email.trim().slice(0, 255) : "";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      throw new Error("Adresse e-mail invalide.");
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("content_feedback")
      .insert({
        content_type: data.contentType,
        content_key: data.contentKey,
        content_title: data.contentTitle || null,
        rating: data.rating,
        comment: comment || null,
        email: email || null,
        visitor_hash: hash,
        user_agent: ua || null,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("[feedback] insert failed", error);
      throw new Error("Votre avis n'a pas pu être enregistré.");
    }

    return { ok: true as const, id: inserted.id };
  });

const supportSchema = z.object({
  feedbackId: z.string().uuid(),
  amountCents: z.number().int().min(100).max(500000).nullable().optional(),
});

export const startSupport = createServerFn({ method: "POST" })
  .validator((data: unknown) => supportSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { linksOf } = await import("./feedback.server");

    const { data: row } = await supabaseAdmin
      .from("feedback_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();
    if (!row || !row.support_enabled) {
      throw new Error("Les contributions sont momentanément indisponibles.");
    }
    const links = linksOf(row);
    // Le montant est choisi directement sur la page de paiement Revolut.
    const url =
      (data.amountCents ? links[String(data.amountCents)] : undefined) ?? links["custom"];
    if (!url) throw new Error("Aucun lien de paiement n'est configuré pour ce montant.");

    await supabaseAdmin
      .from("content_feedback")
      .update({ support_amount_cents: data.amountCents ?? null, payment_status: "pending" })
      .eq("id", data.feedbackId);

    return { url };
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Accès refusé.");
}

export const listFeedback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: rows }, { data: settings }] = await Promise.all([
      supabaseAdmin
        .from("content_feedback")
        .select(
          "id, content_type, content_key, content_title, rating, comment, email, support_amount_cents, payment_status, paid_amount_cents, payment_reference, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(2000),
      supabaseAdmin.from("feedback_settings").select("*").eq("id", true).maybeSingle(),
    ]);
    return { rows: rows ?? [], settings: settings ?? null };
  });

const paymentSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["none", "pending", "paid", "cancelled"]),
  paidAmountCents: z.number().int().min(0).max(1000000).nullable().optional(),
  reference: z.string().trim().max(120).optional().or(z.literal("")),
});

export const updateFeedbackPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => paymentSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("content_feedback")
      .update({
        payment_status: data.status,
        paid_amount_cents: data.status === "paid" ? (data.paidAmountCents ?? null) : null,
        payment_reference: data.reference || null,
      })
      .eq("id", data.id);
    if (error) throw new Error("Mise à jour impossible.");
    return { ok: true as const };
  });

export const deleteFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("content_feedback").delete().eq("id", data.id);
    return { ok: true as const };
  });

const settingsSchema = z.object({
  enabled: z.boolean(),
  supportEnabled: z.boolean(),
  commentEnabled: z.boolean(),
  publicDisplay: z.enum(["none", "average", "average_count"]),
  minRatingForSupport: z.number().int().min(1).max(5),
  amountsCents: z.array(z.number().int().min(100).max(500000)).min(1).max(8),
  minAmountCents: z.number().int().min(100).max(500000),
  revolutLinks: z.record(z.string(), z.string().trim().max(500)),
  questions: z.record(z.string(), z.string().trim().max(200)),
  confirmationTexts: z.record(z.string(), z.string().trim().max(600)),
  disabledPaths: z.array(z.string().trim().max(300)).max(100),
});

export const saveFeedbackSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => settingsSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const links: Record<string, string> = {};
    for (const [k, v] of Object.entries(data.revolutLinks)) {
      const url = v.trim();
      if (!url) continue;
      if (!/^https:\/\//i.test(url)) throw new Error(`Lien invalide pour « ${k} » (https requis).`);
      links[k] = url;
    }
    const { error } = await supabaseAdmin
      .from("feedback_settings")
      .update({
        enabled: data.enabled,
        support_enabled: data.supportEnabled,
        comment_enabled: data.commentEnabled,
        public_display: data.publicDisplay,
        min_rating_for_support: data.minRatingForSupport,
        amounts_cents: data.amountsCents,
        min_amount_cents: data.minAmountCents,
        revolut_links: links,
        questions: data.questions,
        confirmation_texts: data.confirmationTexts,
        disabled_paths: data.disabledPaths,
      })
      .eq("id", true);
    if (error) throw new Error("Enregistrement des réglages impossible.");
    return { ok: true as const };
  });