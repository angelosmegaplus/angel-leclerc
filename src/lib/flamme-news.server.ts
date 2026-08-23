import type { FlammeNewsCategory, FlammeNewsItem, FlammeNewsPayload } from "./flamme-news-types";
import { findRegion } from "./flamme-regions";

export type { FlammeNewsItem, FlammeNewsPayload };

type FeedConfig = { source: string; urls: string[]; categories: FlammeNewsCategory[]; regional?: boolean };

// Flux réellement testés côté serveur (GET 200 + contenu RSS/Atom).
// Écartés : Marianne (405 anti-bot), Public Sénat (404 sur /rss.xml),
// Le Monde (conditions RSS : usage strictement personnel).
const FEEDS: FeedConfig[] = [

  {
    source: "Franceinfo",
    urls: ["https://www.franceinfo.fr/titres.rss", "https://www.francetvinfo.fr/titres.rss"],
    categories: ["general", "france"],
  },
  {
    source: "Franceinfo Histoire",
    urls: ["https://www.franceinfo.fr/replay-radio/l-info-de-l-histoire.rss"],
    categories: ["culture-history"],
  },
  {
    source: "Service-Public",
    urls: ["https://www.service-public.gouv.fr/abonnements/rss/actu-actualites-particuliers.rss"],
    categories: ["public-life"],
  },
  {
    source: "Vie publique",
    urls: ["https://feeds.feedburner.com/vie-publique/nnRKrX8naq2"],
    categories: ["public-life", "france"],
  },
  {
    source: "CNRS Le Journal",
    urls: ["https://lejournal.cnrs.fr/rss"],
    categories: ["science-tech", "culture-history"],
  },
  {
    source: "Ouest-France",
    urls: ["https://www.ouest-france.fr/rss-en-continu.xml", "https://www.ouest-france.fr/rss/une"],
    categories: ["general", "france"],
  },
  { source: "Sud Ouest", urls: ["https://www.sudouest.fr/essentiel/rss.xml"], categories: ["france", "general"] },
  { source: "La Dépêche", urls: ["https://www.ladepeche.fr/rss.xml"], categories: ["france", "general"] },
  { source: "L’Obs", urls: ["https://www.nouvelobs.com/a-la-une/rss.xml"], categories: ["general", "france"] },
  { source: "HuffPost", urls: ["https://www.huffingtonpost.fr/feeds/index.xml"], categories: ["general", "france"] },
  { source: "RFI", urls: ["https://www.rfi.fr/fr/france/rss"], categories: ["france", "world"] },
  { source: "France 24", urls: ["https://www.france24.com/fr/rss"], categories: ["world", "general"] },
];

const CATEGORY_HINTS: Array<{ category: FlammeNewsCategory; re: RegExp }> = [
  { category: "sport", re: /\/sport|\/rugby|\/football|\/tennis|\/jeux-olympiques|\/cyclisme/i },
  { category: "economy", re: /\/economie|\/entreprise|\/emploi|\/immobilier|\/conso|\/argent|\/bourse/i },
  { category: "world", re: /\/monde|\/international|\/europe|\/afrique|\/moyen-orient|\/ameriques|\/asie/i },
  { category: "science-tech", re: /\/sciences|\/science|\/tech|\/numerique|\/high-tech|\/internet|\/espace|\/sante/i },
  { category: "culture-history", re: /\/culture|\/histoire|\/patrimoine|\/livres|\/cinema|\/musique|\/arts/i },
  { category: "public-life", re: /\/politique|\/vie-publique|\/service-public|\/administration/i },
];

function categoriesFor(url: string, base: FlammeNewsCategory[]): FlammeNewsCategory[] {
  const set = new Set<FlammeNewsCategory>(base);
  for (const hint of CATEGORY_HINTS) {
    if (hint.re.test(url)) set.add(hint.category);
  }
  return Array.from(set);
}


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

function parseFeed(xml: string, config: FeedConfig): FlammeNewsItem[] {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  const items: FlammeNewsItem[] = [];
  for (const block of blocks) {
    const title = cleanText(tagContent(block, "title"), 180);
    const rawLink = tagContent(block, "link") || attrFrom(block, "link", "href") || "";
    const url = decodeEntities(rawLink).trim();
    if (!title || !/^https?:\/\//i.test(url)) continue;
    const dateRaw =
      tagContent(block, "pubDate") || tagContent(block, "dc:date") || tagContent(block, "updated") || tagContent(block, "date");
    const parsed = dateRaw ? new Date(dateRaw) : null;
    const description = cleanText(tagContent(block, "description") ?? tagContent(block, "summary"));
    const imageUrl = extractImage(block);
    items.push({
      title,
      url,
      source: config.source,
      publishedAt: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : null,
      categories: categoriesFor(url, config.categories),
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
      const timer = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { accept: "application/rss+xml, application/xml, text/xml, */*", "user-agent": "FlammeBeta/1.0" },
      });
      clearTimeout(timer);
      if (!response.ok) continue;
      const body = await response.text();
      if (!/<rss|<feed|<channel/i.test(body)) continue;
      const items = parseFeed(body, config);
      // On borne chaque source pour éviter qu'un gros flux écrase les autres.
      if (items.length) return items.slice(0, 14);
    } catch {
      // Flux indisponible : on tente l'URL suivante.
    }
  }
  return [];
}

function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    const titleKey = normalizeTitle(item.title);
    if (!titleKey || seenUrl.has(urlKey) || seenTitle.has(titleKey)) return;
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
    // Pool tagué : le client filtre par couches puis mélange les sources.
    items: items.slice(0, 120),
    fetchedAt: new Date().toISOString(),
    sources: Array.from(sources),
  };
  cache = { payload, at: Date.now() };
  return payload;
}
