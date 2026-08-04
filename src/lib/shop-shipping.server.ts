/** Calcul des frais de livraison réels — serveur uniquement. */
import { createClient } from "@supabase/supabase-js";
import { SHIPPING_CENTS } from "@/lib/shop";
import { getPrintfulShippingRates } from "@/lib/printful.server";

export interface ShippingQuote {
  id: string;
  name: string;
  amountCents: number;
  currency: string;
  minDays: number | null;
  maxDays: number | null;
}

export interface ShippingDestination {
  country: string;
  postalCode: string;
  city?: string;
  state?: string;
}

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

/** Charge les produits du panier avec leurs identifiants Printful. */
async function loadCartRows(items: Array<{ slug: string; quantity: number }>) {
  const { data, error } = await publicClient()
    .from("shop_products")
    .select(
      "slug, name, description, price_cents, currency, image_url, printful_variant_id, printful_sync_variant_id",
    )
    .in("slug", items.map((i) => i.slug))
    .eq("active", true);
  if (error) throw new Error("Catalogue indisponible");
  return new Map((data ?? []).map((r: any) => [r.slug as string, r]));
}

/** Convertit le panier en lignes Printful pour le calcul des frais réels. */
function toPrintfulLines(
  items: Array<{ slug: string; quantity: number }>,
  bySlug: Map<string, any>,
) {
  return items
    .map((i) => {
      const p = bySlug.get(i.slug);
      if (!p) return null;
      if (p.printful_sync_variant_id) {
        return { sync_variant_id: Number(p.printful_sync_variant_id), quantity: i.quantity };
      }
      if (p.printful_variant_id) {
        return { variant_id: Number(p.printful_variant_id), quantity: i.quantity };
      }
      return null;
    })
    .filter(Boolean) as Array<{ variant_id?: number; sync_variant_id?: number; quantity: number }>;
}

export async function quoteShipping(
  items: Array<{ slug: string; quantity: number }>,
  destination: ShippingDestination,
): Promise<{ rates: ShippingQuote[]; estimated: boolean }> {
  const fallback: { rates: ShippingQuote[]; estimated: boolean } = {
    rates: [
      {
        id: "STANDARD",
        name: "Livraison standard",
        amountCents: SHIPPING_CENTS,
        currency: "EUR",
        minDays: 5,
        maxDays: 10,
      },
    ],
    estimated: true,
  };
  try {
    const bySlug = await loadCartRows(items);
    const lines = toPrintfulLines(items, bySlug);
    if (lines.length === 0) return fallback;
    const result = await getPrintfulShippingRates({
      recipient: {
        country_code: destination.country,
        zip: destination.postalCode,
        city: destination.city || undefined,
        state_code: destination.state || undefined,
      },
      items: lines,
      currency: "EUR",
    });
    if (!result.ok) {
      console.error("Printful shipping rates:", result.error);
      return fallback;
    }
    return {
      rates: result.rates.map((r) => ({
        id: r.id,
        name: r.name,
        amountCents: r.rateCents,
        currency: r.currency,
        minDays: r.minDays,
        maxDays: r.maxDays,
      })),
      estimated: false,
    };
  } catch (error) {
    console.error("quoteShipping:", error);
    return fallback;
  }
}

