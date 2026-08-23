import { createFileRoute } from "@tanstack/react-router";
import { checkMistralRate } from "@/lib/mistral-rate.server";

const jsonHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  "Content-Type": "application/json; charset=utf-8",
};

const MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const MODEL = "mistral-small-latest";
const MAX_MESSAGE_LENGTH = 2500;
const MAX_HISTORY = 8;

type IncomingMessage = { role?: unknown; content?: unknown };
type IncomingBody = { message?: unknown; history?: unknown };

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export const Route = createFileRoute("/api/flamme-mistral")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const key = process.env["MISTRAL_API_KEY"]?.trim();
          if (!key) {
            return Response.json({ text: null, reason: "not_configured" }, { status: 200, headers: jsonHeaders });
          }

          if (!checkMistralRate(clientIp(request))) {
            return Response.json({ text: null, reason: "rate_limit" }, { status: 429, headers: jsonHeaders });
          }

          const body = (await request.json().catch(() => ({}))) as IncomingBody;
          const message = typeof body.message === "string" ? body.message.trim() : "";
          if (!message || message.length > MAX_MESSAGE_LENGTH) {
            return Response.json({ text: null, reason: "invalid_message" }, { status: 400, headers: jsonHeaders });
          }

          const rawHistory = Array.isArray(body.history) ? (body.history as IncomingMessage[]) : [];
          const history = rawHistory.slice(-MAX_HISTORY).flatMap((entry) => {
            const role = entry.role === "user" || entry.role === "assistant" ? entry.role : null;
            const content = typeof entry.content === "string" ? entry.content.trim().slice(0, MAX_MESSAGE_LENGTH) : "";
            return role && content ? [{ role, content }] : [];
          });

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 30_000);
          let response: Response;
          try {
            response = await fetch(MISTRAL_ENDPOINT, {
              method: "POST",
              signal: controller.signal,
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
              body: JSON.stringify({
                model: MODEL,
                max_tokens: 600,
                temperature: 0.4,
                messages: [
                  {
                    role: "system",
                    content:
                      "Tu es l'assistant IA français intégré au moteur Flamme. Réponds en français, de façon claire, brève et utile. N'utilise jamais de HTML : uniquement du texte simple ou du markdown léger.",
                  },
                  ...history,
                  { role: "user", content: message },
                ],
              }),
            });
          } finally {
            clearTimeout(timeout);
          }

          if (!response.ok) {
            const reason = response.status === 429 ? "rate_limit" : "upstream_error";
            return Response.json({ text: null, reason }, { status: response.status === 429 ? 429 : 502, headers: jsonHeaders });
          }

          const payload = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
          const raw = payload.choices?.[0]?.message?.content;
          const text = typeof raw === "string" ? raw.trim() : "";
          if (!text) {
            return Response.json({ text: null, reason: "empty_answer" }, { status: 502, headers: jsonHeaders });
          }

          return Response.json({ text: text.slice(0, 6000), reason: null }, { headers: jsonHeaders });
        } catch (error) {
          const aborted = error instanceof Error && error.name === "AbortError";
          return Response.json({ text: null, reason: aborted ? "timeout" : "server_error" }, { status: aborted ? 504 : 500, headers: jsonHeaders });
        }
      },
    },
  },
});
