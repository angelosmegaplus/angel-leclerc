import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type NewsCategory =
  | "une"
  | "politique"
  | "medias"
  | "journalisme"
  | "ia"
  | "dordogne"
  | "emploi";

export type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
  category: NewsCategory;
};

type NewsPayload = { items: NewsItem[]; fetchedAt: string; source?: "live" | "cache" };

const NEWS_CACHE_KEY = "news_dashboard";

const FEEDS: Array<{ category: NewsCategory; query?: string; url?: string }> = [
  { category: "une", url: "https://news.google.com/rss?hl=fr&gl=FR&ceid=FR:fr" },
  { category: "politique", query: "politique France société" },
  { category: "medias", query: "radio médias France" },
  { category: "journalisme", query: "journalisme communication France" },
  { category: "ia", query: "intelligence artificielle technologie France" },
  { category: "dordogne", query: "Sarlat Dordogne Périgord" },
  { category: "emploi", query: "alternance communication emploi BTS communication" },
];

const decodeXml = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decodeXml(match[1].trim()) : "";
}

function parseFeed(xml: string, category: NewsCategory): NewsItem[] {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  return items.slice(0, 14).map((block, index) => {
    const title = tag(block, "title").replace(/\s+-\s+[^-]+$/, "").trim();
    const url = tag(block, "link");
    const source = tag(block, "source") || "Google News";
    const pubDate = tag(block, "pubDate");
    const parsedDate = pubDate ? new Date(pubDate) : null;
    return {
      id: `${category}-${index}-${title}`,
      title,
      url,
      source,
      publishedAt: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null,
      category,
    };
  }).filter((item) => item.title && item.url);
}

async function assertAdmin(context: { supabase: { from: (table: string) => any }; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Accès réservé à l'administrateur.");
}

async function loadFeed(feed: (typeof FEEDS)[number]): Promise<NewsItem[]> {
  const url = feed.url ?? `https://news.google.com/rss/search?q=${encodeURIComponent(feed.query ?? "")}&hl=fr&gl=FR&ceid=FR:fr`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "AngelOS-News/1.0", Accept: "application/rss+xml, application/xml, text/xml" },
      signal: controller.signal,
    });
    if (!response.ok) return [];
    return parseFeed(await response.text(), feed.category);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function readCache(context: any): Promise<NewsPayload | null> {
  const { data } = await context.supabase
    .from("angel_os_cache")
    .select("payload, updated_at")
    .eq("key", NEWS_CACHE_KEY)
    .maybeSingle();
  if (!data?.payload) return null;
  const payload = data.payload as NewsPayload;
  return { ...payload, fetchedAt: payload.fetchedAt || data.updated_at, source: "cache" };
}

async function writeCache(context: any, payload: NewsPayload) {
  await context.supabase
    .from("angel_os_cache")
    .upsert({ key: NEWS_CACHE_KEY, payload, updated_at: new Date().toISOString() }, { onConflict: "key" });
}

function dedupe(items: NewsItem[]) {
  const seen = new Set<string>();
  return items
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .filter((item) => {
      const key = `${item.category}:${item.title.toLocaleLowerCase("fr").replace(/\W+/g, " ").trim()}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export const getAdminNews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NewsPayload> => {
    await assertAdmin(context);

    const cached = await readCache(context);
    const groups = await Promise.all(FEEDS.map(loadFeed));
    const liveItems = dedupe(groups.flat());

    if (liveItems.length === 0) {
      return cached ?? { items: [], fetchedAt: new Date().toISOString(), source: "cache" };
    }

    const categories = new Set(liveItems.map((item) => item.category));
    const cachedFill = (cached?.items ?? []).filter((item) => !categories.has(item.category));
    const merged = dedupe([...liveItems, ...cachedFill]);
    const payload: NewsPayload = {
      items: merged,
      fetchedAt: new Date().toISOString(),
      source: "live",
    };
    await writeCache(context, payload);
    return payload;
  });
