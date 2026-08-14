import { createFileRoute } from "@tanstack/react-router";

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

/**
 * Endpoint historique conservé pour compatibilité.
 * Le site public reste toujours disponible pendant les déploiements.
 */
export const Route = createFileRoute("/api/public/site-status")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          {
            maintenance: false,
            reason: "maintenance-disabled",
          },
          { headers },
        ),
    },
  },
});
