import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  FileText,
  Layers,
  Mail,
  PenLine,
  Phone,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";
import { LatestArticles } from "@/components/LatestArticles";

const TITLE = "Angel Leclerc — Communication, conseil et rédaction";
const DESCRIPTION =
  "Angel Leclerc accompagne entreprises, associations, collectivités et porteurs de projet partout en France : gestion de projet, conseil en communication et rédaction. Parcours et CV en ligne.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: LandingPage,
});

const services = [
  {
    icon: Layers,
    title: "Gestion de projet",
    text: "Organisation, planning, suivi et coordination des prestataires.",
  },
  {
    icon: Compass,
    title: "Conseil en communication",
    text: "Analyse du besoin, objectifs, choix des supports et des messages.",
  },
  {
    icon: PenLine,
    title: "Rédaction éditoriale",
    text: "Textes professionnels, institutionnels, journalistiques et web.",
  },
];

function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-background">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>

        <div className="container-tight relative py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex max-w-2xl flex-col items-center text-center"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border bg-card md:h-28 md:w-28">
              <img
                src={logo}
                alt="Logo Angel Leclerc Communication"
                className="h-16 w-16 object-contain md:h-20 md:w-20"
                width={96}
                height={96}
              />
            </div>

            <h1 className="mt-8 font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              Angel <span className="italic text-primary">Leclerc</span>
            </h1>
            <p className="mt-3 font-display text-base tracking-wide text-primary md:text-lg">
              « Donner du souffle à vos idées. »
            </p>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              J'accompagne des entreprises, associations, collectivités et porteurs
              de projet partout en France, à distance ou sur le terrain selon les
              besoins&nbsp;: gestion de projet, conseil en communication et rédaction.
            </p>

            <div className="mt-8 grid w-full max-w-md grid-cols-1 gap-3 sm:flex sm:max-w-none sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/contact">
                  Parler de votre projet
                  <ArrowRight size={18} />
                </Link>
              </Button>
              <div className="grid grid-cols-2 gap-3 sm:contents">
                <Button asChild size="lg" variant="outline">
                  <Link to="/entreprise">Voir les services</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/parcours">
                    <FileText size={18} aria-hidden />
                    Voir mon CV
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services essentiels */}
      <section className="border-t border-border bg-card/40">
        <div className="container-tight py-14 md:py-20">
          <div className="grid gap-5 md:grid-cols-3">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <div className="inline-flex rounded-xl border border-border bg-muted p-2.5">
                    <Icon size={20} className="text-primary" aria-hidden />
                  </div>
                  <h2 className="mt-4 font-display text-lg font-bold text-foreground">
                    {s.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.text}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              to="/entreprise"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-5 transition-colors hover:border-primary/60"
            >
              <span className="min-w-0">
                <span className="block font-display text-sm font-bold text-foreground">
                  Méthode, réalisations et tarifs
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Le détail de l'accompagnement, étape par étape.
                </span>
              </span>
              <ArrowRight
                size={18}
                className="shrink-0 text-primary transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
            <Link
              to="/parcours"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-5 transition-colors hover:border-primary/60"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
                  <User size={15} className="text-primary" aria-hidden />
                  Mon parcours et mon CV
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Expériences, projets et recherche d'alternance en BTS Communication.
                </span>
              </span>
              <FileText size={18} className="shrink-0 text-primary" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <LatestArticles />

      {/* Contact */}
      <section className="border-t border-border bg-background">
        <div className="container-tight py-14 md:py-16">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              Un projet, une question&nbsp;?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Décrivez votre besoin en quelques lignes : vous recevrez un premier
              retour et une proposition écrite et chiffrée.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/contact">
                  <Mail size={18} />
                  Me contacter
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="tel:+33601766978">
                  <Phone size={18} />
                  06 01 76 69 78
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
