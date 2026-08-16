import { getOpenAiCredential } from "./vercel-connect-credentials.server";

type AiRole = "system" | "user" | "assistant";
export type AiMessage = { role: AiRole; content: string };
export type AiPriority = "interactive" | "important" | "background";
export type AiFailureReason = "ok" | "disabled" | "not_configured" | "budget" | "circuit_open" | "provider";

type UsageEntry = { at: number; estimatedTokens: number; priority: AiPriority };
const usage: UsageEntry[] = [];
const cache = new Map<string, { expires: number; text: string }>();
const health = { consecutiveFailures: 0, lastFailureAt: 0, lastSuccessAt: 0, circuitOpenUntil: 0, lastReason: "ok" as AiFailureReason };

function numberEnv(name: string, fallback: number) { const value = Number(process.env[name]); return Number.isFinite(value) && value > 0 ? value : fallback; }
function enabled() { return !["0", "false", "off", "disabled"].includes(String(process.env.ANGEL_AI_ENABLED ?? "true").toLowerCase()); }
function prune(now = Date.now()) {
  const dayAgo = now - 86_400_000;
  while (usage.length && usage[0].at < dayAgo) usage.shift();
  for (const [key, value] of cache) if (value.expires < now) cache.delete(key);
  if (health.circuitOpenUntil && health.circuitOpenUntil <= now) health.circuitOpenUntil = 0;
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
function responseText(json: any): string | null {
  if (typeof json?.output_text === "string" && json.output_text.trim()) return json.output_text.trim();
  for (const item of json?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string" && content.text.trim()) return content.text.trim();
    }
  }
  return null;
}
function providerErrorDetail(status: number, body: string, model: string, requestId: string | null) {
  let message = "";
  let code = "";
  try {
    const parsed = JSON.parse(body);
    message = typeof parsed?.error?.message === "string" ? parsed.error.message : "";
    code = typeof parsed?.error?.code === "string" ? parsed.error.code : typeof parsed?.error?.type === "string" ? parsed.error.type : "";
  } catch {}
  const parts = [`OpenAI HTTP ${status}`, `modèle ${model}`];
  if (code) parts.push(`code ${code}`);
  if (message) parts.push(message.replace(/sk-[A-Za-z0-9_-]+/g, "[clé masquée]").slice(0, 500));
  if (requestId) parts.push(`request ${requestId}`);
  return parts.join(" · ");
}

export async function angelAi(options: { messages: AiMessage[]; priority?: AiPriority; maxTokens?: number; temperature?: number; cacheKey?: string; cacheTtlMs?: number; model?: string }) {
  const now = Date.now();
  prune(now);
  const priority = options.priority ?? "background";
  const interactive = priority === "interactive";
  if (!enabled()) return fail("disabled", now, "ANGEL_AI_ENABLED désactive l’IA intégrée.");

  const credential = await getOpenAiCredential();
  if (!credential) return fail("not_configured", now, "OPENAI_API_KEY est absente des variables d’environnement Vercel.");
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
    if (usedDay + estimated > dailyLimit * reserve || usedHour + estimated > hourlyLimit * reserve) {
      return fail("budget", now, `Budget IA de fond atteint : heure ${usedHour}/${hourlyLimit}, jour ${usedDay}/${dailyLimit}.`);
    }
  }

  const model = options.model || process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const rawCache = options.cacheKey ?? `${model}\n${messages.map((m) => `${m.role}:${m.content}`).join("\n")}`;
  const cacheKey = hash(rawCache);
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > now) {
    succeed();
    return { text: hit.text, reason: "ok" as const, detail: null, cached: true, fallbackRequired: false };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), interactive ? 24_000 : 18_000);
  const clientRequestId = `${priority}-${now}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${credential.value}`,
        "X-Client-Request-Id": clientRequestId,
      },
      body: JSON.stringify({
        model,
        input: messages,
        max_output_tokens: maxTokens,
        temperature: options.temperature ?? 0.3,
        store: false,
      }),
    });

    const providerRequestId = response.headers.get("x-request-id");
    if (!response.ok) {
      const body = await response.text();
      return fail("provider", Date.now(), providerErrorDetail(response.status, body, model, providerRequestId));
    }

    const json = await response.json();
    const text = responseText(json);
    if (!text) return fail("provider", Date.now(), `OpenAI a répondu sans texte exploitable · modèle ${model}.`);

    const totalTokens = Number(json?.usage?.total_tokens);
    usage.push({ at: now, estimatedTokens: Number.isFinite(totalTokens) ? totalTokens : estimated, priority });
    cache.set(cacheKey, { expires: now + (options.cacheTtlMs ?? (interactive ? 60_000 : 15 * 60_000)), text });
    succeed();
    return { text, reason: "ok" as const, detail: null, cached: false, fallbackRequired: false };
  } catch (error) {
    const aborted = controller.signal.aborted || (error instanceof Error && error.name === "AbortError");
    return fail("provider", Date.now(), aborted
      ? `Délai OpenAI dépassé (${interactive ? 24 : 18}s) · modèle ${model}.`
      : `Échec réseau OpenAI · modèle ${model} · ${error instanceof Error ? error.message.slice(0, 500) : "erreur inconnue"}.`);
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
  const providerConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  return {
    enabled: enabled(),
    providerConfigured,
    healthy: enabled() && providerConfigured && health.circuitOpenUntil <= now,
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
