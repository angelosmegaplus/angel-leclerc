import { AngelOSAdapterRegistry } from "../../angel-os/core/adapter-registry";
import { angelDataServerAdapter, type AngelDataClient } from "../../angel-os/adapters/data.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Article } from "@/lib/articles-types";

const adapters = new AngelOSAdapterRegistry();
adapters.register(angelDataServerAdapter);
const NS = "content.articles";

async function nativeData(): Promise<AngelDataClient | null> {
  if (!process.env.ANGEL_DATA_TOKEN) return null;
  try { return await adapters.connect<AngelDataClient>("angel.data.native"); } catch { return null; }
}

async function importLegacy(data: AngelDataClient): Promise<Article[]> {
  const current = await data.list<Article>(NS);
  if (current.length) return current.map((item) => item.value);
  const { data: rows, error } = await (supabaseAdmin as any).from("articles").select("*").order("updated_at", { ascending: false }).limit(1000);
  if (error) throw error;
  for (const article of rows ?? []) await data.set(NS, article.id, article);
  await data.set("migration.status", "articles", { source: "supabase", destination: `angel-data:${NS}`, imported: (rows ?? []).length, migratedAt: new Date().toISOString() });
  return (rows ?? []) as Article[];
}

function visible(article: Article) {
  if (!article.published || article.is_private) return false;
  if (article.scheduled_at && new Date(article.scheduled_at).getTime() > Date.now()) return false;
  return true;
}

function sortArticles(rows: Article[]) {
  return [...rows].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return new Date(b.published_at ?? b.created_at).getTime() - new Date(a.published_at ?? a.created_at).getTime();
  });
}

export async function listPublicArticlesNative(): Promise<Article[] | null> {
  const data = await nativeData();
  if (!data) return null;
  return sortArticles((await importLegacy(data)).filter(visible));
}

export async function getPublicArticleNative(slug: string): Promise<Article | null> {
  const data = await nativeData();
  if (!data) return null;
  return (await importLegacy(data)).find((article) => article.slug === slug && visible(article)) ?? null;
}

export async function listAdminArticlesNative(): Promise<Article[]> {
  const data = await nativeData();
  if (!data) throw new Error("Angel Data indisponible");
  return sortArticles(await importLegacy(data));
}

export async function saveAdminArticleNative(input: { article: Record<string, unknown>; id?: string | null; userId: string }): Promise<Article> {
  const data = await nativeData();
  if (!data) throw new Error("Angel Data indisponible");
  await importLegacy(data);
  const id = input.id ?? crypto.randomUUID();
  const previous = input.id ? await data.get<Article>(NS, id) : null;
  const now = new Date().toISOString();
  const article = { ...(previous ?? {}), ...input.article, id, author_id: (input.article.author_id as string | undefined) ?? input.userId, created_at: previous?.created_at ?? now, updated_at: now } as Article;
  await data.set(NS, id, article);
  return article;
}

export async function deleteAdminArticleNative(id: string) {
  const data = await nativeData();
  if (!data) throw new Error("Angel Data indisponible");
  await data.delete(NS, id);
}
