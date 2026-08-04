import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Loader2 } from "lucide-react";
import { fetchProducts, formatPrice } from "@/lib/shopify";
import { AnimatedSection } from "@/components/AnimatedSection";

const TITLE = "Boutique — Angel Leclerc Communication";
const DESCRIPTION =
  "La boutique d'Angel Leclerc Communication : produits, tailles et couleurs disponibles, paiement sécurisé et livraison suivie.";

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
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["shopify-products"],
    queryFn: () => fetchProducts(50),
    staleTime: 60_000,
  });

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-card">
        <div className="container-tight py-14 sm:py-20">
          <AnimatedSection>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">
              Boutique
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Les produits Angel Leclerc Communication
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Commande en quelques clics, paiement sécurisé et suivi de commande
              par e-mail.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="container-tight py-12 sm:py-16">
        {isLoading && (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            Chargement des produits…
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-foreground">
              La boutique est momentanément indisponible.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Merci de réessayer dans quelques instants.
            </p>
          </div>
        )}

        {!isLoading && !isError && (products?.length ?? 0) === 0 && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <ShoppingBag size={32} className="mx-auto text-muted-foreground" />
            <p className="mt-4 font-display text-lg font-bold text-foreground">
              Aucun produit pour le moment
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Les articles publiés dans la boutique apparaîtront ici
              automatiquement.
            </p>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products?.map(({ node }) => {
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
                  <span className="mt-auto text-xs text-muted-foreground">
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