import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { IntegrationReadiness, IntegrationStatus } from "./system.server";

export type { IntegrationReadiness, IntegrationStatus };

export const integrationReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IntegrationReadiness[]> => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw new Error("Accès réservé à l'administrateur.");
    const { readIntegrations } = await import("./system.server");
    return readIntegrations();
  });
