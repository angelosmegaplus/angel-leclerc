import { createFileRoute } from "@tanstack/react-router";

const CATEGORY_INFO = [
  {
    id: "necessaires",
    label: "Strictement nécessaires",
    purpose:
      "Fonctionnement du site : session de connexion à l'espace personnel, panier de la boutique, sécurité des formulaires (anti-robot).",
    examples: "Authentification, panier, vérification anti-robot",
    duration: "Session à 6 mois",
  },
  {
    id: "mesure",
    label: "Mesure d'audience anonyme",
    purpose:
      "Comptage interne et anonyme des pages vues, sans profilage, sans partage avec un tiers et sans régie publicitaire. Cette mesure est exemptée de consentement.",
    examples: "Statistiques internes (identifiant de session temporaire)",
    duration: "Session",
  },
] as const;

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
            Ce site n'utilise aucun traceur soumis à consentement : ni publicité, ni profilage, ni
            outil d'analyse tiers. Seuls des stockages strictement nécessaires au fonctionnement et
            une mesure d'audience interne et anonyme sont utilisés. Aucun bandeau de consentement
            n'est donc nécessaire.
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
            Hébergement et base de données : Lovable (Union européenne). Envoi d'e-mails
            transactionnels : Resend. Boutique et paiements : Stripe et Printful, uniquement si vous
            passez commande. Médias intégrés (vidéos) : chargés en mode sans cookie
            (youtube-nocookie). Aucune régie publicitaire ni pixel marketing n'est utilisé
            aujourd'hui&nbsp;; cette page sera mise à jour si cela venait à changer.
          </p>

          <h2 className="mt-8 font-display text-xl font-bold text-foreground">
            Sécurité et adresses IP
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Lors de l'envoi d'un message ou d'une vérification anti-robot, l'adresse IP peut être
            traitée pour limiter les abus et le spam. Elle n'est jamais utilisée à des fins
            commerciales et n'est conservée que le temps nécessaire au traitement de la demande.
          </p>
        </div>
      </section>
    </div>
  );
}
