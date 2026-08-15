import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PushConfig, SyncReport } from "./notifications.server";

export type { PushConfig, SyncReport };

export type PushStatus = PushConfig & { subscriptions: number };

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Accès réservé à l'administrateur.");
}

export const pushStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PushStatus> => {
    await assertAdmin(context);
    const { readPushConfig } = await import("./notifications.server");
    const { count } = await context.supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId);
    return { ...readPushConfig(), subscriptions: count ?? 0 };
  });

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { endpoint: string; p256dh: string; auth: string; userAgent?: string }) => {
    if (!input?.endpoint?.startsWith("https://")) throw new Error("Abonnement push invalide.");
    if (!input.p256dh || !input.auth) throw new Error("Clés d'abonnement manquantes.");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("push_subscriptions").upsert(
      {
        user_id: context.userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.userAgent?.slice(0, 300) ?? null,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
    if (error) throw error;
    return { ok: true };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { endpoint: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", context.userId)
      .eq("endpoint", data.endpoint);
    if (error) throw error;
    return { ok: true };
  });

export const refreshNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SyncReport> => {
    await assertAdmin(context);
    const { syncNotifications } = await import("./notifications.server");
    return syncNotifications(context.supabase);
  });
