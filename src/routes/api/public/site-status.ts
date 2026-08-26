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
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const sourceParam = requestUrl.searchParams.get("portfolioSource");
        const raw = requestUrl.searchParams.get("raw") === "1";

        if (sourceParam) {
          let source: URL;
          try {
            source = new URL(sourceParam);
          } catch {
            return Response.json({ error: "invalid source" }, { status: 400, headers });
          }
          if (source.protocol !== "https:" || source.hostname !== "media.canva.com") {
            return Response.json({ error: "source not allowed" }, { status: 403, headers });
          }

          const upstream = await fetch(source, { redirect: "follow" });
          if (!upstream.ok) {
            return Response.json({ error: `Canva returned ${upstream.status}` }, { status: 502, headers });
          }
          const bytes = new Uint8Array(await upstream.arrayBuffer());
          const contentType = upstream.headers.get("content-type") || "image/png";

          if (raw) {
            return new Response(bytes, {
              headers: {
                "Cache-Control": "no-store",
                "Content-Type": contentType,
                "Content-Length": String(bytes.byteLength),
              },
            });
          }

          return Response.json({
            contentType,
            bytes: bytes.byteLength,
            base64: Buffer.from(bytes).toString("base64"),
          }, { headers });
        }

        return Response.json(
          { maintenance: false, reason: "maintenance-disabled" },
          { headers },
        );
      },
    },
  },
});
