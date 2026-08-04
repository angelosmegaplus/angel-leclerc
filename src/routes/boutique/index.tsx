import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShoppingBag, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listShopProducts } from "@/lib/shop.functions";
import { formatPrice, type ShopProduct } from "@/lib/shop";
import { useCartStore } from "@/stores/cartStore";
import { useCartUi } from "@/components/CartDrawer";

export const Route = createFileRoute("/boutique/")({
  head: () => {
    const title = "Boutique ALC! — objets et créations Angel Leclerc";
    const description =
      "La boutique ALC! : objets imprimés à la demande, paiement sécurisé et expédition suivie partout en Europe.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: BoutiquePage,
});

type SortKey = "featured" | "price-asc" | "price-desc" | "name";

function BoutiquePage() {
  const [sort, setSort] = useState<SortKey>("featured");
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartUi((s) => s.setOpen);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: () => listShopProducts(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const sorted = useMemo(() => {
    const list = [...products];
    if (sort === "price-asc") list.sort((a, b) => a.priceCents - b.priceCents);
    if (sort === "price-desc") list.sort((a, b) => b.priceCents - a.priceCents);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    return list;
  }, [products, sort]);

  const handleAdd = (product: ShopProduct) => {
    addItem(product, 1);
    toast.success("Ajouté au panier", { description: product.name });
    setCartOpen(true);
  };

  return (
    <div className="container-tight py-10 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Boutique
        </h1>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          ALC!
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Objets imprimés à la demande, fabriqués et expédiés par notre partenaire
          d'impression. Paiement sécurisé par carte, Apple Pay ou Google Pay.
        </p>
      </header>

      {products.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <label htmlFor="tri" className="text-sm text-muted-foreground">
            Trier par
          </label>
          <select
            id="tri"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            <option value="featured">Sélection</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="name">Nom (A-Z)</option>
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="animate-spin" size={20} /> Chargement du catalogue…
        </div>
      ) : sorted.length === 0 ? (
        <div className="relative mt-10 overflow-hidden rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <Sparkles className="relative mx-auto text-primary" size={28} />
          <p className="relative mt-4 font-display text-xl font-bold text-foreground">
            La boutique arrive bientôt
          </p>
          <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Les premières créations ALC! sont en préparation. Revenez très vite.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((product) => (
            <article
              key={product.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
            >
              <Link
                to="/boutique/$handle"
                params={{ handle: product.slug }}
                className="block aspect-square overflow-hidden bg-muted"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingBag size={28} className="text-muted-foreground" />
                  </div>
                )}
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-display text-base font-bold text-foreground">
                  <Link to="/boutique/$handle" params={{ handle: product.slug }}>
                    {product.name}
                  </Link>
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {product.description}
                </p>
                <p className="mt-3 font-display text-lg text-primary">
                  {formatPrice(product.priceCents, product.currency)}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => handleAdd(product)}
                  >
                    Ajouter
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/boutique/$handle" params={{ handle: product.slug }}>
                      Détails
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}