import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  Clapperboard,
  Database,
  FileText,
  Globe2,
  LockKeyhole,
  MessageSquareText,
  RadioTower,
  Search,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/experiences")({
  head: () => ({
    meta: [
      { title: "Flamme OS — système de contrôle numérique" },
      {
        name: "description",
        content: "Flamme OS est le système de contrôle numérique d’angel-leclerc.fr : administration, IA, automatisations, données, fichiers, agenda, communications, sécurité et supervision.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Flamme OS — système de contrôle numérique" },
      {
        property: "og:description",
        content: "Le centre de contrôle numérique d’angel-leclerc.fr, avec administration, IA, données, automatisations et services intégrés.",
      },
      { property: "og:url", content: "https://www.angel-leclerc.fr/experiences" },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/experiences" }],
  }),
  component: ExperiencesPage,
});

const coreFunctions = [
  {
    title: "Centre de contrôle",
    text: "Administration du site, contenus, paramètres, outils et opérations depuis une interface centrale.",
    icon: Workflow,
  },
  {
    title: "IA intégrée",
    text: "Assistance, recherche, rédaction, classement, synthèse et aide à la décision directement dans le système.",
    icon: BrainCircuit,
  },
  {
    title: "Automatisations",
    text: "Tâches planifiées, traitements récurrents, workflows et actions déclenchées depuis le même environnement.",
    icon: ServerCog,
  },
  {
    title: "Données & fichiers",
    text: "Centralisation des données, documents, médias, contenus structurés et ressources utilisées par le site.",
    icon: Database,
  },
  {
    title: "Agenda & communications",
    text: "Calendrier, rendez-vous, messages, e-mails, contacts, abonnés et suivi des échanges réunis dans l’espace de travail.",
    icon: CalendarDays,
  },
  {
    title: "Sécurité & supervision",
    text: "Authentification, rôles, contrôle des accès, notifications, journal d’activité et suivi de l’état des services.",
    icon: ShieldCheck,
  },
];

const secondaryModules = [
  { title: "Recherche & services", icon: Search },
  { title: "Films & Séries", icon: Clapperboard },
  { title: "Radio & médias", icon: RadioTower },
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
              <Sparkles className="h-4 w-4" /> Système de contrôle numérique
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">Flamme OS</h1>
            <p className="mt-5 max-w-3xl text-xl font-semibold leading-8 text-foreground md:text-2xl">
              Le centre de contrôle numérique d’angel-leclerc.fr.
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
              <strong className="text-foreground">Flamme OS</strong> pilote l’administration du site, l’intelligence artificielle, les automatisations, les données, les fichiers, l’agenda, les communications, la sécurité et la supervision depuis un environnement commun.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/auth">Ouvrir Flamme OS <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/angel-os-ia">Voir l’interface IA</Link></Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container-tight py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Cœur du système</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-5xl">Un OS pour piloter tout l’écosystème.</h2>
          <p className="mt-5 leading-7 text-muted-foreground">Les fonctions centrales de Flamme OS permettent d’administrer, organiser, automatiser et superviser le site et ses services.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {coreFunctions.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article key={item.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-5 font-display text-xl font-bold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="container-tight py-14 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_.9fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Architecture</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-5xl">Une couche centrale, des services autour.</h2>
              <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">
                Flamme OS sert de couche centrale entre le site, les données, les outils d’administration et les services connectés. Les comptes, permissions, préférences et ressources peuvent être partagés entre les différentes fonctions du système.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <article className="rounded-3xl border border-border bg-card p-6"><LockKeyhole className="h-5 w-5 text-primary" /><h3 className="mt-4 font-display text-xl font-bold">Espace privé</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Administration, IA personnelle, fichiers, agenda, messages, contacts, abonnés, notifications, automatisations et supervision.</p></article>
                <article className="rounded-3xl border border-border bg-card p-6"><Globe2 className="h-5 w-5 text-primary" /><h3 className="mt-4 font-display text-xl font-bold">Services connectés</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">APIs, services Web et fonctions publiques reliées au même environnement.</p></article>
              </div>
            </div>
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 md:p-8">
              <MessageSquareText className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-display text-2xl font-bold text-foreground">Communications centralisées</h3>
              <p className="mt-4 leading-7 text-muted-foreground">Messages, demandes du site, e-mails, contacts, abonnés et notifications sont gérés depuis l’espace administrateur, sans réseau social public séparé.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-tight py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Modules complémentaires</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">Des fonctions supplémentaires intégrées à l’OS.</h2>
          <p className="mt-4 leading-7 text-muted-foreground">Ces modules complètent Flamme OS, mais ne définissent pas son rôle principal.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {secondaryModules.map((module) => {
            const Icon = module.icon;
            return <article key={module.title} className="rounded-2xl border border-border bg-card p-5"><Icon className="h-5 w-5 text-primary" /><h3 className="mt-4 font-display font-bold text-foreground">{module.title}</h3></article>;
          })}
        </div>
      </section>

      <section className="container-tight pb-14 md:pb-20">
        <div className="rounded-3xl border border-border bg-card p-6 md:p-9">
          <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-primary" /><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Flamme OS</p></div>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground">Administrer, organiser, automatiser, superviser.</h2>
          <p className="mt-5 max-w-3xl leading-7 text-muted-foreground">C’est le cœur de Flamme OS. La recherche, Films & Séries et les médias restent des services complémentaires ; les fonctions de communication utiles sont intégrées directement à l’administration.</p>
        </div>
      </section>
    </main>
  );
}
