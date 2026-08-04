export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  images: string[];
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