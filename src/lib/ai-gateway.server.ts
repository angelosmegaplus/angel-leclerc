import { getLovableAiKey, lovableChat, probeLovableAi, resolveAiModel, LOVABLE_AI_SOURCE } from "./lovable-ai.server";

type AiRole = "system" | "user" | "assistant";
export type AiMessage = { role: AiRole; content: string };
export type AiPriority = "interactive" | "important" | "background";
export type AiFailureReason = "ok" | "disabled" | "not_configured" | "budget" | "circuit_open" | "provider";

type UsageEntry = { at: number; estimatedTokens: number; priority: AiPriority };
const usage: UsageEntry[] = [];
const cache = new Map<string, { expires: number; text: string }>();
const health = { consecutiveFailures: 0, lastFailureAt: 0, lastSuccessAt: 0, circuitOpenUntil: 0, lastReason: "ok" as AiFailureReason };
let probeCache: { at: number; healthy: boolean; detail: string | null; source: string | null } | null = null;
let gatewayBlockedUntil = 0;
let gatewayFailures = 0;
let gatewayLastFailureAt: number | null = null;
let gatewayLastSuccessAt: number | null = null;

function numberEnv(name: string, fallback: number) { const value = Number(process.env[name]); return Number.isFinite(value) && value > 0 ? value : fallback; }
function enabled() { return !["0", "false", "off", "disabled"].includes(String(process.env.ANGEL_AI_ENABLED ?? "true").toLowerCase()); }
function gatewayKey() { return getLovableAiKey(); }
function gatewayModel(model: string) { return resolveAiModel(model); }
function prune(now = Date.now()) {
  const dayAgo = now - 86_400_000;
  while (usage.length && usage[0].at < dayAgo) usage.shift();
  for (const [key, value] of cache) if (value.expires < now) cache.delete(key);
  if (health.circuitOpenUntil && health.circuitOpenUntil <= now) health.circuitOpenUntil = 0;
  if (gatewayBlockedUntil && gatewayBlockedUntil <= now) gatewayBlockedUntil = 0;
}
function estimate(messages: AiMessage[], output: number) { return Math.ceil(messages.reduce((n, m) => n + m.content.length, 0) / 4) + output; }
function hash(value: string) { let h = 2166136261; for (let i = 0; i < value.length; i += 1) h = Math.imul(h ^ value.charCodeAt(i), 16777619); return (h >>> 0).toString(36); }
function fail(reason: Exclude<AiFailureReason, "ok">, now = Date.now(), detail?: string) {
  health.lastReason = reason;
  health.lastFailureAt = now;
  if (reason === "provider") {
    health.consecutiveFailures += 1;
    if (health.consecutiveFailures >= numberEnv("ANGEL_AI_CIRCUIT_FAILURES", 3)) {
      health.circuitOpenUntil = now + numberEnv("ANGEL_AI_CIRCUIT_COOLDOWN_MS", 5 * 60_000);
    }
  }
  return { text: null, reason, detail: detail?.slice(0, 900) || null, cached: false, fallbackRequired: true } as const;
}
function succeed() { health.consecutiveFailures = 0; health.lastSuccessAt = Date.now(); health.lastReason = "ok"; health.circuitOpenUntil = 0; }
function sanitizeMessages(messages: AiMessage[]): AiMessage[] {
  const stale = [/^État réel\s*:/i, /moteur IA externe n['’]est pas disponible/i, /moteur local/i, /mode de secours/i];
  return messages.filter((message) => message.role !== "assistant" || !stale.some((pattern) => pattern.test(message.content)));
}
function credentialCooldown(status?: number) {
  if (status === 401 || status === 403) return 15 * 60_000;
  if (status === 429) return 2 * 60_000;
  if (status && status >= 500) return 45_000;
  return 30_000;
}
function markGatewayFailure(status?: number) {
  gatewayFailures += 1;
  gatewayLastFailureAt = Date.now();
  gatewayBlockedUntil = Date.now() + Math.min(15 * 60_000, credentialCooldown(status) * Math.min(6, Math.max(1, gatewayFailures)));
}
function markGatewayHealthy() {
  gatewayFailures = 0;
  gatewayBlockedUntil = 0;
  gatewayLastSuccessAt = Date.now();
}

async function requestProvider(options: {
  model: string;
  messages: AiMessage[];
  maxTokens: number;
  temperature: number;
  interactive: boolean;
  priority: AiPriority;
}) {
  const controller = new AbortController();
  const timeoutMs = options.interactive ? 20_000 : 15_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const result = await lovableChat({
      model: options.model,
      messages: options.messages,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      signal: controller.signal,
    });
    return { text: result.text, totalTokens: result.totalTokens, status: result.status, detail: result.detail };
  } finally {
    clearTimeout(timeout);
  }
}

async function requestWithGateway(options: {
  priority: AiPriority;
  interactive: boolean;
  model: string;
  messages: AiMessage[];
  maxTokens: number;
  temperature: number;
}) {
  const key = gatewayKey();
  if (!key || gatewayBlockedUntil > Date.now()) {
    return { text: null as string | null, totalTokens: null as number | null, detail: key ? "Passerelle IA temporairement en cooldown." : "LOVABLE_API_KEY absente.", status: null as number | null };
  }
  const result = await requestProvider({ ...options, model: gatewayModel(options.model) });
  if (!result.text) markGatewayFailure(result.status ?? undefined);
  else markGatewayHealthy();
  return result;
}

export async function angelAi(options: { messages: AiMessage[]; priority?: AiPriority; maxTokens?: number; temperature?: number; cacheKey?: string; cacheTtlMs?: number; model?: string }) {
  const now = Date.now();
  prune(now);
  const priority = options.priority ?? "background";
  const interactive = priority === "interactive";
  if (!enabled()) return fail("disabled", now, "ANGEL_AI_ENABLED désactive l’IA intégrée.");

  const gatewayConfigured = Boolean(gatewayKey());
  if (!gatewayConfigured) return fail("not_configured", now, "Aucune clé IA serveur n’est configurée (LOVABLE_API_KEY).");
  if (!interactive && health.circuitOpenUntil > now) return fail("circuit_open", now, `Circuit IA temporairement ouvert jusqu’à ${new Date(health.circuitOpenUntil).toISOString()}.`);

  const messages = sanitizeMessages(options.messages);
  const maxTokens = Math.min(options.maxTokens ?? 500, interactive ? 1400 : 800);
  const estimated = estimate(messages, maxTokens);
  const dailyLimit = numberEnv("ANGEL_AI_DAILY_TOKEN_BUDGET", 120_000);
  const hourlyLimit = numberEnv("ANGEL_AI_HOURLY_TOKEN_BUDGET", 30_000);
  const usedDay = usage.reduce((n, e) => n + e.estimatedTokens, 0);
  const hourAgo = now - 3_600_000;
  const usedHour = usage.filter((e) => e.at >= hourAgo).reduce((n, e) => n + e.estimatedTokens, 0);
  if (!interactive) {
    const reserve = priority === "important" ? 0.85 : 0.65;
    if (usedDay + estimated > dailyLimit * reserve || usedHour + estimated > hourlyLimit * reserve) return fail("budget", now, `Budget IA de fond atteint : heure ${usedHour}/${hourlyLimit}, jour ${usedDay}/${dailyLimit}.`);
  }

  const model = resolveAiModel(options.model || process.env["ANGEL_AI_MODEL"]);
  const rawCache = options.cacheKey ?? `${model}\n${messages.map((m) => `${m.role}:${m.content}`).join("\n")}`;
  const cacheKey = hash(rawCache);
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > now) {
    succeed();
    return { text: hit.text, reason: "ok" as const, detail: null, cached: true, fallbackRequired: false };
  }

  const failures: string[] = [];
  const requestOptions = { priority, interactive, model, messages, maxTokens, temperature: options.temperature ?? 0.3 };
  if (gatewayConfigured) {
    const result = await requestWithGateway(requestOptions);
    if (result.text) {
      usage.push({ at: now, estimatedTokens: result.totalTokens ?? estimated, priority });
      cache.set(cacheKey, { expires: now + (options.cacheTtlMs ?? (interactive ? 60_000 : 15 * 60_000)), text: result.text });
      succeed();
      return { text: result.text, reason: "ok" as const, detail: null, cached: false, fallbackRequired: false, provider: "lovable-ai" as const };
    }
    if (result.detail) failures.push(result.detail);
  }

  return fail("provider", Date.now(), failures.slice(-4).join(" | ") || "Tous les fournisseurs IA configurés ont échoué.");
}

export async function probeOpenAiHealth(force = false) {
  const now = Date.now();
  if (!force && probeCache && now - probeCache.at < 45_000) return probeCache;
  if (!enabled()) return { at: now, healthy: false, detail: "IA intégrée désactivée.", source: null };
  if (!gatewayKey()) return { at: now, healthy: false, detail: "Aucune clé IA serveur configurée (LOVABLE_API_KEY).", source: null };

  const probe = await probeLovableAi();
  if (probe.healthy) {
    markGatewayHealthy();
    succeed();
    probeCache = { at: Date.now(), healthy: true, detail: null, source: probe.source };
    return probeCache;
  }
  markGatewayFailure();
  probeCache = { at: Date.now(), healthy: false, detail: probe.detail, source: null };
  return probeCache;
}

export const probeAngelAiHealth = probeOpenAiHealth;

export function angelAiSupervisorSnapshot() {
  const now = Date.now();
  prune(now);
  const hourAgo = now - 3_600_000;
  const usedToday = usage.reduce((n, e) => n + e.estimatedTokens, 0);
  const usedHour = usage.filter((e) => e.at >= hourAgo).reduce((n, e) => n + e.estimatedTokens, 0);
  const dailyLimit = numberEnv("ANGEL_AI_DAILY_TOKEN_BUDGET", 120_000);
  const hourlyLimit = numberEnv("ANGEL_AI_HOURLY_TOKEN_BUDGET", 30_000);
  const gatewayConfigured = Boolean(gatewayKey());
  const gatewayAvailable = gatewayConfigured && gatewayBlockedUntil <= now;
  const providerConfigured = gatewayConfigured;
  const availableCredentialCount = gatewayAvailable ? 1 : 0;
  return {
    enabled: enabled(),
    providerConfigured,
    credentialCount: gatewayConfigured ? 1 : 0,
    availableCredentialCount,
    healthy: enabled() && providerConfigured && availableCredentialCount > 0 && health.circuitOpenUntil <= now,
    circuitOpen: health.circuitOpenUntil > now,
    circuitOpenUntil: health.circuitOpenUntil || null,
    consecutiveFailures: health.consecutiveFailures,
    lastFailureAt: health.lastFailureAt || null,
    lastSuccessAt: health.lastSuccessAt || null,
    lastReason: health.lastReason,
    providers: {
      openaiDirect: { configured: 0, available: 0, credentials: [] as Array<{ source: string; failures: number; blockedUntil: number | null; healthy: boolean; lastFailureAt: number | null; lastSuccessAt: number | null }> },
      lovableAi: {
        configured: gatewayConfigured,
        available: gatewayAvailable,
        source: LOVABLE_AI_SOURCE,
        failures: gatewayFailures,
        blockedUntil: gatewayBlockedUntil || null,
        lastFailureAt: gatewayLastFailureAt,
        lastSuccessAt: gatewayLastSuccessAt,
      },
      vercelAiGateway: {
        configured: gatewayConfigured,
        available: gatewayAvailable,
        failures: gatewayFailures,
        blockedUntil: gatewayBlockedUntil || null,
        lastFailureAt: gatewayLastFailureAt,
        lastSuccessAt: gatewayLastSuccessAt,
      },
    },
    usedToday,
    usedHour,
    dailyLimit,
    hourlyLimit,
    remainingToday: Math.max(0, dailyLimit - usedToday),
    remainingHour: Math.max(0, hourlyLimit - usedHour),
  };
}
export const angelAiBudgetSnapshot = angelAiSupervisorSnapshot;
