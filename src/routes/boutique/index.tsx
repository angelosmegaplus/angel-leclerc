import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ShoppingBag, Loader2, Sparkles, Mail, RefreshCw } from "lucide-react";
import { fetchProducts, formatPrice, type ShopifyProduct } from "@/lib/shopify";
import { AnimatedSection } from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";

const TITLE = "Boutique | Angel Leclerc Communication";
const DESCRIPTION =
  "Boutique ALC! par Angel Leclerc Communication : produits, tailles et couleurs disponibles, paiement sécurisé et livraison suivie.";

export const Route = createFileRoute("/boutique/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/boutique" }],
  }),
  component: BoutiquePage,
});

function BoutiquePage() {
  const {
    data: products,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["shopify-products"],
    queryFn: () => fetchProducts(50),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  const [sort, setSort] = useState("recent");
  const [availability, setAvailability] = useState("all");
  const [variant, setVariant] = useState("all");

  const variantOptions = useMemo(() => {
    const set = new Set<string>();
    (products ?? []).forEach(({ node }) =>
      node.options?.forEach((o) => {
        if (o.name.toLowerCase() !== "title")
          o.values.forEach((v) => set.add(`${o.name}: ${v}`));
      }),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [products]);

  const visible = useMemo(() => {
    let list: ShopifyProduct[] = [...(products ?? [])];
    if (availability === "in")
      list = list.filter(({ node }) => node.availableForSale);
    if (availability === "out")
      list = list.filter(({ node }) => !node.availableForSale);
    if (variant !== "all") {
      const [name, value] = variant.split(": ");
      list = list.filter(({ node }) =>
        node.options?.some((o) => o.name === name && o.values.includes(value)),
      );
    }
    const price = (p: ShopifyProduct) =>
      parseFloat(p.node.priceRange.minVariantPrice.amount);
    if (sort === "price-asc") list.sort((a, b) => price(a) - price(b));
    if (sort === "price-desc") list.sort((a, b) => price(b) - price(a));
    if (sort === "name")
      list.sort((a, b) => a.node.title.localeCompare(b.node.title, "fr"));
    if (sort === "availability")
      list.sort(
        (a, b) => Number(b.node.availableForSale) - Number(a.node.availableForSale),
      );
    return list;
  }, [products, availability, variant, sort]);

  const selectClass =
    "rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary";

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-card">
        <div className="container-tight py-14 sm:py-20">
          <AnimatedSection>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              ALC!
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Boutique
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Commande en quelques clics, paiement sécurisé et suivi de commande
              par e-mail.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="container-tight py-12 sm:py-16">
        {!isLoading && !isError && (products?.length ?? 0) > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <select
              aria-label="Trier les produits"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className={selectClass}
            >
              <option value="recent">Tri : nouveautés</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="name">Nom (A–Z)</option>
              <option value="availability">Disponibles d'abord</option>
            </select>
            <select
              aria-label="Filtrer par disponibilité"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className={selectClass}
            >
              <option value="all">Toutes disponibilités</option>
              <option value="in">En stock</option>
              <option value="out">Épuisés</option>
            </select>
            {variantOptions.length > 0 && (
              <select
                aria-label="Filtrer par variante"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                className={selectClass}
              >
                <option value="all">Toutes les variantes</option>
                {variantOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            )}
            <span className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw
                size={13}
                className={isFetching ? "animate-spin" : undefined}
              />
              {visible.length} produit{visible.length > 1 ? "s" : ""} · mise à jour
              automatique
            </span>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            Chargement des produits…
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-foreground">
              La boutique ALC! est momentanément indisponible.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Merci de réessayer dans quelques instants.
            </p>
          </div>
        )}

        {!isLoading && !isError && (products?.length ?? 0) === 0 && (
          <AnimatedSection>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-14 text-center sm:px-12">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-2xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-primary/5 blur-2xl"
              />
              <div className="relative mx-auto flex max-w-xl flex-col items-center">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles size={28} />
                </span>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Bientôt disponible
                </p>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  La boutique ALC! prépare ses premières créations
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Objets, supports et créations signés Angel Leclerc
                  Communication arrivent très prochainement. Cette page se met à
                  jour automatiquement dès la mise en ligne d'un produit.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link to="/contact">
                      <Mail className="mr-2 h-4 w-4" /> Être prévenu du lancement
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={() => refetch()}>
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                    />
                    Actualiser
                  </Button>
                </div>
              </div>
            </div>
          </AnimatedSection>
        )}

        {!isLoading && !isError && (products?.length ?? 0) > 0 && visible.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <ShoppingBag size={28} className="mx-auto text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Aucun produit ne correspond à ces filtres.
            </p>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ node }) => {
            const image = node.images.edges[0]?.node;
            return (
              <Link
                key={node.id}
                to="/boutique/$handle"
                params={{ handle: node.handle }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  {image ? (
                    <img
                      src={image.url}
                      alt={image.altText ?? node.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag size={28} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h2 className="font-display text-base font-bold text-foreground">
                    {node.title}
                  </h2>
                  <p className="text-sm text-primary">
                    {formatPrice(
                      node.priceRange.minVariantPrice.amount,
                      node.priceRange.minVariantPrice.currencyCode,
                    )}
                  </p>
                  <span
                    className={`mt-auto inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      node.availableForSale
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {node.availableForSale ? "En stock" : "Épuisé"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}