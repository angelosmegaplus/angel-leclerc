import {
  FLAMME_NEWS_CATEGORIES,
  type FlammeNewsCategory,
  type FlammeNewsItem,
} from "./flamme-news-types";

export type SearchEngine = "qwant" | "lilo";

const ENGINE_KEY = "flamme-search-engine";
const LAYERS_KEY = "flamme-news-layers";

export const SEARCH_ENGINE_LABELS: Record<SearchEngine, string> = {
  qwant: "Qwant",
  lilo: "Lilo",
};

export function readSearchEngine(): SearchEngine {
  try {
    return localStorage.getItem(ENGINE_KEY) === "lilo" ? "lilo" : "qwant";
  } catch {
    return "qwant";
  }
}

export function writeSearchEngine(engine: SearchEngine) {
  try {
    localStorage.setItem(ENGINE_KEY, engine);
  } catch {
    // Stockage local indisponible : le réglage reste actif pour la session.
  }
}

export const ALL_LAYERS: FlammeNewsCategory[] = [...FLAMME_NEWS_CATEGORIES];

export function readNewsLayers(): FlammeNewsCategory[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LAYERS_KEY) || "null");
    if (Array.isArray(raw)) {
      const valid = raw.filter((value): value is FlammeNewsCategory =>
        (ALL_LAYERS as string[]).includes(value),
      );
      if (valid.length) return valid;
    }
  } catch {
    // Valeur illisible : on retombe sur toutes les couches.
  }
  return [...ALL_LAYERS];
}

export function writeNewsLayers(layers: FlammeNewsCategory[]) {
  try {
    localStorage.setItem(LAYERS_KEY, JSON.stringify(layers));
  } catch {
    // Stockage local indisponible.
  }
}

const RECENT_WINDOW = 72 * 60 * 60 * 1000;
const MAX_PER_SOURCE = 3;
const MAX_REGIONAL = 3;

function fallbackSelection(items: FlammeNewsItem[], limit: number): FlammeNewsItem[] {
  const time = (item: FlammeNewsItem) => (item.publishedAt ? Date.parse(item.publishedAt) || 0 : 0);
  const byDate = [...items].sort((a, b) => time(b) - time(a));
  const queues = new Map<string, FlammeNewsItem[]>();
  byDate.forEach((item) => {
    const list = queues.get(item.source) ?? [];
    list.push(item);
    queues.set(item.source, list);
  });

  const out: FlammeNewsItem[] = [];
  const counts = new Map<string, number>();
  let guard = 0;
  while (out.length < limit && guard < 500) {
    guard += 1;
    let progressed = false;
    const ordered = Array.from(queues.values())
      .filter((queue) => queue.length)
      .sort((a, b) => time(b[0]!) - time(a[0]!));
    for (const queue of ordered) {
      if (out.length >= limit) break;
      const item = queue.shift();
      if (!item) continue;
      const used = counts.get(item.source) ?? 0;
      if (used >= MAX_PER_SOURCE) {
        progressed = true;
        continue;
      }
      counts.set(item.source, used + 1);
      out.push(item);
      progressed = true;
    }
    if (!progressed) break;
  }
  return out.slice(0, limit);
}

/**
 * Quand Mistral a composé le fil, son ordre éditorial devient la source
 * principale de vérité. Le client se limite à appliquer les préférences de
 * couches de l'utilisateur et quelques garde-fous techniques. Si Mistral est
 * indisponible, l'ancien mélange déterministe reprend automatiquement.
 */
export function selectNewsFeed(
  pool: FlammeNewsItem[],
  layers: FlammeNewsCategory[],
  limit = 12,
): FlammeNewsItem[] {
  const active = new Set(layers.length ? layers : ALL_LAYERS);
  const filtered = pool.filter((item) => item.categories.some((category) => active.has(category)));
  const time = (item: FlammeNewsItem) => (item.publishedAt ? Date.parse(item.publishedAt) || 0 : 0);
  const now = Date.now();
  const recent = filtered.filter((item) => !time(item) || now - time(item) <= RECENT_WINDOW);
  const base = recent.length >= limit ? recent : filtered;

  const aiOrdered = base
    .filter((item) => typeof item.curationRank === "number")
    .sort((a, b) => (a.curationRank as number) - (b.curationRank as number));

  if (!aiOrdered.length) return fallbackSelection(base, limit);

  const out: FlammeNewsItem[] = [];
  const counts = new Map<string, number>();
  let regionalCount = 0;

  // L'ordre vient de Mistral. Le code ne fait que bloquer une répétition
  // excessive d'un même média ou du régional.
  for (const item of aiOrdered) {
    if (out.length >= limit) break;
    const used = counts.get(item.source) ?? 0;
    if (used >= MAX_PER_SOURCE) continue;
    if (item.regional && regionalCount >= MAX_REGIONAL) continue;

    const lastTwo = out.slice(-2);
    if (lastTwo.length === 2 && lastTwo.every((entry) => entry.source === item.source)) continue;

    counts.set(item.source, used + 1);
    if (item.regional) regionalCount += 1;
    out.push(item);
  }

  // Si les couches choisies ont éliminé trop d'articles de la sélection IA,
  // on complète seulement les places manquantes avec le tri de secours.
  if (out.length < limit) {
    const fallback = fallbackSelection(
      base.filter((item) => !out.includes(item)),
      limit - out.length,
    );
    for (const item of fallback) {
      if (out.length >= limit) break;
      const used = counts.get(item.source) ?? 0;
      if (used >= MAX_PER_SOURCE) continue;
      if (item.regional && regionalCount >= MAX_REGIONAL) continue;
      counts.set(item.source, used + 1);
      if (item.regional) regionalCount += 1;
      out.push(item);
    }
  }

  return out.slice(0, limit);
}
