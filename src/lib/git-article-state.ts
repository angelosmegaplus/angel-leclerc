import { getDeletedRecoveredArticleSlugs } from "@/lib/article-state.functions";

export const LEGACY_GIT_ARTICLE_SLUGS = new Set([
  "macron-2017-philippe-2027-reseaux-attali-president-par-defaut",
  "meilleurs-films-horreur-classement-allocine-avis",
]);

export async function fetchDeletedGitArticleSlugs(): Promise<Set<string>> {
  const slugs = await getDeletedRecoveredArticleSlugs();
  return new Set(slugs);
}
