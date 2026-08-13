import { supabase } from "@/integrations/supabase/client";

export const LEGACY_GIT_ARTICLE_SLUGS = new Set([
  "macron-2017-philippe-2027-reseaux-attali-president-par-defaut",
  "meilleurs-films-horreur-classement-allocine-avis",
]);

type StateRow = { slug: string };

/** Lit uniquement les slugs des anciens articles Git explicitement supprimés. */
export async function fetchDeletedGitArticleSlugs(): Promise<Set<string>> {
  try {
    const client = supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: boolean) => Promise<{
            data: StateRow[] | null;
            error: unknown;
          }>;
        };
      };
    };
    const { data, error } = await client
      .from("git_article_state")
      .select("slug")
      .eq("deleted", true);
    if (error) throw error;
    return new Set((data ?? []).map((row) => row.slug));
  } catch {
    return new Set();
  }
}
