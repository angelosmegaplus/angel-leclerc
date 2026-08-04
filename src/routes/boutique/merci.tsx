import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCheckoutStatus } from "@/lib/shop.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/shop";

export const Route = createFileRoute("/boutique/merci")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  head: () => {
    const title = "Merci pour votre commande — Boutique ALC!";
    const description =
      "Votre commande ALC! est confirmée : récapitulatif et suivi envoyés par e-mail.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: MerciPage,
});

function MerciPage() {
  const { session_id: sessionId } = Route.useSearch();
  const clearCart = useCartStore((s) => s.clearCart);

  const { data, isLoading } = useQuery({
    queryKey: ["checkout-status", sessionId],
    enabled: Boolean(sessionId),
    queryFn: () =>
      getCheckoutStatus({
        data: { sessionId: sessionId as string, environment: getStripeEnvironment() },
      }),
  });

  const paid = data && !("error" in data) && data.paymentStatus !== "unpaid";

  useEffect(() => {
    if (paid) clearCart();
  }, [paid, clearCart]);

  return (
    <div className="container-tight py-16 text-center sm:py-24">
      {isLoading ? (
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="animate-spin" size={20} /> Vérification du paiement…
        </div>
      ) : paid ? (
        <>
          <CheckCircle2 className="mx-auto text-primary" size={40} />
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground sm:text-3xl">
            Merci pour votre commande
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            {data && !("error" in data) && data.amountCents > 0
              ? `Paiement de ${formatPrice(data.amountCents)} confirmé. `
              : ""}
            Un e-mail de confirmation vous a été envoyé
            {data && !("error" in data) && data.email ? ` à ${data.email}` : ""}. Votre
            commande part en production.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Paiement en attente
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Nous n'avons pas encore reçu la confirmation de votre paiement. Vous recevrez
            un e-mail dès qu'il sera validé.
          </p>
        </>
      )}
      <Button asChild variant="outline" className="mt-8">
        <Link to="/boutique">Retour à la boutique</Link>
      </Button>
    </div>
  );
}