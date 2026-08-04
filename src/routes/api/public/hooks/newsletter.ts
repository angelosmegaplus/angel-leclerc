import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/newsletter")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace("Bearer ", "");
        const expected = process.env["SUPABASE_ANON_KEY"];
        if (!expected || apiKey !== expected) {
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
