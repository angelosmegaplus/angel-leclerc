import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Accès réservé à l'administrateur.");
}

export type AdminAiHealth = {
  enabled: boolean;
  providerConfigured: boolean;
  healthy: boolean;
  lastReason: string;
  circuitOpen: boolean;
  retryAt: number | null;
  consecutiveFailures: number;
  lastFailureAt: number | null;
  lastSuccessAt: number | null;
  credentialCount: number;
  availableCredentialCount: number;
  probeSource: string | null;
  probeDetail: string | null;
};

export const getAdminAiHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAiHealth> => {
    await assertAdmin(context);
    const { angelAiSupervisorSnapshot, probeOpenAiHealth } = await import("./ai-gateway.server");
    const probe = await probeOpenAiHealth();
    const status = angelAiSupervisorSnapshot();
    const lastFailureAt = status.lastFailureAt ?? null;
    const lastSuccessAt = status.lastSuccessAt ?? null;
    const retryAt = status.circuitOpenUntil
      ? status.circuitOpenUntil
      : !probe.healthy
        ? Date.now() + 45_000
        : null;

    return {
      enabled: status.enabled,
      providerConfigured: status.providerConfigured,
      healthy: status.enabled && status.providerConfigured && probe.healthy,
      lastReason: probe.healthy ? "ok" : status.lastReason === "ok" ? "provider" : status.lastReason,
      circuitOpen: status.circuitOpen,
      retryAt,
      consecutiveFailures: status.consecutiveFailures,
      lastFailureAt,
      lastSuccessAt,
      credentialCount: status.credentialCount,
      availableCredentialCount: status.availableCredentialCount,
      probeSource: probe.source,
      probeDetail: probe.detail,
    };
  });
