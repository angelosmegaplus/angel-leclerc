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