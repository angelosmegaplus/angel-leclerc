/** Synchronisation périodique des commandes Printful — serveur uniquement. */
import { getPrintfulOrder } from "@/lib/printful.server";
import { appendEvent, orderPatchFromPrintful, PRINTFUL_STATUS_LABEL } from "@/lib/shop-orders.server";

/** Statuts Printful terminaux : plus rien à rafraîchir. */
const TERMINAL = new Set(["fulfilled", "canceled", "failed", "package_returned"]);

export async function syncOpenPrintfulOrders(): Promise<{
  checked: number;
  updated: number;
  error?: string;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("shop_orders")
    .select("id, printful_order_id, printful_status, events")
    .not("printful_order_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) return { checked: 0, updated: 0, error: error.message };

  const open = (data ?? []).filter(
    (o: any) => !TERMINAL.has(String(o.printful_status ?? "")),
  );

  let updated = 0;
  for (const order of open) {
    const state = await getPrintfulOrder((order as any).printful_order_id as string);
    if (!state.ok) continue;
    if (state.order.status === (order as any).printful_status) continue;

    await supabaseAdmin
      .from("shop_orders")
      .update({
        ...orderPatchFromPrintful(state.order),
        events: appendEvent((order as any).events, {
          at: new Date().toISOString(),
          label: PRINTFUL_STATUS_LABEL[state.order.status] ?? state.order.status,
        }),
      })
      .eq("id", (order as any).id);
    updated += 1;
  }

  return { checked: open.length, updated };
}
