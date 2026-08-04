export interface ShopVariant {
  syncVariantId: number | null;
  variantId: number | null;
  name: string;
  size: string | null;
  color: string | null;
  available: boolean;
  priceCents: number;
  imageUrl: string | null;
}

export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  images: string[];
  sizes: string[];
  colors: string[];
  availability: string | null;
  variants: ShopVariant[];
}

/** Raison pour laquelle la boutique n'affiche aucun produit. */
export type ShopEmptyReason =
  | "none"
  | "no-products"
  | "not-published"
  | "db-error";

export interface ShopCatalog {
  products: ShopProduct[];
  reason: ShopEmptyReason;
  message: string | null;
  lastSyncedAt: string | null;
}

export function formatPrice(cents: number, currency = "EUR") {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export const SHIPPING_CENTS = 490;