import { horrorArticle } from "@/content/horrorArticle";
import { macronPhilippeArticle } from "@/content/macronPhilippeArticle";
import { politicalSalariesArticle } from "@/content/politicalSalariesArticle";
import type { Article } from "@/lib/articles-types";

export const legacyGitArticles = [
  politicalSalariesArticle as unknown as Article,
  macronPhilippeArticle as unknown as Article,
  horrorArticle as unknown as Article,
];

export const legacyGitSlugs = new Set(legacyGitArticles.map((article) => article.slug));

export function mergeLegacyGitArticles(
  databaseArticles: Article[],
  deletedSlugs: Set<string>,
): Article[] {
  const databaseSlugs = new Set(databaseArticles.map((article) => article.slug));
  return [
    ...databaseArticles,
    ...legacyGitArticles.filter(
      (article) => !databaseSlugs.has(article.slug) && !deletedSlugs.has(article.slug),
    ),
  ].sort(
    (a, b) =>
      new Date(b.published_at ?? b.created_at).getTime() -
      new Date(a.published_at ?? a.created_at).getTime(),
  );
}

export function legacyGitArticlesForAdmin(deletedSlugs: Set<string>): Article[] {
  return legacyGitArticles
    .filter((article) => !deletedSlugs.has(article.slug))
    .map((article) => ({ ...article, id: "" as unknown as string }));
}
