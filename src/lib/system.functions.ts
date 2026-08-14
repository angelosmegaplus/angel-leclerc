import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequest } from "@tanstack/react-start/server";
import { requireAngelAuth } from "@/lib/auth/require-angel-auth";
import { assertAdmin } from "@/lib/auth/authorization.server";
import type { IntegrationReadiness, IntegrationStatus, ConnectionState } from "./system.server";

export type { IntegrationReadiness, IntegrationStatus, ConnectionState };

export const integrationReadiness = createServerFn({ method: "GET" })
  .middleware([requireAngelAuth])
  .handler(async ({ context }): Promise<IntegrationReadiness[]> => {
    await assertAdmin(context);
    const { readIntegrations } = await import("./system.server");
    const services = readIntegrations();

    const { listConnections } = await import("./oauth/oauth.server");
    let connections: Awaited<ReturnType<typeof listConnections>> = [];
    try {
      connections = await listConnections(context.userId);
    } catch (error) {
      console.error("[integrations] lecture des connexions impossible", error);
    }

    return services.map((service) => {
      if (!service.provider) return service;
      const row = connections.find((c) => c.provider === service.provider);
      const connection: ConnectionState = !row
        ? "not_connected"
        : row.status === "reconnect_required"
          ? "reconnect_required"
          : "connected";
      return {
        ...service,
        connection,
        accountLabel: row?.accountLabel ?? null,
        lastSyncAt: row?.lastSyncAt ?? null,
        scopes: row?.scopes ?? [],
      };
    });
  });

const providerInput = z.object({ provider: z.string().min(1).max(30) });

/** Returns the provider consent URL. The browser only ever sees this URL, never a token. */
export const startOAuthConnection = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((data: unknown) => providerInput.parse(data))
  .handler(async ({ context, data }): Promise<{ url: string }> => {
    await assertAdmin(context);
    const { isProviderId } = await import("./oauth/providers");
    if (!isProviderId(data.provider)) throw new Error("Fournisseur inconnu.");
    const { buildAuthorizeUrl } = await import("./oauth/oauth.server");
    const origin = new URL(getRequest().url).origin;
    return { url: buildAuthorizeUrl(data.provider, origin, context.userId) };
  });

export const disconnectOAuthConnection = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((data: unknown) => providerInput.parse(data))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { isProviderId } = await import("./oauth/providers");
    if (!isProviderId(data.provider)) throw new Error("Fournisseur inconnu.");
    const { deleteConnection } = await import("./oauth/oauth.server");
    await deleteConnection(context.userId, data.provider);
    return { ok: true };
  });
