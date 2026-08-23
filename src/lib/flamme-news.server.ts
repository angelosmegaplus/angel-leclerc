import type { FlammeNewsItem, FlammeNewsPayload } from "./flamme-news-types";

export type { FlammeNewsItem, FlammeNewsPayload };

type FeedConfig = { source: string; urls: string[] };

// Flux réellement testés côté serveur (GET 200 + contenu RSS).
// Marianne (https://www.marianne.net/rss.xml) répond 405 + page anti-bot : écarté.
const FEEDS: FeedConfig[] = [
  { source: "Franceinfo", urls: ["https://www.franceinfo.fr/titres.rss", "https://www.francetvinfo.fr/titres.rss"] },
  {
    source: "Service-Public",
    urls: ["https://www.service-public.gouv.fr/abonnements/rss/actu-actualites-particuliers.rss"],
  },
];

const CACHE_TTL = 5 * 60 * 1000;
let cache: { payload: FlammeNewsPayload; at: number } | null = null;

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  eacute: "é",
  egrave: "è",
  agrave: "à",
  ccedil: "ç",
  ecirc: "ê",
  ocirc: "ô",
  ugrave: "ù",
  laquo: "«",
  raquo: "»",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  ndash: "–",
  mdash: "—",
};

function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (m, name: string) => ENTITIES[name.toLowerCase()] ?? m);
}

function cleanText(input: string | undefined, max = 220): string {
  if (!input) return "";
  const text = decodeEntities(
    decodeEntities(input)
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function unwrapCdata(raw: string): string {
  const match = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return match ? match[1] : raw;
}

function tagContent(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? unwrapCdata(match[1]).trim() : undefined;
}

function attrFrom(block: string, tag: string, attr: string): string | undefined {
  const re = new RegExp(`<${tag}\\b[^>]*\\b${attr}\\s*=\\s*"([^"]+)"[^>]*>`, "i");
  const match = block.match(re);
  return match ? decodeEntities(match[1]) : undefined;
}

function extractImage(block: string): string | undefined {
  const candidates = [
    attrFrom(block, "media:content", "url"),
    attrFrom(block, "media:thumbnail", "url"),
    attrFrom(block, "enclosure", "url"),
  ].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (/^https?:\/\//i.test(candidate)) return candidate;
  }
  const description = tagContent(block, "description") ?? "";
  const inline = decodeEntities(description).match(/<img[^>]+src\s*=\s*"([^"]+)"/i);
  if (inline && /^https?:\/\//i.test(inline[1])) return decodeEntities(inline[1]);
  return undefined;
}

function parseFeed(xml: string, source: string): FlammeNewsItem[] {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  const items: FlammeNewsItem[] = [];
  for (const block of blocks) {
    const title = cleanText(tagContent(block, "title"), 180);
    const rawLink = tagContent(block, "link") || attrFrom(block, "link", "href") || "";
    const url = decodeEntities(rawLink).trim();
    if (!title || !/^https?:\/\//i.test(url)) continue;
    const dateRaw = tagContent(block, "pubDate") || tagContent(block, "dc:date") || tagContent(block, "date");
    const parsed = dateRaw ? new Date(dateRaw) : null;
    const description = cleanText(tagContent(block, "description"));
    const imageUrl = extractImage(block);
    items.push({
      title,
      url,
      source,
      publishedAt: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : null,
      ...(description ? { description } : {}),
      ...(imageUrl ? { imageUrl } : {}),
    });
  }
  return items;
}

async function fetchFeed(config: FeedConfig): Promise<FlammeNewsItem[]> {
  for (const url of config.urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { accept: "application/rss+xml, application/xml, text/xml, */*", "user-agent": "FlammeBeta/1.0" },
      });
      clearTimeout(timer);
      if (!response.ok) continue;
      const body = await response.text();
      if (!/<rss|<feed|<channel/i.test(body)) continue;
      const items = parseFeed(body, config.source);
      if (items.length) return items;
    } catch {
      // Flux indisponible : on tente l'URL suivante.
    }
  }
  return [];
}

export async function loadFlammeNews(): Promise<FlammeNewsPayload> {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.payload;

  const results = await Promise.all(FEEDS.map((feed) => fetchFeed(feed)));
  const seenUrl = new Set<string>();
  const seenTitle = new Set<string>();
  const items: FlammeNewsItem[] = [];
  const sources = new Set<string>();

  results.flat().forEach((item) => {
    const urlKey = item.url.split("?")[0].toLowerCase();
    const titleKey = item.title.toLowerCase();
    if (seenUrl.has(urlKey) || seenTitle.has(titleKey)) return;
    seenUrl.add(urlKey);
    seenTitle.add(titleKey);
    sources.add(item.source);
    items.push(item);
  });

  items.sort((a, b) => {
    const da = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const db = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return db - da;
  });

  const payload: FlammeNewsPayload = {
    items: items.slice(0, 8),
    fetchedAt: new Date().toISOString(),
    sources: Array.from(sources),
  };
  cache = { payload, at: Date.now() };
  return payload;
}
