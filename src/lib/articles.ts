export * from "@/lib/articles-types";
export * from "@/lib/articles-format";
export * from "@/lib/articles-date";

import * as base from "@/lib/articles.impl";
import type { Article } from "@/lib/articles-types";
import { fetchDeletedGitArticleSlugs } from "@/lib/git-article-state";
import {
  githubDeletedArticleSlugs,
  githubNativeArticles,
} from "@/lib/github-articles";
import { legacyGitArticles } from "@/lib/legacy-git-articles";
import {
  getAllLovableArticleArchive,
  getPublishedLovableArticleArchive,
} from "@/content/lovable-archive";

function deletedSlugs(extra: Set<string>) {
  return new Set([...githubDeletedArticleSlugs, ...extra]);
}

/**
 * GitHub reste la source éditoriale de référence. Tant que Vercel ne possède pas
 * encore un token GitHub d'écriture, une ligne serveur Supabase peut toutefois
 * surcharger un article Git existant afin que modifier/masquer/supprimer reste
 * opérationnel. La version de base gagne toujours par slug.
 */
function mergeSources(databaseArticles: Article[], archive: Article[], deleted: Set<string>): Article[] {
  const bySlug = new Map<string, Article>();

  for (const article of legacyGitArticles) {
    if (!deleted.has(article.slug)) bySlug.set(article.slug, article);
  }
  for (const article of archive) {
    if (!deleted.has(article.slug)) bySlug.set(article.slug, article);
  }
  for (const article of githubNativeArticles) {
    if (!deleted.has(article.slug)) bySlug.set(article.slug, article);
  }
  // Une ligne courante doit rester visible dans l'admin même si un tombstone
  // masque sa version historique Git sur le site public.
  for (const article of databaseArticles) bySlug.set(article.slug, article);

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

async function currentArticles(): Promise<Article[]> {
  try {
    return await base.fetchAllArticles();
  } catch {
    return [];
  }
}

export async function fetchLatestArticles(limit = 3): Promise<Article[]> {
  const deleted = deletedSlugs(await fetchDeletedGitArticleSlugs());
  const database = await currentArticles();
  return visiblePublished(
    mergeSources(database, getPublishedLovableArticleArchive(), deleted),
  ).slice(0, limit);
}

export async function fetchPublishedArticles(): Promise<Article[]> {
  const deleted = deletedSlugs(await fetchDeletedGitArticleSlugs());
  const database = await currentArticles();
  return visiblePublished(
    mergeSources(database, getPublishedLovableArticleArchive(), deleted),
  );
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const deleted = deletedSlugs(await fetchDeletedGitArticleSlugs());
  const database = await currentArticles();
  const current = database.find((article) => article.slug === slug);

  if (current) {
    if (!current.published || current.is_private) return null;
    if (current.scheduled_at && new Date(current.scheduled_at).getTime() > Date.now()) return null;
    return current;
  }
  if (deleted.has(slug)) return null;

  const merged = mergeSources([], getAllLovableArticleArchive(), deleted);
  const article = merged.find((candidate) => candidate.slug === slug) ?? null;
  if (!article) return null;
  if (!article.published || article.is_private) return null;
  if (article.scheduled_at && new Date(article.scheduled_at).getTime() > Date.now()) return null;
  return article;
}

export async function fetchAllArticles(): Promise<Article[]> {
  const deleted = deletedSlugs(await fetchDeletedGitArticleSlugs());
  const database = await currentArticles();
  return mergeSources(database, getAllLovableArticleArchive(), deleted);
}
