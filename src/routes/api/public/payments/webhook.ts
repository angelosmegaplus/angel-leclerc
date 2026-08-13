import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, createStripeClient, verifyWebhook } from "@/lib/stripe.server";
import {
  createPrintfulOrder,
  cancelPrintfulOrder,
  findPrintfulOrderByExternalId,
  toPrintfulRecipient,
} from "@/lib/printful.server";
import { appendEvent } from "@/lib/shop-orders.server";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";
import { formatPrice } from "@/lib/shop";

async function fulfillSession(session: any, env: StripeEnv) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const stripe = createStripeClient(env);

  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items"],
  });

  // 5. Vérification du statut réel du paiement auprès de Stripe (pas de confiance
  //    dans le corps de l'événement, et rien n'est produit tant que c'est "unpaid").
  if (full.payment_status === "unpaid") {
    console.log("Session non payée, production différée:", full.id);
    return;
  }

  const lineItems = (full as any).line_items?.data ?? [];

  let requested: Array<{ s: string; q: number }> = [];
  try {
    requested = JSON.parse(full.metadata?.["items"] ?? "[]");
  } catch {
    requested = [];
  }

  const { data: products } = await supabaseAdmin
    .from("shop_products")
    .select("slug, name, printful_variant_id, printful_sync_variant_id, printful_print_file_url")
    .in(
      "slug",
      requested.map((i) => i.s),
    );
  const bySlug = new Map((products ?? []).map((p: any) => [p.slug as string, p]));

  const currency = (full.currency ?? "eur").toUpperCase();
  const items = lineItems.map((li: any) => ({
    name: li.description as string,
    quantity: li.quantity as number,
    amount_cents: li.amount_total as number,
  }));

  const shipping =
    (full as any).collected_information?.shipping_details ?? (full as any).shipping_details ?? null;
  const customerName = full.customer_details?.name ?? shipping?.name ?? null;
  const customerEmail = full.customer_details?.email ?? null;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("shop_orders")
    .upsert(
      {
        stripe_session_id: full.id,
        stripe_payment_intent: typeof full.payment_intent === "string" ? full.payment_intent : null,
        environment: env,
        customer_email: customerEmail,
        customer_name: customerName,
        amount_cents: full.amount_total ?? 0,
        currency,
        items,
        shipping,
        status: "paid",
      },
      { onConflict: "stripe_session_id" },
    )
    .select("id, printful_order_id, printful_status")
    .single();

  if (orderError) {
    console.error("Order upsert failed:", orderError.message);
    return;
  }

  // 6. Idempotence : une commande déjà transmise (ou en cours de transmission)
  //    n'est jamais renvoyée à Printful, même si Stripe rejoue le webhook.
  if ((order as any).printful_order_id) {
    console.log("Printful order already exists for", full.id);
    return;
  }
  const { data: claim } = await supabaseAdmin
    .from("shop_orders")
    .update({ printful_status: "submitting" })
    .eq("id", order.id)
    .is("printful_order_id", null)
    .neq("printful_status", "submitting")
    .select("id")
    .maybeSingle();
  if (!claim) {
    console.log("Printful submission already in progress for", full.id);
    return;
  }

  // --- Envoi automatique vers Printful ---
  const recipient = toPrintfulRecipient({
    name: customerName,
    email: customerEmail,
    address: shipping?.address ?? full.customer_details?.address ?? null,
  });
  const printfulItems = requested
    .map((i) => {
      const product = bySlug.get(i.s);
      if (!product) return null;
      // Produit synchronisé Printful : le visuel est déjà attaché côté Printful.
      const syncVariantId = product.printful_sync_variant_id as number | null;
      if (syncVariantId) {
        return {
          sync_variant_id: syncVariantId,
          quantity: i.q,
          name: product.name as string,
        };
      }
      // Sinon : variante catalogue + fichier d'impression (exigé par Printful).
      const variantId = product.printful_variant_id as number | null;
      const fileUrl = product.printful_print_file_url as string | null;
      if (!variantId || !fileUrl) return null;
      return {
        variant_id: variantId,
        quantity: i.q,
        name: product.name as string,
        files: [{ url: fileUrl }],
      };
    })
    .filter(Boolean) as Array<{
    variant_id?: number;
    sync_variant_id?: number;
    quantity: number;
    name: string;
    files?: Array<{ url: string }>;
  }>;

  const events = appendEvent([], {
    at: new Date().toISOString(),
    label: "Paiement confirmé",
    detail: formatPrice(full.amount_total ?? 0, currency),
  });

  if (recipient.ok && printfulItems.length > 0) {
    // En sandbox, la commande est créée en brouillon (confirm=0) : aucune
    // fabrication ni facturation Printful pendant les tests.
    let result = await createPrintfulOrder({
      externalId: order.id as string,
      recipient: recipient.recipient,
      items: printfulItems,
      confirm: env === "live",
    });
    if (!result.ok) {
      // Filet de sécurité : si Printful a déjà cette commande (external_id
      // dupliqué suite à un rejeu), on la récupère au lieu d'en créer une autre.
      const existing = await findPrintfulOrderByExternalId(order.id as string);
      if (existing.ok && existing.id) result = existing;
    }

    await supabaseAdmin
      .from("shop_orders")
      .update(
        result.ok
          ? {
              printful_order_id: result.id,
              printful_status: result.status,
              printful_updated_at: new Date().toISOString(),
              status: env === "live" ? "in_production" : "paid",
              error_message: null,
              events: appendEvent(events, {
                at: new Date().toISOString(),
                label:
                  env === "live"
                    ? "Commande envoyée en production"
                    : "Commande créée en brouillon (test)",
                detail: `Printful #${result.id}`,
              }),
            }
          : {
              printful_status: "failed",
              printful_updated_at: new Date().toISOString(),
              error_message: result.error,
              events: appendEvent(events, {
                at: new Date().toISOString(),
                label: "Échec de l'envoi Printful",
                detail: result.error,
              }),
            },
      )
      .eq("id", order.id);
  } else {
    const reason = !recipient.ok
      ? recipient.error
      : "Aucun article prêt pour Printful (variante ou fichier d'impression manquant)";
    await supabaseAdmin
      .from("shop_orders")
      .update({
        printful_status: "skipped",
        printful_updated_at: new Date().toISOString(),
        error_message: reason,
        events: appendEvent(events, {
          at: new Date().toISOString(),
          label: "Production non déclenchée",
          detail: reason,
        }),
      })
      .eq("id", order.id);
  }

  // --- E-mail de confirmation client ---
  if (customerEmail) {
    try {
      await sendTemplateEmail("order-confirmation", customerEmail, {
        idempotencyKey: `order-confirmation-${full.id}`,
        templateData: {
          firstName: customerName?.split(" ")[0] ?? undefined,
          orderRef: (order.id as string).slice(0, 8).toUpperCase(),
          total: formatPrice(full.amount_total ?? 0, currency),
          items: items.map((i: any) => ({
            name: i.name,
            quantity: i.quantity,
            price: formatPrice(i.amount_cents, currency),
          })),
          shippingAddress: recipient.ok
            ? [
                recipient.recipient.address1,
                recipient.recipient.address2,
                `${recipient.recipient.zip} ${recipient.recipient.city}`.trim(),
                recipient.recipient.country_code,
              ]
                .filter(Boolean)
                .join("\n")
            : undefined,
        },
      });
    } catch (error) {
      console.error("Order confirmation email failed:", error);
    }
  }
}

async function handleRefund(charge: any, env: StripeEnv) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const paymentIntent = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
  if (!paymentIntent) return;

  const { data: order } = await supabaseAdmin
    .from("shop_orders")
    .select("id, amount_cents, currency, printful_order_id, printful_status, events")
    .eq("stripe_payment_intent", paymentIntent)
    .eq("environment", env)
    .maybeSingle();
  if (!order) return;

  const refunded = (charge.amount_refunded as number) ?? 0;
  const partial = refunded > 0 && refunded < ((charge.amount as number) ?? 0);
  const now = new Date().toISOString();

  let events = appendEvent((order as any).events, {
    at: now,
    label: partial ? "Remboursement partiel" : "Remboursement total",
    detail: formatPrice(refunded, ((order as any).currency as string) || "EUR"),
  });

  // Annulation Printful si la commande n'est pas encore expédiée.
  let printfulPatch: Record<string, unknown> = {};
  const printfulId = (order as any).printful_order_id as string | null;
  const printfulStatus = (order as any).printful_status as string | null;
  if (!partial && printfulId && printfulStatus !== "fulfilled") {
    const cancel = await cancelPrintfulOrder(printfulId);
    printfulPatch = cancel.ok
      ? { printful_status: "canceled", printful_updated_at: now }
      : { error_message: cancel.error };
    events = appendEvent(events, {
      at: now,
      label: cancel.ok ? "Production annulée chez Printful" : "Annulation Printful impossible",
      detail: cancel.ok ? undefined : cancel.error,
    });
  }

  await supabaseAdmin
    .from("shop_orders")
    .update({
      refunded_amount_cents: refunded,
      refunded_at: now,
      status: partial ? "partially_refunded" : "refunded",
      events,
      ...printfulPatch,
    })
    .eq("id", (order as any).id);
}

async function handleCanceledIntent(intent: any, env: StripeEnv) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin
    .from("shop_orders")
    .select("id, events")
    .eq("stripe_payment_intent", intent.id)
    .eq("environment", env)
    .maybeSingle();
  if (!order) return;
  const now = new Date().toISOString();
  await supabaseAdmin
    .from("shop_orders")
    .update({
      status: "canceled",
      events: appendEvent((order as any).events, { at: now, label: "Paiement annulé" }),
    })
    .eq("id", (order as any).id);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook received with invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(request, env);
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object;
              if (session.payment_status !== "unpaid") {
                await fulfillSession(session, env);
              }
              break;
            }
            case "checkout.session.async_payment_succeeded":
              await fulfillSession(event.data.object, env);
              break;
            case "charge.refunded":
              await handleRefund(event.data.object, env);
              break;
            case "payment_intent.canceled":
              await handleCanceledIntent(event.data.object, env);
              break;
            default:
              console.log("Unhandled event:", event.type);
          }
          return Response.json({ received: true });
        } catch (error) {
          console.error("Webhook error:", error);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
