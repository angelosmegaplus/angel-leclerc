import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Article = Database["public"]["Tables"]["articles"]["Row"];

export type ArticleAttachment = {
  name: string;
  url: string;
  size?: number;
};

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

export async function fetchLatestArticles(limit = 3): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("published", true)
    .eq("is_private", false)
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
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("published", true)
    .eq("is_private", false)
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