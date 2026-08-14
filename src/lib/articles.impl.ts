import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { horrorArticle } from "@/content/horrorArticle";

export type Article = Database["public"]["Tables"]["articles"]["Row"];
export type ArticleAttachment = { name: string; url: string; size?: number };
export type ArticleSource = { label: string; url: string };
export type AiDisclosure = { personal: boolean; chatgpt: boolean; otherAi: boolean; otherAiName: string; images: boolean; imagesTool: string };

export const emptyAiDisclosure: AiDisclosure = { personal: false, chatgpt: false, otherAi: false, otherAiName: "", images: false, imagesTool: "" };
export function getAiDisclosure(article: { ai_disclosure?: unknown }): AiDisclosure {
  const raw = article.ai_disclosure;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return emptyAiDisclosure;
  const r = raw as Record<string, unknown>;
  return { personal: r.personal === true, chatgpt: r.chatgpt === true, otherAi: r.otherAi === true, otherAiName: typeof r.otherAiName === "string" ? r.otherAiName : "", images: r.images === true, imagesTool: typeof r.imagesTool === "string" ? r.imagesTool : "" };
}
export function hasAiDisclosure(d: AiDisclosure): boolean { return d.personal || d.chatgpt || d.otherAi || d.images; }
export function getSources(article: { sources?: unknown }): ArticleSource[] {
  const raw = article.sources;
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is ArticleSource => typeof s === "object" && s !== null && typeof (s as ArticleSource).label === "string" && (s as ArticleSource).label.trim().length > 0);
}
export function getAttachments(article: Article): ArticleAttachment[] {
  const raw = article.attachments;
  if (!Array.isArray(raw)) return [];
  return raw.filter((a): a is ArticleAttachment => typeof a === "object" && a !== null && "url" in a && "name" in a);
}

export const ARTICLE_CATEGORIES = ["Article", "Annonce", "Presse", "Coulisses", "Projet"] as const;
export const ARTICLE_TOPICS = ["Politique", "Société", "Emploi & formation", "Entreprise & économie", "Communication & médias", "International & géopolitique", "Religion", "Scoutisme", "Technologie & numérique", "Culture & idées"] as const;
export type ArticleTopic = (typeof ARTICLE_TOPICS)[number];
export function getTopics(article: { topics?: unknown }): string[] { const raw = article.topics; return Array.isArray(raw) ? raw.filter((t): t is string => typeof t === "string" && t.trim().length > 0) : []; }
function visibleNow(query: any) { return query.or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`); }
export type ArticleStatus = "brouillon" | "programme" | "publie";
export function getArticleStatus(article: { published: boolean; scheduled_at: string | null }): ArticleStatus { if (!article.published) return "brouillon"; if (article.scheduled_at && new Date(article.scheduled_at) > new Date()) return "programme"; return "publie"; }
export function formatDateTime(value: string | null): string { if (!value) return ""; return new Date(value).toLocaleString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
export function slugify(input: string): string { return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80); }
export function formatDate(value: string | null): string { if (!value) return ""; return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); }

const staticPublicArticles = [horrorArticle as unknown as Article];
function mergePublicArticles(data: Article[]): Article[] {
  const bySlug = new Map<string, Article>();
  for (const article of [...staticPublicArticles, ...data]) bySlug.set(article.slug, article);
  return [...bySlug.values()].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return new Date(b.published_at ?? b.created_at).getTime() - new Date(a.published_at ?? a.created_at).getTime();
  });
}

export async function fetchLatestArticles(limit = 3): Promise<Article[]> {
  const { data, error } = await visibleNow(supabase.from("articles").select("*").eq("published", true).eq("is_private", false)).order("featured", { ascending: false }).order("published_at", { ascending: false }).limit(Math.max(limit, 10));
  if (error) throw error;
  return mergePublicArticles(data ?? []).slice(0, limit);
}
export async function fetchPublishedArticles(): Promise<Article[]> {
  const { data, error } = await visibleNow(supabase.from("articles").select("*").eq("published", true).eq("is_private", false)).order("featured", { ascending: false }).order("published_at", { ascending: false });
  if (error) throw error;
  return mergePublicArticles(data ?? []);
}
export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const local = staticPublicArticles.find((article) => article.slug === slug);
  if (local) return local;
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .eq("is_private", false)
    .maybeSingle();
  if (error) throw error;
  return data;
}
export async function fetchAllArticles(): Promise<Article[]> {
  const { data, error } = await supabase.from("articles").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}