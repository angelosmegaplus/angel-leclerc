import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/angel-os")({
  head: () => ({
    meta: [
      { title: "Angel OS — Architecture, IA et supervision" },
      {
        name: "description",
        content: "Angel OS réunit l'administration, les données, les automatisations, Angel OS IA et Angel Guard dans une architecture connectée.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Angel OS" },
      { property: "og:description", content: "L'architecture qui organise l'administration, l'intelligence artificielle, les données et la supervision d'angel-leclerc.fr." },
      { property: "og:url", content: "https://www.angel-leclerc.fr/angel-os" },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/angel-os" }],
  }),
  component: AngelOsPublicPage,
});

type Tech = { name: string; description: string; logo?: string; mark?: string };

const technologies: Tech[] = [
  { name: "ChatGPT", logo: "/logos/chatgpt.com.svg", description: "Intervient sur le développement, les corrections, la maintenance et certaines opérations automatisées autour d’Angel OS." },
  { name: "Angel OS IA API", mark: "AI", description: "Fournit les capacités d’intelligence artificielle utilisées directement par Angel OS IA." },
  { name: "React", mark: "R", description: "Structure les interfaces et les composants de l’application." },
  { name: "TypeScript", mark: "TS", description: "Porte la logique applicative et une grande partie du fonctionnement du système." },
  { name: "GitHub", mark: "GH", description: "Centralise le code source, les versions et l’historique des modifications." },
  { name: "Vercel", mark: "▲", description: "Construit et déploie l’application web." },
  { name: "Supabase", mark: "S", description: "Gère la base de données, l’authentification et des données internes d’Angel OS." },
  { name: "Google APIs", logo: "/logos/google.com.svg", description: "Connectent les services Google utilisés par Angel OS, notamment Gmail et Google Calendar." },
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
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Architecture connectée</p>
              <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">Angel OS</h1>
            </div>
          </div>
          <h2 className="mt-8 max-w-4xl font-display text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
            Un environnement pour organiser l’administration, les données, l’intelligence artificielle et les automatisations.
          </h2>
          <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
            Angel OS est l’architecture qui organise l’espace administrateur d’angel-leclerc.fr, ses données, ses automatisations, ses connecteurs et ses fonctions internes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/auth">Accéder à l’administration <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/angel-os-ia">Angel OS IA</Link></Button>
          </div>
        </div>
      </section>

      <section className="container-tight py-14 md:py-20">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BrainCircuit className="h-5 w-5" /></div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[.18em] text-primary">Intelligence artificielle</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-foreground">Angel OS IA</h2>
            <p className="mt-3 leading-7 text-muted-foreground">Utilise les données disponibles dans l’espace administrateur pour rechercher, analyser, rédiger, assister certaines actions et exploiter le contexte du système.</p>
          </article>
          <article className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[.18em] text-primary">Supervision</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-foreground">Angel Guard</h2>
            <p className="mt-3 leading-7 text-muted-foreground">Surveille le fonctionnement d’Angel OS, détecte des anomalies, centralise des incidents et participe aux contrôles techniques et aux mécanismes de récupération.</p>
          </article>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="container-tight py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Infrastructure</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">Les technologies connectées à Angel OS</h2>
            <p className="mt-4 leading-7 text-muted-foreground">L’ensemble fonctionne avec une infrastructure connectée associant les technologies et API utilisées par le système.</p>
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
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Fonctionnement</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground">Un même système, plusieurs rôles</h2>
          <div className="mt-7 grid gap-3 md:grid-cols-4 md:items-center md:text-center">
            <div className="rounded-2xl border border-border bg-background p-4 font-semibold">ChatGPT</div>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 font-semibold">Angel OS</div>
            <div className="rounded-2xl border border-border bg-background p-4 font-semibold">Angel OS IA</div>
            <div className="rounded-2xl border border-border bg-background p-4 font-semibold">Angel Guard</div>
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-7 text-muted-foreground">ChatGPT intervient autour du projet pour le développement et la maintenance. Angel OS organise l’application et ses données. Angel OS IA apporte les fonctions intelligentes intégrées. Angel Guard assure la supervision technique du système.</p>
        </div>
      </section>
    </main>
  );
}
