import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: { from: (t: string) => any }; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Accès réservé à l'administrateur.");
}

export const getMaintenanceIssues = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { angelApplicationRuntime, getAngelMaintenanceSnapshot } = await import("./angel-runtime.server");
    await Promise.all(
      angelApplicationRuntime.list().map(async (app) => {
        await angelApplicationRuntime.checkHealth(app.id);
      }),
    );
    return getAngelMaintenanceSnapshot();
  });

export const getMaintenanceIssueReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { getAngelMaintenanceMarkdown } = await import("./angel-runtime.server");
    return { markdown: await getAngelMaintenanceMarkdown() };
  });
