import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, User } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Angel Leclerc — Entreprise & Parcours" },
      {
        name: "description",
        content:
          "Choisissez votre entrée : découvrez Angel Leclerc Communication (services aux professionnels et associations) ou consultez mon parcours personnel et mon CV en ligne.",
      },
      { property: "og:title", content: "Angel Leclerc — Entreprise & Parcours" },
      {
        property: "og:description",
        content:
          "Deux entrées : Angel Leclerc Communication (services) ou mon parcours personnel (CV en ligne).",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: LandingPage,
});

const choices = [
  {
    to: "/entreprise" as const,
    icon: Briefcase,
    eyebrow: "Partie professionnelle",
    title: "Angel Leclerc Communication",
    text: "Mon entreprise : gestion de projet, conseil en communication et rédaction éditoriale pour professionnels, associations et porteurs de projets.",
    cta: "Découvrir mes services",
  },
  {
    to: "/parcours" as const,
    icon: User,
    eyebrow: "Partie personnelle",
    title: "Mon parcours",
    text: "Mon CV en ligne : expériences, formations, certifications, engagements associatifs, outils et recherche d'alternance BTS Communication.",
    cta: "Voir mon parcours",
  },
];

function LandingPage() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="container-tight py-16 md:py-24 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-foreground">
            Bienvenue
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Angel <span className="text-primary">Leclerc</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Ce site a deux entrées : mon activité professionnelle et mon
            parcours personnel. Choisissez celle qui vous intéresse.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {choices.map((choice, i) => {
            const Icon = choice.icon;
            return (
              <motion.div
                key={choice.to}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.15 + i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  to={choice.to}
                  className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-md md:p-10"
                >
                  <div className="inline-flex w-fit rounded-xl bg-muted p-3">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <span className="mt-6 text-xs font-semibold uppercase tracking-widest text-primary">
                    {choice.eyebrow}
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-bold text-foreground md:text-3xl">
                    {choice.title}
                  </h2>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground md:text-base">
                    {choice.text}
                  </p>
                  <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {choice.cta}
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}