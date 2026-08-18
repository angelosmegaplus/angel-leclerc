import { supabase } from "@/integrations/supabase/client";
import type { Article } from "@/lib/articles-types";

export type TrashedArticle = Article & { deletedAt: string | null };

function deletionInfo(badges: unknown): { deleted: boolean; deletedAt: string | null } {
  if (!badges || typeof badges !== "object" || Array.isArray(badges)) return { deleted: false, deletedAt: null };
  const record = badges as Record<string, unknown>;
  return {
    deleted: record.__angel_os_deleted === true,
    deletedAt: typeof record.deleted_at === "string" ? record.deleted_at : null,
  };
}

/** Articles marqués supprimés : conservés en base, invisibles du site et du Studio. */
export async function fetchTrashedArticles(): Promise<TrashedArticle[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((article) => ({ article, info: deletionInfo(article.badges) }))
    .filter((entry) => entry.info.deleted)
    .map((entry) => ({ ...(entry.article as Article), deletedAt: entry.info.deletedAt }));
}