import { createFileRoute } from "@tanstack/react-router";
import { bootAngelOS, getAngelOSStatus } from "@/lib/angel-os-runtime";

export const Route = createFileRoute("/api/angel-os/status")({
  server: {
    handlers: {
      GET: async () => {
        await bootAngelOS();
        return Response.json(getAngelOSStatus(), {
          headers: {
            "Cache-Control": "public, max-age=60, s-maxage=300",
          },
        });
      },
    },
  },
});
