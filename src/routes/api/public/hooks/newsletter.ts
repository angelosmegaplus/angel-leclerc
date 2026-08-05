import { createFileRoute } from "@tanstack/react-router";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export const Route = createFileRoute("/api/public/hooks/newsletter")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided =
          request.headers.get("x-newsletter-token") ??
          request.headers.get("authorization")?.replace("Bearer ", "") ??
          "";
        const expected = process.env["NEWSLETTER_CRON_SECRET"];
        if (!expected || !provided || !safeEqual(provided, expected)) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const { sendWeeklyNewsletter } = await import("@/lib/newsletter.server");
          const result = await sendWeeklyNewsletter();
          return Response.json({ ok: true, ...result });
        } catch (error) {
          console.error("[newsletter] weekly run failed", error);
          return new Response(JSON.stringify({ ok: false }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
