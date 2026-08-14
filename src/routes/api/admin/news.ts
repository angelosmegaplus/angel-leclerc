import { createFileRoute } from "@tanstack/react-router";
import { fetchAdminNewsSnapshot } from "@/lib/news.functions";

const headers = {
  "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=21600",
  "Content-Type": "application/json; charset=utf-8",
};

export const Route = createFileRoute("/api/admin/news")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return Response.json(await fetchAdminNewsSnapshot(), { headers });
        } catch (error) {
          console.error("[news-api] feeds unavailable", error);
          return Response.json(
            { items: [], fetchedAt: new Date().toISOString(), source: "cache" },
            { status: 503, headers },
          );
        }
      },
    },
  },
});
