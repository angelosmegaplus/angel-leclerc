import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getShopProduct } from "@/lib/shop.functions";
import { formatPrice } from "@/lib/shop";
import { useCartStore } from "@/stores/cartStore";
import { useCartUi } from "@/components/CartDrawer";

export const Route = createFileRoute("/boutique/$handle")({
  head: ({ params }) => {
    const title = "Produit — Boutique ALC!";
    const description = `Fiche produit « ${params.handle} » : détails, prix et paiement sécurisé sur la boutique ALC!.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { handle } = Route.useParams();
  const setCartOpen = useCartUi((s) => s.setOpen);
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["shop-product", handle],
    queryFn: () => getShopProduct({ data: { slug: handle } }),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="container-tight flex items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="animate-spin" size={20} /> Chargement du produit…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-tight py-24 text-center">
        <p className="font-display text-xl font-bold text-foreground">
          Produit introuvable
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/boutique">Retour à la boutique ALC!</Link>
        </Button>
      </div>
    );
  }

  const gallery = [product.imageUrl, ...product.images].filter(Boolean) as string[];

  const handleAdd = () => {
    addItem(product, quantity);
    toast.success("Ajouté au panier", { description: product.name });
    setCartOpen(true);
  };

  return (
    <div className="container-tight py-10 sm:py-16">
      <Link
        to="/boutique"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> Boutique ALC!
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
          {gallery[0] ? (
            <img
              src={gallery[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ShoppingBag size={32} className="text-muted-foreground" />
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {product.name}
          </h1>
          <p className="mt-3 font-display text-xl text-primary">
            {formatPrice(product.priceCents, product.currency)}
          </p>

          {product.availability && (
            <p className="mt-2 text-sm text-muted-foreground">
              {product.availability === "in_stock"
                ? "Disponible · impression à la demande"
                : "Temporairement indisponible"}
            </p>
          )}

          {product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-foreground">Tailles disponibles</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <li
                    key={size}
                    className="rounded-lg border border-border px-3 py-1 text-xs text-muted-foreground"
                  >
                    {size}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.colors.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-medium text-foreground">Couleurs disponibles</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <li
                    key={color}
                    className="rounded-lg border border-border px-3 py-1 text-xs text-muted-foreground"
                  >
                    {color}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Quantité</span>
            <input
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.min(20, Math.max(1, Number(e.target.value) || 1)))
              }
              className="w-20 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
            />
          </div>

          <Button
            className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
            onClick={handleAdd}
            disabled={product.availability === "out_of_stock"}
          >
            Ajouter au panier
          </Button>

          <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Truck size={14} /> Impression à la demande · expédition sous 5 à 10 jours
            ouvrés.
          </p>

          {product.description && (
            <div className="mt-8 border-t border-border pt-6">
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}