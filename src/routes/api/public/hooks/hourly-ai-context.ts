import { createFileRoute } from "@tanstack/react-router";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/hooks/hourly-ai-context")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("x-cron-token") ?? request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
        const expected = process.env["NEWSLETTER_CRON_SECRET"];
        if (!expected || !provided || !safeEqual(provided, expected)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const { refreshOperationalContext } = await import("@/lib/angel-os-ia/operational-context.server");
          const context = await refreshOperationalContext();
          return Response.json({
            ok: true,
            generatedAt: context.generatedAt,
            validUntil: context.validUntil,
            overview: context.overview,
            priorities: context.priorities.length,
            alerts: context.alerts.length,
            sources: context.liveSources.length,
          });
        } catch (error) {
          console.error("[hourly-ai-context] refresh failed", error);
          return Response.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
        }
      },
    },
  },
});
