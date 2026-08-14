import { createFileRoute } from "@tanstack/react-router";
import { fetchAdminNewsSnapshot } from "@/lib/news.functions";

const headers = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
};

export const Route = createFileRoute("/api/admin/news")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const payload = await fetchAdminNewsSnapshot();
          return Response.json(payload, { headers });
        } catch (error) {
          console.error("[news-api] feeds unavailable", error);
          return Response.json(
            { items: [], fetchedAt: new Date().toISOString(), source: "cache", phase: "combined" },
            { status: 200, headers },
          );
        }
      },
    },
  },
});
