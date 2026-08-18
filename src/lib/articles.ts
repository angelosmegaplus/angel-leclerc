export * from "@/lib/articles-types";
export * from "@/lib/articles-format";
export * from "@/lib/articles-date";

import type { Article } from "@/lib/articles-types";
import { githubNativeArticles, githubNativeArticleBySlug } from "@/lib/github-articles";
import { legacyGitArticles } from "@/lib/legacy-git-articles";
import {
  getAllLovableArticleArchive,
  getPublishedLovableArticleArchive,
  lovableArticleArchiveBySlug,
} from "@/content/lovable-archive";

/**
 * GitHub est la source de vérité éditoriale.
 *
 * Ordre de priorité :
 * 1. fichiers JSON natifs src/content/articles-data/*.json ;
 * 2. snapshot Lovable versionné dans Git ;
 * 3. anciens articles TypeScript maintenus dans Git.
 *
 * Aucune lecture de public.articles n'est nécessaire pour rendre le blog.
 */
function mergeGitSources(primary: Article[], archive: Article[]): Article[] {
  const bySlug = new Map<string, Article>();

  // Les sources historiques sont ajoutées d'abord pour que les fichiers natifs
  // plus récents gagnent en cas de slug identique.
  for (const article of legacyGitArticles) bySlug.set(article.slug, article);
  for (const article of archive) bySlug.set(article.slug, article);
  for (const article of primary) bySlug.set(article.slug, article);

  return [...bySlug.values()].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return (
      new Date(b.published_at ?? b.created_at).getTime() -
      new Date(a.published_at ?? a.created_at).getTime()
    );
  });
}

function visiblePublished(articles: Article[]): Article[] {
  const now = Date.now();
  return articles.filter((article) => {
    if (!article.published || article.is_private) return false;
    if (!article.scheduled_at) return true;
    return new Date(article.scheduled_at).getTime() <= now;
  });
}

export async function fetchLatestArticles(limit = 3): Promise<Article[]> {
  return visiblePublished(
    mergeGitSources(githubNativeArticles, getPublishedLovableArticleArchive()),
  ).slice(0, limit);
}

export async function fetchPublishedArticles(): Promise<Article[]> {
  return visiblePublished(
    mergeGitSources(githubNativeArticles, getPublishedLovableArticleArchive()),
  );
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const native = githubNativeArticleBySlug.get(slug);
  if (native) return native;

  const archived = lovableArticleArchiveBySlug.get(slug);
  if (archived) return archived;

  return legacyGitArticles.find((article) => article.slug === slug) ?? null;
}

export async function fetchAllArticles(): Promise<Article[]> {
  return mergeGitSources(githubNativeArticles, getAllLovableArticleArchive());
}
