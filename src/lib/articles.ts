export * from "@/lib/articles-types";
export * from "@/lib/articles-format";
export * from "@/lib/articles-date";

import * as base from "@/lib/articles.impl";
import type { Article } from "@/lib/articles-types";
import { fetchDeletedGitArticleSlugs } from "@/lib/git-article-state";
import {
  legacyGitArticles,
  mergeLegacyGitArticles,
} from "@/lib/legacy-git-articles";
import {
  getAllLovableArticleArchive,
  getPublishedLovableArticleArchive,
  lovableArticleArchiveBySlug,
} from "@/content/lovable-archive";

/**
 * Fusionne la base actuelle avec le snapshot Lovable récupéré.
 * La base gagne toujours en cas de slug identique. Les suppressions volontaires
 * ne filtrent que les archives : une ligne Supabase actuelle n'est jamais masquée.
 */
function mergeLovableArchive(
  databaseArticles: Article[],
  archivedArticles: Article[],
  deleted: Set<string>,
): Article[] {
  const databaseSlugs = new Set(databaseArticles.map((article) => article.slug));
  const recovered = archivedArticles.filter(
    (article) => !databaseSlugs.has(article.slug) && !deleted.has(article.slug),
  );
  return [...databaseArticles, ...recovered].sort(
    (a, b) =>
      new Date(b.published_at ?? b.created_at).getTime() -
      new Date(a.published_at ?? a.created_at).getTime(),
  );
}

function archivedPublishedFallback(deleted: Set<string>): Article[] {
  return mergeLegacyGitArticles(getPublishedLovableArticleArchive(), deleted);
}

function archivedAllFallback(deleted: Set<string>): Article[] {
  return mergeLegacyGitArticles(getAllLovableArticleArchive(), deleted);
}

export async function fetchLatestArticles(limit = 3): Promise<Article[]> {
  const deleted = await fetchDeletedGitArticleSlugs();
  try {
    const databaseArticles = await base.fetchLatestArticles(Math.max(limit, 10));
    const withArchive = mergeLovableArchive(
      databaseArticles,
      getPublishedLovableArticleArchive(),
      deleted,
    );
    return mergeLegacyGitArticles(withArchive, deleted).slice(0, limit);
  } catch {
    return archivedPublishedFallback(deleted).slice(0, limit);
  }
}

export async function fetchPublishedArticles(): Promise<Article[]> {
  const deleted = await fetchDeletedGitArticleSlugs();
  try {
    const databaseArticles = await base.fetchPublishedArticles();
    const withArchive = mergeLovableArchive(
      databaseArticles,
      getPublishedLovableArticleArchive(),
      deleted,
    );
    return mergeLegacyGitArticles(withArchive, deleted);
  } catch {
    return archivedPublishedFallback(deleted);
  }
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const deleted = await fetchDeletedGitArticleSlugs();
  try {
    // Toujours donner priorité à la base actuelle. Un ancien article Git marqué
    // supprimé ne doit pas empêcher la réutilisation normale de son slug.
    const databaseArticles = await base.fetchAllArticles();
    const databaseArticle = databaseArticles.find((article) => article.slug === slug);
    if (databaseArticle) return databaseArticle;

    // Tant que la restauration native n'est pas terminée, un article du snapshot
    // doit rester adressable même si quelques lignes seulement existent en base.
    if (!deleted.has(slug)) {
      const archived = lovableArticleArchiveBySlug.get(slug);
      if (archived) return archived;
    }

    if (deleted.has(slug)) return null;
    return await base.fetchArticleBySlug(slug);
  } catch {
    if (!deleted.has(slug)) {
      const archived = lovableArticleArchiveBySlug.get(slug);
      if (archived) return archived;
    }
    if (deleted.has(slug)) return null;
    return legacyGitArticles.find((article) => article.slug === slug) ?? null;
  }
}

export async function fetchAllArticles(): Promise<Article[]> {
  const deleted = await fetchDeletedGitArticleSlugs();
  try {
    // L'admin montre aussi les archives récupérées tant que leur restauration
    // native n'est pas terminée. Une version Supabase plus récente reste prioritaire.
    const databaseArticles = await base.fetchAllArticles();
    const withArchive = mergeLovableArchive(
      databaseArticles,
      getAllLovableArticleArchive(),
      deleted,
    );
    return mergeLegacyGitArticles(withArchive, deleted);
  } catch {
    return archivedAllFallback(deleted);
  }
}
