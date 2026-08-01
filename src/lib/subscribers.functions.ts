import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().trim().email("E-mail invalide").max(255),
  website: z.string().max(0).optional().or(z.literal("")),
});

export const subscribeToBlog = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => emailSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.website && data.website.length > 0) return { ok: true as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    const { error } = await supabaseAdmin
      .from("blog_subscribers")
      .upsert({ email, active: true }, { onConflict: "email" });
    if (error) {
      console.error("[subscribers] upsert failed", error);
      throw new Error("L'inscription n'a pas pu être enregistrée.");
    }
    return { ok: true as const };
  });

const tokenSchema = z.object({ token: z.string().uuid() });

export const unsubscribeFromBlog = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("blog_subscribers")
      .update({ active: false })
      .eq("unsubscribe_token", data.token);
    if (error) throw new Error("Désinscription impossible.");
    return { ok: true as const };
  });

const notifySchema = z.object({ articleId: z.string().uuid() });

export const notifySubscribersOfArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => notifySchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Accès refusé.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail, escapeHtml } = await import("./email.server");

    const { data: article } = await supabaseAdmin
      .from("articles")
      .select("id, title, slug, excerpt, published, is_private")
      .eq("id", data.articleId)
      .maybeSingle();

    if (!article) throw new Error("Article introuvable.");
    if (!article.published || article.is_private) {
      throw new Error("Cet article n'est pas public : publiez-le avant de notifier.");
    }

    const { data: subs } = await supabaseAdmin
      .from("blog_subscribers")
      .select("email, unsubscribe_token")
      .eq("active", true);

    const recipients = subs ?? [];
    if (recipients.length === 0) return { ok: true as const, sent: 0 };

    const fromAddress =
      process.env["CONTACT_FROM_ADDRESS"] ||
      "Angel Leclerc Communication <onboarding@resend.dev>";
    const url = `https://www.angel-leclerc.fr/articles/${article.slug}`;

    const cream = "#F6F1E8";
    const white = "#FFFDF9";
    const ink = "#181716";
    const terracotta = "#CE654B";
    const body =
      "'Inter','Helvetica Neue','Segoe UI',Arial,sans-serif";
    const head = "'Manrope','Helvetica Neue','Segoe UI',Arial,sans-serif";

    let sent = 0;
    for (const sub of recipients) {
      const unsubUrl = `https://www.angel-leclerc.fr/desabonnement?token=${sub.unsubscribe_token}`;
      const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0;padding:0;background:${cream};font-family:${body};color:${ink};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${cream};padding:32px 16px;"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${white};border-radius:14px;overflow:hidden;"><tr><td style="padding:28px 32px 8px 32px;border-bottom:3px solid ${terracotta};"><div style="font-family:${head};font-size:18px;font-weight:700;">Angel Leclerc Communication</div><div style="font-size:13px;color:#6b6b6b;margin-top:2px;">Nouvel article sur le blog</div></td></tr><tr><td style="padding:28px 32px;font-size:15px;line-height:1.6;"><h2 style="margin:0 0 12px 0;font-family:${head};font-size:22px;">${escapeHtml(article.title)}</h2>${article.excerpt ? `<p style="margin:0 0 20px 0;color:#4b4b4b;">${escapeHtml(article.excerpt)}</p>` : ""}<p style="margin:24px 0 0 0;"><a href="${url}" style="background:${terracotta};color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Lire l'article</a></p></td></tr><tr><td style="padding:20px 32px;background:${cream};font-size:12px;color:#8a8a8a;text-align:center;">Vous recevez cet e-mail car vous êtes abonné au blog.<br/><a href="${unsubUrl}" style="color:${terracotta};">Se désabonner</a></td></tr></table></td></tr></table></body></html>`;

      const result = await sendEmail({
        from: fromAddress,
        to: sub.email,
        subject: `Nouvel article : ${article.title}`,
        html,
      });
      if (result.ok) sent += 1;
    }

    return { ok: true as const, sent };
  });
