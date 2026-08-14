import { createFileRoute } from "@tanstack/react-router";

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

/**
 * Endpoint conservé uniquement pour compatibilité avec d'anciens clients.
 * Le site public ne possède plus de mode maintenance automatique.
 */
export const Route = createFileRoute("/system-status")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          {
            maintenance: false,
            reason: "maintenance-disabled",
            forcedMaintenance: false,
            deploymentInProgress: false,
            staleMaintenanceAutoReleased: false,
          },
          { headers },
        ),
    },
  },
});
