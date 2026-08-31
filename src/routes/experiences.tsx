import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Bot,
  BrainCircuit,
  Database,
  FlaskConical,
  Globe2,
  LockKeyhole,
  MessageSquareText,
  Network,
  Search,
  ServerCog,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/experiences")({
  head: () => ({
    meta: [
      { title: "Expériences — Angel OS & Flamme" },
      {
        name: "description",
        content: "Découvrez comment angel-leclerc.fr, Angel OS et Flamme s’articulent : administration, IA, données, automatisations, recherche et réseau social.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Expériences — Angel OS & Flamme" },
      {
        property: "og:description",
        content: "Une cartographie claire du système Angel OS, du site public et des expériences Flamme.",
      },
      { property: "og:url", content: "https://www.angel-leclerc.fr/experiences" },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/experiences" }],
  }),
  component: ExperiencesPage,
});

const angelFeatures = [
  "Administration du site",
  "IA et assistance",
  "Automatisations",
  "Agenda et messagerie",
  "Contenus et fichiers",
  "Recherche interne",
];

const flammeSearchFeatures = [
  "Recherche Web via Qwant ou Lilo",
  "Actualités, images, vidéos et cartes",
  "Services numériques français",
  "IA Mistral intégrée",
  "Raccourcis et panneaux de services",
  "Interface pensée pour le mobile",
];

const flammeSocialFeatures = [
  "Publications et stories",
  "Vidéos verticales",
  "Forum et découverte",
  "Messagerie chiffrée",
  "Profils, signalements et modération",
  "Recherche et services dans la même interface",
];

const flowSteps = [
  {
    index: "01",
    title: "Le visiteur arrive sur le site",
    text: "angel-leclerc.fr est la façade publique : pages, articles, portfolio, formulaire de contact et outils accessibles sans entrer dans l’administration.",
    icon: Globe2,
  },
  {
    index: "02",
    title: "Le site appelle ses services",
    text: "Les demandes passent par des routes serveur et des services dédiés : recherche, formulaires, IA, authentification, contenus et autres fonctions dynamiques.",
    icon: ServerCog,
  },
  {
    index: "03",
    title: "Les données sont centralisées",
    text: "Les informations utiles sont stockées et structurées afin d’être réutilisées par le site public et par les outils internes sans dupliquer le travail.",
    icon: Database,
  },
  {
    index: "04",
    title: "Angel OS pilote l’ensemble",
    text: "L’espace privé sert de centre de contrôle : contenus, agenda, messagerie, candidatures, studio, IA et fonctions expérimentales sont regroupés dans une seule interface.",
    icon: Workflow,
  },
  {
    index: "05",
    title: "L’IA assiste, elle ne remplace pas le contrôle",
    text: "Les fonctions d’IA peuvent aider à rechercher, rédiger, classer ou synthétiser. La validation humaine et les droits d’accès restent au centre du système.",
    icon: BrainCircuit,
  },
  {
    index: "06",
    title: "Flamme sert de laboratoire parallèle",
    text: "Flamme teste d’autres usages — recherche, services, réseau social et nouvelles interfaces — tout en restant une expérience distincte d’Angel OS.",
    icon: Network,
  },
];

function FeatureChips({ items }: { items: string[] }) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {item}
        </span>
      ))}
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-2 lg:hidden" aria-hidden="true">
      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/5 text-primary"
      >
        <ArrowDown className="h-4 w-4" />
      </motion.div>
    </div>
  );
}

function SystemMap() {
  return (
    <section className="relative border-b border-border bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/.35))]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-10 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[6%] top-44 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container-tight relative py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.16em] text-primary shadow-sm">
            <Network className="h-4 w-4" /> Carte du système
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Comment fonctionne tout l’écosystème.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
            Le site public, Angel OS, les données, l’intelligence artificielle et Flamme ne sont pas des blocs isolés. Voici comment les différentes briques communiquent, ce qui est public, ce qui reste privé et où chaque fonction intervient.
          </p>
        </motion.div>

        <div className="relative mt-12 lg:mt-16">
          <div className="pointer-events-none absolute left-0 right-0 top-[5.25rem] hidden h-px lg:block">
            <div className="relative mx-[8%] h-px overflow-hidden bg-border">
              <motion.div
                className="absolute inset-y-0 w-28 bg-gradient-to-r from-transparent via-primary to-transparent"
                animate={{ x: ["-140px", "1100px"] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-6 lg:gap-3">
            {flowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.index} className="contents">
                  <motion.article
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.45, delay: index * 0.07 }}
                    whileHover={{ y: -5 }}
                    className="relative z-10 rounded-3xl border border-border bg-card/95 p-5 shadow-sm backdrop-blur transition-shadow hover:shadow-lg lg:min-h-[21rem]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-display text-xs font-bold tracking-[.18em] text-muted-foreground/60">{step.index}</span>
                    </div>
                    <h2 className="mt-5 font-display text-lg font-bold leading-6 text-foreground">{step.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.text}</p>
                  </motion.article>
                  {index < flowSteps.length - 1 && <FlowArrow />}
                </div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-10 grid gap-4 md:grid-cols-3"
        >
          <div className="rounded-2xl border border-border bg-background/80 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Globe2 className="h-4 w-4 text-primary" /> Zone publique</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Pages du site, articles, expériences publiques, formulaires et interfaces destinées aux visiteurs.</p>
          </div>
          <div className="rounded-2xl border border-border bg-background/80 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><LockKeyhole className="h-4 w-4 text-primary" /> Zone privée</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Angel OS et ses outils d’administration nécessitent une authentification et des droits adaptés.</p>
          </div>
          <div className="rounded-2xl border border-border bg-background/80 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Bot className="h-4 w-4 text-primary" /> Couche intelligente</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">L’IA intervient comme outil d’assistance autour des contenus, de la recherche et de certains flux de travail.</p>
          </div>
        </motion.div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg"><a href="#angel-os">Explorer Angel OS <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
          <Button asChild size="lg" variant="outline"><a href="#flamme">Découvrir Flamme</a></Button>
        </div>
      </div>
    </section>
  );
}

function ExperiencesPage() {
  return (
    <main className="overflow-hidden bg-background">
      <SystemMap />

      <section className="border-b border-border">
        <div className="container-tight py-12 md:py-16">
          <div className="grid gap-6 lg:grid-cols-[1fr_.8fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-[.16em] text-primary">
                <FlaskConical className="h-4 w-4" /> Expériences numériques
              </div>
              <h2 className="mt-5 max-w-4xl font-display text-3xl font-bold tracking-tight text-foreground md:text-5xl">Deux laboratoires, deux usages.</h2>
            </div>
            <p className="text-sm leading-7 text-muted-foreground md:text-base">
              Angel OS sert surtout à organiser et piloter l’écosystème du site. Flamme explore davantage la recherche, les services et les interactions sociales. Les deux évoluent au fil des tests.
            </p>
          </div>
        </div>
      </section>

      <section id="flamme" className="container-tight scroll-mt-24 py-14 md:py-20">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <motion.article whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 18 }} viewport={{ once: true }} className="rounded-3xl border border-border bg-card p-6 md:p-9">
            <div className="flex items-center gap-4">
              <img src="/flamme-social-logo.svg" alt="Logo Flamme" className="h-16 w-16 object-contain md:h-20 md:w-20" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Expérience · Bêta</p>
                <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Flamme</h2>
              </div>
            </div>
            <p className="mt-6 text-lg font-semibold leading-8 text-foreground">Une seule interface qui réunit recherche, services et réseau social.</p>
            <p className="mt-3 leading-7 text-muted-foreground">
              Flamme a commencé comme une page de recherche et d’accès rapide à des services numériques. L’expérience s’est ensuite élargie à un réseau social complet. L’objectif actuel est de faire fonctionner les deux comme un seul environnement cohérent, simple et très mobile.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild><Link to="/flamme/social">Ouvrir Flamme</Link></Button>
              <Button asChild variant="outline"><Link to="/flamme">Voir le moteur historique</Link></Button>
            </div>
          </motion.article>

          <div className="grid gap-5">
            <article className="rounded-3xl border border-border bg-background p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Search className="h-5 w-5" /></div>
              <h3 className="mt-5 font-display text-2xl font-bold text-foreground">Recherche & services</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Le volet historique de Flamme : moteur de recherche, actualités, services français, raccourcis et IA.</p>
              <FeatureChips items={flammeSearchFeatures} />
            </article>
            <article className="rounded-3xl border border-border bg-background p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UsersRound className="h-5 w-5" /></div>
              <h3 className="mt-5 font-display text-2xl font-bold text-foreground">Réseau social</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Un réseau né autour du scoutisme puis ouvert à tous, avec publications, vidéos, forum, découverte et messagerie.</p>
              <FeatureChips items={flammeSocialFeatures} />
            </article>
          </div>
        </div>
      </section>

      <section id="angel-os" className="scroll-mt-24 border-y border-border bg-muted/30">
        <div className="container-tight py-14 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
            <div>
              <div className="flex items-center gap-4">
                <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-16 w-16 rounded-2xl object-contain shadow-sm md:h-20 md:w-20" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Centre de contrôle expérimental</p>
                  <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Angel OS</h2>
                </div>
              </div>
              <p className="mt-6 text-lg font-semibold leading-8 text-foreground">La couche expérimentale qui organise et automatise angel-leclerc.fr.</p>
              <p className="mt-3 leading-7 text-muted-foreground">
                Angel OS est le nom donné à l’ensemble des fonctions internes qui relient administration, contenus, données, IA et automatisations. Il sert surtout de laboratoire pour tester de nouvelles façons de gérer un site et son activité depuis une interface unique.
              </p>
              <FeatureChips items={angelFeatures} />
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild><Link to="/angel-os-ia">Voir Angel OS IA</Link></Button>
                <Button asChild variant="outline"><Link to="/auth">Espace administrateur</Link></Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-3xl border border-border bg-card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BrainCircuit className="h-5 w-5" /></div>
                <h3 className="mt-5 font-display text-xl font-bold text-foreground">IA intégrée</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">Aide à la rédaction, recherche, assistance et expérimentations d’interface alimentées par différents modèles et services.</p>
              </article>
              <article className="rounded-3xl border border-border bg-card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div>
                <h3 className="mt-5 font-display text-xl font-bold text-foreground">Sécurité & contrôle</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">Authentification, rôles, contrôles de données et concepts de supervision expérimentaux liés à l’administration du site.</p>
              </article>
              <article className="rounded-3xl border border-border bg-card p-6 sm:col-span-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MessageSquareText className="h-5 w-5" /></div>
                <h3 className="mt-5 font-display text-xl font-bold text-foreground">Un seul tableau de bord</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">L’objectif est de réduire les allers-retours entre plusieurs outils en regroupant progressivement les fonctions utiles au même endroit.</p>
              </article>
              <article className="rounded-3xl border border-border bg-card p-6 sm:col-span-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></div>
                <h3 className="mt-5 font-display text-xl font-bold text-foreground">Un laboratoire qui évolue</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">Les fonctions peuvent changer, être fusionnées ou disparaître. Le but est précisément d’essayer, d’apprendre et de transformer les meilleures idées en usages concrets.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="container-tight py-14 md:py-20">
        <div className="rounded-3xl border border-border bg-card p-6 md:p-9">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Même logique</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground">Tester, simplifier, recommencer.</h2>
          <p className="mt-5 max-w-3xl leading-7 text-muted-foreground">
            Angel OS et Flamme appartiennent au même ensemble d’expérimentations personnelles. Ils peuvent utiliser des technologies différentes, mais suivent la même idée : construire rapidement, observer ce qui fonctionne et améliorer l’expérience au fur et à mesure.
          </p>
        </div>
      </section>
    </main>
  );
}
