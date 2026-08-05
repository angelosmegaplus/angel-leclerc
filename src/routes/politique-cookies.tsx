import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CATEGORY_INFO, openCookiePreferences } from "@/lib/cookie-consent";

const TITLE = "Politique des cookies — Angel Leclerc Communication";
const DESCRIPTION =
  "Catégories de cookies utilisées sur angel-leclerc.fr, finalités, durées, prestataires et modalités de retrait du consentement à tout moment.";

export const Route = createFileRoute("/politique-cookies")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/politique-cookies" }],
  }),
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
  return (
    <div className="bg-background">
      <section className="section-padding">
        <div className="container-tight max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Politique des cookies
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Ce site utilise un nombre volontairement réduit de traceurs. Les cookies et
            stockages strictement nécessaires au fonctionnement sont toujours actifs&nbsp;;
            toutes les autres catégories dépendent de votre consentement explicite, qui
            n'est jamais présélectionné et peut être retiré à tout moment.
          </p>

          <div className="mt-8 space-y-4">
            {CATEGORY_INFO.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-display text-lg font-bold text-foreground">{c.label}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.purpose}</p>
                <p className="mt-2 text-xs text-muted-foreground/80">
                  Exemples : {c.examples} · Durée indicative : {c.duration}
                </p>
              </div>
            ))}
          </div>

          <h2 className="mt-10 font-display text-xl font-bold text-foreground">
            Prestataires et contenus tiers
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Hébergement et base de données : Lovable et Supabase (Union européenne).
            Envoi d'e-mails transactionnels : Resend. Boutique et paiements :
            Stripe et Printful, uniquement si vous passez commande. Médias intégrés
            (vidéos, lecteurs) : chargés seulement après acceptation de la catégorie
            « Services tiers / médias intégrés ». Aucune régie publicitaire ni pixel
            marketing n'est utilisé aujourd'hui&nbsp;; cette page sera mise à jour si
            cela venait à changer.
          </p>

          <h2 className="mt-8 font-display text-xl font-bold text-foreground">
            Preuve de votre choix
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Seuls la version du bandeau, la date du choix et les catégories acceptées
            sont conservées dans votre navigateur. Aucune donnée personnelle n'y est
            associée.
          </p>

          <h2 className="mt-8 font-display text-xl font-bold text-foreground">
            Sécurité et adresses IP
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Lors de l'envoi d'un message ou d'une vérification anti-robot, l'adresse IP
            peut être traitée pour limiter les abus et le spam. Elle n'est jamais
            utilisée à des fins commerciales et n'est conservée que le temps nécessaire
            au traitement de la demande.
          </p>

          <div className="mt-10">
            <Button onClick={openCookiePreferences}>Gérer mes cookies</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
