import { createFileRoute } from "@tanstack/react-router";

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

const portfolioSources: Record<string, string> = {
  "logo-alc": "https://media.canva.com/v2/document-image/hash:1184351037/height:335/id:DAHO-bA0GOM/type:B/width:595?brand=BAE8qOCilJM&csig=AAAAAAAAAAAAAAAAAAAAAEneUixYIn1wyAe-uO3iuJ0yPMv75iVHeR8TDXbkdkds&disableexport=T&exp=1787768812&fallback=https%3A%2F%2Fs3.amazonaws.com%2Fdocument-export.canva.com%2FA0GOM%2FDAHO-bA0GOM%2F12%2Fthumbnail%2F0001.png%3FX-Amz-Algorithm%3DAWS4-HMAC-SHA256%26X-Amz-Credential%3DAKIAQYCGKMUH4GDRW44L%252F20260826%252Fus-east-1%252Fs3%252Faws4_request%26X-Amz-Date%3D20260826T130944Z%26X-Amz-Expires%3D19028%26X-Amz-Signature%3D3f1344ed59b34215acf56dfc0689afaf56babec7a2e05f2b9a0be3c9fcc55903%26X-Amz-SignedHeaders%3Dhost%26response-expires%3DWed%252C%252026%2520Aug%25202026%252018%253A26%253A52%2520GMT&osig=AAAAAAAAAAAAAAAAAAAAAPJIr35zU5F9HnINjwIPtQGKehWrQsVK8v-T52OA-uba&page=1&signed=brand%2Cdisableexport%2Cfallback%2Cpage%2Cversion&signer=document-rpc&version=12",
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
          const upstream = await fetch(source, { redirect: "follow" });
          if (!upstream.ok) return Response.json({ error: `Canva returned ${upstream.status}` }, { status: 502, headers });
          const bytes = new Uint8Array(await upstream.arrayBuffer());
          return Response.json({
            slug: portfolioSlug,
            contentType: upstream.headers.get("content-type") || "application/octet-stream",
            bytes: bytes.byteLength,
            base64: Buffer.from(bytes).toString("base64"),
          }, { headers });
        }

        return Response.json({ maintenance: false, reason: "maintenance-disabled" }, { headers });
      },
    },
  },
});
