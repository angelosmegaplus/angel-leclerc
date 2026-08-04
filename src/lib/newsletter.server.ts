import { sendTemplateEmail } from "./email-templates/send-email";
import type { NewsletterArticle } from "./email-templates/weekly-newsletter";

const SITE = "https://www.angel-leclerc.fr";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Envoie la lettre hebdomadaire aux abonnés confirmés.
 * Ne fait rien si aucun article n'a été publié depuis le dernier envoi.
 */
export async function sendWeeklyNewsletter(): Promise<{
  sent: number;
  articles: number;
  skipped?: string;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: lastRun } = await supabaseAdmin
    .from("newsletter_runs")
    .select("sent_at")
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const since =
    lastRun?.sent_at ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const { data: rows } = await supabaseAdmin
    .from("articles")
    .select("id, title, slug, excerpt, cover_url, published_at, created_at")
    .eq("published", true)
    .eq("is_private", false)
    .gt("published_at", since)
    .lte("published_at", now)
    .order("published_at", { ascending: false });

  const seen = new Set<string>();
  const articles: NewsletterArticle[] = [];
  for (const row of rows ?? []) {
    if (seen.has(row.slug)) continue;
    seen.add(row.slug);
    articles.push({
      title: row.title,
      excerpt: row.excerpt ?? undefined,
      url: `${SITE}/articles/${row.slug}`,
      imageUrl: row.cover_url?.startsWith("https://") ? row.cover_url : undefined,
      date: formatDate(row.published_at ?? row.created_at),
    });
  }

  if (articles.length === 0) {
    return { sent: 0, articles: 0, skipped: "Aucun nouvel article cette semaine." };
  }

  const { data: subs } = await supabaseAdmin
    .from("blog_subscribers")
    .select("id, email, first_name, unsubscribe_token")
    .eq("active", true)
    .not("confirmed_at", "is", null);

  const recipients = subs ?? [];
  const runKey = now.slice(0, 10);
  let sent = 0;

  for (const sub of recipients) {
    const result = await sendTemplateEmail("weekly-newsletter", sub.email, {
      templateData: {
        articles,
        unsubscribeUrl: `${SITE}/desabonnement?token=${sub.unsubscribe_token}`,
      },
      idempotencyKey: `newsletter-${runKey}-${sub.unsubscribe_token}`,
    });
    if (result.sent) {
      sent += 1;
      await supabaseAdmin
        .from("blog_subscribers")
        .update({ last_newsletter_at: now })
        .eq("id", sub.id);
    }
  }

  await supabaseAdmin.from("newsletter_runs").insert({
    sent_at: now,
    article_count: articles.length,
    recipient_count: sent,
  });

  return { sent, articles: articles.length };
}
