import { createFileRoute } from "@tanstack/react-router";

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

const portfolioSources: Record<string, string> = {
  "logo-alc": "https://design.canva.ai/ERnnCTPVt0CNCx3",
  "serie-logos-personnels": "https://design.canva.ai/X8Qr31KGd7ApqsP",
  "explorations-logos": "https://design.canva.ai/MQqG84jqqArdADA",
  "fds": "https://design.canva.ai/-EDDkDRnp2w9V74",
  "angel-os": "https://design.canva.ai/mynEfAulHgpDQUr",
  "firebox": "https://design.canva.ai/Lz9aJQyPySr0wgz",
  "eclaireurs-libres": "https://design.canva.ai/o2Y_HSWMk12cmHW",
  "tombola": "https://design.canva.ai/sObwXgi3qa0-CRM",
  "gannat-ouverture": "https://design.canva.ai/GH3oLueOxxXg3Qq",
  "freshtalk-radio": "https://design.canva.ai/--6cLLDQoNhRnBu",
  "collecte-dons": "https://design.canva.ai/--miwgxt2sx0HAC",
  "identite-politique": "https://design.canva.ai/FOcMHUx9A0GWptP",
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
        const portfolioSlug = requestUrl.searchParams.get("portfolio");

        if (portfolioSlug) {
          const source = portfolioSources[portfolioSlug];
          if (!source) return Response.json({ error: "unknown portfolio item" }, { status: 404, headers });

          const upstream = await fetch(source, {
            headers: { "User-Agent": "Mozilla/5.0" },
            redirect: "follow",
          });
          if (!upstream.ok) {
            return Response.json({ error: `Canva returned ${upstream.status}` }, { status: 502, headers });
          }

          const bytes = new Uint8Array(await upstream.arrayBuffer());
          return Response.json(
            {
              slug: portfolioSlug,
              contentType: upstream.headers.get("content-type") || "application/octet-stream",
              bytes: bytes.byteLength,
              base64: Buffer.from(bytes).toString("base64"),
            },
            { headers },
          );
        }

        return Response.json(
          {
            maintenance: false,
            reason: "maintenance-disabled",
          },
          { headers },
        );
      },
    },
  },
});
