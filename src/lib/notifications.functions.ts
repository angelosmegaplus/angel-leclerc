import { createServerFn } from "@tanstack/react-start";
import { requireAngelAuth } from "@/lib/auth/require-angel-auth";
import { assertAngelAdmin } from "@/lib/auth/require-admin";
import { AngelOSAdapterRegistry } from "../../angel-os/core/adapter-registry";
import { angelDataServerAdapter, type AngelDataClient } from "../../angel-os/adapters/data.server";
import type { PushConfig, SyncReport } from "./notifications.server";

export type { PushConfig, SyncReport };
export type PushStatus = PushConfig & { subscriptions: number };

const adapters = new AngelOSAdapterRegistry();
adapters.register(angelDataServerAdapter);

async function nativeData() {
  if (!process.env.ANGEL_DATA_TOKEN) return null;
  try { return await adapters.connect<AngelDataClient>('angel.data.native'); } catch { return null; }
}

function subscriptionKey(endpoint: string) {
  return encodeURIComponent(endpoint).slice(0, 180);
}

export const pushStatus = createServerFn({ method: "GET" })
  .middleware([requireAngelAuth])
  .handler(async ({ context }): Promise<PushStatus> => {
    await assertAngelAdmin(context);
    const { readPushConfig } = await import("./notifications.server");
    const data = await nativeData();
    if (data) {
      const items = await data.list(`push.subscriptions.${context.userId}`);
      return { ...readPushConfig(), subscriptions: items.length };
    }
    const { count } = await context.supabase.from("push_subscriptions").select("id", { count: "exact", head: true }).eq("user_id", context.userId);
    return { ...readPushConfig(), subscriptions: count ?? 0 };
  });

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: { endpoint: string; p256dh: string; auth: string; userAgent?: string }) => {
    if (!input?.endpoint?.startsWith("https://")) throw new Error("Abonnement push invalide.");
    if (!input.p256dh || !input.auth) throw new Error("Clés d'abonnement manquantes.");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAngelAdmin(context);
    const store = await nativeData();
    if (store) {
      await store.set(`push.subscriptions.${context.userId}`, subscriptionKey(data.endpoint), { ...data, userAgent: data.userAgent?.slice(0, 300) ?? null, updatedAt: new Date().toISOString() });
      return { ok: true };
    }
    const { error } = await context.supabase.from("push_subscriptions").upsert(
      { user_id: context.userId, endpoint: data.endpoint, p256dh: data.p256dh, auth: data.auth, user_agent: data.userAgent?.slice(0,300) ?? null, last_used_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: "endpoint" },
    );
    if (error) throw error;
    return { ok: true };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: { endpoint: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAngelAdmin(context);
    const store = await nativeData();
    if (store) {
      await store.delete(`push.subscriptions.${context.userId}`, subscriptionKey(data.endpoint));
      return { ok: true };
    }
    const { error } = await context.supabase.from("push_subscriptions").delete().eq("user_id", context.userId).eq("endpoint", data.endpoint);
    if (error) throw error;
    return { ok: true };
  });

export const refreshNotifications = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .handler(async ({ context }): Promise<SyncReport> => {
    await assertAngelAdmin(context);
    const { syncNotifications } = await import("./notifications.server");
    if (!context.supabase) return { created: 0, kinds: [] };
    return syncNotifications(context.supabase);
  });
