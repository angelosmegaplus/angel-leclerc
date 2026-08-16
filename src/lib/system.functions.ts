import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { IntegrationReadiness, IntegrationStatus, ConnectionState } from "./system.server";

export type { IntegrationReadiness, IntegrationStatus, ConnectionState };

async function assertAdmin(context: { supabase: { from: (t: string) => any }; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Accès réservé à l'administrateur.");
}

export const integrationReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IntegrationReadiness[]> => {
    await assertAdmin(context);
    const { readIntegrations } = await import("./system.server");
    const { PROVIDERS } = await import("./oauth/providers");
    const oauth = await import("./oauth/oauth.server");
    const services = readIntegrations();

    let connections: Awaited<ReturnType<typeof oauth.listConnections>> = [];
    try {
      connections = await oauth.listConnections(context.userId);
    } catch (error) {
      console.error("[integrations] lecture des connexions impossible", error);
    }

    return Promise.all(services.map(async (service) => {
      if (!service.provider) return service;
      const provider = PROVIDERS[service.provider];
      const row = connections.find((c) => c.provider === service.provider);
      const requiredScopes = provider.scopes;
      const granted = new Set(row?.scopes ?? []);
      const missingScopes = row ? requiredScopes.filter((scope) => !granted.has(scope)) : [];
      const optionalMissing = row
        ? (provider.optionalScopes ?? []).filter((scope) => !granted.has(scope))
        : [];

      let connection: ConnectionState = !row
        ? "not_connected"
        : row.status === "reconnect_required" || missingScopes.length > 0
          ? "reconnect_required"
          : "connected";
      let accountLabel = row?.accountLabel ?? null;
      let liveProbeNote = "";

      // A database row is not proof that OAuth still works. Force the same token path
      // used by Gmail/Calendar/Drive and, where possible, validate it against the
      // provider identity endpoint. Revoked/expired credentials are therefore exposed
      // as reconnect_required instead of the misleading "Connecté" state.
      if (row && connection === "connected") {
        try {
          const token = await oauth.getAccessToken(context.userId, service.provider);
          if (!token) {
            connection = "reconnect_required";
            liveProbeNote = "Le jeton enregistré n’est plus exploitable. Une reconnexion est nécessaire.";
          } else if (provider.identity) {
            const label = await oauth.fetchAccountLabel(service.provider, token);
            if (!label) {
              connection = "reconnect_required";
              liveProbeNote = "Le fournisseur refuse le jeton enregistré ou ne répond plus correctement. Reconnexion recommandée.";
            } else {
              accountLabel = label;
            }
          }
        } catch (error) {
          connection = "reconnect_required";
          liveProbeNote = `Contrôle réel de la connexion impossible : ${error instanceof Error ? error.message.slice(0, 160) : "erreur inconnue"}.`;
        }
      }

      const optionalNote = optionalMissing.length > 0
        ? `Fonctions optionnelles non encore autorisées : ${optionalMissing.join(", ")}.`
        : "";
      const noteParts = [service.note, missingScopes.length > 0 ? `Reconnexion requise pour autoriser : ${missingScopes.join(", ")}.` : "", optionalNote, liveProbeNote].filter(Boolean);

      return {
        ...service,
        connection,
        accountLabel,
        lastSyncAt: row?.lastSyncAt ?? null,
        scopes: row?.scopes ?? [],
        ...(noteParts.length ? { note: noteParts.join(" ") } : {}),
      };
    }));
  });

const providerInput = z.object({ provider: z.string().min(1).max(30) });

/** Returns the provider consent URL. The browser only ever sees this URL, never a token. */
export const startOAuthConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => providerInput.parse(data))
  .handler(async ({ context, data }): Promise<{ url: string }> => {
    await assertAdmin(context);
    const { isProviderId } = await import("./oauth/providers");
    if (!isProviderId(data.provider)) throw new Error("Fournisseur inconnu.");
    const { buildAuthorizeUrl } = await import("./oauth/oauth.server");
    const requestOrigin = new URL(getRequest().url).origin;
    const canonicalOrigin = process.env.PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim() || requestOrigin;
    const origin = canonicalOrigin.replace(/\/$/, "");
    return { url: buildAuthorizeUrl(data.provider, origin, context.userId) };
  });

export const disconnectOAuthConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => providerInput.parse(data))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { isProviderId } = await import("./oauth/providers");
    if (!isProviderId(data.provider)) throw new Error("Fournisseur inconnu.");
    const { deleteConnection } = await import("./oauth/oauth.server");
    await deleteConnection(context.userId, data.provider);
    return { ok: true };
  });
