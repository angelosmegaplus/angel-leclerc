import { createFileRoute } from "@tanstack/react-router";
import { fetchAdminNewsSnapshot, fetchAiNewsSnapshot } from "@/lib/news.functions";

const headers = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
};

export const Route = createFileRoute("/api/admin/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const phase = url.searchParams.get("phase");
          const payload = phase === "ai" ? await fetchAiNewsSnapshot() : await fetchAdminNewsSnapshot();
          return Response.json(payload, { headers });
        } catch (error) {
          console.error("[news-api] feeds unavailable", error);
          return Response.json(
            { items: [], fetchedAt: new Date().toISOString(), source: "cache", phase: "combined" },
            { status: 503, headers },
          );
        }
      },
    },
  },
});
