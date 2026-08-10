import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Article = Database["public"]["Tables"]["articles"]["Row"];

export type ArticleAttachment = {
  name: string;
  url: string;
  size?: number;
};

export type ArticleSource = {
  label: string;
  url: string;
};

export function getSources(article: { sources?: unknown }): ArticleSource[] {
  const raw = article.sources;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (s): s is ArticleSource =>
      typeof s === "object" &&
      s !== null &&
      typeof (s as ArticleSource).label === "string" &&
      (s as ArticleSource).label.trim().length > 0,
  );
}

export function getAttachments(article: Article): ArticleAttachment[] {
  const raw = article.attachments;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (a): a is ArticleAttachment =>
      typeof a === "object" && a !== null && "url" in a && "name" in a,
  );
}

export const ARTICLE_CATEGORIES = [
  "Article",
  "Annonce",
  "Presse",
  "Coulisses",
  "Projet",
] as const;

function visibleNow(query: any) {
  return query.or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`);
}

/** Statut d'affichage d'un article dans l'espace personnel. */
export type ArticleStatus = "brouillon" | "programme" | "publie";

export function getArticleStatus(article: {
  published: boolean;
  scheduled_at: string | null;
}): ArticleStatus {
  if (!article.published) return "brouillon";
  if (article.scheduled_at && new Date(article.scheduled_at) > new Date())
    return "programme";
  return "publie";
}

export function formatDateTime(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function fetchLatestArticles(limit = 3): Promise<Article[]> {
  const { data, error } = await visibleNow(
    supabase.from("articles").select("*").eq("published", true).eq("is_private", false),
  )
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function fetchPublishedArticles(): Promise<Article[]> {
  const { data, error } = await visibleNow(
    supabase.from("articles").select("*").eq("published", true).eq("is_private", false),
  )
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAllArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}