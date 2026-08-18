import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/angel-os")({
  head: () => ({
    meta: [
      { title: "Angel OS — Projet personnel et expérimental" },
      {
        name: "description",
        content: "Angel OS est mon projet personnel et expérimental : l'identité et l'ensemble des fonctions qui organisent l'administration, les contenus, l'IA et les automatisations d'angel-leclerc.fr.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Angel OS" },
      { property: "og:description", content: "Projet personnel et expérimental : la couche qui regroupe l'administration, les contenus, l'IA et les automatisations d'angel-leclerc.fr." },
      { property: "og:url", content: "https://www.angel-leclerc.fr/angel-os" },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/angel-os" }],
  }),
  component: AngelOsPublicPage,
});

type Tech = { name: string; description: string; logo?: string; mark?: string };

const technologies: Tech[] = [
  { name: "Lovable", mark: "LV", description: "Plateforme actuelle sur laquelle une partie du site est construite, hébergée et publiée." },
  { name: "Passerelle IA Lovable", mark: "AI", description: "Fournit les capacités d’intelligence artificielle (modèles Google Gemini) utilisées par les fonctions IA du site." },
  { name: "React", mark: "R", description: "Structure les interfaces et les composants de l’application." },
  { name: "TypeScript", mark: "TS", description: "Porte la logique applicative et une grande partie du fonctionnement du système." },
  { name: "GitHub", mark: "GH", description: "Centralise le code source, les versions et l’historique des modifications." },
  { name: "Base de données & authentification", mark: "DB", description: "Stocke les contenus, les données internes et gère la connexion à l’espace administrateur." },
  { name: "Google APIs", logo: "/logos/google.com.svg", description: "Connectent les services Google utilisés par le site, notamment Gmail et Google Calendar." },
  { name: "TMDB API", mark: "TMDB", description: "Alimente les recherches et les informations de l’espace Films & séries." },
];

function TechLogo({ tech }: { tech: Tech }) {
  if (tech.logo) {
    return <img src={tech.logo} alt={`Logo ${tech.name}`} className="h-8 w-8 object-contain" loading="lazy" />;
  }
  return (
    <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-primary/10 px-2 text-xs font-black tracking-tight text-primary" aria-hidden="true">
      {tech.mark}
    </span>
  );
}

function AngelOsPublicPage() {
  return (
    <main className="overflow-hidden bg-background">
      <section className="relative border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_42%)]" />
        <div className="container-tight relative py-16 md:py-24">
          <div className="flex items-center gap-4">
            <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-16 w-16 rounded-2xl object-contain shadow-sm md:h-20 md:w-20" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Projet personnel · Expérimental</p>
              <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">Angel OS</h1>
            </div>
          </div>
          <h2 className="mt-8 max-w-4xl font-display text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
            Le nom que je donne à l’ensemble des idées et des fonctions qui font vivre mon site.
          </h2>
          <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
            Angel OS est un projet personnel et expérimental. C’est à la fois une identité et une couche qui regroupe une partie des fonctions d’administration, d’intelligence artificielle, de données et d’automatisation du site. Il évolue au fil de mes essais, avec plusieurs outils : une partie du site est aujourd’hui construite et exploitée avec Lovable.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/auth">Accéder à l’administration <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/angel-os-ia">Angel OS IA</Link></Button>
          </div>
        </div>
      </section>

      <section className="container-tight py-14 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Ce qui existe aujourd’hui</p>
        <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">Les fonctions réellement présentes</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item) => (
            <div key={item} className="rounded-2xl border border-border bg-card px-5 py-4 text-sm font-medium text-foreground">{item}</div>
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BrainCircuit className="h-5 w-5" /></div>
            <h3 className="mt-6 font-display text-2xl font-bold text-foreground">Angel OS IA</h3>
            <p className="mt-3 leading-7 text-muted-foreground">Les fonctions d’intelligence artificielle intégrées au site : aide à la rédaction, recherche, assistance dans le formulaire de contact et dans l’administration.</p>
          </article>
          <article className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div>
            <h3 className="mt-6 font-display text-2xl font-bold text-foreground">Angel Guard</h3>
            <p className="mt-3 leading-7 text-muted-foreground">Un concept expérimental de sécurité et de supervision lié à Angel OS. Il s’agit d’une réflexion en cours, pas d’un système autonome : la sécurité réelle repose sur l’authentification, les rôles et les contrôles de la base de données.</p>
          </article>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="container-tight py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Infrastructure</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">Les technologies utilisées aujourd’hui</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Le site s’appuie sur quelques outils simples, dont Lovable, la plateforme actuelle de développement et de publication.</p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {technologies.map((tech) => (
              <article key={tech.name} className="rounded-3xl border border-border bg-background p-5">
                <div className="flex items-center gap-3"><TechLogo tech={tech} /><h3 className="font-semibold text-foreground">{tech.name}</h3></div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{tech.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-tight py-14 md:py-20">
        <div className="rounded-3xl border border-border bg-card p-6 md:p-9">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">En résumé</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground">Un projet qui avance par expérimentation</h2>
          <p className="mt-5 max-w-3xl leading-7 text-muted-foreground">Angel OS n’est pas un produit commercial. C’est un espace d’apprentissage où je teste des idées d’organisation, d’automatisation et d’intelligence artificielle appliquées à mon propre site. Certaines fonctions sont pleinement actives, d’autres restent à l’état de concept assumé.</p>
        </div>
      </section>
    </main>
  );
}
