import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, MapPin, Truck } from "lucide-react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createShopCheckout, estimateShippingRates } from "@/lib/shop.functions";
import type { ShippingQuote } from "@/lib/shop.functions";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/shop";

const COUNTRIES: Array<{ code: string; label: string }> = [
  { code: "FR", label: "France" },
  { code: "BE", label: "Belgique" },
  { code: "LU", label: "Luxembourg" },
  { code: "CH", label: "Suisse" },
  { code: "DE", label: "Allemagne" },
  { code: "ES", label: "Espagne" },
  { code: "IT", label: "Italie" },
  { code: "NL", label: "Pays-Bas" },
  { code: "PT", label: "Portugal" },
  { code: "AT", label: "Autriche" },
  { code: "IE", label: "Irlande" },
  { code: "DK", label: "Danemark" },
  { code: "SE", label: "Suède" },
  { code: "FI", label: "Finlande" },
  { code: "PL", label: "Pologne" },
];

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
  const [country, setCountry] = useState("FR");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [quotes, setQuotes] = useState<ShippingQuote[] | null>(null);
  const [estimated, setEstimated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const currency = items[0]?.currency ?? "EUR";
  const subtotal = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const cheapest = quotes?.length
    ? quotes.reduce((min, q) => (q.amountCents < min.amountCents ? q : min))
    : null;

  if (items.length === 0) {
    return (
      <div className="container-tight py-24 text-center">
        <p className="font-display text-xl font-bold text-foreground">Votre panier est vide</p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/boutique">Retour à la boutique</Link>
        </Button>
      </div>
    );
  }

  const computeShipping = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await estimateShippingRates({
        data: {
          items: items.map((i) => ({ slug: i.slug, quantity: i.quantity })),
          destination: { country, postalCode, city },
        },
      });
      setQuotes(result.rates);
      setEstimated(result.estimated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Calcul impossible");
      setQuotes(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientSecret = async (): Promise<string> => {
    const result = await createShopCheckout({
      data: {
        items: items.map((i) => ({ slug: i.slug, quantity: i.quantity })),
        returnUrl: `${window.location.origin}/boutique/merci?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
        destination: { country, postalCode, city },
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
        Indiquez votre destination : les frais de livraison et la TVA sont calculés avant paiement.
        Vos informations bancaires sont traitées par Stripe.
      </p>

      {!confirmed ? (
        <div className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin size={16} className="text-primary" /> Destination de livraison
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              aria-label="Pays de livraison"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setQuotes(null);
              }}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              aria-label="Code postal"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Code postal"
              value={postalCode}
              onChange={(e) => {
                setPostalCode(e.target.value);
                setQuotes(null);
              }}
            />
            <input
              aria-label="Ville"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Ville"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setQuotes(null);
              }}
            />
          </div>

          <Button
            variant="outline"
            onClick={computeShipping}
            disabled={loading || postalCode.trim().length < 3}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Truck className="mr-2 h-4 w-4" />
            )}
            Calculer les frais de livraison
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {quotes && (
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Options de livraison
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {quotes.map((q) => (
                  <li key={q.id} className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {q.name}
                      {q.minDays && q.maxDays ? ` · ${q.minDays}–${q.maxDays} j ouvrés` : ""}
                    </span>
                    <span className="text-foreground">
                      {formatPrice(q.amountCents, q.currency)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Articles</dt>
                  <dd className="text-foreground">{formatPrice(subtotal, currency)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-foreground">Total à partir de</dt>
                  <dd className="font-display text-lg font-bold text-primary">
                    {formatPrice(subtotal + (cheapest?.amountCents ?? 0), currency)}
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                {estimated
                  ? "Tarif forfaitaire : le montant exact sera confirmé à l'étape de paiement."
                  : "Tarifs réels calculés par notre atelier d'impression."}{" "}
                TVA calculée automatiquement selon votre pays à l'étape suivante.
              </p>
              <Button className="mt-4 w-full" onClick={() => setConfirmed(true)}>
                Continuer vers le paiement
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <button
            onClick={() => setConfirmed(false)}
            className="mt-6 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Modifier la destination
          </button>
          <div id="checkout" className="mt-4 rounded-2xl border border-border bg-card p-4">
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </>
      )}
    </div>
  );
}
