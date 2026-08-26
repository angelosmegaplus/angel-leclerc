import { createFileRoute } from "@tanstack/react-router";

const sources: Record<string, string> = {
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

export const Route = createFileRoute("/api/public/portfolio-cache/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const url = sources[params.slug];
        if (!url) return new Response("Not found", { status: 404 });

        const upstream = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          redirect: "follow",
        });
        if (!upstream.ok) {
          return Response.json({ error: `Canva returned ${upstream.status}` }, { status: 502 });
        }

        const bytes = new Uint8Array(await upstream.arrayBuffer());
        const base64 = Buffer.from(bytes).toString("base64");
        return Response.json({
          slug: params.slug,
          contentType: upstream.headers.get("content-type") || "application/octet-stream",
          bytes: bytes.byteLength,
          base64,
        }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
