import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AskSchema = z.object({
  question: z.string().trim().min(2).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      }),
    )
    .max(8)
    .optional(),
});

export type AskAssistantResult = {
  text: string | null;
  source: "openai" | "lovable" | "fallback";
};

async function chat(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("[assistant] erreur IA", url, res.status, await res.text());
      return null;
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return json.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("[assistant] appel IA impossible", url, error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Interroge OpenAI côté serveur. Ne renvoie jamais d'erreur technique au visiteur :
 * en cas de clé absente, de quota, de délai dépassé ou d'abus, `text` vaut null et
 * le client bascule automatiquement sur le moteur local.
 */
export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AskSchema.parse(input))
  .handler(async ({ data }): Promise<AskAssistantResult> => {
    const apiKey = process.env["OPENAI_API_KEY"];
    const lovableKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey && !lovableKey) return { text: null, source: "fallback" };

    const { getRequestIP } = await import("@tanstack/react-start/server");
    const { checkAssistantRate } = await import("./assistant-rate.server");
    let ip = "unknown";
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
    } catch {
      /* contexte hors requête */
    }
    if (!checkAssistantRate(ip)) return { text: null, source: "fallback" };

    const { ASSISTANT_SYSTEM_PROMPT } = await import("./assistant-context");
    const messages = [
      { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
      ...(data.history ?? []).slice(-6),
      { role: "user", content: data.question },
    ];

    if (apiKey) {
      const text = await chat(
        "https://api.openai.com/v1/chat/completions",
        { Authorization: `Bearer ${apiKey}` },
        { model: "gpt-4o-mini", temperature: 0.3, max_tokens: 400, messages },
      );
      if (text) return { text: text.slice(0, 1500), source: "openai" };
    }

    // Repli : passerelle IA Lovable (aucune clé à fournir, quota inclus).
    if (lovableKey) {
      const text = await chat(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        { "Lovable-API-Key": lovableKey },
        { model: "google/gemini-3-flash-preview", messages },
      );
      if (text) return { text: text.slice(0, 1500), source: "lovable" };
    }

    return { text: null, source: "fallback" };
  });
