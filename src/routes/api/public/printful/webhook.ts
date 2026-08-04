import { createFileRoute } from "@tanstack/react-router";
import { appendEvent, PRINTFUL_STATUS_LABEL, internalStatusFromPrintful } from "@/lib/shop-orders.server";

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/printful/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["PRINTFUL_WEBHOOK_TOKEN"];
        const token = new URL(request.url).searchParams.get("token") ?? "";
        if (!expected || !timingSafeEqual(token, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }

        let payload: any;
        try {
          payload = await request.json();
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const type = String(payload?.type ?? "");

        // Catalogue automatique : tout produit publié, modifié ou supprimé
        // chez Printful déclenche une resynchronisation immédiate.
        if (
          type === "product_synced" ||
          type === "product_updated" ||
          type === "product_deleted" ||
          type === "stock_updated"
        ) {
          const { syncPrintfulCatalogToDb } = await import("@/lib/shop-catalog.server");
          const report = await syncPrintfulCatalogToDb({});
          return Response.json({ received: true, catalog: report });
        }

        const order = payload?.data?.order ?? payload?.data?.shipment?.order ?? null;
        const shipment = payload?.data?.shipment ?? null;
        const printfulId = order?.id ? String(order.id) : null;
        const externalId = order?.external_id ? String(order.external_id) : null;
        if (!printfulId && !externalId) {
          return Response.json({ received: true, ignored: "no order" });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const query = supabaseAdmin
          .from("shop_orders")
          .select(
            "id, events, printful_status, customer_email, customer_name, items, shipping, printful_shipped_at",
          );
        const { data: row } = externalId
          ? await query.eq("id", externalId).maybeSingle()
          : await query.eq("printful_order_id", printfulId as string).maybeSingle();
        if (!row) return Response.json({ received: true, ignored: "unknown order" });

        const now = new Date().toISOString();
        const printfulStatus =
          type === "package_shipped"
            ? "fulfilled"
            : type === "package_returned"
              ? "package_returned"
              : (order?.status ?? (row as any).printful_status ?? "unknown");
        const internal = internalStatusFromPrintful(printfulStatus);

        await supabaseAdmin
          .from("shop_orders")
          .update({
            printful_order_id: printfulId ?? undefined,
            printful_status: printfulStatus,
            printful_updated_at: now,
            ...(internal ? { status: internal } : {}),
            ...(shipment
              ? {
                  carrier: shipment.carrier ?? shipment.service ?? null,
                  tracking_number: shipment.tracking_number ?? null,
                  tracking_url: shipment.tracking_url ?? null,
                  printful_shipped_at: now,
                }
              : {}),
            events: appendEvent((row as any).events, {
              at: now,
              label: PRINTFUL_STATUS_LABEL[type] ?? PRINTFUL_STATUS_LABEL[printfulStatus] ?? type,
              detail: shipment?.tracking_number ?? undefined,
            }),
          })
          .eq("id", (row as any).id);

        // Notification d'expédition : envoyée une seule fois, avec le suivi.
        const alreadyNotified = (row as any).printful_shipped_at != null;
        if (type === "package_shipped" && !alreadyNotified) {
          await notifyShipment(row, shipment);
        }

        return Response.json({ received: true });
      },
    },
  },
});

/** Envoie au client l'e-mail « commande expédiée » avec le numéro de suivi. */
async function notifyShipment(row: any, shipment: any) {
  const email = row.customer_email as string | null;
  if (!email) return;
  try {
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const shippingAddress = row.shipping
      ? [
          row.shipping.line1,
          row.shipping.line2,
          [row.shipping.postal_code, row.shipping.city].filter(Boolean).join(" "),
          row.shipping.country,
        ]
          .filter(Boolean)
          .join("\n")
      : undefined;
    const items = Array.isArray(row.items)
      ? row.items.map((i: any) => ({
          name: String(i.name ?? i.slug ?? "Article"),
          quantity: Number(i.quantity ?? 1),
        }))
      : [];

    await sendTemplateEmail("order-shipped", email, {
      templateData: {
        firstName: (row.customer_name ?? "").toString().split(" ")[0] || undefined,
        orderRef: String(row.id).slice(0, 8).toUpperCase(),
        carrier: shipment?.carrier ?? shipment?.service ?? undefined,
        trackingNumber: shipment?.tracking_number ?? undefined,
        trackingUrl: shipment?.tracking_url ?? undefined,
        items,
        shippingAddress,
      },
      idempotencyKey: `order-shipped-${row.id}-${shipment?.tracking_number ?? "no-tracking"}`,
    });
  } catch (error) {
    // L'e-mail ne doit jamais faire échouer le webhook (Printful réessaierait).
    console.error("Notification d'expédition impossible:", error);
  }
}
