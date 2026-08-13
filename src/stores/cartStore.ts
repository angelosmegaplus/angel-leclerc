import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ShopProduct } from "@/lib/shop";

export interface CartItem {
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: ShopProduct, quantity?: number) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        const existing = get().items.find((i) => i.slug === product.slug);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.slug === product.slug ? { ...i, quantity: Math.min(20, i.quantity + quantity) } : i,
            ),
          });
          return;
        }
        set({
          items: [
            ...get().items,
            {
              slug: product.slug,
              name: product.name,
              priceCents: product.priceCents,
              currency: product.currency,
              imageUrl: product.imageUrl,
              quantity,
            },
          ],
        });
      },
      updateQuantity: (slug, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.slug !== slug) });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.slug === slug ? { ...i, quantity: Math.min(20, quantity) } : i,
          ),
        });
      },
      removeItem: (slug) => set({ items: get().items.filter((i) => i.slug !== slug) }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "alc-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
