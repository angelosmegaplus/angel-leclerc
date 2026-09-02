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
  Tv,
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
        content: "Flamme OS réunit dans un même logiciel l’administration, l’IA, la recherche, Films & Séries, les médias, les services et les fonctions sociales d’angel-leclerc.fr.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Flamme OS — écosystème numérique" },
      {
        property: "og:description",
        content: "Un seul logiciel, plusieurs modules : administration, IA, recherche, Films & Séries, radio, TV et social.",
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
    text: "Catalogue, recommandations, listes et découverte de films, séries et documentaires deviennent un module natif de Flamme OS.",
    icon: Clapperboard,
  },
  {
    title: "IA",
    text: "Assistance, recherche, rédaction, classement et automatisations sont regroupés dans la couche intelligente de Flamme OS.",
    icon: BrainCircuit,
  },
  {
    title: "Administration",
    text: "L’ancien Angel OS devient le centre de contrôle privé de Flamme OS pour administrer le site, les contenus, les données et les outils.",
    icon: Workflow,
  },
  {
    title: "Social & messagerie",
    text: "Publications, stories, vidéos, forum, découverte, profils et messagerie restent intégrés au même logiciel.",
    icon: UsersRound,
  },
  {
    title: "Radio & TV",
    text: "Les accès radio, podcasts, télévision et replay font partie de la même expérience Flamme OS.",
    icon: RadioTower,
  },
];

const architecture = [
  {
    index: "01",
    title: "Un seul nom",
    text: "Flamme OS est désormais la marque unique. Les anciens noms restent seulement comme repères techniques lorsque c’est nécessaire pour la compatibilité.",
    icon: Sparkles,
  },
  {
    index: "02",
    title: "Des modules spécialisés",
    text: "Films & Séries, IA, recherche, social, médias et administration ne sont plus présentés comme des produits séparés : ce sont des fonctions de Flamme OS.",
    icon: Network,
  },
  {
    index: "03",
    title: "Des données communes",
    text: "Les modules peuvent partager les mêmes comptes, préférences, données et services afin d’éviter les silos et les doublons.",
    icon: Database,
  },
  {
    index: "04",
    title: "Un espace privé intégré",
    text: "Le tableau de bord autrefois nommé Angel OS devient l’administration de Flamme OS, avec authentification et droits adaptés.",
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
              <Sparkles className="h-4 w-4" /> Système unifié
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">Flamme OS</h1>
            <p className="mt-5 max-w-3xl text-xl font-semibold leading-8 text-foreground md:text-2xl">Un seul logiciel. Tous les outils numériques du site au même endroit.</p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
              Flamme, Films & Séries et Angel OS ne sont désormais plus présentés comme des logiciels distincts. Ils forment un seul environnement : <strong className="text-foreground">Flamme OS</strong>. Chaque ancienne fonctionnalité devient un module spécialisé du même système.
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
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-5xl">Tout appartient maintenant à Flamme OS.</h2>
          <p className="mt-5 leading-7 text-muted-foreground">Les fonctions gardent leur spécialité, mais plus leur identité de logiciel séparé.</p>
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
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Les anciennes briques Angel OS IA deviennent simplement la fonction IA de Flamme OS.</p>
          </article>
          <article className="rounded-3xl border border-border bg-card p-6">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="mt-4 font-display text-xl font-bold">Sécurité & contrôle</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Authentification, rôles et supervision restent derrière la même administration Flamme OS.</p>
          </article>
          <article className="rounded-3xl border border-border bg-card p-6">
            <MessageSquareText className="h-5 w-5 text-primary" />
            <h3 className="mt-4 font-display text-xl font-bold">Une expérience cohérente</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Même compte, même logique d’interface et mêmes données partagées lorsque les modules le permettent.</p>
          </article>
        </div>

        <div className="mt-10 rounded-3xl border border-primary/20 bg-primary/5 p-6 md:p-9">
          <div className="flex items-center gap-3"><Globe2 className="h-5 w-5 text-primary" /><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Règle de marque</p></div>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground">Flamme OS est le produit. Le reste, ce sont ses modules.</h2>
          <p className="mt-5 max-w-3xl leading-7 text-muted-foreground">Les anciennes routes comme <code>/angel-os</code>, <code>/angel-os-ia</code> ou certaines appellations historiques peuvent être conservées techniquement pour ne rien casser, mais elles ne définissent plus des logiciels séparés.</p>
        </div>
      </section>
    </main>
  );
}
