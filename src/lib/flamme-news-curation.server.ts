import type { FlammeNewsItem, FlammeNewsPayload } from "./flamme-news-types";

const MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const MODEL = "mistral-small-latest";
const CACHE_TTL = 15 * 60 * 1000;
const RECENT_WINDOW = 72 * 60 * 60 * 1000;
const MAX_CANDIDATES = 80;
const MAX_RANKED = 48;

type CachedRanks = { at: number; ranks: Map<string, number> };
const cache = new Map<string, CachedRanks>();

function time(item: FlammeNewsItem) {
  return item.publishedAt ? Date.parse(item.publishedAt) || 0 : 0;
}

/**
 * Pré-sélection déterministe et équilibrée avant l'appel IA : aucune source ne
 * peut remplir à elle seule le contexte envoyé à Mistral.
 */
function buildCandidatePool(items: FlammeNewsItem[]): FlammeNewsItem[] {
  const now = Date.now();
  const recent = items.filter((item) => {
    const value = time(item);
    return !value || now - value <= RECENT_WINDOW;
  });
  const base = recent.length >= 30 ? recent : items;
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
  while (out.length < MAX_CANDIDATES && guard < 500) {
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
    date: item.publishedAt,
    themes: item.categories,
    regional: Boolean(item.regional),
  }));
  const validIds = new Set(candidates.map((item) => item.id));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(MISTRAL_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.1,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content:
              "Tu es un moteur de diversification éditoriale neutre. Tu ne juges ni l'orientation politique ni la qualité idéologique d'un média. Ton unique rôle est d'ordonner des titres déjà collectés pour maximiser fraîcheur, diversité de médias, diversité de sujets et diversité de thèmes. Évite plusieurs titres parlant du même événement. Dans les 20 premiers, vise un maximum de médias distincts et jamais plus de 3 titres du même média. Privilégie les contenus de moins de 24 h, puis moins de 72 h. Les sujets régionaux complètent le national sans dominer. Réponds STRICTEMENT par un tableau JSON d'identifiants, sans texte autour.",
          },
          {
            role: "user",
            content: `Classe jusqu'à ${MAX_RANKED} identifiants parmi ces actualités :\n${JSON.stringify(candidates)}`,
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    const ids = parseIds(content, validIds);
    if (ids.length < 8) return null;

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
