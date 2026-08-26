import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Maximize2, Sparkles, X } from "lucide-react";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio créatif — Angel Leclerc" },
      {
        name: "description",
        content:
          "Une sélection de logos, affiches, identités visuelles et expérimentations graphiques créées par Angel Leclerc.",
      },
      { property: "og:title", content: "Portfolio créatif — Angel Leclerc" },
      {
        property: "og:description",
        content:
          "Logos, affiches, identités et expérimentations : une sélection de créations graphiques d'Angel Leclerc.",
      },
      { property: "og:url", content: "/portfolio" },
    ],
    links: [{ rel: "canonical", href: "/portfolio" }],
  }),
  component: PortfolioPage,
});

type Category = "Logos & identités" | "Affiches" | "Expérimentations" | "Projets";

type Work = {
  title: string;
  category: Category;
  description: string;
  image: string;
  aspect?: string;
  featured?: boolean;
};

const canvaStats = {
  total: "950",
  firstCreation: "1er avril 2022",
  period: "4 ans, 4 mois et 25 jours",
  yearly: "≈ 216 / an",
  monthly: "≈ 18 / mois",
  weekly: "≈ 4,1 / semaine",
  cadence: "1 création tous les 1,7 jour",
  asOf: "26 août 2026",
};

const works: Work[] = [
  {
    title: "Logo ALC!",
    category: "Logos & identités",
    description: "Une exploration autour de l’identité Angel Leclerc Communication.",
    image: "/portfolio/logo-alc.webp",
    aspect: "aspect-[16/9]",
    featured: true,
  },
  {
    title: "FdS",
    category: "Logos & identités",
    description: "Une identité pensée autour d’un univers associatif et collectif.",
    image: "/portfolio/fds.webp",
    aspect: "aspect-square",
  },
  {
    title: "Angel OS",
    category: "Expérimentations",
    description: "Donner une identité visuelle à un projet numérique personnel.",
    image: "/portfolio/angel-os.webp",
    aspect: "aspect-square",
    featured: true,
  },
  {
    title: "FireBox",
    category: "Expérimentations",
    description: "Recherche d’identité autour d’un logiciel et d’un univers numérique.",
    image: "/portfolio/firebox.webp",
    aspect: "aspect-video",
  },
  {
    title: "Éclaireurs Libres de France",
    category: "Projets",
    description: "Une identité scout contemporaine, simple et reconnaissable.",
    image: "/portfolio/eclaireurs-libres.webp",
    aspect: "aspect-[3/4]",
  },
  {
    title: "Tombola",
    category: "Affiches",
    description: "Des visuels de campagne conçus pour faire comprendre un projet en quelques secondes.",
    image: "/portfolio/tombola.webp",
    aspect: "aspect-[4/5]",
    featured: true,
  },
  {
    title: "Gannat — ouverture",
    category: "Affiches",
    description: "Un exemple de création événementielle plus ancienne.",
    image: "/portfolio/gannat-ouverture.webp",
    aspect: "aspect-[3/4]",
  },
  {
    title: "Freshtalk Radio",
    category: "Affiches",
    description: "Une exploration autour de la radio, du rythme et de l’identité d’émission.",
    image: "/portfolio/freshtalk-radio.webp",
    aspect: "aspect-[4/5]",
  },
  {
    title: "Collecte de dons",
    category: "Affiches",
    description: "Une affiche pensée pour être simple, lisible et immédiatement compréhensible.",
    image: "/portfolio/collecte-dons.webp",
    aspect: "aspect-[3/4]",
  },
  {
    title: "Identité politique — exploration",
    category: "Expérimentations",
    description: "Une expérimentation de composition graphique et d’identité politique.",
    image: "/portfolio/identite-politique.webp",
    aspect: "aspect-[16/6]",
  },
];

const categories = ["Tout", "Logos & identités", "Affiches", "Expérimentations", "Projets"] as const;

function PortfolioImage({ work, className = "" }: { work: Work; className?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-primary/15 via-muted to-secondary/40 ${className}`}>
      {!failed ? (
        <img
          src={work.image}
          alt={work.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full min-h-52 items-center justify-center p-8 text-center">
          <div>
            <Sparkles className="mx-auto h-7 w-7 text-primary" />
            <p className="mt-3 font-display text-lg font-bold text-foreground">{work.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">Aperçu temporairement indisponible</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PortfolioPage() {
  const [filter, setFilter] = useState<(typeof categories)[number]>("Tout");
  const [selected, setSelected] = useState<Work | null>(null);

  const filtered = useMemo(
    () => (filter === "Tout" ? works : works.filter((work) => work.category === filter)),
    [filter],
  );

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border bg-[#F6F1E8]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-20 -top-16 h-80 w-80 rounded-full bg-secondary/40 blur-3xl" />
        </div>
        <div className="container-tight relative py-14 md:py-20">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles size={14} /> Portfolio créatif
          </span>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Je crée aussi <span className="text-primary">pour le plaisir.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Je crée beaucoup. Parfois pour un projet, une association ou mon activité. Parfois juste parce qu’une idée me passe par la tête et que j’ai envie de tester un style. Logos, affiches, identités, visuels… voici une petite sélection.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Certaines créations ont servi à de vrais projets. D’autres sont des prototypes, des exercices ou de simples expérimentations graphiques.
          </p>
        </div>
      </section>

      <section className="container-tight py-10 md:py-14">
        <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(category)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                filter === category
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <details className="group mt-6 overflow-hidden rounded-[1.4rem] border border-border bg-card shadow-sm open:shadow-md">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:content-none sm:px-6 [&::-webkit-details-marker]:hidden">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Canva en chiffres</p>
              <p className="mt-1 font-display text-base font-bold text-foreground sm:text-lg">
                {canvaStats.total} créations recensées depuis avril 2022
              </p>
            </div>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ChevronDown size={18} className="transition-transform duration-300 group-open:rotate-180" />
            </span>
          </summary>

          <div className="border-t border-border px-5 py-5 sm:px-6 sm:py-6">
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              La première création retrouvée dans mon compte Canva date du <strong className="font-semibold text-foreground">{canvaStats.firstCreation}</strong>. Au {canvaStats.asOf}, cela représente {canvaStats.period} de créations, d’essais et de projets.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-2xl border border-border bg-muted/35 p-4">
                <p className="font-display text-2xl font-bold text-primary sm:text-3xl">{canvaStats.total}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">créations Canva</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/35 p-4">
                <p className="font-display text-xl font-bold text-foreground sm:text-2xl">{canvaStats.yearly}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">en moyenne</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/35 p-4">
                <p className="font-display text-xl font-bold text-foreground sm:text-2xl">{canvaStats.monthly}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">en moyenne</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/35 p-4">
                <p className="font-display text-xl font-bold text-foreground sm:text-2xl">{canvaStats.weekly}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">en moyenne</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>{canvaStats.cadence} en moyenne.</span>
              <span className="sm:text-right">Comptage arrêté au {canvaStats.asOf}.</span>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/80">
              Canva ne fournit pas ici la date officielle de création du compte ni la date de passage à Canva Pro. La date de départ correspond donc à la plus ancienne création retrouvée. Le compteur recense les designs dont je suis propriétaire ; un design de plusieurs pages compte comme une seule création.
            </p>
          </div>
        </details>

        <div className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {filtered.map((work, index) => (
            <button
              key={`${work.title}-${index}`}
              type="button"
              onClick={() => setSelected(work)}
              className="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-[1.4rem] border border-border bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-foreground/[0.06]"
            >
              <PortfolioImage work={work} className={work.aspect ?? "aspect-[4/5]"} />
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{work.category}</p>
                    <h2 className="mt-1 font-display text-lg font-bold text-foreground">{work.title}</h2>
                  </div>
                  <span className="inline-flex rounded-full bg-primary/10 p-2 text-primary">
                    <Maximize2 size={15} />
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{work.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/35 py-12 md:py-16">
        <div className="container-tight">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#172638] px-6 py-9 text-[#FFFDF9] md:px-10 md:py-11">
            <div aria-hidden className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#CE654B]/25 blur-3xl" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#CE654B]">Un projet en tête ?</p>
                <h2 className="mt-2 max-w-xl font-display text-2xl font-bold md:text-3xl">On peut aussi créer quelque chose pour vous.</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">Identité, affiche, support de communication ou projet un peu différent : expliquez-moi simplement l’idée.</p>
              </div>
              <a href="/contact" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#CE654B] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#A84D38]">
                Me contacter <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101010]/85 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-5xl overflow-auto rounded-[1.5rem] bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Fermer"
              className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur"
            >
              <X size={20} />
            </button>
            <PortfolioImage work={selected} className="max-h-[68vh] min-h-64 w-full" />
            <div className="p-5 md:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{selected.category}</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-foreground md:text-3xl">{selected.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">{selected.description}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
