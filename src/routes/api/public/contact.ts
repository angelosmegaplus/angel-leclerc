import { createFileRoute } from "@tanstack/react-router";
import {
  conversationalContactSchema,
  processConversationalContact,
} from "@/lib/contact-chat.functions";

const ALLOWED_ORIGINS = new Set([
  "https://angel-leclerc.fr",
  "https://www.angel-leclerc.fr",
  "https://angel-leclerc.lovable.app",
]);

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin)
      ? origin
      : "https://www.angel-leclerc.fr",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export const Route = createFileRoute("/api/public/contact")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        new Response(null, { status: 204, headers: corsHeaders(request) }),
      POST: async ({ request }) => {
        const headers = corsHeaders(request);
        const origin = request.headers.get("origin");
        if (origin && !ALLOWED_ORIGINS.has(origin)) {
          return Response.json({ error: "Origine non autorisée." }, { status: 403, headers });
        }

        try {
          const data = conversationalContactSchema.parse(await request.json());
          const result = await processConversationalContact(data);
          return Response.json(result, { headers });
        } catch (error) {
          const message =
            error instanceof Error && error.message
              ? error.message
              : "La demande n'a pas pu être transmise.";
          console.error("[contact-api] submission failed", error);
          return Response.json({ error: message }, { status: 400, headers });
        }
      },
    },
  },
});
