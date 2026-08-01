import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { sendTemplateEmail } from "./email-templates/send-email";

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

    const url = `https://www.angel-leclerc.fr/articles/${article.slug}`;

    let sent = 0;
    for (const sub of recipients) {
      const unsubUrl = `https://www.angel-leclerc.fr/desabonnement?token=${sub.unsubscribe_token}`;
      const result = await sendTemplateEmail('blog-new-article', sub.email, {
        templateData: {
          title: article.title,
          excerpt: article.excerpt ?? undefined,
          url,
          unsubscribeUrl: unsubUrl,
        },
        idempotencyKey: `article-${article.id}-subscriber-${sub.unsubscribe_token}`,
      });
      if (result.sent) sent += 1;
    }

    return { ok: true as const, sent };
  });
