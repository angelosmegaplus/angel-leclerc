import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";
import type { ShopProduct } from "@/lib/shop";
import { SHIPPING_CENTS } from "@/lib/shop";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: any, init: any) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  image_url: string | null;
  images: unknown;
};

function toProduct(row: ProductRow): ShopProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    priceCents: row.price_cents,
    currency: row.currency || "EUR",
    imageUrl: row.image_url,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
  };
}

export const listShopProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ShopProduct[]> => {
    const { data, error } = await publicClient()
      .from("shop_products")
      .select("id, slug, name, description, price_cents, currency, image_url, images")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("listShopProducts:", error.message);
      return [];
    }
    return ((data ?? []) as ProductRow[]).map(toProduct);
  },
);

export const getShopProduct = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => {
    if (!/^[a-z0-9-]{1,80}$/.test(data.slug)) throw new Error("Référence invalide");
    return data;
  })
  .handler(async ({ data }): Promise<ShopProduct | null> => {
    const { data: row, error } = await publicClient()
      .from("shop_products")
      .select("id, slug, name, description, price_cents, currency, image_url, images")
      .eq("slug", data.slug)
      .eq("active", true)
      .maybeSingle();
    if (error || !row) return null;
    return toProduct(row as ProductRow);
  });

type CheckoutResult = { clientSecret: string } | { error: string };

export const createShopCheckout = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      items: Array<{ slug: string; quantity: number }>;
      returnUrl: string;
      environment: StripeEnv;
    }) => {
      if (!Array.isArray(data.items) || data.items.length === 0) {
        throw new Error("Panier vide");
      }
      if (data.items.length > 20) throw new Error("Trop d'articles");
      for (const item of data.items) {
        if (!/^[a-z0-9-]{1,80}$/.test(item.slug)) throw new Error("Référence invalide");
        if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
          throw new Error("Quantité invalide");
        }
      }
      if (!/^https?:\/\//.test(data.returnUrl)) throw new Error("URL de retour invalide");
      return data;
    },
  )
  .handler(async ({ data }): Promise<CheckoutResult> => {
    try {
      const { data: rows, error } = await publicClient()
        .from("shop_products")
        .select("slug, name, description, price_cents, currency, image_url")
        .in(
          "slug",
          data.items.map((i) => i.slug),
        )
        .eq("active", true);
      if (error) return { error: "Catalogue indisponible" };

      const bySlug = new Map((rows ?? []).map((r: any) => [r.slug as string, r]));
      const lineItems = data.items.map((item) => {
        const product = bySlug.get(item.slug);
        if (!product) throw new Error(`Produit indisponible : ${item.slug}`);
        return {
          price_data: {
            currency: (product.currency || "EUR").toLowerCase(),
            product_data: {
              name: product.name as string,
              ...(product.image_url ? { images: [product.image_url as string] } : {}),
            },
            unit_amount: product.price_cents as number,
          },
          quantity: item.quantity,
        };
      });

      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        line_items: lineItems,
        payment_intent_data: { description: "Commande boutique ALC!" },
        shipping_address_collection: {
          allowed_countries: ["FR", "BE", "LU", "CH", "DE", "ES", "IT", "NL", "PT"],
        },
        phone_number_collection: { enabled: false },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              display_name: "Livraison standard",
              fixed_amount: { amount: SHIPPING_CENTS, currency: "eur" },
              delivery_estimate: {
                minimum: { unit: "business_day", value: 5 },
                maximum: { unit: "business_day", value: 10 },
              },
            },
          },
        ],
        metadata: {
          source: "boutique-alc",
          items: JSON.stringify(
            data.items.map((i) => ({ s: i.slug, q: i.quantity })),
          ).slice(0, 480),
        },
      } as any);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const getCheckoutStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { sessionId: string; environment: StripeEnv }) => {
    if (!/^cs_[A-Za-z0-9_]+$/.test(data.sessionId)) throw new Error("Session invalide");
    return data;
  })
  .handler(
    async ({
      data,
    }): Promise<
      | { status: string; paymentStatus: string; email: string | null; amountCents: number }
      | { error: string }
    > => {
      try {
        const stripe = createStripeClient(data.environment);
        const session = await stripe.checkout.sessions.retrieve(data.sessionId);
        return {
          status: session.status ?? "open",
          paymentStatus: session.payment_status ?? "unpaid",
          email: session.customer_details?.email ?? null,
          amountCents: session.amount_total ?? 0,
        };
      } catch (error) {
        return { error: getStripeErrorMessage(error) };
      }
    },
  );

export const listShopOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("shop_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
async function assertAdmin(context: any) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Accès refusé");
}

/** Rembourse (totalement ou partiellement) une commande et annule la production. */
export const refundShopOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string; amountCents?: number }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.orderId)) throw new Error("Commande invalide");
    if (
      data.amountCents !== undefined &&
      (!Number.isInteger(data.amountCents) || data.amountCents < 1)
    ) {
      throw new Error("Montant invalide");
    }
    return data;
  })
  .handler(async ({ data, context }): Promise<{ ok: true } | { error: string }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { cancelPrintfulOrder } = await import("@/lib/printful.server");
    const { appendEvent } = await import("@/lib/shop-orders.server");

    const { data: order } = await supabaseAdmin
      .from("shop_orders")
      .select(
        "id, stripe_payment_intent, environment, amount_cents, refunded_amount_cents, printful_order_id, printful_status, events",
      )
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order) return { error: "Commande introuvable" };
    const paymentIntent = (order as any).stripe_payment_intent as string | null;
    if (!paymentIntent) return { error: "Paiement introuvable pour cette commande" };

    try {
      const stripe = createStripeClient((order as any).environment as StripeEnv);
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntent,
        ...(data.amountCents ? { amount: data.amountCents } : {}),
      });

      const now = new Date().toISOString();
      const total =
        ((order as any).refunded_amount_cents ?? 0) + (refund.amount ?? 0);
      const partial = total < ((order as any).amount_cents ?? 0);

      let events = appendEvent((order as any).events, {
        at: now,
        label: partial ? "Remboursement partiel (admin)" : "Remboursement total (admin)",
      });

      let printfulPatch: Record<string, unknown> = {};
      const printfulId = (order as any).printful_order_id as string | null;
      if (!partial && printfulId && (order as any).printful_status !== "fulfilled") {
        const cancel = await cancelPrintfulOrder(printfulId);
        printfulPatch = cancel.ok
          ? { printful_status: "canceled", printful_updated_at: now }
          : { error_message: cancel.error };
        events = appendEvent(events, {
          at: now,
          label: cancel.ok
            ? "Production annulée chez Printful"
            : "Annulation Printful impossible",
          detail: cancel.ok ? undefined : cancel.error,
        });
      }

      await supabaseAdmin
        .from("shop_orders")
        .update({
          refunded_amount_cents: total,
          refunded_at: now,
          status: partial ? "partially_refunded" : "refunded",
          events,
          ...printfulPatch,
        })
        .eq("id", (order as any).id);

      return { ok: true };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/** Rafraîchit le statut Printful d'une commande à la demande. */
export const syncPrintfulOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.orderId)) throw new Error("Commande invalide");
    return data;
  })
  .handler(async ({ data, context }): Promise<{ ok: true } | { error: string }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getPrintfulOrder } = await import("@/lib/printful.server");
    const { appendEvent, orderPatchFromPrintful, PRINTFUL_STATUS_LABEL } = await import(
      "@/lib/shop-orders.server"
    );

    const { data: order } = await supabaseAdmin
      .from("shop_orders")
      .select("id, printful_order_id, printful_status, events")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order) return { error: "Commande introuvable" };
    const printfulId = (order as any).printful_order_id as string | null;
    if (!printfulId) return { error: "Aucune commande Printful associée" };

    const state = await getPrintfulOrder(printfulId);
    if (!state.ok) return { error: state.error };

    const patch = orderPatchFromPrintful(state.order);
    const changed = state.order.status !== (order as any).printful_status;
    await supabaseAdmin
      .from("shop_orders")
      .update({
        ...patch,
        ...(changed
          ? {
              events: appendEvent((order as any).events, {
                at: new Date().toISOString(),
                label:
                  PRINTFUL_STATUS_LABEL[state.order.status] ?? state.order.status,
              }),
            }
          : {}),
      })
      .eq("id", (order as any).id);

    return { ok: true };
  });

/** Enregistre l'URL de webhook Printful pour la mise à jour automatique. */
export const configurePrintfulWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { baseUrl: string }) => {
    if (!/^https:\/\/[a-z0-9.-]+$/i.test(data.baseUrl)) throw new Error("URL invalide");
    return data;
  })
  .handler(async ({ data, context }): Promise<{ ok: true } | { error: string }> => {
    await assertAdmin(context);
    const token = process.env["PRINTFUL_WEBHOOK_TOKEN"];
    if (!token) return { error: "PRINTFUL_WEBHOOK_TOKEN manquant" };
    const { setPrintfulWebhook } = await import("@/lib/printful.server");
    const result = await setPrintfulWebhook(
      `${data.baseUrl}/api/public/printful/webhook?token=${encodeURIComponent(token)}`,
    );
    return result.ok ? { ok: true } : { error: result.error };
  });
