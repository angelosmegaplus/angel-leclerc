import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchProductByHandle, formatPrice } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { useCartUi } from "@/components/CartDrawer";

export const Route = createFileRoute("/boutique/$handle")({
  head: ({ params }) => {
    const title = "Produit — Boutique Angel Leclerc Communication";
    const description = `Fiche produit « ${params.handle} » : variantes, disponibilité et paiement sécurisé.`;
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
  const isLoadingCart = useCartStore((s) => s.isLoading);

  const { data: product, isLoading } = useQuery({
    queryKey: ["shopify-product", handle],
    queryFn: () => fetchProductByHandle(handle),
    staleTime: 60_000,
  });

  const variants = useMemo(
    () => product?.node.variants.edges.map((e) => e.node) ?? [],
    [product],
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) ?? variants[0];

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
          <Link to="/boutique">Retour à la boutique</Link>
        </Button>
      </div>
    );
  }

  const node = product.node;
  const images = node.images.edges.map((e) => e.node);
  const image = images[activeImage] ?? images[0];

  const handleAdd = async () => {
    if (!selectedVariant) return;
    await addItem({
      product,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions,
    });
    toast.success("Ajouté au panier", { description: node.title });
    setCartOpen(true);
  };

  return (
    <div className="container-tight py-10 sm:py-16">
      <Link
        to="/boutique"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> Boutique
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
            {image ? (
              <img
                src={image.url}
                alt={image.altText ?? node.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ShoppingBag size={32} className="text-muted-foreground" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.url}
                  onClick={() => setActiveImage(i)}
                  aria-label={`Voir l'image ${i + 1}`}
                  className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border ${
                    i === activeImage ? "border-primary" : "border-border"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.altText ?? node.title}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {node.title}
          </h1>
          <p className="mt-3 font-display text-xl text-primary">
            {selectedVariant
              ? formatPrice(
                  selectedVariant.price.amount,
                  selectedVariant.price.currencyCode,
                )
              : formatPrice(
                  node.priceRange.minVariantPrice.amount,
                  node.priceRange.minVariantPrice.currencyCode,
                )}
          </p>

          {variants.length > 1 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-foreground">Variantes</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {variants.map((v) => {
                  const active = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      disabled={!v.availableForSale}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:border-primary"
                      }`}
                    >
                      {v.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="mt-5 text-sm text-muted-foreground">
            {selectedVariant?.availableForSale
              ? typeof selectedVariant.quantityAvailable === "number" &&
                selectedVariant.quantityAvailable > 0
                ? `En stock — ${selectedVariant.quantityAvailable} disponible(s)`
                : "En stock"
              : "Épuisé"}
          </p>

          <Button
            className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
            disabled={!selectedVariant?.availableForSale || isLoadingCart}
            onClick={handleAdd}
          >
            {isLoadingCart ? "Ajout en cours…" : "Ajouter au panier"}
          </Button>

          {node.description && (
            <div className="mt-8 border-t border-border pt-6">
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {node.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}