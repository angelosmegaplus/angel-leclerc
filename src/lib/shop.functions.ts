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
  printful_sync_variant_id?: number | null;
  printful_variant_id?: number | null;
  printful_print_file_url?: string | null;
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

const PRODUCT_COLUMNS =
  "id, slug, name, description, price_cents, currency, image_url, images, printful_sync_variant_id, printful_variant_id, printful_print_file_url";

/**
 * Un produit n'est visible publiquement que s'il est réellement fabricable :
 * prix de vente, image, variante Printful et fichier d'impression.
 */
function isSellable(row: ProductRow): boolean {
  const hasVariant = Boolean(row.printful_sync_variant_id || row.printful_variant_id);
  const hasPrintFile = Boolean(row.printful_sync_variant_id || row.printful_print_file_url);
  return row.price_cents > 0 && Boolean(row.image_url) && hasVariant && hasPrintFile;
}

export const listShopProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ShopProduct[]> => {
    const { data, error } = await publicClient()
      .from("shop_products")
      .select(PRODUCT_COLUMNS)
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("listShopProducts:", error.message);
      return [];
    }
    return ((data ?? []) as ProductRow[]).filter(isSellable).map(toProduct);
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
      .select(PRODUCT_COLUMNS)
      .eq("slug", data.slug)
      .eq("active", true)
      .maybeSingle();
    if (error || !row) return null;
    if (!isSellable(row as ProductRow)) return null;
    return toProduct(row as ProductRow);
  });

type CheckoutResult = { clientSecret: string } | { error: string };

const ALLOWED_COUNTRIES = [
  "FR", "BE", "LU", "CH", "DE", "ES", "IT", "NL", "PT", "AT", "IE", "DK", "SE", "FI", "PL",
] as const;

export interface ShippingQuote {
  id: string;
  name: string;
  amountCents: number;
  currency: string;
  minDays: number | null;
  maxDays: number | null;
}

type Destination = { country: string; postalCode: string; city?: string; state?: string };

function validateDestination(d: Destination): Destination {
  const country = (d.country ?? "").toUpperCase();
  if (!(ALLOWED_COUNTRIES as readonly string[]).includes(country)) {
    throw new Error("Pays de livraison non desservi");
  }
  const postalCode = (d.postalCode ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]{1,11}$/.test(postalCode)) {
    throw new Error("Code postal invalide");
  }
  return {
    country,
    postalCode,
    city: (d.city ?? "").trim().slice(0, 80),
    state: (d.state ?? "").trim().slice(0, 10).toUpperCase(),
  };
}

/**
 * Frais de port réels renvoyés par Printful pour la destination saisie.
 * Repli sur un tarif forfaitaire si Printful est indisponible.
 */
export const estimateShippingRates = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      items: Array<{ slug: string; quantity: number }>;
      destination: Destination;
    }) => {
      if (!Array.isArray(data.items) || data.items.length === 0) throw new Error("Panier vide");
      for (const item of data.items) {
        if (!/^[a-z0-9-]{1,80}$/.test(item.slug)) throw new Error("Référence invalide");
        if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
          throw new Error("Quantité invalide");
        }
      }
      return { items: data.items, destination: validateDestination(data.destination) };
    },
  )
  .handler(async ({ data }): Promise<{ rates: ShippingQuote[]; estimated: boolean }> => {
    const { quoteShipping } = await import("@/lib/shop-shipping.server");
    return quoteShipping(data.items, data.destination);
  });

export const createShopCheckout = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      items: Array<{ slug: string; quantity: number }>;
      returnUrl: string;
      environment: StripeEnv;
      destination: Destination;
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
      return { ...data, destination: validateDestination(data.destination) };
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
            // Prix affichés TTC : la TVA calculée par Stripe est incluse dedans.
            tax_behavior: "inclusive",
          },
          quantity: item.quantity,
        };
      });

      // Frais de port réels Printful pour la destination saisie par le client.
      const { quoteShipping } = await import("@/lib/shop-shipping.server");
      const shipping = await quoteShipping(data.items, data.destination);
      const shippingOptions = shipping.rates.slice(0, 5).map((rate) => ({
        shipping_rate_data: {
          type: "fixed_amount" as const,
          display_name: rate.name,
          fixed_amount: {
            amount: rate.amountCents,
            currency: (rate.currency || "EUR").toLowerCase(),
          },
          tax_behavior: "inclusive" as const,
          ...(rate.minDays && rate.maxDays
            ? {
                delivery_estimate: {
                  minimum: { unit: "business_day" as const, value: rate.minDays },
                  maximum: { unit: "business_day" as const, value: rate.maxDays },
                },
              }
            : {}),
        },
      }));

      const stripe = createStripeClient(data.environment);
      const params: any = {
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        line_items: lineItems,
        payment_intent_data: { description: "Commande boutique ALC!" },
        shipping_address_collection: {
          allowed_countries: [data.destination.country],
        },
        phone_number_collection: { enabled: false },
        shipping_options: shippingOptions,
        // TVA calculée automatiquement par Stripe selon la destination.
        automatic_tax: { enabled: true },
        metadata: {
          source: "boutique-alc",
          destination: `${data.destination.country} ${data.destination.postalCode}`,
          shipping_source: shipping.estimated ? "forfait" : "printful",
          items: JSON.stringify(
            data.items.map((i) => ({ s: i.slug, q: i.quantity })),
          ).slice(0, 480),
        },
      };

      let session;
      try {
        session = await stripe.checkout.sessions.create(params);
      } catch (taxError) {
        // Stripe Tax pas encore activé sur le compte : on n'empêche pas la vente.
        const message = getStripeErrorMessage(taxError);
        if (!/tax/i.test(message)) throw taxError;
        console.error("Stripe Tax indisponible, repli sans calcul de TVA:", message);
        delete params.automatic_tax;
        for (const line of params.line_items) delete line.price_data.tax_behavior;
        for (const option of params.shipping_options) {
          delete option.shipping_rate_data.tax_behavior;
        }
        session = await stripe.checkout.sessions.create(params);
      }

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export interface PublicOrderTracking {
  createdAt: string;
  status: string;
  printfulStatus: string | null;
  shippedAt: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrier: string | null;
  amountCents: number;
  currency: string;
  items: Array<{ name: string; quantity: number }>;
  events: Array<{ at: string; label: string }>;
}

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

export interface PrintfulDiagnostics {
  tokenConfigured: boolean;
  storeId: string | null;
  storeName: string | null;
  stores: Array<{ id: number; name: string; type: string }>;
  webhookUrl: string | null;
  webhookTypes: string[];
  variants: Array<{ slug: string; name: string; variantId: number | null; valid: boolean; detail: string }>;
  errors: string[];
}

/** Diagnostic complet de la chaîne Stripe → backend → Printful. */
export const checkPrintfulSetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PrintfulDiagnostics> => {
    await assertAdmin(context);
    const { listPrintfulStores, checkPrintfulVariant, getPrintfulWebhook } = await import(
      "@/lib/printful.server"
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const errors: string[] = [];
    const tokenConfigured = Boolean(process.env["PRINTFUL_API_KEY"]);
    const storeId = process.env["PRINTFUL_STORE_ID"] ?? null;

    let stores: Array<{ id: number; name: string; type: string }> = [];
    if (tokenConfigured) {
      const list = await listPrintfulStores();
      if (list.ok) stores = list.stores;
      else errors.push(list.error);
    } else {
      errors.push("Jeton API Printful absent");
    }
    const storeName =
      stores.find((s) => String(s.id) === storeId)?.name ?? (storeId ? null : null);
    if (storeId && stores.length > 0 && !storeName) {
      errors.push(`La boutique ${storeId} n'est pas accessible avec ce jeton`);
    }

    let webhookUrl: string | null = null;
    let webhookTypes: string[] = [];
    if (tokenConfigured) {
      const hook = await getPrintfulWebhook();
      if (hook.ok) {
        webhookUrl = hook.url;
        webhookTypes = hook.types;
      } else errors.push(hook.error);
    }

    const { data: rows } = await supabaseAdmin
      .from("shop_products")
      .select(
        "slug, name, printful_variant_id, printful_sync_variant_id, printful_print_file_url, active",
      )
      .eq("active", true);

    const variants: PrintfulDiagnostics["variants"] = [];
    for (const row of (rows ?? []) as any[]) {
      const variantId = (row.printful_variant_id as number | null) ?? null;
      const syncVariantId = (row.printful_sync_variant_id as number | null) ?? null;
      const fileUrl = (row.printful_print_file_url as string | null) ?? null;
      if (syncVariantId) {
        variants.push({
          slug: row.slug,
          name: row.name,
          variantId: syncVariantId,
          valid: true,
          detail: "Produit synchronisé Printful (visuel géré par Printful)",
        });
        continue;
      }
      if (!variantId) {
        variants.push({
          slug: row.slug,
          name: row.name,
          variantId: null,
          valid: false,
          detail: "Aucune variante Printful renseignée",
        });
        continue;
      }
      const check = tokenConfigured
        ? await checkPrintfulVariant(variantId)
        : ({ ok: false, error: "Jeton absent" } as const);
      if (check.ok && !fileUrl) {
        variants.push({
          slug: row.slug,
          name: row.name,
          variantId,
          valid: false,
          detail: `${check.name} — fichier d'impression manquant`,
        });
        continue;
      }
      variants.push({
        slug: row.slug,
        name: row.name,
        variantId,
        valid: check.ok,
        detail: check.ok ? check.name : check.error,
      });
    }

    return {
      tokenConfigured,
      storeId,
      storeName,
      stores,
      webhookUrl,
      webhookTypes,
      variants,
      errors,
    };
  });

/**
 * Suivi public d'une commande : accessible via l'identifiant de session Stripe
 * (non devinable) transmis au client après paiement.
 */
export const trackShopOrder = createServerFn({ method: "POST" })
  .inputValidator((data: { sessionId: string }) => {
    if (!/^cs_[A-Za-z0-9_]+$/.test(data.sessionId)) throw new Error("Référence invalide");
    return data;
  })
  .handler(async ({ data }): Promise<PublicOrderTracking | { error: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("shop_orders")
      .select(
        "created_at, status, printful_status, printful_shipped_at, tracking_number, tracking_url, carrier, items, amount_cents, currency, events",
      )
      .eq("stripe_session_id", data.sessionId)
      .maybeSingle();
    if (!order) return { error: "Commande introuvable" };

    const row = order as any;
    return {
      createdAt: row.created_at,
      status: row.status,
      printfulStatus: row.printful_status ?? null,
      shippedAt: row.printful_shipped_at ?? null,
      trackingNumber: row.tracking_number ?? null,
      trackingUrl: row.tracking_url ?? null,
      carrier: row.carrier ?? null,
      amountCents: row.amount_cents ?? 0,
      currency: row.currency ?? "EUR",
      items: Array.isArray(row.items)
        ? row.items.map((i: any) => ({
            name: String(i.name ?? i.slug ?? "Article"),
            quantity: Number(i.quantity ?? 1),
          }))
        : [],
      events: Array.isArray(row.events)
        ? row.events
            .filter((e: any) => e && typeof e.at === "string")
            .map((e: any) => ({ at: e.at, label: String(e.label ?? "") }))
        : [],
    };
  });

/**
 * Rafraîchit automatiquement toutes les commandes encore en cours auprès de
 * Printful. Appelée en boucle par l'espace admin, sans action manuelle.
 */
export const syncPendingPrintfulOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({ context }): Promise<{ checked: number; updated: number; error?: string }> => {
      await assertAdmin(context);
      const { syncOpenPrintfulOrders } = await import("@/lib/shop-sync.server");
      return syncOpenPrintfulOrders();
    },
  );

/* ------------------------- Catalogue Printful ------------------------- */

export interface PrintfulCatalogStatus {
  storeId: string | null;
  storeName: string | null;
  storeType: string | null;
  storeAllowed: boolean;
  stores: Array<{ id: number; name: string; type: string }>;
  apiProductCount: number;
  apiVariantCount: number;
  dbProductCount: number;
  lastSyncedAt: string | null;
  errors: string[];
}

/** État du catalogue : boutique utilisée, produits API vs produits en base. */
export const getPrintfulCatalogStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PrintfulCatalogStatus> => {
    await assertAdmin(context);
    const { listPrintfulStores, listPrintfulSyncProducts, isApiStore } =
      await import("@/lib/printful.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const errors: string[] = [];
    const storeId = process.env["PRINTFUL_STORE_ID"] ?? null;
    let stores: Array<{ id: number; name: string; type: string }> = [];
    const storeList = await listPrintfulStores();
    if (storeList.ok) stores = storeList.stores;
    else errors.push(storeList.error);

    const current = stores.find((s) => String(s.id) === storeId) ?? null;
    if (storeId && stores.length > 0 && !current) {
      errors.push(`La boutique ${storeId} n'est pas accessible avec ce jeton`);
    }
    const storeAllowed = current ? isApiStore(current) : false;
    if (current && !storeAllowed) {
      errors.push(
        `La boutique « ${current.name} » (${current.type}) n'est pas une boutique API dédiée : ` +
          "aucune synchronisation ne sera effectuée. Créez une boutique API Printful pour " +
          "angel-leclerc.fr, puis enregistrez son jeton.",
      );
    }

    const sync = storeAllowed ? await listPrintfulSyncProducts() : null;
    if (sync && !sync.ok) errors.push(sync.error);

    const { count } = await supabaseAdmin
      .from("shop_products")
      .select("id", { count: "exact", head: true });

    const { data: last } = await supabaseAdmin
      .from("shop_products")
      .select("printful_synced_at")
      .not("printful_synced_at", "is", null)
      .order("printful_synced_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      storeId,
      storeName: current?.name ?? null,
      storeType: current?.type ?? null,
      storeAllowed,
      stores,
      apiProductCount: sync?.ok ? sync.items.length : 0,
      apiVariantCount: sync?.ok
        ? sync.items.reduce((total, item) => total + item.variants.length, 0)
        : 0,
      dbProductCount: count ?? 0,
      lastSyncedAt: (last as any)?.printful_synced_at ?? null,
      errors,
    };
  });

export interface PrintfulSyncReport {
  source: "sync" | "none";
  created: number;
  updated: number;
  deactivated: number;
  productCount: number;
  variantCount: number;
  webhook: "inchangé" | "enregistré" | "non configuré";
  incomplete: Array<{ name: string; missing: string[] }>;
  syncedAt: string;
  errors: string[];
}

function slugifyName(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70) || "produit"
  );
}

/** Synchronise la boutique Printful vers la table locale (sans doublon). */
export const syncPrintfulCatalog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PrintfulSyncReport> => {
    await assertAdmin(context);
    const { listPrintfulStores, listPrintfulSyncProducts, isApiStore } = await import(
      "@/lib/printful.server"
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const syncedAt = new Date().toISOString();
    const errors: string[] = [];
    const incomplete: PrintfulSyncReport["incomplete"] = [];

    // Garde-fou : jamais de synchronisation depuis une boutique Squarespace,
    // Shopify ou « Personal orders ».
    const storeId = process.env["PRINTFUL_STORE_ID"] ?? null;
    const storeList = await listPrintfulStores();
    if (!storeList.ok) {
      return {
        source: "none", created: 0, updated: 0, deactivated: 0, incomplete,
        syncedAt, errors: [storeList.error],
      };
    }
    const current = storeList.stores.find((s) => String(s.id) === storeId) ?? null;
    if (!current || !isApiStore(current)) {
      return {
        source: "none", created: 0, updated: 0, deactivated: 0, incomplete, syncedAt,
        errors: [
          current
            ? `Synchronisation bloquée : « ${current.name} » (${current.type}) n'est pas une boutique API dédiée.`
            : "Aucune boutique API Printful valide n'est configurée.",
        ],
      };
    }

    const sync = await listPrintfulSyncProducts();
    if (!sync.ok) errors.push(sync.error);
    // Uniquement les produits réellement publiés dans la boutique API.
    const items = sync.ok ? sync.items : [];
    const source: PrintfulSyncReport["source"] = items.length > 0 ? "sync" : "none";

    const { data: existingRows } = await supabaseAdmin
      .from("shop_products")
      .select("id, slug, printful_external_id, price_cents, active");
    const existing = (existingRows ?? []) as any[];
    const byExternal = new Map(
      existing.filter((r) => r.printful_external_id).map((r) => [r.printful_external_id, r]),
    );

    let created = 0;
    let updated = 0;
    const seen = new Set<string>();

    for (const [index, item] of items.entries()) {
      const variant =
        item.variants.find((v) => v.syncVariantId) ?? item.variants[0] ?? null;
      const missing: string[] = [];
      if (!variant) missing.push("variante");
      if (!variant?.priceCents) missing.push("prix de vente");
      if (!item.thumbnail && !variant?.imageUrl) missing.push("image");
      if (!variant?.syncVariantId && !variant?.printFileUrl) missing.push("fichier d'impression");
      if (missing.length > 0) incomplete.push({ name: item.name, missing });

      seen.add(item.externalId);
      const row = byExternal.get(item.externalId);
      const payload: Record<string, unknown> = {
        name: item.name,
        image_url: item.thumbnail ?? variant?.imageUrl ?? null,
        currency: variant?.currency || "EUR",
        printful_variant_id: variant?.variantId ?? null,
        printful_sync_variant_id: variant?.syncVariantId ?? null,
        printful_print_file_url: variant?.printFileUrl ?? null,
        printful_source: item.source,
        printful_external_id: item.externalId,
        printful_synced_at: syncedAt,
      };

      if (row) {
        // Prix Printful prioritaire ; sinon on garde le prix saisi en admin.
        if (variant?.priceCents) payload["price_cents"] = variant.priceCents;
        if (missing.length === 0) payload["active"] = true;
        const { error } = await supabaseAdmin
          .from("shop_products")
          .update(payload as any)
          .eq("id", row.id);
        if (error) errors.push(`${item.name} : ${error.message}`);
        else updated += 1;
      } else {
        let slug = slugifyName(item.name);
        if (existing.some((r) => r.slug === slug)) slug = `${slug}-${index + 1}`;
        const { error } = await supabaseAdmin.from("shop_products").insert({
          ...(payload as any),
          slug,
          description: "",
          price_cents: variant?.priceCents ?? 0,
          sort_order: index,
          // Un produit incomplet reste masqué tant qu'il n'est pas finalisé.
          active: missing.length === 0,
        });
        if (error) errors.push(`${item.name} : ${error.message}`);
        else created += 1;
      }
    }

    const stale = existing.filter(
      (r) => r.printful_external_id && !seen.has(r.printful_external_id) && r.active,
    );
    let deactivated = 0;
    for (const row of stale) {
      const { error } = await supabaseAdmin
        .from("shop_products")
        .update({ active: false, printful_synced_at: syncedAt })
        .eq("id", row.id);
      if (!error) deactivated += 1;
    }

    return { source, created, updated, deactivated, incomplete, syncedAt, errors };
  });
