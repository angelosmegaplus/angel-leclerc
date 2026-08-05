/** Protection basique contre les abus : 15 questions / 10 minutes par IP. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 15;

const hits = new Map<string, number[]>();

export function checkAssistantRate(ip: string): boolean {
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
