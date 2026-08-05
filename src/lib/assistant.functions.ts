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
  source: "openai" | "fallback";
};

/**
 * Interroge OpenAI côté serveur. Ne renvoie jamais d'erreur technique au visiteur :
 * en cas de clé absente, de quota, de délai dépassé ou d'abus, `text` vaut null et
 * le client bascule automatiquement sur le moteur local.
 */
export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AskSchema.parse(input))
  .handler(async ({ data }): Promise<AskAssistantResult> => {
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) return { text: null, source: "fallback" };

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.3,
          max_tokens: 400,
          messages: [
            { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
            ...(data.history ?? []).slice(-6),
            { role: "user", content: data.question },
          ],
        }),
      });

      if (!res.ok) {
        console.error("[assistant] OpenAI error", res.status, await res.text());
        return { text: null, source: "fallback" };
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.message?.content?.trim();
      if (!text) return { text: null, source: "fallback" };
      return { text: text.slice(0, 1500), source: "openai" };
    } catch (error) {
      console.error("[assistant] appel OpenAI impossible", error);
      return { text: null, source: "fallback" };
    } finally {
      clearTimeout(timeout);
    }
  });
