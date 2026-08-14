import { createFileRoute } from "@tanstack/react-router";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/hooks/daily-article")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided =
          request.headers.get("x-cron-token") ?? request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
        const expected = process.env["NEWSLETTER_CRON_SECRET"];
        if (!expected || !provided || !safeEqual(provided, expected)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        try {
          const { publishDailyWatchArticle } = await import("@/lib/daily-watch-article.server");
          return Response.json({ ok: true, ...(await publishDailyWatchArticle()) });
        } catch (error) {
          console.error("[daily-watch-article] run failed", error);
          return Response.json(
            { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
