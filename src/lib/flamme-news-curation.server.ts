import type { FlammeNewsItem, FlammeNewsPayload } from "./flamme-news-types";

const MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const MODEL = "mistral-small-latest";
const CACHE_TTL = 10 * 60 * 1000;
const RECENT_WINDOW = 72 * 60 * 60 * 1000;
const MAX_CANDIDATES = 100;
const MAX_RANKED = 64;

type CachedRanks = { at: number; ranks: Map<string, number> };
const cache = new Map<string, CachedRanks>();

function time(item: FlammeNewsItem) {
  return item.publishedAt ? Date.parse(item.publishedAt) || 0 : 0;
}

/**
 * Pré-sélection technique avant l'appel IA : on conserve de la fraîcheur et on
 * évite qu'une seule source remplisse tout le contexte. À partir de ce pool,
 * Mistral assume la composition éditoriale principale du fil.
 */
function buildCandidatePool(items: FlammeNewsItem[]): FlammeNewsItem[] {
  const now = Date.now();
  const recent = items.filter((item) => {
    const value = time(item);
    return !value || now - value <= RECENT_WINDOW;
  });
  const base = recent.length >= 36 ? recent : items;
  const bySource = new Map<string, FlammeNewsItem[]>();

  [...base]
    .sort((a, b) => time(b) - time(a))
    .forEach((item) => {
      const list = bySource.get(item.source) ?? [];
      list.push(item);
      bySource.set(item.source, list);
    });

  const queues = Array.from(bySource.values());
  const out: FlammeNewsItem[] = [];
  let guard = 0;
  while (out.length < MAX_CANDIDATES && guard < 800) {
    guard += 1;
    let progressed = false;
    for (const queue of queues) {
      const item = queue.shift();
      if (!item) continue;
      out.push(item);
      progressed = true;
      if (out.length >= MAX_CANDIDATES) break;
    }
    if (!progressed) break;
  }
  return out;
}

function parseIds(text: string, validIds: Set<string>): string[] {
  const cleaned = text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const match = cleaned.match(/\[[\s\S]*?\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed
      .map((value) => String(value))
      .filter((id) => validIds.has(id) && !seen.has(id) && seen.add(id))
      .slice(0, MAX_RANKED);
  } catch {
    return [];
  }
}

async function askMistral(items: FlammeNewsItem[]): Promise<Map<string, number> | null> {
  const key = process.env["MISTRAL_API_KEY"]?.trim();
  if (!key || items.length < 8) return null;

  const candidates = items.map((item, index) => ({
    id: `n${index}`,
    media: item.source,
    titre: item.title,
    resume: item.description?.slice(0, 220) || null,
    date: item.publishedAt,
    themes: item.categories,
    regional: Boolean(item.regional),
  }));
  const validIds = new Set(candidates.map((item) => item.id));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(MISTRAL_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.05,
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content:
              "Tu es le rédacteur en chef algorithmique du fil d'actualités Flamme. Tu composes réellement la une à partir d'articles déjà collectés. Tu ne réécris pas les titres et tu n'inventes aucun fait. Tu ne classes jamais un média selon son orientation politique, ses opinions ou une préférence idéologique.\n\nTa mission, dans cet ordre :\n1. Identifier les articles qui parlent du même événement ou de la même information et éviter les doublons ; garde le représentant le plus clair, récent et utile.\n2. Choisir ce qui doit apparaître en priorité en combinant importance générale, fraîcheur et intérêt informatif, sans privilégier le sensationnel.\n3. Construire une vraie diversité : médias différents, France, monde, économie, sciences/tech, culture/histoire, sport et vie publique quand ces sujets existent dans le pool.\n4. Dans les 12 premières positions, viser au moins 8 médias distincts si le pool le permet, ne jamais mettre plus de 3 articles du même média et éviter deux sujets quasi identiques.\n5. Si des articles régionaux sont présents, en sélectionner normalement 1 à 3 dans les 12 premiers lorsqu'ils apportent une information distincte, sans faire dominer le régional.\n6. Privilégier fortement les moins de 24 h, puis les moins de 72 h. Un article plus ancien ne passe devant que s'il apporte une valeur éditoriale réellement différente.\n7. Les positions 1 à 12 constituent la composition principale de la page d'accueil. Les positions suivantes sont des réserves, elles aussi diverses, pour permettre les filtres personnalisés de l'utilisateur.\n\nRéponds STRICTEMENT par un tableau JSON d'identifiants, dans l'ordre éditorial choisi, sans aucun texte autour.",
          },
          {
            role: "user",
            content: `Compose le fil et classe jusqu'à ${MAX_RANKED} identifiants parmi ces actualités :\n${JSON.stringify(candidates)}`,
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    const ids = parseIds(content, validIds);
    if (ids.length < 10) return null;

    const ranks = new Map<string, number>();
    ids.forEach((id, rank) => {
      const index = Number(id.slice(1));
      const item = items[index];
      if (item) ranks.set(item.url, rank);
    });
    return ranks.size ? ranks : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function curateFlammeNewsWithMistral(payload: FlammeNewsPayload): Promise<FlammeNewsPayload> {
  const cacheKey = payload.region || "__all__";
  const cached = cache.get(cacheKey);
  let ranks = cached && Date.now() - cached.at < CACHE_TTL ? cached.ranks : null;

  if (!ranks) {
    const candidates = buildCandidatePool(payload.items);
    const freshRanks = await askMistral(candidates);
    if (freshRanks) {
      ranks = freshRanks;
      cache.set(cacheKey, { at: Date.now(), ranks });
    }
  }

  if (!ranks) return payload;
  return {
    ...payload,
    items: payload.items.map((item) => {
      const rank = ranks?.get(item.url);
      return typeof rank === "number" ? { ...item, curationRank: rank } : item;
    }),
    curatedByMistral: true,
  };
}
