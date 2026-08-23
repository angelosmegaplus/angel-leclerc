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
 * Filtre le pool selon les couches actives puis applique le classement de
 * diversification Mistral lorsqu'il est disponible. Les garde-fous locaux
 * restent prioritaires : fraîcheur, maximum 3 articles par média, jamais plus
 * de 2 consécutifs et injection régionale limitée.
 */
export function selectNewsFeed(
  pool: FlammeNewsItem[],
  layers: FlammeNewsCategory[],
  limit = 12,
): FlammeNewsItem[] {
  const active = new Set(layers.length ? layers : ALL_LAYERS);
  const all = pool.filter((item) => item.categories.some((category) => active.has(category)));
  const time = (item: FlammeNewsItem) => (item.publishedAt ? Date.parse(item.publishedAt) : 0);
  const rank = (item: FlammeNewsItem) =>
    typeof item.curationRank === "number" ? item.curationRank : Number.MAX_SAFE_INTEGER;
  const comparePriority = (a: FlammeNewsItem, b: FlammeNewsItem) => {
    const rankDiff = rank(a) - rank(b);
    return rankDiff !== 0 ? rankDiff : time(b) - time(a);
  };

  const regionalPicks = all
    .filter((item) => item.regional)
    .sort(comparePriority)
    .slice(0, MAX_REGIONAL);
  const filtered = all.filter((item) => !item.regional);
  const now = Date.now();
  const nationalLimit = Math.max(1, limit - regionalPicks.length);
  const recent = filtered.filter((item) => time(item) && now - time(item) <= RECENT_WINDOW);
  const base = recent.length >= nationalLimit ? recent : filtered;

  const byPriority = [...base].sort(comparePriority);
  const perSource = new Map<string, FlammeNewsItem[]>();
  byPriority.forEach((item) => {
    const list = perSource.get(item.source) ?? [];
    list.push(item);
    perSource.set(item.source, list);
  });

  const queues = Array.from(perSource.values());
  const counts = new Map<string, number>();
  const out: FlammeNewsItem[] = [];
  let guard = 0;

  while (out.length < nationalLimit && guard < 500) {
    guard += 1;
    let progressed = false;
    // Le rang Mistral départage les têtes de file ; sans rang, on retombe sur la fraîcheur.
    const ordered = queues
      .filter((queue) => queue.length > 0)
      .sort((a, b) => comparePriority(a[0]!, b[0]!));
    for (const queue of ordered) {
      if (out.length >= nationalLimit) break;
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

  if (out.length < nationalLimit) {
    for (const item of byPriority) {
      if (out.length >= nationalLimit) break;
      if (!out.includes(item)) out.push(item);
    }
  }

  // Injection régionale : positions 2, 5 et 8 pour rester visible sans dominer.
  const merged = [...out];
  regionalPicks.forEach((item, index) => {
    const position = Math.min(merged.length, 1 + index * 3);
    merged.splice(position, 0, item);
  });

  return merged.slice(0, limit);
}
