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
};

export const getAdminAiHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAiHealth> => {
    await assertAdmin(context);
    const { angelAiSupervisorSnapshot } = await import("./ai-gateway.server");
    const status = angelAiSupervisorSnapshot();
    return {
      enabled: status.enabled,
      providerConfigured: status.providerConfigured,
      healthy: status.healthy,
      lastReason: status.lastReason,
    };
  });
