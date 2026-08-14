type AiRole = "system" | "user" | "assistant";
export type AiMessage = { role: AiRole; content: string };
export type AiPriority = "interactive" | "important" | "background";
export type AiFailureReason = "ok" | "disabled" | "not_configured" | "budget" | "circuit_open" | "provider";

type UsageEntry = { at: number; estimatedTokens: number; priority: AiPriority };
const usage: UsageEntry[] = [];
const cache = new Map<string, { expires: number; text: string }>();
const health = {
  consecutiveFailures: 0,
  lastFailureAt: 0,
  lastSuccessAt: 0,
  circuitOpenUntil: 0,
  lastReason: "ok" as AiFailureReason,
};

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
function enabled() {
  return !["0", "false", "off", "disabled"].includes(String(process.env["ANGEL_AI_ENABLED"] ?? "true").toLowerCase());
}
function prune(now = Date.now()) {
  const dayAgo = now - 86_400_000;
  while (usage.length && usage[0].at < dayAgo) usage.shift();
  for (const [key, value] of cache) if (value.expires < now) cache.delete(key);
  if (health.circuitOpenUntil && health.circuitOpenUntil <= now) health.circuitOpenUntil = 0;
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
function fail(reason: Exclude<AiFailureReason, "ok">, now = Date.now()) {
  health.lastReason = reason;
  health.lastFailureAt = now;
  if (reason === "provider") {
    health.consecutiveFailures += 1;
    const threshold = numberEnv("ANGEL_AI_CIRCUIT_FAILURES", 3);
    if (health.consecutiveFailures >= threshold) {
      health.circuitOpenUntil = now + numberEnv("ANGEL_AI_CIRCUIT_COOLDOWN_MS", 5 * 60_000);
    }
  }
  return { text: null, reason, cached: false, fallbackRequired: true } as const;
}
function succeed() {
  health.consecutiveFailures = 0;
  health.lastSuccessAt = Date.now();
  health.lastReason = "ok";
  health.circuitOpenUntil = 0;
}

function sanitizeMessages(messages: AiMessage[]): AiMessage[] {
  const localBoilerplate = [
    /^État réel\s*:/i,
    /Demandez par exemple/i,
    /moteur IA externe n['’]est pas disponible/i,
    /moteur local/i,
    /maintenance ChatGPT pourra reprendre/i,
    /réponse automatique limitée/i,
    /mode de secours/i,
  ];
  return messages.filter((message) => {
    if (message.role !== "assistant") return true;
    return !localBoilerplate.some((pattern) => pattern.test(message.content));
  });
}

export async function angelAi(options: {
  messages: AiMessage[];
  priority?: AiPriority;
  maxTokens?: number;
  temperature?: number;
  cacheKey?: string;
  cacheTtlMs?: number;
  model?: string;
}) {
  const now = Date.now();
  prune(now);
  if (!enabled()) return fail("disabled", now);
  const key = process.env["OPENAI_API_KEY"];
  if (!key) return fail("not_configured", now);
  if (health.circuitOpenUntil > now) return fail("circuit_open", now);

  const messages = sanitizeMessages(options.messages);
  const priority = options.priority ?? "background";
  const maxTokens = Math.min(options.maxTokens ?? 500, priority === "interactive" ? 1200 : 800);
  const estimated = estimate(messages, maxTokens);
  const dailyLimit = numberEnv("ANGEL_AI_DAILY_TOKEN_BUDGET", 120_000);
  const hourlyLimit = numberEnv("ANGEL_AI_HOURLY_TOKEN_BUDGET", 30_000);
  const usedDay = usage.reduce((n, e) => n + e.estimatedTokens, 0);
  const hourAgo = now - 3_600_000;
  const usedHour = usage.filter((e) => e.at >= hourAgo).reduce((n, e) => n + e.estimatedTokens, 0);

  const reserve = priority === "interactive" ? 1 : priority === "important" ? 0.85 : 0.65;
  if (usedDay + estimated > dailyLimit * reserve || usedHour + estimated > hourlyLimit * reserve) {
    return fail("budget", now);
  }

  const model = options.model || process.env["OPENAI_MODEL"] || "gpt-4o-mini";
  const rawCache = options.cacheKey ?? `${model}\n${messages.map((m) => `${m.role}:${m.content}`).join("\n")}`;
  const cacheKey = hash(rawCache);
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > now) {
    succeed();
    return { text: hit.text, reason: "ok" as const, cached: true, fallbackRequired: false };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), priority === "interactive" ? 30_000 : 22_000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: options.temperature ?? 0.3,
        max_tokens: maxTokens,
        messages,
      }),
    });
    if (!response.ok) {
      console.error("[angel-ai-gateway] OpenAI", response.status, { model, body: await response.text() });
      return fail("provider");
    }
    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }>; usage?: { total_tokens?: number } };
    const text = json.choices?.[0]?.message?.content?.trim() ?? null;
    if (!text) return fail("provider");
    usage.push({ at: now, estimatedTokens: json.usage?.total_tokens ?? estimated, priority });
    cache.set(cacheKey, { expires: now + (options.cacheTtlMs ?? (priority === "interactive" ? 60_000 : 15 * 60_000)), text });
    succeed();
    console.info("[angel-ai-gateway] success", { model, priority, cached: false, filteredHistory: options.messages.length - messages.length });
    return { text, reason: "ok" as const, cached: false, fallbackRequired: false };
  } catch (error) {
    console.error("[angel-ai-gateway] failure", { model, error });
    return fail("provider");
  } finally {
    clearTimeout(timeout);
  }
}

export function angelAiSupervisorSnapshot() {
  const now = Date.now();
  prune(now);
  const hourAgo = now - 3_600_000;
  const usedToday = usage.reduce((n, e) => n + e.estimatedTokens, 0);
  const usedHour = usage.filter((e) => e.at >= hourAgo).reduce((n, e) => n + e.estimatedTokens, 0);
  const dailyLimit = numberEnv("ANGEL_AI_DAILY_TOKEN_BUDGET", 120_000);
  const hourlyLimit = numberEnv("ANGEL_AI_HOURLY_TOKEN_BUDGET", 30_000);
  return {
    enabled: enabled(),
    providerConfigured: Boolean(process.env["OPENAI_API_KEY"]),
    healthy: enabled() && Boolean(process.env["OPENAI_API_KEY"]) && health.circuitOpenUntil <= now,
    circuitOpen: health.circuitOpenUntil > now,
    circuitOpenUntil: health.circuitOpenUntil || null,
    consecutiveFailures: health.consecutiveFailures,
    lastFailureAt: health.lastFailureAt || null,
    lastSuccessAt: health.lastSuccessAt || null,
    lastReason: health.lastReason,
    usedToday,
    usedHour,
    dailyLimit,
    hourlyLimit,
    remainingToday: Math.max(0, dailyLimit - usedToday),
    remainingHour: Math.max(0, hourlyLimit - usedHour),
  };
}

export const angelAiBudgetSnapshot = angelAiSupervisorSnapshot;
