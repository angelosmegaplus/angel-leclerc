import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { searchNewsWithOpenAI } from "./ai-news-search.server";

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

export type NewsPayload = {
  items: NewsItem[];
  fetchedAt: string;
  source?: "live" | "cache";
  phase?: "openai" | "combined";
};

const NEWS_CACHE_KEY = "news_dashboard";
const HEADLINE_FRESH_HOURS = 24;
const HEADLINE_RECENT_HOURS = 6;
const AI_NEWS_TIMEOUT_MS = 4500;

const FEEDS: Array<{ category: Exclude<NewsCategory, "une">; query: string }> = [
  { category: "politique", query: "politique France société gouvernement élections souveraineté social when:1d" },
  { category: "medias", query: "radio médias France animateur radio podcast audiovisuel when:1d" },
  { category: "journalisme", query: "journalisme communication édition presse France when:1d" },
  { category: "ia", query: "intelligence artificielle technologie ChatGPT IA France web when:1d" },
  { category: "dordogne", query: "Sarlat Dordogne Périgord Bergerac Périgueux actualité when:1d" },
  { category: "emploi", query: "alternance communication emploi BTS communication radio média stage when:1d" },
];

const PREFERENCE_WEIGHTS: Array<{ pattern: RegExp; weight: number }> = [
  { pattern: /radio|animateur|antenne|podcast|audio|fm\b|audiovisuel/i, weight: 9 },
  { pattern: /journalis|presse|média|media|édition|editeur|rédaction/i, weight: 8 },
  { pattern: /communication|création|contenu|canva|marketing/i, weight: 6 },
  { pattern: /sarlat|dordogne|périgord|périgueux|bergerac/i, weight: 8 },
  { pattern: /alternance|apprentissage|bts|emploi|stage|recrut/i, weight: 7 },
  { pattern: /intelligence artificielle|\bia\b|chatgpt|openai|technolog|numérique|web/i, weight: 6 },
  { pattern: /politique|gouvernement|élection|assemblée|président|social|souverain/i, weight: 5 },
];

const CATEGORY_WEIGHT: Record<Exclude<NewsCategory, "une">, number> = {
  medias: 8,
  journalisme: 8,
  dordogne: 8,
  emploi: 7,
  politique: 6,
  ia: 6,
};

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

function parseFeed(xml: string, category: Exclude<NewsCategory, "une">): NewsItem[] {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  return items.slice(0, 18).map((block, index) => {
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
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(feed.query)}&hl=fr&gl=FR&ceid=FR:fr`;
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

function ageHours(item: NewsItem) {
  if (!item.publishedAt) return Number.POSITIVE_INFINITY;
  const timestamp = new Date(item.publishedAt).getTime();
  if (Number.isNaN(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (Date.now() - timestamp) / 3_600_000);
}

function normalizedTitle(value: string) {
  return value.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\W+/g, " ").trim();
}

function dedupe(items: NewsItem[]) {
  const seenTitles = new Set<string>();
  const seenUrls = new Set<string>();
  return items
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .filter((item) => {
      const titleKey = normalizedTitle(item.title);
      const urlKey = item.url.replace(/[?#].*$/, "");
      if (!titleKey || seenTitles.has(titleKey) || seenUrls.has(urlKey)) return false;
      seenTitles.add(titleKey);
      seenUrls.add(urlKey);
      return true;
    });
}

function preferenceScore(item: NewsItem) {
  const text = `${item.title} ${item.source}`;
  let score = item.category === "une" ? 0 : CATEGORY_WEIGHT[item.category];
  for (const rule of PREFERENCE_WEIGHTS) {
    if (rule.pattern.test(text)) score += rule.weight;
  }

  const age = ageHours(item);
  if (age <= 1) score += 45;
  else if (age <= 3) score += 34;
  else if (age <= HEADLINE_RECENT_HOURS) score += 25;
  else if (age <= 12) score += 14;
  else if (age <= HEADLINE_FRESH_HOURS) score += 6;
  else score -= Math.min(30, (age - HEADLINE_FRESH_HOURS) / 2);

  return score;
}

function buildPersonalizedHeadlines(items: NewsItem[]): NewsItem[] {
  const seenTitles = new Set<string>();
  const fresh = items.filter((item) => ageHours(item) <= HEADLINE_FRESH_HOURS);
  const ranked = [...fresh]
    .sort((a, b) => preferenceScore(b) - preferenceScore(a))
    .filter((item) => {
      const key = normalizedTitle(item.title);
      if (!key || seenTitles.has(key)) return false;
      seenTitles.add(key);
      return true;
    });

  const selected: NewsItem[] = [];
  const selectedIds = new Set<string>();
  const perCategory = new Map<NewsCategory, number>();

  for (const item of ranked) {
    const count = perCategory.get(item.category) ?? 0;
    if (count >= 2) continue;
    selected.push({ ...item, id: `une-${item.id}`, category: "une" });
    selectedIds.add(item.id);
    perCategory.set(item.category, count + 1);
    if (selected.length >= 10) break;
  }

  if (selected.length < 12) {
    for (const item of ranked) {
      if (selectedIds.has(item.id)) continue;
      const count = perCategory.get(item.category) ?? 0;
      if (count >= 3) continue;
      selected.push({ ...item, id: `une-${item.id}`, category: "une" });
      selectedIds.add(item.id);
      perCategory.set(item.category, count + 1);
      if (selected.length >= 12) break;
    }
  }

  return selected;
}

function finalize(items: NewsItem[]) {
  const topical = dedupe(
    items.filter((item) => item.category !== "une" && ageHours(item) <= HEADLINE_FRESH_HOURS),
  );
  const headlines = buildPersonalizedHeadlines(topical);
  return [...headlines, ...topical];
}

async function loadGoogleNews() {
  const groups = await Promise.all(FEEDS.map(loadFeed));
  return groups.flat();
}

async function loadAiNewsFast(): Promise<NewsItem[]> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      searchNewsWithOpenAI().catch(() => []),
      new Promise<NewsItem[]>((resolve) => {
        timer = setTimeout(() => resolve([]), AI_NEWS_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function loadCombinedNews() {
  const [aiItems, googleItems] = await Promise.all([
    loadAiNewsFast(),
    loadGoogleNews(),
  ]);
  return finalize([...aiItems, ...googleItems]);
}

export const getAdminNews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NewsPayload> => {
    await assertAdmin(context);

    const cached = await readCache(context);
    const liveItems = await loadCombinedNews();

    if (liveItems.length === 0) {
      return cached ?? { items: [], fetchedAt: new Date().toISOString(), source: "cache", phase: "combined" };
    }

    const liveCategories = new Set(liveItems.filter((item) => item.category !== "une").map((item) => item.category));
    const cachedFill = (cached?.items ?? []).filter(
      (item) => item.category !== "une" && !liveCategories.has(item.category) && ageHours(item) <= HEADLINE_FRESH_HOURS,
    );
    const merged = finalize([...liveItems.filter((item) => item.category !== "une"), ...cachedFill]);
    const payload: NewsPayload = {
      items: merged,
      fetchedAt: new Date().toISOString(),
      source: "live",
      phase: "combined",
    };
    await writeCache(context, payload);
    return payload;
  });

export async function fetchAiNewsSnapshot(): Promise<NewsPayload> {
  const aiItems = finalize(await loadAiNewsFast());
  if (aiItems.length === 0) throw new Error("Recherche web OpenAI indisponible");
  return { items: aiItems, fetchedAt: new Date().toISOString(), source: "live", phase: "openai" };
}

export async function fetchAdminNewsSnapshot(): Promise<NewsPayload> {
  const items = await loadCombinedNews();
  if (items.length === 0) throw new Error("Actualités indisponibles");
  return { items, fetchedAt: new Date().toISOString(), source: "live", phase: "combined" };
}
