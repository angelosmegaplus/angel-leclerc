import { findArticleCover, generateArticleDraft, type GeneratedArticleDraft } from "./article-ai.server";
import { fetchAdminNewsSnapshot } from "./news.functions";
import type { NewsPayload } from "./news.functions";

const DISCLOSURE =
  "Cet article a été généré et publié automatiquement par la veille Angel OS IA à partir de sources publiques. Malgré la recherche et le recoupement, des erreurs ou imprécisions restent possibles : consultez les sources avant de réutiliser une information.";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 82);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

async function buildAutomaticPressReview(news: NewsPayload): Promise<GeneratedArticleDraft | null> {
  const dayLabel = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date());
  const selected = news.items.filter((item, index, items) =>
    index === items.findIndex((other) => other.category === item.category),
  );
  if (selected.length < 4) return null;

  const categoryNames: Record<string, string> = {
    une: "À la une",
    politique: "Politique",
    medias: "Radio et médias",
    journalisme: "Journalisme et communication",
    ia: "Intelligence artificielle et technologie",
    dordogne: "Sarlat et Dordogne",
    emploi: "Emploi et alternance",
  };
  const content = [
    `<p>Voici la revue de presse automatique d’Angel OS pour le ${escapeHtml(dayLabel)}. Elle rassemble un sujet récent par rubrique à partir de la veille web. Les titres ci-dessous proviennent des médias cités ; ouvrez les sources pour lire les informations complètes et leur contexte.</p>`,
    ...selected.map((item) =>
      `<h2>${escapeHtml(categoryNames[item.category] ?? item.category)}</h2><p><strong>${escapeHtml(item.title)}</strong></p><p>Signal repéré par la veille Angel OS auprès de ${escapeHtml(item.source)}${item.publishedAt ? `, publié le ${escapeHtml(new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(item.publishedAt)))}` : ""}. Cette revue automatique ne reformule pas les faits au-delà du titre fourni par la source afin de ne pas ajouter d’information non vérifiée.</p>`,
    ),
    "<h2>Comment lire cette veille ?</h2><p>Cette sélection est un point de départ, pas un remplacement du travail des rédactions. Les titres peuvent évoluer, simplifier un sujet ou refléter un angle éditorial particulier. Il est recommandé de comparer plusieurs médias, de vérifier la date et de consulter directement les articles d’origine avant de partager une affirmation.</p>",
  ].join("");
  const cover = (await findArticleCover("journalisme presse actualité France")) ?? {
    url: "https://www.angel-leclerc.fr/angel-os/logo.png",
    meta: {
      source: "Angel OS",
      pageUrl: "https://www.angel-leclerc.fr/angel-os-ia",
      credit: "Angel Leclerc — Angel OS",
      license: "Identité visuelle Angel OS",
      alt: "Logo Angel OS",
    },
  };
  return {
    title: `La veille Angel OS du ${dayLabel} : les actualités à retenir`,
    excerpt: "Politique, médias, IA, Dordogne et emploi : la sélection quotidienne automatiquement compilée par la veille Angel OS.",
    content,
    sources: selected.map((item) => ({ label: `${item.source} — ${item.title}`, url: item.url })),
    topics: ["Société", "Communication & médias", "Technologie & numérique"],
    coverUrl: cover.url,
    coverMeta: cover.meta,
  };
}

async function fetchDailyNews(): Promise<NewsPayload> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch("https://angel-leclerc.vercel.app/api/admin/news", {
      headers: { Accept: "application/json", "User-Agent": "AngelOS-Daily-Article/1.0" },
      signal: controller.signal,
    });
    if (response.ok) {
      const payload = (await response.json()) as NewsPayload;
      if (payload.items.length > 0) return payload;
    }
  } catch (error) {
    console.warn("[daily-watch-article] Vercel news collector unavailable", error);
  } finally {
    clearTimeout(timeout);
  }
  return fetchAdminNewsSnapshot();
}

/** Publie au maximum un article de veille par jour, uniquement si le résultat est complet et sourcé. */
export async function publishDailyWatchArticle() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const day = new Date().toISOString().slice(0, 10);

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("articles")
    .select("id, slug")
    .contains("ai_disclosure", { dailyWatchDate: day })
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return { published: false, skipped: "already-published", article: existing };

  const news = await fetchDailyNews();
  const candidate = news.items.find((item) => item.category === "une") ?? news.items[0];
  if (!candidate) throw new Error("Aucune actualité exploitable aujourd'hui.");

  const generated = (await generateArticleDraft(
    `${candidate.title}. Point de départ obligatoire à vérifier : ${candidate.source} — ${candidate.url}`,
  )) ?? (await buildAutomaticPressReview(news));
  if (!generated) throw new Error("La génération IA n'a pas produit de résultat vérifiable.");

  const sources = [...generated.sources];
  if (!sources.some((source) => source.url === candidate.url)) {
    sources.unshift({ label: `${candidate.source} — source de départ`, url: candidate.url });
  }
  const plainTextLength = generated.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
  if (sources.length < 2 || plainTextLength < 1_500 || !generated.coverUrl || !generated.coverMeta) {
    throw new Error("Contrôle qualité refusé : texte, sources ou couverture insuffisants.");
  }

  const now = new Date().toISOString();
  const slug = `${slugify(generated.title) || "veille-angel-os"}-${day}`;
  const content = `<aside style="margin:0 0 24px;padding:16px;border-left:4px solid var(--primary);border-radius:0 12px 12px 0;background:var(--muted)"><strong>Transparence IA</strong><p style="margin:8px 0 0">${DISCLOSURE}</p></aside>${generated.content}`;

  const { data: article, error } = await supabaseAdmin
    .from("articles")
    .insert({
      title: generated.title,
      slug,
      category: "Actualité",
      excerpt: generated.excerpt || null,
      content,
      sources: sources.slice(0, 12),
      topics: generated.topics,
      cover_url: generated.coverUrl,
      cover_meta: generated.coverMeta,
      published: true,
      published_at: now,
      scheduled_at: null,
      is_private: false,
      featured: false,
      author_id: null,
      ai_disclosure: {
        personal: false,
        chatgpt: true,
        otherAi: true,
        otherAiName: "Veille Angel OS IA",
        images: false,
        imagesTool: "Wikimedia Commons",
        dailyWatchDate: day,
        automaticPublication: true,
      },
    })
    .select("id, slug, title, published_at")
    .single();
  if (error) throw error;

  await supabaseAdmin.from("activity_log").insert({
    source: "ai",
    action: "publish_daily_watch_article",
    entity_type: "articles",
    entity_id: article.id,
    details: { source_url: candidate.url, source_count: sources.length, automatic: true },
  });

  return { published: true, article };
}
