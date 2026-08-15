import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { sendTemplateEmail } from "./email-templates/send-email";

const SITE = "https://www.angel-leclerc.fr";

const emailSchema = z.object({
  email: z.string().trim().email("E-mail invalide").max(255),
  firstName: z.string().trim().max(80).optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
  captchaToken: z.string().min(1).max(400),
  captchaAnswer: z.string().trim().min(1).max(10),
});

export const subscribeToBlog = createServerFn({ method: "POST" })
  .validator((data: unknown) => emailSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.website && data.website.length > 0) return { ok: true as const };

    const { verifyChallenge } = await import("./captcha.server");
    if (!(await verifyChallenge(data.captchaToken, data.captchaAnswer))) {
      throw new Error("Vérification anti-robot incorrecte ou expirée. Merci de réessayer.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    const { data: existing } = await supabaseAdmin
      .from("blog_subscribers")
      .select("id, active, confirmed_at, confirm_token, unsubscribe_token, first_name")
      .eq("email", email)
      .maybeSingle();

    // Une personne désinscrite n'est jamais réactivée automatiquement :
    // elle doit reconfirmer via le lien reçu par e-mail.
    let row = existing;
    if (!row) {
      const { data: inserted, error } = await supabaseAdmin
        .from("blog_subscribers")
        .insert({ email, first_name: data.firstName || null, active: true })
        .select("id, active, confirmed_at, confirm_token, unsubscribe_token, first_name")
        .single();
      if (error) {
        console.error("[subscribers] insert failed", error);
        throw new Error("L'inscription n'a pas pu être enregistrée.");
      }
      row = inserted;
    } else if (data.firstName && !row.first_name) {
      await supabaseAdmin
        .from("blog_subscribers")
        .update({ first_name: data.firstName })
        .eq("id", row.id);
    }

    if (row.active && row.confirmed_at) {
      return { ok: true as const, alreadyConfirmed: true as const };
    }

    await sendTemplateEmail("subscribe-welcome", email, {
      templateData: {
        firstName: data.firstName || row.first_name || undefined,
        confirmUrl: `${SITE}/confirmation-abonnement?token=${row.confirm_token}`,
        unsubscribeUrl: `${SITE}/desabonnement?token=${row.unsubscribe_token}`,
      },
      idempotencyKey: `subscribe-welcome-${row.confirm_token}`,
    });

    return { ok: true as const, alreadyConfirmed: false as const };
  });

const tokenSchema = z.object({ token: z.string().uuid() });

export const confirmSubscription = createServerFn({ method: "POST" })
  .validator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await supabaseAdmin
      .from("blog_subscribers")
      .update({ confirmed_at: new Date().toISOString(), active: true })
      .eq("confirm_token", data.token)
      .select("email")
      .maybeSingle();
    if (error || !updated) throw new Error("Lien de confirmation invalide ou expiré.");
    return { ok: true as const };
  });

export const unsubscribeFromBlog = createServerFn({ method: "POST" })
  .validator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("blog_subscribers")
      .update({ active: false })
      .eq("unsubscribe_token", data.token);
    if (error) throw new Error("Désinscription impossible.");
    return { ok: true as const };
  });

/** Envoi manuel de la lettre hebdomadaire depuis l'espace administrateur. */
export const sendNewsletterNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Accès refusé.");

    const { sendWeeklyNewsletter } = await import("./newsletter.server");
    return sendWeeklyNewsletter();
  });
