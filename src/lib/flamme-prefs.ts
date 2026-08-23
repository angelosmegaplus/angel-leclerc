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

/** Nombre maximum d'articles régionaux injectés dans le fil. */
const MAX_REGIONAL = 3;

/**
 * Filtre le pool selon les couches actives, privilégie les articles récents,
 * puis mélange les sources (max 2 articles consécutifs et 3 au total par média).
 * Quand une région est choisie, quelques actualités régionales récentes sont
 * injectées dans le fil sans le transformer en fil 100 % local.
 */
export function selectNewsFeed(
  pool: FlammeNewsItem[],
  layers: FlammeNewsCategory[],
  limit = 12,
): FlammeNewsItem[] {
  const active = new Set(layers.length ? layers : ALL_LAYERS);
  const all = pool.filter((item) => item.categories.some((category) => active.has(category)));
  const time = (item: FlammeNewsItem) => (item.publishedAt ? Date.parse(item.publishedAt) : 0);
  const regionalPicks = all
    .filter((item) => item.regional)
    .sort((a, b) => time(b) - time(a))
    .slice(0, MAX_REGIONAL);
  const filtered = all.filter((item) => !item.regional);
  const now = Date.now();
  const nationalLimit = Math.max(1, limit - regionalPicks.length);
  const recent = filtered.filter((item) => time(item) && now - time(item) <= RECENT_WINDOW);
  const base = recent.length >= nationalLimit ? recent : filtered;


  const byDate = [...base].sort((a, b) => time(b) - time(a));
  const perSource = new Map<string, FlammeNewsItem[]>();
  byDate.forEach((item) => {
    const list = perSource.get(item.source) ?? [];
    list.push(item);
    perSource.set(item.source, list);
  });

  const queues = Array.from(perSource.values());
  const counts = new Map<string, number>();
  const out: FlammeNewsItem[] = [];
  let guard = 0;

  while (out.length < limit && guard < 500) {
    guard += 1;
    let progressed = false;
    // Round-robin : on parcourt les sources par ordre de fraîcheur de leur tête de file.
    const ordered = queues.filter((queue) => queue.length > 0).sort((a, b) => time(b[0]!) - time(a[0]!));
    for (const queue of ordered) {
      if (out.length >= limit) break;
      const candidate = queue[0]!;
      const used = counts.get(candidate.source) ?? 0;
      if (used >= 3) {
        queue.shift();
        progressed = true;
        continue;
      }
      const lastTwo = out.slice(-2);
      if (lastTwo.length === 2 && lastTwo.every((item) => item.source === candidate.source)) continue;
      queue.shift();
      counts.set(candidate.source, used + 1);
      out.push(candidate);
      progressed = true;
    }
    if (!progressed) break;
  }

  if (out.length < limit) {
    for (const item of byDate) {
      if (out.length >= limit) break;
      if (!out.includes(item)) out.push(item);
    }
  }

  return out.slice(0, limit);
}
