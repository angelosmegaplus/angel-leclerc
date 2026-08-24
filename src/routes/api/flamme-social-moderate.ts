import { createFileRoute } from "@tanstack/react-router";
import { checkMistralRate } from "@/lib/mistral-rate.server";

const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const MODEL = "mistral-small-latest";
const MAX_LENGTH = 5000;

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

type Body = {
  content?: unknown;
  kind?: unknown;
  scope?: unknown;
  confirmed?: unknown;
};

function ip(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

export const Route = createFileRoute("/api/flamme-social-moderate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const key = process.env["MISTRAL_API_KEY"]?.trim();
          if (!key) return Response.json({ available: false, decision: "allow", categories: [] }, { headers });
          if (!checkMistralRate(ip(request))) {
            return Response.json({ available: true, decision: "allow", categories: [], reason: "rate_limit" }, { status: 429, headers });
          }

          const body = (await request.json().catch(() => ({}))) as Body;
          const content = typeof body.content === "string" ? body.content.trim() : "";
          const kind = typeof body.kind === "string" ? body.kind.slice(0, 40) : "publication";
          const scope = body.scope === "reported_private" ? "reported_private" : "public";
          const confirmed = body.confirmed === true;

          if (!content || content.length > MAX_LENGTH) {
            return Response.json({ available: true, decision: "allow", categories: [], reason: "invalid_content" }, { status: 400, headers });
          }
          if (scope === "reported_private" && !confirmed) {
            return Response.json({ available: true, decision: "allow", categories: [], reason: "explicit_confirmation_required" }, { status: 400, headers });
          }

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15_000);
          let response: Response;
          try {
            response = await fetch(ENDPOINT, {
              method: "POST",
              signal: controller.signal,
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
              body: JSON.stringify({
                model: MODEL,
                temperature: 0,
                max_tokens: 180,
                response_format: { type: "json_object" },
                messages: [
                  {
                    role: "system",
                    content: "Tu aides à modérer Flamme, un réseau social français. Analyse uniquement le texte fourni. Retourne strictement un JSON avec decision ('allow' ou 'review'), categories (tableau parmi spam, harassment, hate, sexual, violence, impersonation, other) et reason (phrase très courte). 'review' signifie qu'une vérification humaine est recommandée, pas que le contenu est automatiquement illégal. Ne fais aucune inférence sur l'identité de l'auteur.",
                  },
                  { role: "user", content: `Type: ${kind}\nPortée: ${scope}\nTexte:\n${content}` },
                ],
              }),
            });
          } finally {
            clearTimeout(timeout);
          }

          if (!response.ok) {
            return Response.json({ available: true, decision: "allow", categories: [], reason: "upstream_error" }, { status: 200, headers });
          }
          const payload = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
          const raw = payload.choices?.[0]?.message?.content;
          if (typeof raw !== "string") return Response.json({ available: true, decision: "allow", categories: [] }, { headers });
          let parsed: { decision?: unknown; categories?: unknown; reason?: unknown } = {};
          try { parsed = JSON.parse(raw) as typeof parsed; } catch { /* fail open: AI is advisory, not security */ }
          const decision = parsed.decision === "review" ? "review" : "allow";
          const allowedCategories = new Set(["spam", "harassment", "hate", "sexual", "violence", "impersonation", "other"]);
          const categories = Array.isArray(parsed.categories)
            ? parsed.categories.filter((value): value is string => typeof value === "string" && allowedCategories.has(value)).slice(0, 4)
            : [];
          const reason = typeof parsed.reason === "string" ? parsed.reason.slice(0, 240) : undefined;
          return Response.json({ available: true, decision, categories, reason }, { headers });
        } catch (error) {
          const timeout = error instanceof Error && error.name === "AbortError";
          return Response.json({ available: true, decision: "allow", categories: [], reason: timeout ? "timeout" : "server_error" }, { status: 200, headers });
        }
      },
    },
  },
});
