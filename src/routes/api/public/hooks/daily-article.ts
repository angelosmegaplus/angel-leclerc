import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/daily-article")({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          { error: "La publication automatique quotidienne a été supprimée." },
          { status: 410 },
        ),
    },
  },
});
