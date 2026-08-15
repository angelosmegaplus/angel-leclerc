import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { searchNewsWithOpenAI } from "./ai-news-search.server";

export type NewsCategory =
  | "une"
  | "politique"
  | "dordogne"
  | "tourisme"
  | "medias"
  | "journalisme"
  | "emploi"
  | "ia"
  | "scoutisme";

export type NewsItem = { id: string; title: string; url: string; source: string; publishedAt: string | null; category: NewsCategory };
export type NewsPayload = { items: NewsItem[]; fetchedAt: string; source?: "live" | "cache"; phase?: "openai" | "combined" };

const NEWS_CACHE_KEY = "news_dashboard";
const TOPICAL_MAX_HOURS = 48;
const HEADLINE_PRIMARY_HOURS = 10;
const HEADLINE_FALLBACK_HOURS = 30;
// La recherche web peut tenter OpenAI direct (12 s max) puis le Gateway (12 s max).
// Le garde-fou externe doit donc laisser ce fallback aller au bout, tout en restant
// inférieur au timeout de contrôle production (35 s).
const AI_NEWS_TIMEOUT_MS = 28_000;

const FEEDS: Array<{ category: Exclude<NewsCategory, "une">; query: string }> = [
  { category: "politique", query: '(politique France OR société OR gouvernement OR Assemblée OR collectivités OR services publics OR pouvoir achat OR souveraineté OR justice OR corruption OR lobbying OR institutions) when:1d' },
  { category: "dordogne", query: '(Sarlat OR Périgord Noir OR Dordogne OR Périgueux OR Bergerac OR Souillac) (actualité OR politique OR travaux OR commerce OR transport OR logement OR culture OR justice OR emploi OR association) when:2d' },
  { category: "tourisme", query: '(tourisme OR office de tourisme OR destination OR fréquentation touristique OR patrimoine OR hôtellerie OR camping OR saison touristique OR attractivité) (Dordogne OR Périgord OR Lot OR Nouvelle-Aquitaine OR France) when:2d' },
  { category: "medias", query: '(radio OR audiovisuel OR médias OR animateur radio OR podcast OR audience OR Radio France OR radio locale OR FM) France when:1d' },
  { category: "journalisme", query: '(journalisme OR presse OR rédaction OR communication OR création contenu OR média local OR édition OR information locale) France when:2d' },
  { category: "emploi", query: '(alternance BTS Communication OR assistant communication OR chargé communication OR radio OR média OR journalisme OR tourisme OR stage communication) (Périgueux OR Bergerac OR Brive OR Sarlat OR Bordeaux) when:2d' },
  { category: "ia", query: '(OpenAI OR ChatGPT OR intelligence artificielle OR Android OR Google Pixel OR smartphone utile OR technologie grand public) France when:1d' },
  { category: "scoutisme", query: '(scoutisme OR scouts OR éclaireurs OR camp scout OR mouvement scout OR éducation populaire jeunesse) France when:7d' },
];

const PREFERENCE_WEIGHTS: Array<{ pattern: RegExp; weight: number }> = [
  { pattern: /sarlat|périgord noir|dordogne|périgueux|bergerac|souillac/i, weight: 24 },
  { pattern: /politique|gouvernement|assemblée|président|élection|collectivité|social|souverain|service public|pouvoir d.?achat|institution/i, weight: 22 },
  { pattern: /corruption|favoritisme|conflit d.?intérêts|lobby|enquête|justice|financier|marché public/i, weight: 20 },
  { pattern: /tourisme|office de tourisme|patrimoine|destination|fréquentation|hôtel|camping|saison touristique|attractivité/i, weight: 18 },
  { pattern: /radio|animateur|antenne|podcast|audio|fm\b|audiovisuel|radio france/i, weight: 15 },
  { pattern: /journalis|presse|média|media|édition|rédaction|information locale/i, weight: 13 },
  { pattern: /alternance|apprentissage|bts|emploi|stage|recrut/i, weight: 12 },
  { pattern: /communication|création|contenu|canva|marketing/i, weight: 9 },
  { pattern: /scout|éclaireur|éducation populaire|jeunesse|camp/i, weight: 7 },
  { pattern: /android|pixel|smartphone|openai|chatgpt|intelligence artificielle|\bia\b/i, weight: 6 },
];

const CATEGORY_WEIGHT: Record<Exclude<NewsCategory, "une">, number> = {
  politique: 20, dordogne: 20, tourisme: 16, medias: 14, journalisme: 13, emploi: 12, ia: 6, scoutisme: 5,
};

const decodeXml = (value: string) => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
function tag(block: string, name: string): string { const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i")); return match ? decodeXml(match[1].trim()) : ""; }
function parseFeed(xml: string, category: Exclude<NewsCategory, "une">): NewsItem[] {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  return items.slice(0, 24).map((block, index) => {
    const title = tag(block, "title").replace(/\s+-\s+[^-]+$/, "").trim();
    const url = tag(block, "link"); const source = tag(block, "source") || "Google News"; const pubDate = tag(block, "pubDate"); const parsedDate = pubDate ? new Date(pubDate) : null;
    return { id: `${category}-${index}-${title}`, title, url, source, publishedAt: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null, category };
  }).filter((item) => item.title && item.url);
}
async function assertAdmin(context: { supabase: { from: (table: string) => any }; userId: string }) { const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle(); if (!data) throw new Error("Accès réservé à l'administrateur."); }
async function loadFeed(feed: (typeof FEEDS)[number]): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(feed.query)}&hl=fr&gl=FR&ceid=FR:fr`; const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 6500);
  try { const response = await fetch(url, { headers: { "User-Agent": "AngelOS-News/1.0", Accept: "application/rss+xml, application/xml, text/xml" }, signal: controller.signal }); if (!response.ok) return []; return parseFeed(await response.text(), feed.category); } catch { return []; } finally { clearTimeout(timeout); }
}
async function readCache(context: any): Promise<NewsPayload | null> { const { data } = await context.supabase.from("angel_os_cache").select("payload, updated_at").eq("key", NEWS_CACHE_KEY).maybeSingle(); if (!data?.payload) return null; const payload = data.payload as NewsPayload; return { ...payload, fetchedAt: payload.fetchedAt || data.updated_at, source: "cache" }; }
async function writeCache(context: any, payload: NewsPayload) { await context.supabase.from("angel_os_cache").upsert({ key: NEWS_CACHE_KEY, payload, updated_at: new Date().toISOString() }, { onConflict: "key" }); }
function ageHours(item: NewsItem) { if (!item.publishedAt) return Number.POSITIVE_INFINITY; const timestamp = new Date(item.publishedAt).getTime(); if (Number.isNaN(timestamp)) return Number.POSITIVE_INFINITY; return Math.max(0, (Date.now() - timestamp) / 3_600_000); }
function normalizedTitle(value: string) { return value.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\W+/g, " ").trim(); }
function dedupe(items: NewsItem[]) { const seenTitles = new Set<string>(); const seenUrls = new Set<string>(); return items.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")).filter((item) => { const titleKey = normalizedTitle(item.title); const urlKey = item.url.replace(/[?#].*$/, ""); if (!titleKey || seenTitles.has(titleKey) || seenUrls.has(urlKey)) return false; seenTitles.add(titleKey); seenUrls.add(urlKey); return true; }); }
function preferenceScore(item: NewsItem) {
  const text = `${item.title} ${item.source}`; let score = item.category === "une" ? 0 : CATEGORY_WEIGHT[item.category]; for (const rule of PREFERENCE_WEIGHTS) if (rule.pattern.test(text)) score += rule.weight;
  const age = ageHours(item); if (age <= 1) score += 64; else if (age <= 3) score += 48; else if (age <= 6) score += 34; else if (age <= 12) score += 20; else if (age <= HEADLINE_FALLBACK_HOURS) score += 6; else score -= 32; return score;
}
function buildPersonalizedHeadlines(items: NewsItem[]): NewsItem[] {
  const primary = items.filter((item) => ageHours(item) <= HEADLINE_PRIMARY_HOURS); const fallback = items.filter((item) => ageHours(item) <= HEADLINE_FALLBACK_HOURS); const source = primary.length >= 6 ? primary : fallback;
  const ranked = [...source].sort((a, b) => { const score = preferenceScore(b) - preferenceScore(a); return score || (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""); });
  const selected: NewsItem[] = []; const selectedIds = new Set<string>(); const perCategory = new Map<NewsCategory, number>();
  for (const item of ranked) { if (selectedIds.has(item.id)) continue; const count = perCategory.get(item.category) ?? 0; const cap = ["politique", "dordogne", "tourisme"].includes(item.category) ? 3 : 2; if (count >= cap) continue; selected.push({ ...item, id: `une-${item.id}`, category: "une" }); selectedIds.add(item.id); perCategory.set(item.category, count + 1); if (selected.length >= 10) break; }
  if (selected.length < 10) for (const item of ranked) { if (selectedIds.has(item.id)) continue; selected.push({ ...item, id: `une-${item.id}`, category: "une" }); selectedIds.add(item.id); if (selected.length >= 10) break; }
  return selected;
}
function ensureCategoryCoverage(items: NewsItem[]) {
  const categories = FEEDS.map((feed) => feed.category); const result = [...items];
  for (const category of categories) { if (result.some((item) => item.category === category)) continue; const fallback = items.filter((item) => item.category !== "une").filter((item) => { const text = normalizedTitle(item.title); if (category === "politique") return /politique|gouvernement|assemblee|social|justice|corruption|souverain|institution/.test(text); if (category === "dordogne") return /sarlat|dordogne|perigord|perigueux|bergerac|souillac/.test(text); if (category === "tourisme") return /touris|office de tourisme|patrimoine|hotel|camping|destination|frequentation/.test(text); if (category === "medias") return /radio|media|audiovisuel|podcast|television/.test(text); if (category === "journalisme") return /journalis|presse|redaction|communication|edition/.test(text); if (category === "emploi") return /alternance|bts|emploi|stage|recrut|apprentissage/.test(text); if (category === "ia") return /ia |intelligence artificielle|chatgpt|openai|android|smartphone|pixel|technolog/.test(text); return /scout|eclaireur|education populaire|jeunesse/.test(text); }).sort((a, b) => preferenceScore(b) - preferenceScore(a))[0]; if (fallback) result.push({ ...fallback, id: `${category}-fallback-${fallback.id}`, category }); }
  return result;
}
function finalize(items: NewsItem[]) { const topical = ensureCategoryCoverage(dedupe(items.filter((item) => item.category !== "une" && ageHours(item) <= TOPICAL_MAX_HOURS))); const headlines = buildPersonalizedHeadlines(topical); return [...headlines, ...topical]; }
async function loadGoogleNews() { const groups = await Promise.all(FEEDS.map(loadFeed)); return groups.flat(); }
async function loadAiNewsFast(): Promise<NewsItem[]> { let timer: ReturnType<typeof setTimeout> | undefined; try { return await Promise.race([searchNewsWithOpenAI().catch(() => []), new Promise<NewsItem[]>((resolve) => { timer = setTimeout(() => resolve([]), AI_NEWS_TIMEOUT_MS); })]); } finally { if (timer) clearTimeout(timer); } }
async function loadCombinedNews() { const [aiItems, googleItems] = await Promise.all([loadAiNewsFast(), loadGoogleNews()]); return finalize([...aiItems, ...googleItems]); }

export const getAdminNews = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }): Promise<NewsPayload> => {
  await assertAdmin(context); const cached = await readCache(context); const liveItems = await loadCombinedNews(); if (liveItems.length === 0) return cached ?? { items: [], fetchedAt: new Date().toISOString(), source: "cache", phase: "combined" };
  const liveCategories = new Set(liveItems.filter((item) => item.category !== "une").map((item) => item.category)); const cachedFill = (cached?.items ?? []).filter((item) => item.category !== "une" && !liveCategories.has(item.category) && ageHours(item) <= TOPICAL_MAX_HOURS); const merged = finalize([...liveItems.filter((item) => item.category !== "une"), ...cachedFill]); const payload: NewsPayload = { items: merged, fetchedAt: new Date().toISOString(), source: "live", phase: "combined" }; await writeCache(context, payload); return payload;
});
export async function fetchAiNewsSnapshot(): Promise<NewsPayload> { const aiItems = finalize(await loadAiNewsFast()); if (aiItems.length === 0) throw new Error("Recherche web OpenAI indisponible"); return { items: aiItems, fetchedAt: new Date().toISOString(), source: "live", phase: "openai" }; }
export async function fetchAdminNewsSnapshot(): Promise<NewsPayload> { const items = await loadCombinedNews(); if (items.length === 0) throw new Error("Actualités indisponibles"); return { items, fetchedAt: new Date().toISOString(), source: "live", phase: "combined" }; }
