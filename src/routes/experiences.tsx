import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, FlaskConical, Search, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/experiences")({
  head: () => ({
    meta: [
      { title: "Expériences — Angel OS & Flamme" },
      {
        name: "description",
        content: "Une seule page pour découvrir les expériences numériques Angel OS et Flamme : administration, IA, recherche, services et réseau social.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Expériences — Angel OS & Flamme" },
      {
        property: "og:description",
        content: "Angel OS et Flamme réunis comme expériences numériques : des prototypes évolutifs pour tester de nouvelles idées d’interface, d’IA, de recherche et de réseau social.",
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

function ExperiencesPage() {
  return (
    <main className="overflow-hidden bg-background">
      <section className="relative border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.14),transparent_38%)]" />
        <div className="container-tight relative py-16 md:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-[.16em] text-primary">
            <FlaskConical className="h-4 w-4" /> Expériences numériques
          </div>
          <h1 className="mt-6 max-w-5xl font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Des idées que je transforme en expériences utilisables.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
            Cette page regroupe les projets expérimentaux du site. Angel OS et Flamme ne sont pas présentés comme des offres commerciales séparées : ce sont des terrains d’essai où je teste des interfaces, de l’intelligence artificielle, de l’automatisation, de la recherche et de nouvelles façons d’utiliser le Web.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><a href="#flamme">Découvrir Flamme <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
            <Button asChild size="lg" variant="outline"><a href="#angel-os">Voir Angel OS</a></Button>
          </div>
        </div>
      </section>

      <section id="flamme" className="container-tight scroll-mt-24 py-14 md:py-20">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <article className="rounded-3xl border border-border bg-card p-6 md:p-9">
            <div className="flex items-center gap-4">
              <img src="/flamme-social-logo.svg" alt="Logo Flamme" className="h-16 w-16 object-contain md:h-20 md:w-20" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Expérience · Bêta</p>
                <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Flamme</h2>
              </div>
            </div>
            <p className="mt-6 text-lg font-semibold leading-8 text-foreground">
              Une seule interface qui réunit recherche, services et réseau social.
            </p>
            <p className="mt-3 leading-7 text-muted-foreground">
              Flamme a commencé comme une page de recherche et d’accès rapide à des services numériques. L’expérience s’est ensuite élargie à un réseau social complet. L’objectif actuel est de faire fonctionner les deux comme un seul environnement cohérent, simple et très mobile.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild><Link to="/flamme/social">Ouvrir Flamme</Link></Button>
              <Button asChild variant="outline"><Link to="/flamme">Voir le moteur historique</Link></Button>
            </div>
          </article>

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
                  <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Expérience personnelle</p>
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
