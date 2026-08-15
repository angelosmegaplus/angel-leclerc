import { createFileRoute } from "@tanstack/react-router";
import type { AiMessage } from "@/lib/ai-gateway.server";
import { resilientAngelAi } from "@/lib/ai-resilient.server";
import { ASSISTANT_SYSTEM_PROMPT, CONTACT_ASSISTANT_ADDENDUM } from "@/lib/assistant-context";
import { checkAssistantRate } from "@/lib/assistant-rate.server";
import { aiMemoryPrompt } from "@/lib/ai-memory.server";
import { recordAngelOperation } from "@/lib/angel-runtime.server";
import { rememberPersonalContext, searchPersonalContext } from "@/lib/angel-os-ia/personal-context.server";

const jsonHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", Pragma: "no-cache", Expires: "0", "Content-Type": "application/json; charset=utf-8" };
type IncomingMessage = { role?: unknown; content?: unknown };
type IncomingBody = { question?: unknown; mode?: unknown; history?: unknown };

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export const Route = createFileRoute("/api/assistant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const startedAt = Date.now();
        const requestId = crypto.randomUUID();
        try {
          const ip = clientIp(request);
          if (!checkAssistantRate(ip)) {
            await recordAngelOperation({ type: "angel-os-ia.assistant.rate_limited", source: "angel-os-ia", ok: false });
            return Response.json({ text: null, source: "fallback", reason: "rate_limit", requestId }, { status: 429, headers: jsonHeaders });
          }

          const body = (await request.json()) as IncomingBody;
          const question = typeof body.question === "string" ? body.question.trim().slice(0, 1000) : "";
          if (question.length < 2) return Response.json({ text: null, source: "fallback", reason: "invalid_question", requestId }, { status: 400, headers: jsonHeaders });

          const mode = body.mode === "contact" ? "contact" : "site";
          const historyRaw = Array.isArray(body.history) ? (body.history as IncomingMessage[]) : [];
          const history: AiMessage[] = historyRaw.slice(-12).flatMap((message) => {
            const role = message.role === "user" || message.role === "assistant" ? message.role : null;
            const content = typeof message.content === "string" ? message.content.trim().slice(0, 3000) : "";
            return role && content ? [{ role, content } as AiMessage] : [];
          });

          const liveMemory = await aiMemoryPrompt("public");
          const personalHits = searchPersonalContext(question, 5);
          const personalMemory = personalHits.length ? `\n\nContexte personnel Angel OS IA pertinent :\n${personalHits.map((hit) => `- ${hit.title}: ${hit.text.slice(0, 500)}`).join("\n")}` : "";
          const basePrompt = mode === "contact" ? `${ASSISTANT_SYSTEM_PROMPT}\n\n${CONTACT_ASSISTANT_ADDENDUM}` : ASSISTANT_SYSTEM_PROMPT;
          const systemPrompt = `${basePrompt}${liveMemory}${personalMemory}`;
          const messages: AiMessage[] = [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: question }];

          const result = await resilientAngelAi({ messages, priority: "interactive", maxTokens: mode === "contact" ? 700 : 600, temperature: mode === "contact" ? 0.35 : 0.3, cacheKey: `angel-os-ia:assistant-live:${requestId}`, cacheTtlMs: 1 });
          const durationMs = Date.now() - startedAt;
          const ok = Boolean(result.text);
          await recordAngelOperation({ type: ok ? "angel-os-ia.assistant.completed" : "angel-os-ia.assistant.failed", source: "angel-os-ia", ok, durationMs, payload: { requestId, mode, reason: result.reason, recoveryAction: result.recoveryAction } });

          if (result.text && mode !== "contact") {
            await rememberPersonalContext({ id: `assistant:${requestId}`, domain: "preferences", title: question.slice(0, 120), text: `Question: ${question}\nRéponse: ${result.text.slice(0, 2500)}`, tags: ["conversation"], metadata: { requestId } });
          }

          return Response.json({ text: result.text ? result.text.slice(0, 3000) : null, source: result.text ? "openai" : "fallback", reason: result.reason, requestId }, { headers: jsonHeaders });
        } catch (error) {
          const durationMs = Date.now() - startedAt;
          console.error("[assistant-api] failure", { requestId, durationMs, error });
          await recordAngelOperation({ type: "angel-os-ia.assistant.exception", source: "angel-os-ia", ok: false, durationMs, payload: { requestId } });
          return Response.json({ text: null, source: "fallback", reason: "server_error", requestId }, { status: 500, headers: jsonHeaders });
        }
      },
    },
  },
});
