import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Maximize2,
  Palette,
  Sparkles,
  X,
} from "lucide-react";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio créatif — Angel Leclerc" },
      {
        name: "description",
        content:
          "Affiches, flyers, publications, logos, identités visuelles et supports numériques créés par Angel Leclerc.",
      },
      { property: "og:title", content: "Portfolio créatif — Angel Leclerc" },
      {
        property: "og:description",
        content:
          "Une sélection de créations graphiques pour des projets personnels, professionnels et associatifs.",
      },
      { property: "og:url", content: "/portfolio" },
    ],
    links: [{ rel: "canonical", href: "/portfolio" }],
  }),
  component: PortfolioPage,
});

type Category =
  | "Logos & identités"
  | "Affiches & flyers"
  | "Réseaux sociaux"
  | "Documents & supports";

type Work = {
  title: string;
  category: Category;
  description: string;
  image: string;
  aspect: string;
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
    description: "Recherche autour de l’identité visuelle d’Angel Leclerc Communication.",
    image: "/portfolio/logo-alc.webp",
    aspect: "aspect-[16/9]",
  },
  {
    title: "FdS",
    category: "Logos & identités",
    description: "Une identité créée pour un univers associatif et collectif.",
    image: "/portfolio/fds.webp",
    aspect: "aspect-square",
  },
  {
    title: "Éclaireurs Libres de France",
    category: "Logos & identités",
    description: "Travail d’identité visuelle autour d’un projet scout associatif.",
    image: "/portfolio/eclaireurs-libres.webp",
    aspect: "aspect-[4/5]",
  },
  {
    title: "Tombola Patrimoine",
    category: "Affiches & flyers",
    description: "Visuel de campagne pour présenter rapidement une opération de collecte.",
    image: "/portfolio/tombola.webp",
    aspect: "aspect-[4/5]",
  },
  {
    title: "Flyers Renard Noir",
    category: "Affiches & flyers",
    description: "Création de flyer avec une identité graphique pensée pour être immédiatement reconnaissable.",
    image: "/portfolio/flyer-renard-noir.webp",
    aspect: "aspect-[4/5]",
  },
  {
    title: "Collecte de dons",
    category: "Affiches & flyers",
    description: "Une affiche simple et lisible conçue pour faire passer le message en quelques secondes.",
    image: "/portfolio/collecte-dons.webp",
    aspect: "aspect-[4/5]",
  },
  {
    title: "Journée ramassage de déchets",
    category: "Affiches & flyers",
    description: "Affiche événementielle autour d’une action locale et solidaire.",
    image: "/portfolio/ramassage-dechets.webp",
    aspect: "aspect-[4/5]",
  },
  {
    title: "Gannat — ouverture",
    category: "Affiches & flyers",
    description: "Une création événementielle issue de mes réalisations plus anciennes.",
    image: "/portfolio/gannat-ouverture.webp",
    aspect: "aspect-[4/5]",
  },
  {
    title: "Freshtalk Radio",
    category: "Réseaux sociaux",
    description: "Visuel promotionnel autour de la radio, du rythme et de l’identité d’émission.",
    image: "/portfolio/freshtalk-radio.webp",
    aspect: "aspect-[4/5]",
  },
  {
    title: "Modèle de publication ALC!",
    category: "Réseaux sociaux",
    description: "Recherche de format réutilisable pour garder une identité cohérente sur les réseaux sociaux.",
    image: "/portfolio/modele-post-alc.webp",
    aspect: "aspect-[4/5]",
  },
  {
    title: "Livret partenaire",
    category: "Documents & supports",
    description: "Exemple de document de présentation pensé pour organiser beaucoup d’informations de façon claire.",
    image: "/portfolio/livret-partenaire.webp",
    aspect: "aspect-[4/5]",
  },
];

const categories = [
  "Tout",
  "Logos & identités",
  "Affiches & flyers",
  "Réseaux sociaux",
  "Documents & supports",
] as const;

const creationTypes = [
  { icon: ImageIcon, text: "Affiches, flyers et publications pour les réseaux sociaux" },
  { icon: Palette, text: "Logos et identités visuelles simples" },
  { icon: FileText, text: "Documents de présentation et supports numériques" },
];

function PortfolioImage({ work }: { work: Work }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-white ${work.aspect}`}>
      {!failed ? (
        <img
          src={work.image}
          alt={work.title}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.015]"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full min-h-56 items-center justify-center bg-muted/40 p-8 text-center">
          <div>
            <Palette className="mx-auto h-7 w-7 text-primary" />
            <p className="mt-3 font-display text-lg font-bold text-foreground">{work.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">Aperçu indisponible</p>
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
          <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-20 -top-12 h-80 w-80 rounded-full bg-secondary/30 blur-3xl" />
        </div>

        <div className="container-tight relative py-12 md:py-20">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles size={14} /> Portfolio créatif
          </span>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Créations graphiques et <span className="text-primary">projets associatifs</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Missions ponctuelles de création de supports pour des projets personnels, professionnels et associatifs.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            J’aime aussi créer juste pour le plaisir : tester une idée, chercher une identité ou voir jusqu’où je peux pousser un visuel.
          </p>
        </div>
      </section>

      <section className="container-tight py-9 md:py-12">
        <div className="rounded-[1.6rem] border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
              <LayoutGrid size={21} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Ce que je crée</p>
              <h2 className="mt-1 font-display text-xl font-bold text-foreground">Des supports pensés pour chaque format</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {creationTypes.map(({ icon: Icon, text }) => (
              <div key={text} className="rounded-2xl border border-border bg-muted/25 p-4">
                <Icon size={19} className="text-primary" />
                <p className="mt-3 text-sm font-medium leading-relaxed text-foreground">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            <strong className="font-semibold text-foreground">Outil principal : Canva.</strong> Le but reste le même : obtenir des supports homogènes, réutilisables et adaptés au public comme au format.
          </div>
        </div>

        <details className="group mt-5 overflow-hidden rounded-[1.4rem] border border-border bg-card shadow-sm open:shadow-md">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:content-none sm:px-6 [&::-webkit-details-marker]:hidden">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Canva en chiffres</p>
              <p className="mt-1 font-display text-base font-bold text-foreground sm:text-lg">{canvaStats.total} créations recensées depuis avril 2022</p>
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
              {[
                [canvaStats.total, "créations Canva"],
                [canvaStats.yearly, "en moyenne"],
                [canvaStats.monthly, "en moyenne"],
                [canvaStats.weekly, "en moyenne"],
              ].map(([value, label], index) => (
                <div key={`${value}-${index}`} className="rounded-2xl border border-border bg-muted/35 p-4">
                  <p className={`font-display font-bold ${index === 0 ? "text-2xl text-primary sm:text-3xl" : "text-xl text-foreground sm:text-2xl"}`}>{value}</p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>{canvaStats.cadence} en moyenne.</span>
              <span className="sm:text-right">Comptage arrêté au {canvaStats.asOf}.</span>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/80">
              La date de départ correspond à la plus ancienne création retrouvée. Un design Canva de plusieurs pages compte ici comme une seule création.
            </p>
          </div>
        </details>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(category)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${filter === category ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"}`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((work) => (
            <button
              key={work.title}
              type="button"
              onClick={() => setSelected(work)}
              className="group overflow-hidden rounded-[1.4rem] border border-border bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-foreground/[0.06]"
            >
              <PortfolioImage work={work} />
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{work.category}</p>
                    <h2 className="mt-1 font-display text-lg font-bold text-foreground">{work.title}</h2>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full bg-primary/10 p-2 text-primary"><Maximize2 size={15} /></span>
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
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">Affiche, identité, publication ou support de présentation : expliquez-moi simplement l’idée.</p>
              </div>
              <a href="/contact" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#CE654B] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#A84D38]">Me contacter <ArrowRight size={16} /></a>
            </div>
          </div>
        </div>
      </section>

      {selected && (
        <div role="dialog" aria-modal="true" aria-label={selected.title} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101010]/85 p-3 backdrop-blur-sm sm:p-6" onClick={() => setSelected(null)}>
          <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.6rem] bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setSelected(null)} className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur transition-colors hover:bg-black" aria-label="Fermer"><X size={20} /></button>
            <div className="min-h-0 flex-1 overflow-auto bg-white p-3 sm:p-5">
              <img src={selected.image} alt={selected.title} className="mx-auto max-h-[72vh] w-auto max-w-full object-contain" />
            </div>
            <div className="border-t border-border p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{selected.category}</p>
              <h2 className="mt-1 font-display text-xl font-bold text-foreground">{selected.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{selected.description}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
