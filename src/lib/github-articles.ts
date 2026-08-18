import type { Article } from "@/lib/articles-types";

/**
 * Articles éditoriaux natifs stockés dans GitHub.
 * Chaque fichier JSON sous src/content/articles-data devient une entrée du CMS.
 * Vite les embarque au build, donc le site public n'a aucune dépendance à une base
 * de données pour lire ces articles.
 */
const modules = import.meta.glob("/src/content/articles-data/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Partial<Article>>;

const tombstoneModules = import.meta.glob("/src/content/article-tombstones/*.json", {
  eager: true,
  import: "default",
}) as Record<string, { slug?: string }>;

export const githubDeletedArticleSlugs = new Set(
  Object.entries(tombstoneModules)
    .map(([path, value]) =>
      String(value.slug || path.split("/").pop()?.replace(/\.json$/i, "") || ""),
    )
    .filter(Boolean),
);

function normalizeArticle(raw: Partial<Article>, path: string): Article {
  const now = new Date(0).toISOString();
  const slugFromPath = path.split("/").pop()?.replace(/\.json$/i, "") || "article";
  const slug = String(raw.slug || slugFromPath);
  const createdAt = String(raw.created_at || raw.published_at || now);
  const updatedAt = String(raw.updated_at || createdAt);

  return {
    id: String(raw.id || `github:${slug}`),
    slug,
    title: String(raw.title || slug),
    category: String(raw.category || "Article"),
    excerpt: raw.excerpt ?? null,
    content: String(raw.content || ""),
    cover_url: raw.cover_url ?? null,
    published: raw.published !== false,
    published_at: raw.published_at ?? createdAt,
    author_id: raw.author_id ?? null,
    created_at: createdAt,
    updated_at: updatedAt,
    scheduled_at: raw.scheduled_at ?? null,
    is_private: raw.is_private === true,
    featured: raw.featured === true,
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    sources: Array.isArray(raw.sources) ? raw.sources : [],
    topics: Array.isArray(raw.topics) ? raw.topics : [],
    ai_disclosure: raw.ai_disclosure ?? {},
    cover_meta: raw.cover_meta ?? {},
  } as Article;
}

export const githubNativeArticles: Article[] = Object.entries(modules)
  .map(([path, value]) => normalizeArticle(value, path))
  .filter((article) => !githubDeletedArticleSlugs.has(article.slug))
  .sort(
    (a, b) =>
      new Date(b.published_at ?? b.created_at).getTime() -
      new Date(a.published_at ?? a.created_at).getTime(),
  );

export const githubNativeArticleBySlug = new Map(
  githubNativeArticles.map((article) => [article.slug, article]),
);
