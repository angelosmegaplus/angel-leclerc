type AiRole = "system" | "user" | "assistant";
export type AiMessage = { role: AiRole; content: string };
export type AiPriority = "interactive" | "important" | "background";

type UsageEntry = { at: number; estimatedTokens: number; priority: AiPriority };
const usage: UsageEntry[] = [];
const cache = new Map<string, { expires: number; text: string }>();

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
function prune(now = Date.now()) {
  const dayAgo = now - 86_400_000;
  while (usage.length && usage[0].at < dayAgo) usage.shift();
  for (const [key, value] of cache) if (value.expires < now) cache.delete(key);
}
function estimate(messages: AiMessage[], output: number) {
  const chars = messages.reduce((n, m) => n + m.content.length, 0);
  return Math.ceil(chars / 4) + output;
}
function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

export async function angelAi(options: {
  messages: AiMessage[];
  priority?: AiPriority;
  maxTokens?: number;
  temperature?: number;
  cacheKey?: string;
  cacheTtlMs?: number;
}) {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) return { text: null, reason: "not_configured" as const, cached: false };
  const now = Date.now();
  prune(now);
  const priority = options.priority ?? "background";
  const maxTokens = Math.min(options.maxTokens ?? 500, priority === "interactive" ? 1200 : 800);
  const estimated = estimate(options.messages, maxTokens);
  const dailyLimit = numberEnv("ANGEL_AI_DAILY_TOKEN_BUDGET", 120_000);
  const hourlyLimit = numberEnv("ANGEL_AI_HOURLY_TOKEN_BUDGET", 30_000);
  const usedDay = usage.reduce((n, e) => n + e.estimatedTokens, 0);
  const hourAgo = now - 3_600_000;
  const usedHour = usage.filter((e) => e.at >= hourAgo).reduce((n, e) => n + e.estimatedTokens, 0);
  // Le chat administrateur reste prioritaire. Les traitements de fond s'arrêtent avant de manger la réserve.
  const reserve = priority === "interactive" ? 1 : priority === "important" ? 0.85 : 0.65;
  if (usedDay + estimated > dailyLimit * reserve || usedHour + estimated > hourlyLimit * reserve) {
    return { text: null, reason: "budget" as const, cached: false };
  }
  const rawCache = options.cacheKey ?? options.messages.map((m) => `${m.role}:${m.content}`).join("\n");
  const cacheKey = hash(rawCache);
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > now) return { text: hit.text, reason: "ok" as const, cached: true };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), priority === "interactive" ? 25_000 : 20_000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env["OPENAI_MODEL"] || "gpt-4o-mini",
        temperature: options.temperature ?? 0.3,
        max_tokens: maxTokens,
        messages: options.messages,
      }),
    });
    if (!response.ok) {
      console.error("[angel-ai-gateway] OpenAI", response.status, await response.text());
      return { text: null, reason: "provider" as const, cached: false };
    }
    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }>; usage?: { total_tokens?: number } };
    const text = json.choices?.[0]?.message?.content?.trim() ?? null;
    if (!text) return { text: null, reason: "provider" as const, cached: false };
    usage.push({ at: now, estimatedTokens: json.usage?.total_tokens ?? estimated, priority });
    cache.set(cacheKey, { expires: now + (options.cacheTtlMs ?? (priority === "interactive" ? 60_000 : 15 * 60_000)), text });
    return { text, reason: "ok" as const, cached: false };
  } catch (error) {
    console.error("[angel-ai-gateway] failure", error);
    return { text: null, reason: "provider" as const, cached: false };
  } finally {
    clearTimeout(timeout);
  }
}

export function angelAiBudgetSnapshot() {
  const now = Date.now(); prune(now);
  const hourAgo = now - 3_600_000;
  return {
    usedToday: usage.reduce((n, e) => n + e.estimatedTokens, 0),
    usedHour: usage.filter((e) => e.at >= hourAgo).reduce((n, e) => n + e.estimatedTokens, 0),
    dailyLimit: numberEnv("ANGEL_AI_DAILY_TOKEN_BUDGET", 120_000),
    hourlyLimit: numberEnv("ANGEL_AI_HOURLY_TOKEN_BUDGET", 30_000),
  };
}
