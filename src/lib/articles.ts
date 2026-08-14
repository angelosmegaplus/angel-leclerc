export * from "@/lib/articles-types";
export * from "@/lib/articles-format";
export * from "@/lib/articles-date";

import * as base from "@/lib/articles.impl";
import type { Article } from "@/lib/articles-types";
import { fetchDeletedGitArticleSlugs } from "@/lib/git-article-state";
import { legacyGitArticles, mergeLegacyGitArticles } from "@/lib/legacy-git-articles";
import { getPublicNativeArticle, listAdminNativeArticles, listPublicNativeArticles } from "@/lib/articles-native.functions";

function withoutDeleted(articles: Article[], deleted: Set<string>): Article[] {
  return articles.filter((article) => !deleted.has(article.slug));
}

async function nativePublished(): Promise<Article[] | null> {
  try { return await listPublicNativeArticles(); } catch { return null; }
}

export async function fetchLatestArticles(limit = 3): Promise<Article[]> {
  const deleted = await fetchDeletedGitArticleSlugs();
  const native = await nativePublished();
  if (native) return mergeLegacyGitArticles(withoutDeleted(native, deleted), deleted).slice(0, limit);
  try {
    const visible = withoutDeleted(await base.fetchLatestArticles(Math.max(limit, 10)), deleted);
    return mergeLegacyGitArticles(visible, deleted).slice(0, limit);
  } catch {
    return mergeLegacyGitArticles([], deleted).slice(0, limit);
  }
}

export async function fetchPublishedArticles(): Promise<Article[]> {
  const deleted = await fetchDeletedGitArticleSlugs();
  const native = await nativePublished();
  if (native) return mergeLegacyGitArticles(withoutDeleted(native, deleted), deleted);
  try {
    const visible = withoutDeleted(await base.fetchPublishedArticles(), deleted);
    return mergeLegacyGitArticles(visible, deleted);
  } catch {
    return mergeLegacyGitArticles([], deleted);
  }
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const deleted = await fetchDeletedGitArticleSlugs();
  if (deleted.has(slug)) return null;
  try {
    const native = await getPublicNativeArticle({ data: { slug } });
    if (native) return native;
  } catch { /* compatibility fallback */ }
  try {
    const databaseArticle = (await base.fetchAllArticles()).find((article) => article.slug === slug);
    if (databaseArticle) return databaseArticle;
    return await base.fetchArticleBySlug(slug);
  } catch {
    return legacyGitArticles.find((article) => article.slug === slug) ?? null;
  }
}

export async function fetchAllArticles(): Promise<Article[]> {
  const deleted = await fetchDeletedGitArticleSlugs();
  try {
    return withoutDeleted(await listAdminNativeArticles(), deleted);
  } catch {
    return withoutDeleted(await base.fetchAllArticles(), deleted);
  }
}
