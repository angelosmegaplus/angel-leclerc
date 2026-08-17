import batch01 from "@/content/lovable-archive/articles-01.json";
import batch02 from "@/content/lovable-archive/articles-02.json";
import batch03 from "@/content/lovable-archive/articles-03.json";
import type { Article } from "@/lib/articles-types";

/**
 * Snapshot de secours des 29 articles récupérés en lecture seule depuis
 * l'ancienne base associée à Lovable le 17 août 2026.
 *
 * La base courante reste toujours prioritaire. Ce snapshot n'est utilisé que
 * lorsqu'aucun article ne peut être obtenu depuis la base courante, afin
 * d'éviter qu'une panne de chargement affiche artificiellement « 0 article ».
 */
export const lovableArticleArchive = [
  ...batch01,
  ...batch02,
  ...batch03,
] as unknown as Article[];

export const lovableArticleArchiveBySlug = new Map(
  lovableArticleArchive.map((article) => [article.slug, article] as const),
);

export function getPublishedLovableArticleArchive(): Article[] {
  return lovableArticleArchive
    .filter((article) => article.published && !article.is_private)
    .sort((a, b) => {
      const aDate = new Date(a.published_at ?? a.created_at).getTime();
      const bDate = new Date(b.published_at ?? b.created_at).getTime();
      return bDate - aDate;
    });
}

export function getAllLovableArticleArchive(): Article[] {
  return [...lovableArticleArchive].sort((a, b) => {
    const aDate = new Date(a.created_at).getTime();
    const bDate = new Date(b.created_at).getTime();
    return bDate - aDate;
  });
}
