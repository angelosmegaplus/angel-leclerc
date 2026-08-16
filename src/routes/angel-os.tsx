import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Bot,
  Boxes,
  BrainCircuit,
  CloudCog,
  Code2,
  Database,
  GitBranch,
  Globe2,
  HardDrive,
  HeartPulse,
  Layers3,
  Network,
  RefreshCcw,
  ServerCog,
  ShieldCheck,
  Smartphone,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/angel-os")({
  head: () => ({
    meta: [
      { title: "Angel OS — Noyau système, orchestration et applications" },
      {
        name: "description",
        content:
          "Angel OS est un socle système modulaire et Linux-ready qui coordonne applications, données, workflows, déploiements, stockage, supervision et récupération. Angel OS IA est sa distribution dédiée à l'intelligence artificielle.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Angel OS" },
      {
        property: "og:description",
        content:
          "Un socle système modulaire pour orchestrer applications, automatisations, données, infrastructure et intelligence artificielle sans dépendre d'un fournisseur unique.",
      },
      { property: "og:url", content: "https://www.angel-leclerc.fr/angel-os" },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/angel-os" }],
  }),
  component: AngelOsPublicPage,
});

const coreCapabilities = [
  {
    icon: Workflow,
    title: "Workflows durables",
    text: "Des opérations structurées avec état, reprise, tentatives et journalisation plutôt que des actions opaques qui disparaissent après une erreur.",
  },
  {
    icon: Activity,
    title: "Événements et télémétrie",
    text: "Le système peut produire des événements, états et métriques afin de rendre les opérations observables et d'éviter les échecs silencieux.",
  },
  {
    icon: Network,
    title: "Orchestration hybride",
    text: "Angel OS peut coordonner des services natifs et externes avec des stratégies de priorité, de secours, de sélection ou de combinaison adaptées au contexte.",
  },
  {
    icon: RefreshCcw,
    title: "Guardian et récupération",
    text: "Les anomalies peuvent être reliées à des politiques de reprise : nouvelle tentative, fournisseur de secours, resynchronisation, invalidation de cache ou restauration d'un état précédent.",
  },
  {
    icon: CloudCog,
    title: "Release et déploiement",
    text: "Une version peut être reliée à un commit, un état et une cible de déploiement. Vercel peut rester un nœud tandis qu'Angel Node prépare des cibles Linux supplémentaires.",
  },
  {
    icon: Database,
    title: "Données, mémoire et synchronisation",
    text: "Index de contexte, stockage, réconciliation de versions et détection de conflits sont pensés comme des services du système, indépendamment d'une interface unique.",
  },
] as const;

const layers = [
  {
    icon: ServerCog,
    label: "Socle",
    title: "Angel OS Core",
    text: "Le noyau coordonne événements, mémoire, workflows, déploiements, nœuds, synchronisation, stockage, supervision et runtime applicatif. Il doit rester utilisable sans intelligence artificielle.",
  },
  {
    icon: BrainCircuit,
    label: "Distribution",
    title: "Angel OS IA",
    text: "La couche IA ajoute fournisseurs de modèles, conversation, analyse, génération, agents et automatisation intelligente. Elle dépend d'Angel OS ; le noyau, lui, ne dépend pas d'elle.",
  },
  {
    icon: Globe2,
    label: "Application",
    title: "angel-leclerc.fr",
    text: "Le site public et son administration utilisent Angel OS et certaines capacités d'Angel OS IA. Le site est une application du système, pas le noyau lui-même.",
  },
] as const;

const principles = [
  {
    icon: ShieldCheck,
    title: "État réel, pas de faux statut",
    text: "Connecté, synchronisé, publié ou terminé doivent correspondre à une opération vérifiable. Une intégration indisponible doit être signalée comme telle.",
  },
  {
    icon: GitBranch,
    title: "GitHub comme source de vérité",
    text: "Le code, les versions et les contrôles techniques sont rattachés au dépôt de référence. Un commit n'est pas présenté comme publié tant que la production réelle n'est pas confirmée.",
  },
  {
    icon: Boxes,
    title: "Indépendance progressive",
    text: "Angel OS combine les services utiles au lieu de les supprimer artificiellement. L'objectif est d'éviter qu'un hébergeur, une base, un fournisseur IA ou une interface devienne un point de dépendance unique.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first et PWA",
    text: "L'espace d'administration est pensé en priorité pour une utilisation confortable sur Android, tout en conservant une expérience complète sur ordinateur.",
  },
] as const;

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
      {children}
    </span>
  );
}

function AngelOsPublicPage() {
  return (
    <main className="overflow-hidden bg-background">
      <section className="relative border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_42%)]" />
        <div className="container-tight relative py-16 md:py-24">
          <div className="flex flex-wrap items-center gap-4">
            <img
              src="/angel-os/logo.png"
              alt="Logo Angel OS"
              className="h-16 w-16 rounded-2xl object-contain shadow-sm md:h-20 md:w-20"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Système modulaire · Linux-ready</p>
              <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">Angel OS</h1>
            </div>
          </div>

          <div className="mt-8 flex max-w-4xl flex-wrap gap-2">
            <StatusBadge>Noyau système</StatusBadge>
            <StatusBadge>Orchestration hybride</StatusBadge>
            <StatusBadge>Applications</StatusBadge>
            <StatusBadge>Résilience</StatusBadge>
            <StatusBadge>IA séparée du Core</StatusBadge>
          </div>

          <h2 className="mt-8 max-w-4xl font-display text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
            Un seul socle pour coordonner l'infrastructure, les applications, les données et les automatisations.
          </h2>
          <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
            Angel OS n'est plus défini comme une simple interface d'administration. C'est un socle système modulaire conçu pour coordonner les flux, les workflows, les déploiements, les nœuds, le stockage, la synchronisation, la supervision et les applications qui s'appuient dessus. L'intelligence artificielle reste une distribution distincte afin que le cœur du système puisse continuer à fonctionner sans dépendre d'un modèle ou d'un fournisseur IA.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Accéder à l'administration <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/angel-os-ia">Découvrir Angel OS IA</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-tight py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Architecture</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">Trois niveaux, trois rôles différents</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            La frontière entre le système, l'intelligence artificielle et le site est volontairement stricte. Cela réduit les dépendances croisées et permet à chaque couche d'évoluer sans transformer tout le projet en bloc monolithique.
          </p>
        </div>

        <div className="mt-9 grid gap-4 lg:grid-cols-3">
          {layers.map(({ icon: Icon, label, title, text }) => (
            <article key={title} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">{label}</span>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-muted/30 p-6 md:p-8">
          <div className="grid gap-3 text-sm font-semibold text-foreground md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center md:text-center">
            <div className="rounded-2xl border border-border bg-background p-4">Linux / hôte</div>
            <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">Angel OS Core</div>
            <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />
            <div className="grid gap-2">
              <div className="rounded-2xl border border-border bg-background p-4">Angel OS IA</div>
              <div className="rounded-2xl border border-border bg-background p-4">angel-leclerc.fr</div>
              <div className="rounded-2xl border border-dashed border-border bg-background/60 p-4 text-muted-foreground">Applications futures</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="container-tight py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Noyau</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">Ce que le Core organise</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Ces briques décrivent les responsabilités du système. Leur disponibilité concrète dépend de l'environnement, des services réellement connectés et des cibles effectivement déployées.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {coreCapabilities.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-3xl border border-border bg-background p-6">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-tight py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Architecture hybride</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">Indépendant ne veut pas dire tout réinventer</h2>
            <p className="mt-5 leading-7 text-muted-foreground">
              Angel OS conserve les services externes utiles lorsqu'ils apportent une vraie valeur, tout en construisant des alternatives et mécanismes natifs pour réduire les points de panne uniques. GitHub peut rester la source de vérité du code, Vercel un nœud web, Google Drive un niveau d'archive et des services de données externes continuer à être utilisés tant qu'ils sont réellement disponibles.
            </p>
            <p className="mt-4 leading-7 text-muted-foreground">
              Le système ne prétend pas disposer d'un serveur Linux, de Redis, MySQL, Python, Rust ou d'une redondance réseau tant que l'infrastructure correspondante n'existe pas réellement. Les capacités sont activées et annoncées selon l'environnement réel.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Exemple de chaîne de déploiement</h3>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              {["GitHub", "Angel Release / Angel Deploy", "Vercel ou Angel Node Linux", "Gateway / réseau", "Client"].map((item, index, items) => (
                <div key={item}>
                  <div className="rounded-2xl border border-border bg-background px-4 py-3 font-medium text-foreground">{item}</div>
                  {index < items.length - 1 ? <div className="mx-auto h-5 w-px bg-border" /> : null}
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">
              Une vraie redondance publique nécessite au moins deux cibles indépendamment joignables et une couche réseau capable de basculer vers un nœud sain.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="container-tight py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Règles du système</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">La fiabilité passe avant l'effet vitrine</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {principles.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-3xl border border-border bg-background p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-tight py-14 md:py-20">
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-card p-7">
            <Bot className="h-6 w-6 text-primary" />
            <h2 className="mt-5 font-display text-2xl font-bold text-foreground">Angel OS IA</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              La distribution IA apporte les modèles, la conversation, l'analyse, la génération, les agents et les automatismes intelligents. Cette séparation permet de changer ou combiner des fournisseurs sans enfermer le noyau Angel OS dans une technologie IA unique.
            </p>
            <Link to="/angel-os-ia" className="mt-5 inline-flex items-center gap-2 font-semibold text-primary hover:underline">
              Voir la présentation Angel OS IA <ArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="rounded-3xl border border-border bg-card p-7">
            <Code2 className="h-6 w-6 text-primary" />
            <h2 className="mt-5 font-display text-2xl font-bold text-foreground">Une plateforme qui peut évoluer</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Le runtime applicatif permet de construire plusieurs applications au-dessus du même Core. L'objectif est de mutualiser orchestration, mémoire opérationnelle, supervision, stockage, déploiement et récupération au lieu de reconstruire ces mécanismes pour chaque nouvelle interface.
            </p>
          </article>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="container-tight py-14 md:py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-semibold">Services externes et données</span>
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold text-foreground">Connexions volontaires et capacités vérifiables</h2>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              Lorsqu'un service externe est connecté, Angel OS utilise les autorisations réellement accordées pour fournir les fonctions demandées. Les connecteurs ne doivent pas être présentés comme actifs lorsqu'ils ne répondent pas ou lorsque leurs autorisations sont absentes. Les détails relatifs aux données et aux autorisations sont décrits dans les documents juridiques du site.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link to="/politique-confidentialite" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
                Politique de confidentialité <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/conditions-utilisation" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
                Conditions d'utilisation <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
