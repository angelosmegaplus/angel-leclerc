import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
  MessageSquare,
  PhoneCall,
  Quote,
  ShieldCheck,
} from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";

export const Route = createFileRoute("/accueil-client")({
  head: () => ({
    meta: [
      { title: "Accueil client externalisé en Périgord noir | Angel Leclerc Communication" },
      {
        name: "description",
        content:
          "Permanence téléphonique et accueil client externalisé pour artisans, gîtes, restaurants, indépendants et associations. Formules dès 39 €/mois, en Périgord noir et à distance partout en France.",
      },
      { property: "og:title", content: "Accueil client externalisé | Angel Leclerc Communication" },
      {
        property: "og:description",
        content:
          "Ne perdez plus d’appels : prise de messages, réponses simples et confirmations de rendez-vous selon vos consignes. Formules dès 39 €/mois.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://angel-leclerc.fr/accueil-client" },
    ],
    links: [{ rel: "canonical", href: "https://angel-leclerc.fr/accueil-client" }],
  }),
  component: AccueilClientPage,
});

const steps = [
  {
    icon: ClipboardList,
    n: "01",
    title: "On définit vos consignes",
    text: "Horaires de couverture, informations que je peux donner, tarifs à communiquer, cas à vous transmettre immédiatement. Tout est écrit dans une fiche de consignes que vous validez.",
  },
  {
    icon: PhoneCall,
    n: "02",
    title: "Je réponds en votre nom",
    text: "Les appels non décrochés sont transférés vers ma ligne. Je réponds avec votre formule d’accueil, je renseigne le client et je note la demande.",
  },
  {
    icon: MessageSquare,
    n: "03",
    title: "Vous recevez le message",
    text: "Chaque appel donne lieu à un compte rendu écrit (SMS ou e-mail) : qui a appelé, pourquoi, ce qui a été répondu et ce qui reste à faire de votre côté.",
  },
  {
    icon: CalendarCheck,
    n: "04",
    title: "Suivi et ajustements",
    text: "Un point régulier permet d’affiner les réponses, l’amplitude horaire et la formule selon le volume réel d’appels.",
  },
];

const plans = [
  {
    name: "Mini permanence",
    price: "dès 39 €/mois",
    lead: "Pour ne plus manquer les appels essentiels.",
    features: [
      "Renvoi d’appels sur des créneaux ciblés",
      "Prise de messages et compte rendu écrit",
      "Réponses aux questions simples (horaires, adresse, services)",
    ],
  },
  {
    name: "Formule régulière",
    price: "dès 79 €/mois",
    lead: "Pour une présence stable sur la semaine.",
    highlight: true,
    features: [
      "Couverture élargie en journée du lundi au vendredi",
      "Réponses détaillées selon votre fiche de consignes",
      "Confirmation et rappel de rendez-vous",
      "Suivi des demandes et relances simples",
    ],
  },
  {
    name: "Formule renforcée",
    price: "dès 149 €/mois",
    lead: "Pour une activité avec beaucoup de contacts.",
    features: [
      "Amplitude horaire étendue, périodes de forte activité incluses",
      "Appels, e-mails et messages des réseaux sociaux",
      "Gestion des réservations et de l’agenda",
      "Point mensuel sur les demandes reçues",
    ],
  },
];

const included = [
  "Un seul interlocuteur qui connaît votre activité",
  "Fiche de consignes écrite et validée par vous",
  "Compte rendu de chaque appel",
  "Confidentialité des informations clients",
  "Engagement au mois, sans durée minimale imposée",
  "Intervention sur place possible en Périgord noir",
];

function AccueilClientPage() {
  return (
    <div className="bg-background">
      <section className="border-b border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <AnimatedSection className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              <MapPin size={14} /> Périgord noir · et à distance partout en France
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-foreground md:text-6xl">
              Accueil client externalisé
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Un appel manqué, c’est souvent un client perdu. Je prends le relais de votre accueil
              téléphonique quand vous êtes en rendez-vous, sur un chantier, en cuisine ou simplement
              indisponible : appels, messages, demandes simples et confirmations de rendez-vous,
              toujours selon vos consignes.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Ce n’est pas un centre d’appels : c’est le même interlocuteur, qui connaît votre
              activité et complète le conseil en communication.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all duration-300 hover:gap-4"
              >
                Demander un devis <ArrowRight size={16} />
              </Link>
              <Link
                to="/entreprise"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Voir tous les services
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <AnimatedSection className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Fonctionnement
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Comment ça se passe, concrètement
          </h2>
        </AnimatedSection>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <AnimatedSection key={step.n} delay={index * 0.07}>
                <article className="flex h-full flex-col rounded-3xl border border-border bg-card p-8 transition-colors duration-300 hover:border-primary">
                  <div className="flex items-center justify-between">
                    <Icon size={22} className="text-primary" />
                    <span className="font-display text-3xl font-extrabold text-primary/25">{step.n}</span>
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </article>
              </AnimatedSection>
            );
          })}
        </div>

        <AnimatedSection delay={0.1} className="mt-10">
          <div className="rounded-3xl border border-border bg-card p-8 md:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Ce qui est compris</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </AnimatedSection>
      </section>

      <section className="border-y border-border/60 bg-card py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Tarifs</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Trois formules, ajustées à votre volume d’appels
            </h2>
            <p className="mt-4 text-muted-foreground">
              Tarifs de lancement indicatifs. Le montant définitif est fixé sur devis, selon le
              volume d’appels et l’amplitude horaire souhaitée.
            </p>
          </AnimatedSection>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <AnimatedSection key={plan.name} delay={index * 0.08}>
                <article
                  className={`flex h-full flex-col rounded-3xl p-8 md:p-10 ${
                    plan.highlight
                      ? "bg-foreground text-background"
                      : "border border-border bg-background"
                  }`}
                >
                  <h3
                    className={`font-display text-xl font-bold ${
                      plan.highlight ? "text-background" : "text-foreground"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p className="mt-3 font-display text-2xl font-extrabold text-primary">{plan.price}</p>
                  <p
                    className={`mt-3 text-sm ${
                      plan.highlight ? "text-background/70" : "text-muted-foreground"
                    }`}
                  >
                    {plan.lead}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className={`flex items-start gap-3 text-sm ${
                          plan.highlight ? "text-background/80" : "text-muted-foreground"
                        }`}
                      >
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/contact"
                    className="group/link mt-auto inline-flex items-center gap-2 pt-8 text-sm font-bold text-primary transition-all duration-300 hover:gap-4"
                  >
                    Demander un devis <ArrowRight size={16} />
                  </Link>
                </article>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={0.1} className="mt-8">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-3xl border border-border bg-background px-8 py-6 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Clock size={16} className="text-primary" /> Mise en place en quelques jours
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary" /> Sans engagement de durée
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} className="text-primary" /> Rencontre possible en Périgord noir
              </span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <AnimatedSection className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Retours</span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Témoignages
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={0.08} className="mt-10">
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 md:p-12">
            <Quote size={28} className="text-primary" />
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-foreground">
              Cette offre vient d’être lancée : aucun témoignage n’est publié pour l’instant. Les
              premiers retours des clients accompagnés apparaîtront ici, avec leur accord et sous
              leur nom.
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Je préfère une page vide à des avis inventés. Si vous souhaitez échanger avec une
              référence avant de vous décider, demandez-le simplement lors du premier contact.
            </p>
            <Link
              to="/contact"
              className="group/link mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary transition-all duration-300 hover:gap-4"
            >
              Poser une question <ArrowRight size={16} />
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
