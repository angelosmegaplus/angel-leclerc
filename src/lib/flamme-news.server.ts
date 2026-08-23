import type { FlammeNewsCategory, FlammeNewsItem, FlammeNewsPayload } from "./flamme-news-types";
import { findRegion } from "./flamme-regions";

export type { FlammeNewsItem, FlammeNewsPayload };

type FeedConfig = { source: string; urls: string[]; categories: FlammeNewsCategory[]; regional?: boolean };

// Flux RSS/Atom officiels ou directement fournis par les éditeurs.
// Écartés volontairement : CNEWS (conditions RSS réservant l'usage à un cadre
// personnel/individuel/non commercial), Le Monde (usage RSS personnel) et les
// endpoints morts/anti-bot. Un flux qui échoue est simplement ignoré au runtime.
const FEEDS: FeedConfig[] = [
  {
    source: "Franceinfo",
    urls: ["https://www.franceinfo.fr/titres.rss", "https://www.francetvinfo.fr/titres.rss"],
    categories: ["general", "france"],
  },
  {
    source: "Franceinfo",
    urls: ["https://www.franceinfo.fr/economie.rss", "https://www.francetvinfo.fr/economie.rss"],
    categories: ["economy", "france"],
  },
  {
    source: "Franceinfo",
    urls: ["https://www.franceinfo.fr/sports.rss"],
    categories: ["sport"],
  },
  {
    source: "Franceinfo",
    urls: ["https://www.franceinfo.fr/culture.rss"],
    categories: ["culture-history"],
  },
  {
    source: "20 Minutes",
    urls: ["https://www.20minutes.fr/feeds/rss-une.xml"],
    categories: ["general", "france"],
  },
  {
    source: "Numerama",
    urls: ["https://www.numerama.com/feed/"],
    categories: ["science-tech"],
  },
  {
    source: "La Croix",
    urls: ["https://www.la-croix.com/RSS/UNIVERS"],
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

  // Diversification éditoriale / généraliste.
  {
    source: "L’Express",
    urls: ["https://www.lexpress.fr/arc/outboundfeeds/rss/alaune.xml"],
    categories: ["general", "france"],
  },
  {
    source: "Mediapart",
    urls: ["https://www.mediapart.fr/articles/feed"],
    categories: ["general", "france", "public-life"],
  },
  {
    source: "BFMTV",
    urls: ["https://www.bfmtv.com/rss/news-24-7/"],
    categories: ["general", "france", "world"],
  },
  {
    source: "Euronews",
    urls: ["https://fr.euronews.com/rss?level=theme&name=news"],
    categories: ["world", "general"],
  },
  {
    source: "RMC Crime",
    urls: ["https://rmccrime.bfmtv.com/rss/affaires-criminelles/"],
    categories: ["general", "france"],
  },

  // Sciences, numérique et technologies.
  {
    source: "Frandroid",
    urls: ["https://www.frandroid.com/feed"],
    categories: ["science-tech"],
  },
  {
    source: "Clubic",
    urls: ["https://www.clubic.com/feed/rss"],
    categories: ["science-tech"],
  },
  {
    source: "Futura",
    urls: ["https://www.futura-sciences.com/rss/actualites.xml"],
    categories: ["science-tech"],
  },
  {
    source: "Journal du Geek",
    urls: ["https://www.journaldugeek.com/feed/"],
    categories: ["science-tech", "culture-history"],
  },
  {
    source: "01net",
    urls: ["https://www.01net.com/rss/actus.xml"],
    categories: ["science-tech"],
  },
  {
    source: "Les Numériques",
    urls: ["https://www.lesnumeriques.com/rss.xml"],
    categories: ["science-tech"],
  },
  {
    source: "Korben",
    urls: ["https://korben.info/feed"],
    categories: ["science-tech"],
  },

  // Culture, cinéma et divertissement.
  {
    source: "AlloCiné",
    urls: ["https://www.allocine.fr/rss/news.xml"],
    categories: ["culture-history"],
  },
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
const cache = new Map<string, { payload: FlammeNewsPayload; at: number }>();

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
      ...(config.regional ? { regional: true as const } : {}),
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
      // Un flux individuel reste borné ; un second cap est appliqué ensuite par média.
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

export async function loadFlammeNews(regionId?: string | null): Promise<FlammeNewsPayload> {
  const region = findRegion(regionId);
  const cacheKey = region ? region.id : "__all__";
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.payload;

  // On ne charge que le flux de la région sélectionnée, en plus du pool global.
  const feeds: FeedConfig[] = region
    ? [
        ...FEEDS,
        {
          source: region.source,
          urls: [`https://france3-regions.franceinfo.fr/${region.slug}/actu/rss`],
          categories: ["france", "general"],
          regional: true,
        },
      ]
    : FEEDS;

  const results = await Promise.all(feeds.map((feed) => fetchFeed(feed)));
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

  const byDate = (a: FlammeNewsItem, b: FlammeNewsItem) => {
    const da = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const db = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return db - da;
  };
  items.sort(byDate);

  // Cap réel par média (et non par URL de flux) : les quatre flux Franceinfo,
  // par exemple, partagent le même quota. On garde ainsi beaucoup plus de diversité.
  const MAX_PER_SOURCE = 10;
  const sourceCounts = new Map<string, number>();
  const diversifiedItems = items.filter((item) => {
    const count = sourceCounts.get(item.source) ?? 0;
    if (count >= MAX_PER_SOURCE) return false;
    sourceCounts.set(item.source, count + 1);
    return true;
  });

  // Les articles régionaux sont conservés hors quota global pour ne pas être coupés.
  const regional = diversifiedItems.filter((item) => item.regional).slice(0, 12);
  const global = diversifiedItems.filter((item) => !item.regional).slice(0, 260);

  const payload: FlammeNewsPayload = {
    // Pool tagué : le client filtre par couches puis mélange les sources.
    items: [...global, ...regional].sort(byDate),
    fetchedAt: new Date().toISOString(),
    sources: Array.from(sources),
    region: region ? region.id : null,
  };
  cache.set(cacheKey, { payload, at: Date.now() });
  return payload;
}
