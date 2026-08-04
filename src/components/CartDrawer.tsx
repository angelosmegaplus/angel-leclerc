import { create } from "zustand";
import { Loader2, Lock, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/shopify";

interface CartUiStore {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useCartUi = create<CartUiStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

export function CartDrawer() {
  const { open, setOpen } = useCartUi();
  const items = useCartStore((s) => s.items);
  const isLoading = useCartStore((s) => s.isLoading);
  const checkoutUrl = useCartStore((s) => s.checkoutUrl);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const currency = items[0]?.price.currencyCode ?? "EUR";
  const subtotal = items.reduce(
    (sum, i) => sum + parseFloat(i.price.amount) * i.quantity,
    0,
  );
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button
        aria-label="Fermer le panier"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              ALC!
            </p>
            <h2 className="mt-1 font-display text-lg font-bold text-foreground">
              Mon panier
              {totalItems > 0 && (
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  · {totalItems} article{totalItems > 1 ? "s" : ""}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fermer le panier"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag size={40} className="text-muted-foreground" />
            <p className="font-display text-base font-bold text-foreground">
              Votre panier est vide
            </p>
            <p className="-mt-1 text-sm text-muted-foreground">
              Ajoutez une création ALC! pour commencer votre commande.
            </p>
            <Button asChild variant="outline" onClick={() => setOpen(false)}>
              <a href="/boutique">Voir la boutique ALC!</a>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {items.map((item) => {
                const image = item.product.node.images.edges[0]?.node;
                return (
                  <div
                    key={item.variantId}
                    className="flex gap-4 rounded-xl border border-border bg-card p-3"
                  >
                    {image ? (
                      <img
                        src={image.url}
                        alt={image.altText ?? item.product.node.title}
                        className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                        <ShoppingBag size={20} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.product.node.title}
                      </p>
                      {item.variantTitle &&
                        item.variantTitle !== "Default Title" && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.variantTitle}
                          </p>
                        )}
                      <p className="mt-1 text-sm text-primary">
                        {formatPrice(item.price.amount, item.price.currencyCode)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-border">
                          <button
                            disabled={isLoading}
                            aria-label="Réduire la quantité"
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity - 1)
                            }
                            className="px-2 py-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-8 text-center text-sm text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            disabled={isLoading}
                            aria-label="Augmenter la quantité"
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity + 1)
                            }
                            className="px-2 py-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          disabled={isLoading}
                          aria-label="Supprimer l'article"
                          onClick={() => removeItem(item.variantId)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4 border-t border-border bg-card px-6 py-5">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Résumé de la commande
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">
                      Articles ({totalItems})
                    </dt>
                    <dd className="text-foreground">
                      {formatPrice(subtotal, currency)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Livraison</dt>
                    <dd className="text-muted-foreground">
                      Calculée au paiement
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <dt className="font-medium text-foreground">Total estimé</dt>
                    <dd className="font-display text-lg font-bold text-primary">
                      {formatPrice(subtotal, currency)}
                    </dd>
                  </div>
                </dl>
              </div>
              <Button
                size="lg"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading || !checkoutUrl}
                onClick={() => {
                  if (checkoutUrl) window.open(checkoutUrl, "_blank");
                }}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" /> Payer en toute sécurité
                  </>
                )}
              </Button>
              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                Paiement sécurisé Shopify · Confirmation et suivi de commande
                envoyés par e-mail.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}