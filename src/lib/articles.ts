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
 * Les slugs présents dans git_article_state concernent uniquement les anciens
 * articles maintenus dans Git. Ils ne doivent jamais masquer un article courant
 * présent dans Supabase avec le même slug.
 *
 * Les 29 articles historiques récupérés en lecture seule depuis l'ancienne base
 * sont conservés dans Git comme filet de sécurité. La base actuelle reste la
 * source prioritaire : le snapshot n'est servi que si la base renvoie zéro ligne
 * ou si la lecture échoue complètement. Cela évite qu'un catalogue vide causé
 * par une panne soit interprété comme une suppression réelle des articles.
 */
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
    if (databaseArticles.length === 0) {
      return archivedPublishedFallback(deleted).slice(0, limit);
    }
    return mergeLegacyGitArticles(databaseArticles, deleted).slice(0, limit);
  } catch {
    return archivedPublishedFallback(deleted).slice(0, limit);
  }
}

export async function fetchPublishedArticles(): Promise<Article[]> {
  const deleted = await fetchDeletedGitArticleSlugs();
  try {
    const databaseArticles = await base.fetchPublishedArticles();
    if (databaseArticles.length === 0) {
      return archivedPublishedFallback(deleted);
    }
    return mergeLegacyGitArticles(databaseArticles, deleted);
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

    // Une base complètement vide est considérée comme un incident de lecture :
    // le snapshot local prend alors le relais sans dépendre de Lovable.
    if (databaseArticles.length === 0) {
      const archived = lovableArticleArchiveBySlug.get(slug);
      if (archived) return archived;
    }

    if (deleted.has(slug)) return null;
    return await base.fetchArticleBySlug(slug);
  } catch {
    const archived = lovableArticleArchiveBySlug.get(slug);
    if (archived) return archived;
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
    if (databaseArticles.length === 0) {
      return archivedAllFallback(deleted);
    }
    return mergeLegacyGitArticles(databaseArticles, deleted);
  } catch {
    return archivedAllFallback(deleted);
  }
}
