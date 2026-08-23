/** Protection légère anti-rafales pour le panneau IA de Flamme : 12 requêtes / 5 minutes par IP. */
const WINDOW_MS = 5 * 60 * 1000;
const MAX_HITS = 12;

const hits = new Map<string, number[]>();

export function checkMistralRate(ip: string): boolean {
  const now = Date.now();
  const previous = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (previous.length >= MAX_HITS) {
    hits.set(ip, previous);
    return false;
  }
  previous.push(now);
  hits.set(ip, previous);
  if (hits.size > 500) {
    for (const [key, stamps] of hits) {
      if (stamps.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return true;
}
