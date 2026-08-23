import { createFileRoute } from "@tanstack/react-router";
import { checkMistralRate } from "@/lib/mistral-rate.server";
import { loadFlammeNews } from "@/lib/flamme-news.server";

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

function asksForFreshNews(message: string) {
  return /(actu|actualité|actualites|actualité du jour|aujourd'hui|aujourd’hui|ce jour|dernières nouvelles|infos du jour|news)/i.test(message);
}

async function freshNewsContext(message: string): Promise<string | null> {
  if (!asksForFreshNews(message)) return null;
  try {
    const payload = await loadFlammeNews(null);
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    const recent = payload.items
      .filter((item) => !item.publishedAt || Date.parse(item.publishedAt) >= cutoff)
      .slice(0, 22);
    if (!recent.length) return null;
    return [
      "Contexte d'actualité fourni en temps réel par le fil RSS Flamme. Utilise uniquement ces éléments pour les faits récents et cite le média quand c'est utile. N'invente pas un événement absent de cette liste :",
      ...recent.map((item) => `- ${item.source} — ${item.title}${item.publishedAt ? ` — ${item.publishedAt}` : ""} — ${item.url}`),
    ].join("\n");
  } catch {
    return null;
  }
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

          const newsContext = await freshNewsContext(message);
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
                max_tokens: 700,
                temperature: 0.35,
                messages: [
                  {
                    role: "system",
                    content:
                      "Tu es l'assistant IA français intégré à Flamme. Réponds en français, de façon claire, brève et utile. N'utilise jamais de HTML : uniquement du texte simple ou du markdown léger. Si l'utilisateur demande une URL, ne fabrique jamais de lien : donne uniquement les adresses dont tu es suffisamment certain, sinon dis que tu n'es pas sûr et propose une recherche Flamme.",
                  },
                  ...(newsContext ? [{ role: "system" as const, content: newsContext }] : []),
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

          return Response.json({ text: text.slice(0, 7000), reason: null }, { headers: jsonHeaders });
        } catch (error) {
          const aborted = error instanceof Error && error.name === "AbortError";
          return Response.json({ text: null, reason: aborted ? "timeout" : "server_error" }, { status: aborted ? 504 : 500, headers: jsonHeaders });
        }
      },
    },
  },
});
