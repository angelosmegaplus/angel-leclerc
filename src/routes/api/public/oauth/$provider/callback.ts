import { createFileRoute } from "@tanstack/react-router";
import { isProviderId, PROVIDERS } from "@/lib/oauth/providers";

function redirectToAdmin(origin: string, params: Record<string, string>) {
  const url = new URL("/admin", origin);
  url.searchParams.set("tab", "connexions");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return new Response(null, { status: 302, headers: { location: url.toString() } });
}

export const Route = createFileRoute("/api/public/oauth/$provider/callback")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const url = new URL(request.url);
        const origin = url.origin;
        const provider = params.provider;

        if (!isProviderId(provider)) return redirectToAdmin(origin, { oauth_error: "provider_inconnu" });
        const providerError = url.searchParams.get("error");
        if (providerError) return redirectToAdmin(origin, { oauth_error: providerError.slice(0, 80) });
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (!code || !state) return redirectToAdmin(origin, { oauth_error: "reponse_incomplete" });

        const oauth = await import("@/lib/oauth/oauth.server");
        const verified = oauth.verifyState(state);
        if (!verified || verified.p !== provider) return redirectToAdmin(origin, { oauth_error: "state_invalide" });

        try {
          const tokens = await oauth.exchangeCode(provider, code, origin, verified.v);
          const accessToken = tokens["access_token"] as string;
          const expiresIn = Number(tokens["expires_in"] ?? 0);
          const scope = tokens["scope"];
          const scopes = typeof scope === "string" && scope.length > 0
            ? scope.split(/[\s,]+/)
            : [...PROVIDERS[provider].scopes, ...(PROVIDERS[provider].optionalScopes ?? [])];
          const accountLabel = await oauth.fetchAccountLabel(provider, accessToken);

          await oauth.saveConnection({
            provider,
            userId: verified.u,
            tokens: {
              access_token: accessToken,
              refresh_token: tokens["refresh_token"] as string | undefined,
              token_type: tokens["token_type"] as string | undefined,
              scope: typeof scope === "string" ? scope : undefined,
            },
            scopes,
            accountLabel,
            expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
          });

          return redirectToAdmin(origin, { oauth_connected: provider });
        } catch (error) {
          console.error("[oauth callback]", error);
          return redirectToAdmin(origin, { oauth_error: "echec_echange" });
        }
      },
    },
  },
});
