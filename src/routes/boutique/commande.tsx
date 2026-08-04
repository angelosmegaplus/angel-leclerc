import { createFileRoute, Link } from "@tanstack/react-router";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createShopCheckout } from "@/lib/shop.functions";
import { useCartStore } from "@/stores/cartStore";

export const Route = createFileRoute("/boutique/commande")({
  head: () => {
    const title = "Paiement sécurisé — Boutique ALC!";
    const description =
      "Finalisez votre commande ALC! en toute sécurité : paiement par carte, Apple Pay ou Google Pay.";
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
  component: CheckoutPage,
});

function CheckoutPage() {
  const items = useCartStore((s) => s.items);

  if (items.length === 0) {
    return (
      <div className="container-tight py-24 text-center">
        <p className="font-display text-xl font-bold text-foreground">
          Votre panier est vide
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/boutique">Retour à la boutique</Link>
        </Button>
      </div>
    );
  }

  const fetchClientSecret = async (): Promise<string> => {
    const result = await createShopCheckout({
      data: {
        items: items.map((i) => ({ slug: i.slug, quantity: i.quantity })),
        returnUrl: `${window.location.origin}/boutique/merci?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Paiement indisponible pour le moment.");
    return result.clientSecret;
  };

  return (
    <div className="container-tight py-10 sm:py-16">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Paiement sécurisé
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Vos informations bancaires sont traitées directement par Stripe.
      </p>
      <div id="checkout" className="mt-8 rounded-2xl border border-border bg-card p-4">
        <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
}