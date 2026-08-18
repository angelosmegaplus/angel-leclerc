// Moteur d'intelligence artificielle d'Angel OS : passerelle IA Lovable (modèles Google Gemini).
// Aucun appel direct à Angel OS IA n'est effectué par Angel OS.
export const LOVABLE_AI_ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";
export const LOVABLE_AI_SOURCE = "env:LOVABLE_API_KEY";

export const DEFAULT_AI_MODEL = "google/gemini-3-flash-preview";
export const FAST_AI_MODEL = "google/gemini-2.5-flash-lite";
export const DEEP_AI_MODEL = "google/gemini-2.5-pro";

export type LovableAiMessage = { role: "system" | "user" | "assistant"; content: string };

export function getLovableAiKey(): string | null {
  const value = process.env["LOVABLE_API_KEY"]?.trim();
  return value || null;
}

/** Convertit un identifiant de modèle historique (Angel OS IA) vers un modèle réellement disponible. */
export function resolveAiModel(model?: string | null): string {
  const value = (model ?? "").trim();
  if (!value) return process.env["ANGEL_AI_MODEL"]?.trim() || DEFAULT_AI_MODEL;
  if (value.startsWith("google/")) return value;
  if (/pro|o1|o3|4\.1(?!-mini)/i.test(value) && !/mini|lite|nano/i.test(value)) return DEEP_AI_MODEL;
  if (/mini|lite|nano|haiku|small/i.test(value)) return FAST_AI_MODEL;
  return DEFAULT_AI_MODEL;
}

export function aiErrorDetail(status: number, body: string, model: string) {
  let message = "";
  try {
    const parsed = JSON.parse(body);
    message = typeof parsed?.error?.message === "string" ? parsed.error.message : typeof parsed?.title === "string" ? parsed.title : "";
  } catch {}
  const parts = [`IA HTTP ${status}`, `modèle ${model}`, "passerelle IA Lovable"];
  if (status === 402) parts.push("crédits IA épuisés : rechargez les crédits Lovable de l’espace de travail.");
  if (status === 429) parts.push("limite de débit atteinte, nouvelle tentative différée.");
  if (message) parts.push(message.slice(0, 400));
  return parts.join(" · ");
}

export async function lovableChat(options: {
  model?: string;
  messages: LovableAiMessage[];
  maxTokens?: number;
  temperature?: number;
  tools?: unknown[];
  responseFormat?: unknown;
  signal?: AbortSignal;
}) {
  const key = getLovableAiKey();
  const model = resolveAiModel(options.model);
  if (!key) {
    return { ok: false as const, status: null as number | null, text: null as string | null, totalTokens: null as number | null, detail: "LOVABLE_API_KEY absente côté serveur.", model };
  }
  try {
    const response = await fetch(LOVABLE_AI_ENDPOINT, {
      method: "POST",
      signal: options.signal,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model,
        messages: options.messages,
        ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
        ...(typeof options.temperature === "number" ? { temperature: options.temperature } : {}),
        ...(options.tools ? { tools: options.tools } : {}),
        ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      return { ok: false as const, status: response.status, text: null as string | null, totalTokens: null as number | null, detail: aiErrorDetail(response.status, body, model), model };
    }
    const json = await response.json() as {
      choices?: Array<{ message?: { content?: unknown } }>;
      usage?: { total_tokens?: number };
    };
    const raw = json.choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw.trim() : Array.isArray(raw)
      ? raw.map((part: any) => (typeof part?.text === "string" ? part.text : "")).join("").trim()
      : "";
    if (!text) {
      return { ok: false as const, status: response.status, text: null as string | null, totalTokens: null as number | null, detail: `La passerelle IA a répondu sans texte exploitable · modèle ${model}.`, model };
    }
    const totalTokens = Number.isFinite(Number(json.usage?.total_tokens)) ? Number(json.usage?.total_tokens) : null;
    return { ok: true as const, status: response.status, text, totalTokens, detail: null as string | null, model };
  } catch (error) {
    const aborted = options.signal?.aborted || (error instanceof Error && error.name === "AbortError");
    return {
      ok: false as const,
      status: null as number | null,
      text: null as string | null,
      totalTokens: null as number | null,
      detail: aborted ? `Délai IA dépassé · modèle ${model}.` : `Échec réseau IA · modèle ${model} · ${error instanceof Error ? error.message.slice(0, 300) : "erreur inconnue"}.`,
      model,
    };
  }
}

/** Sonde légère : une requête minimale suffit, la passerelle n'expose pas /models. */
export async function probeLovableAi() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const result = await lovableChat({ model: FAST_AI_MODEL, messages: [{ role: "user", content: "ping" }], maxTokens: 8, signal: controller.signal });
    return { healthy: result.ok, detail: result.detail, source: LOVABLE_AI_SOURCE };
  } finally {
    clearTimeout(timeout);
  }
}
