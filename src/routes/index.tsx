import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, User, Sparkles, FileText, Mail } from "lucide-react";
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
          "Choisissez votre entrée : découvrez Angel Leclerc Communication (services aux professionnels et associations) ou consultez mon parcours personnel et ma recherche urgente d'alternance BTS Communication pour septembre 2026.",
      },
      { property: "og:title", content: "Angel Leclerc — Entreprise & Parcours" },
      {
        property: "og:description",
        content:
          "Angel Leclerc Communication, CV en ligne et recherche urgente d'alternance BTS Communication pour septembre 2026.",
      },
      { property: "og:url", content: "https://www.angel-leclerc.fr/" },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/" }],
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
    text: "Découvrez mon parcours, mes compétences, mes réalisations et ma recherche urgente d'alternance en BTS Communication. Je suis ouvert à tout secteur proposant de vraies missions de communication, sur Bordeaux, Périgueux, Bergerac, Brive, Sarlat et alentours.",
    cta: "Voir mon parcours",
    badge: "Recherche urgente d'alternance — septembre 2026",
  },
];

function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-background">
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
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-8 flex items-center gap-3 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Un seul site, deux entrées
            </motion.div>

            <motion.img
              src={logo}
              alt="Angel Leclerc Communication"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mb-8 h-auto w-[230px] max-w-[70vw] dark:brightness-0 dark:invert"
            />

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Entreprise & parcours
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg"
            >
              Accédez directement à mes services de communication ou à mon parcours et ma recherche d'alternance.
            </motion.p>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2">
            {choices.map((choice, index) => {
              const Icon = choice.icon;
              return (
                <motion.article
                  key={choice.to}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.22 + index * 0.08 }}
                  className="group relative flex min-h-[330px] flex-col overflow-hidden rounded-3xl border border-border/70 bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl sm:p-8"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-secondary/70 opacity-80" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    {choice.badge ? (
                      <span className="max-w-[230px] rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-right text-xs font-semibold text-primary">
                        {choice.badge}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {choice.eyebrow}
                  </p>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">{choice.title}</h2>
                  <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground sm:text-base">{choice.text}</p>

                  <Button asChild className="mt-8 w-full justify-between rounded-xl px-5 sm:w-auto">
                    <Link to={choice.to}>
                      {choice.cta}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/35 py-16">
        <div className="container-tight grid gap-5 md:grid-cols-3">
          <Link
            to="/entreprise"
            className="rounded-2xl border border-border/70 bg-background p-5 transition-colors hover:bg-accent/50"
          >
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="mt-4 font-semibold text-foreground">Services</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Communication, rédaction, conseil et gestion de projet.</p>
          </Link>
          <Link
            to="/articles"
            className="rounded-2xl border border-border/70 bg-background p-5 transition-colors hover:bg-accent/50"
          >
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="mt-4 font-semibold text-foreground">Articles</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Analyses, billets et contenus éditoriaux publiés sur le site.</p>
          </Link>
          <Link
            to="/contact"
            className="rounded-2xl border border-border/70 bg-background p-5 transition-colors hover:bg-accent/50"
          >
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="mt-4 font-semibold text-foreground">Contact</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Une question ou un projet : accès direct au formulaire de contact.</p>
          </Link>
        </div>
      </section>

      <LatestArticles />
    </>
  );
}
