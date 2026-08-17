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

/**
 * Les slugs présents dans git_article_state concernent uniquement les anciens
 * articles maintenus dans Git. Ils ne doivent jamais masquer un article courant
 * présent dans Supabase avec le même slug.
 */
export async function fetchLatestArticles(limit = 3): Promise<Article[]> {
  const deleted = await fetchDeletedGitArticleSlugs();
  try {
    const databaseArticles = await base.fetchLatestArticles(Math.max(limit, 10));
    return mergeLegacyGitArticles(databaseArticles, deleted).slice(0, limit);
  } catch {
    return mergeLegacyGitArticles([], deleted).slice(0, limit);
  }
}

export async function fetchPublishedArticles(): Promise<Article[]> {
  const deleted = await fetchDeletedGitArticleSlugs();
  try {
    const databaseArticles = await base.fetchPublishedArticles();
    return mergeLegacyGitArticles(databaseArticles, deleted);
  } catch {
    return mergeLegacyGitArticles([], deleted);
  }
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const deleted = await fetchDeletedGitArticleSlugs();
  try {
    // Toujours donner priorité à la base actuelle. Un ancien article Git marqué
    // supprimé ne doit pas empêcher la réutilisation normale de son slug.
    const databaseArticle = (await base.fetchAllArticles()).find(
      (article) => article.slug === slug,
    );
    if (databaseArticle) return databaseArticle;

    if (deleted.has(slug)) return null;
    return await base.fetchArticleBySlug(slug);
  } catch {
    if (deleted.has(slug)) return null;
    return legacyGitArticles.find((article) => article.slug === slug) ?? null;
  }
}

export async function fetchAllArticles(): Promise<Article[]> {
  const deleted = await fetchDeletedGitArticleSlugs();
  try {
    // Le catalogue administrateur doit contenir toutes les lignes Supabase,
    // brouillons et articles privés inclus. `deleted` ne filtre que le fallback Git.
    const databaseArticles = await base.fetchAllArticles();
    return mergeLegacyGitArticles(databaseArticles, deleted);
  } catch {
    return mergeLegacyGitArticles([], deleted);
  }
}
