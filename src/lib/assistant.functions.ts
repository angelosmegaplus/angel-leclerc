import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AiMessage } from "./ai-gateway.server";
import { resilientAngelAi } from "./ai-resilient.server";

const AskSchema = z.object({
  question: z.string().trim().min(2).max(1_000),
  mode: z.enum(["site", "contact"]).optional(),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(3_000) })).max(16).optional(),
});
export type AskAssistantResult = { text: string | null; source: "openai" | "fallback" };

export const askAssistant = createServerFn({ method: "POST" })
  .validator((input: unknown) => AskSchema.parse(input))
  .handler(async ({ data }): Promise<AskAssistantResult> => {
    const { getRequestIP } = await import("@tanstack/react-start/server");
    const { checkAssistantRate } = await import("./assistant-rate.server");
    let ip = "unknown";
    try { ip = getRequestIP({ xForwardedFor: true }) ?? "unknown"; } catch { /* hors requête */ }
    if (!checkAssistantRate(ip)) return { text: null, source: "fallback" };

    const [{ ASSISTANT_SYSTEM_PROMPT, CONTACT_ASSISTANT_ADDENDUM }, { aiMemoryPrompt }] = await Promise.all([
      import("./assistant-context"),
      import("./ai-memory.server"),
    ]);
    const liveMemory = await aiMemoryPrompt("public");
    const basePrompt = data.mode === "contact" ? `${ASSISTANT_SYSTEM_PROMPT}\n\n${CONTACT_ASSISTANT_ADDENDUM}` : ASSISTANT_SYSTEM_PROMPT;
    const systemPrompt = `${basePrompt}${liveMemory}`;
    const messages: AiMessage[] = [
      { role: "system", content: systemPrompt },
      ...(data.history ?? []).slice(-12),
      { role: "user", content: data.question },
    ];
    const result = await resilientAngelAi({
      messages,
      priority: "interactive",
      maxTokens: data.mode === "contact" ? 700 : 600,
      temperature: data.mode === "contact" ? 0.35 : 0.3,
      cacheTtlMs: 2 * 60_000,
    });
    return result.text ? { text: result.text.slice(0, 3_000), source: "openai" } : { text: null, source: "fallback" };
  });
