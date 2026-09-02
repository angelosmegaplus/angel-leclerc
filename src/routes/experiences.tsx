import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Clapperboard,
  Database,
  Globe2,
  LockKeyhole,
  MessageSquareText,
  Network,
  RadioTower,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/experiences")({
  head: () => ({
    meta: [
      { title: "Flamme OS — écosystème numérique" },
      {
        name: "description",
        content: "Flamme OS est le logiciel numérique d’angel-leclerc.fr : administration, IA, recherche, Films & Séries, médias, services et fonctions sociales.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Flamme OS — écosystème numérique" },
      {
        property: "og:description",
        content: "Flamme OS propose des modules d’administration, d’IA, de recherche, Films & Séries, radio, TV et social.",
      },
      { property: "og:url", content: "https://www.angel-leclerc.fr/experiences" },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/experiences" }],
  }),
  component: ExperiencesPage,
});

const modules = [
  {
    title: "Recherche & services",
    text: "Recherche Web, actualités, cartes, météo et accès rapides aux services numériques dans la même interface.",
    icon: Search,
  },
  {
    title: "Films & Séries",
    text: "Catalogue, recommandations, listes et découverte de films, séries et documentaires.",
    icon: Clapperboard,
  },
  {
    title: "IA",
    text: "Assistance, recherche, rédaction, classement et automatisations intégrés à Flamme OS.",
    icon: BrainCircuit,
  },
  {
    title: "Administration",
    text: "Centre de contrôle privé pour administrer le site, les contenus, les données, les outils et les automatisations.",
    icon: Workflow,
  },
  {
    title: "Social & messagerie",
    text: "Publications, stories, vidéos, forum, découverte, profils et messagerie au sein de Flamme OS.",
    icon: UsersRound,
  },
  {
    title: "Radio & TV",
    text: "Accès aux radios, podcasts, chaînes de télévision et services de replay.",
    icon: RadioTower,
  },
];

const architecture = [
  {
    index: "01",
    title: "Un logiciel central",
    text: "Flamme OS constitue l’environnement numérique principal relié à angel-leclerc.fr.",
    icon: Sparkles,
  },
  {
    index: "02",
    title: "Des modules spécialisés",
    text: "Recherche, Films & Séries, IA, social, médias et administration disposent chacun de fonctions dédiées dans le même logiciel.",
    icon: Network,
  },
  {
    index: "03",
    title: "Des données communes",
    text: "Les modules peuvent partager comptes, préférences, données et services pour assurer une expérience cohérente.",
    icon: Database,
  },
  {
    index: "04",
    title: "Un espace privé intégré",
    text: "L’administration de Flamme OS centralise les fonctions privées avec authentification et droits adaptés.",
    icon: LockKeyhole,
  },
];

function ExperiencesPage() {
  return (
    <main className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/.35))]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[8%] top-10 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-[6%] top-44 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="container-tight relative py-16 md:py-24">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.16em] text-primary shadow-sm">
              <Sparkles className="h-4 w-4" /> Écosystème numérique
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">Flamme OS</h1>
            <p className="mt-5 max-w-3xl text-xl font-semibold leading-8 text-foreground md:text-2xl">Le logiciel qui centralise les outils numériques d’angel-leclerc.fr.</p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
              <strong className="text-foreground">Flamme OS</strong> réunit dans une même interface la recherche, les médias, Films & Séries, l’intelligence artificielle, l’administration, les services et les fonctions sociales.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/flamme/social">Ouvrir Flamme OS <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/auth">Administration</Link></Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container-tight py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Modules</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-5xl">Les fonctions de Flamme OS.</h2>
          <p className="mt-5 leading-7 text-muted-foreground">Chaque module répond à un usage précis tout en restant intégré au même environnement.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <motion.article key={module.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-5 font-display text-xl font-bold text-foreground">{module.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{module.text}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="container-tight py-14 md:py-20">
          <div className="grid gap-5 lg:grid-cols-4">
            {architecture.map((step) => {
              const Icon = step.icon;
              return (
                <article key={step.index} className="rounded-3xl border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                    <span className="text-xs font-bold tracking-[.18em] text-muted-foreground/60">{step.index}</span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container-tight py-14 md:py-20">
        <div className="grid gap-5 md:grid-cols-3">
          <article className="rounded-3xl border border-border bg-card p-6">
            <Bot className="h-5 w-5 text-primary" />
            <h3 className="mt-4 font-display text-xl font-bold">IA intégrée</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Flamme OS intègre des fonctions d’assistance, de recherche, de rédaction et d’automatisation.</p>
          </article>
          <article className="rounded-3xl border border-border bg-card p-6">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="mt-4 font-display text-xl font-bold">Sécurité & contrôle</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Authentification, rôles et supervision protègent les fonctions privées et administratives.</p>
          </article>
          <article className="rounded-3xl border border-border bg-card p-6">
            <MessageSquareText className="h-5 w-5 text-primary" />
            <h3 className="mt-4 font-display text-xl font-bold">Une expérience cohérente</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Compte, interface, préférences et données peuvent être partagés entre les différents modules.</p>
          </article>
        </div>

        <div className="mt-10 rounded-3xl border border-primary/20 bg-primary/5 p-6 md:p-9">
          <div className="flex items-center gap-3"><Globe2 className="h-5 w-5 text-primary" /><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Flamme OS</p></div>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground">Un logiciel, plusieurs usages.</h2>
          <p className="mt-5 max-w-3xl leading-7 text-muted-foreground">Flamme OS couvre la recherche, les contenus, les médias, l’IA, l’administration et les interactions sociales dans un environnement commun pensé pour évoluer avec le site.</p>
        </div>
      </section>
    </main>
  );
}
