export * from "@/lib/articles-types";
export * from "@/lib/articles-format";
export * from "@/lib/articles-date";

import * as base from "@/lib/articles.impl";
import type { Article } from "@/lib/articles-types";

/**
 * Source unique de vérité : la base native du projet (Lovable Cloud).
 * Aucune archive JSON, aucun fichier GitHub, aucune ancienne base externe
 * n'intervient plus dans le cycle de vie des articles.
 */
export function isDatabaseDeletionSentinel(article: Pick<Article, "badges">): boolean {
  const badges = article.badges;
  return Boolean(
    badges &&
      typeof badges === "object" &&
      !Array.isArray(badges) &&
      (badges as Record<string, unknown>).__angel_os_deleted === true,
  );
}

export const fetchLatestArticles = base.fetchLatestArticles;
export const fetchPublishedArticles = base.fetchPublishedArticles;
export const fetchArticleBySlug = base.fetchArticleBySlug;

/** Liste complète (admin) hors corbeille. */
export async function fetchAllArticles(): Promise<Article[]> {
  const articles = await base.fetchAllArticles();
  return articles.filter((article) => !isDatabaseDeletionSentinel(article));
}

/** Studio : même source, même filtre corbeille. */
export const fetchStudioArticles = fetchAllArticles;
