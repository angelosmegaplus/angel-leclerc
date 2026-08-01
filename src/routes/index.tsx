import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, User, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";
import { LatestArticles } from "@/components/LatestArticles";

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
    text: "Découvrez mon parcours, mes compétences, mes réalisations et ma recherche d'alternance en BTS Communication à Sarlat et dans ses environs.",
    cta: "Voir mon parcours",
    badge: "Recherche d'alternance — septembre 2026",
  },
];

function LandingPage() {
  return (
    <>
    <section className="relative overflow-hidden bg-background">
      {/* Decorative background layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <div className="container-tight relative py-20 md:py-28 lg:py-32">
        {/* Hero logo */}
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Glow rings */}
            <motion.div
              aria-hidden
              className="absolute inset-0 -m-8 rounded-full bg-primary/25 blur-2xl"
              animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div
              aria-hidden
              className="absolute inset-0 -m-6 rounded-full border border-primary/25"
            />
            <div
              aria-hidden
              className="absolute inset-0 -m-12 rounded-full border border-primary/10"
            />

            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-border bg-card shadow-[0_20px_60px_-20px_rgba(206,101,75,0.45)] md:h-48 md:w-48">
              <img
                src={logo}
                alt="Logo Angel Leclerc Communication"
                className="h-28 w-28 object-contain md:h-32 md:w-32"
                width={128}
                height={128}
              />
            </div>
          </motion.div>

          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-10 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground backdrop-blur"
          >
            <Sparkles size={12} className="text-primary" />
            Bienvenue
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 font-display text-5xl font-bold leading-[1.02] tracking-tight text-foreground md:text-6xl lg:text-7xl"
          >
            Angel <span className="italic text-primary">Leclerc</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-4 font-display text-base tracking-wide text-primary md:text-lg"
          >
            « Donner du souffle à vos idées. »
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            Ce site a deux entrées&nbsp;: mon activité professionnelle et mon
            parcours personnel. Choisissez celle qui vous intéresse.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-8"
          >
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/parcours">
                <FileText size={18} />
                Voir mon CV
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Choice cards */}
        <div className="relative mt-16 grid gap-6 md:mt-20 md:grid-cols-2 md:gap-8">
          {choices.map((choice, i) => {
            const Icon = choice.icon;
            return (
              <motion.div
                key={choice.to}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.55 + i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group relative"
              >
                {/* Ambient glow on hover */}
                <div
                  aria-hidden
                  className="absolute -inset-px rounded-3xl bg-gradient-to-br from-primary/40 via-primary/0 to-secondary/30 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
                />
                <Link
                  to={choice.to}
                  className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all duration-500 group-hover:-translate-y-1 group-hover:border-primary/60 group-hover:shadow-[0_30px_60px_-25px_rgba(206,101,75,0.35)] md:p-10"
                >
                  {/* Corner accent */}
                  <div
                    aria-hidden
                    className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-2xl transition-all duration-500 group-hover:bg-primary/25"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
                  />

                  <div className="relative flex items-center gap-4">
                    <div className="inline-flex rounded-2xl border border-border bg-muted p-3.5 transition-colors group-hover:border-primary/40 group-hover:bg-primary/10">
                      <Icon size={22} className="text-primary" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                      {choice.eyebrow}
                    </span>
                  </div>

                  <h2 className="relative mt-6 font-display text-2xl font-bold leading-tight text-foreground md:text-3xl">
                    {choice.title}
                  </h2>
                  {"badge" in choice && choice.badge && (
                    <span className="relative mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                      {choice.badge}
                    </span>
                  )}
                  <p className="relative mt-4 flex-1 text-sm leading-relaxed text-muted-foreground md:text-base">
                    {choice.text}
                  </p>
                  <span className="relative mt-8 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {choice.cta}
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-1.5"
                    />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
      <LatestArticles />
    </>
  );
}