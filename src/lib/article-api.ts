import { supabase } from "@/integrations/supabase/client";

export type ArticleApiResult = {
  ok: true;
  slug: string;
  backend: "github" | "supabase-fallback";
  commitSha?: string | null;
};

async function callArticleApi(body: Record<string, unknown>): Promise<ArticleApiResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Session expirée : reconnectez-vous.");

  const response = await fetch("/api/admin/articles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof payload.error === "string" ? payload.error : `Erreur ${response.status}`;
    throw new Error(message);
  }
  return payload as ArticleApiResult;
}

/** Création / mise à jour d'un article via la route API stable partagée avec l'éditeur Lovable. */
export function saveArticleViaApi(article: Record<string, unknown>) {
  return callArticleApi({ action: "save", article });
}

/** Suppression d'un article via la même route API. */
export function deleteArticleViaApi(slug: string) {
  return callArticleApi({ action: "delete", slug });
}

/** Restauration depuis la corbeille : l'article revient en brouillon privé. */
export function restoreArticleViaApi(slug: string) {
  return callArticleApi({ action: "restore", slug });
}

/** Suppression définitive (uniquement depuis la corbeille). */
export function purgeArticleViaApi(slug: string) {
  return callArticleApi({ action: "purge", slug });
}
