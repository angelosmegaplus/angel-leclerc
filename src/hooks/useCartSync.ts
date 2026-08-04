import { useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";

/** Re-synchronise le panier avec Shopify au retour sur l'onglet (ex. après checkout). */
export function useCartSync() {
  const syncCart = useCartStore((s) => s.syncCart);

  useEffect(() => {
    syncCart();
    const onVisible = () => {
      if (document.visibilityState === "visible") syncCart();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", syncCart);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", syncCart);
    };
  }, [syncCart]);
}