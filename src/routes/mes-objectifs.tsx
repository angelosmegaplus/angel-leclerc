import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  BriefcaseBusiness,
  Download,
  ExternalLink,
  FileSearch,
  GraduationCap,
  Headphones,
  School,
  Search,
  ShieldCheck,
  Target,
  Waves,
} from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import { Logo } from "@/components/Logo";
import talisLogo from "@/assets/talis-logo.png";

const TITLE = "Mes objectifs — Angel Leclerc";
const DESCRIPTION =
  "Projet d'études et objectifs professionnels d'Angel Leclerc : BTS Communication, journalisme d'investigation, presse et radio.";

export const Route = createFileRoute("/mes-objectifs")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MesObjectifsPage,
});

type Institution = {
  name: string;
  place: string;
  type: string;
  href: string;
  domain: string;
  localLogo?: string;
};

type SchoolEntry = {
  name: string;
  place: string;
  level: string;
  access: string;
  focus: string;
  href: string;
  domain: string;
};

const institutions: Institution[] = [
  {
    name: "Talis",
    place: "Périgueux",
    type: "BTS Communication · alternance",
    href: "https://www.talis.community/campus/perigueux/",
    domain: "talis.community",
    localLogo: talisLogo,
  },
  {
    name: "IBSAC",
    place: "Brive-la-Gaillarde",
    type: "BTS Communication · alternance envisageable",
    href: "https://www.ibsac.fr/",
    domain: "ibsac.fr",
  },
  {
    name: "CNED",
    place: "À distance",
    type: "BTS Communication · formation à distance",
    href: "https://www.cned.fr/bts/bts-communication",
    domain: "cned.fr",
  },
];

const journalistSchools: SchoolEntry[] = [
  {
    name: "CFJ",
    place: "Paris / Lyon",
    level: "Diplôme visé Bac+5",
    access: "Après un premier cursus supérieur et admission sélective",
    focus:
      "Enquête, terrain, vérification de l'information, sources, reportage et formats longs : une base solide pour évoluer vers le journalisme d'investigation, en presse comme en audio.",
    href: "https://cfjparis.com/formation/diplome-bac-plus-5/les-parcours/",
    domain: "cfjparis.com",
  },
  {
    name: "IPJ Dauphine–PSL",
    place: "Paris",
    level: "Master Journalisme",
    access: "Admission sur concours après un cursus de niveau licence",
    focus:
      "Méthodes journalistiques, enquête, recherche documentaire, terrain, traitement des sources, déontologie et production pour plusieurs formats éditoriaux.",
    href: "https://ipj.eu/",
    domain: "ipj.eu",
  },
  {
    name: "ESJ Lille",
    place: "Lille",
    level: "Diplôme généraliste niveau Master",
    access: "Plusieurs voies d'accès et diplôme généraliste",
    focus:
      "Formation généraliste reconnue avec forte pratique du terrain, vérification, reportage et journalisme multimédia, permettant ensuite de développer une spécialisation en enquête et investigation.",
    href: "https://esj-lille.fr/programmes/",
    domain: "esj-lille.fr",
  },
  {
    name: "EJT",
    place: "Toulouse",
    level: "Formation au métier de journaliste",
    access: "Admission propre à l'école",
    focus:
      "Apprentissage du reportage, du terrain, de la recherche d'informations, de l'interview et de l'écriture journalistique pour différents supports.",
    href: "https://ejt.fr/",
    domain: "ejt.fr",
  },
];

const hostSchools: SchoolEntry[] = [
  {
    name: "INA campus",
    place: "Bry-sur-Marne",
    level: "TFP Animateur / Animatrice radio",
    access: "Formation professionnalisante en alternance",
    focus:
      "Conception, production et animation de programmes radio et podcasts, stratégie digitale, réseaux sociaux et pratique en studio.",
    href: "https://campus.ina.fr/formations-radio-a-ina-campus",
    domain: "ina.fr",
  },
  {
    name: "ISCPA · STUDEC",
    place: "Paris",
    level: "Animation et réalisation radio · Bac+2",
    access: "Accessible après le bac, hors Parcoursup",
    focus:
      "Animation, réalisation, prise de parole, conduite du direct, préparation d'émission et fonctionnement d'un studio professionnel.",
    href: "https://www.iscpa-ecoles.com/formation/journalisme/formation-animation-radio",
    domain: "iscpa-ecoles.com",
  },
  {
    name: "La Skol",
    place: "Rennes",
    level: "TFP Animateur / Animatrice radio",
    access: "Parcours en alternance",
    focus:
      "Animation, production, préparation éditoriale, pratique d'antenne et application professionnelle en radio.",
    href: "https://www.cpnef-av.fr/les-formations/tfp-animateur-radio",
    domain: "laskol.fr",
  },
];

const radios = [
  { name: "France Inter", domain: "franceinter.fr" },
  { name: "franceinfo", domain: "franceinfo.fr" },
  { name: "ICI", domain: "radiofrance.fr" },
  { name: "RTL", domain: "rtl.fr" },
  { name: "Europe 1", domain: "europe1.fr" },
  { name: "Happy Radio", domain: "happyradio.fr" },
  { name: "RCF Notre-Dame", domain: "rcf.fr" },
  { name: "RMC", domain: "rmc.bfmtv.com" },
  { name: "NRJ", domain: "nrj.fr" },
  { name: "Skyrock", domain: "skyrock.fm" },
  { name: "Fun Radio", domain: "funradio.fr" },
  { name: "RFM", domain: "rfm.fr" },
  { name: "Europe 2", domain: "europe2.fr" },
  { name: "Sud Radio", domain: "sudradio.fr" },
  { name: "Radio Classique", domain: "radioclassique.fr" },
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function BrandMark({
  domain,
  name,
  size = "md",
  localLogo,
}: {
  domain: string;
  name: string;
  size?: "sm" | "md";
  localLogo?: string;
}) {
  const px = size === "sm" ? 48 : 64;
  if (localLogo) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-white p-2"
        style={{ width: px, height: px }}
      >
        <img
          src={localLogo}
          alt={`Logo ${name}`}
          width={px}
          height={px}
          className="h-full w-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </span>
    );
  }
  return <Logo domain={domain} alt={`Logo ${name}`} size={px} link={false} />;
}

function SchoolCard({ school }: { school: SchoolEntry }) {
  return (
    <a
      href={school.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="flex items-center justify-between gap-4">
        <BrandMark domain={school.domain} name={school.name} />
        <ExternalLink size={16} aria-hidden="true" className="shrink-0 text-muted-foreground group-hover:text-primary" />
      </div>
      <h4 className="mt-4 font-display text-lg font-semibold text-foreground group-hover:text-primary">
        {school.name}
        <span className="sr-only"> (nouvel onglet)</span>
      </h4>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary">
        {school.place} · {school.level}
      </p>
      <p className="mt-3 text-sm font-medium text-foreground/90">{school.access}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{school.focus}</p>
    </a>
  );
}

function RadioMarquee() {
  const loop = [...radios, ...radios];
  return (
    <div
      className="relative mt-10 overflow-hidden border-y border-border bg-background/80 py-5"
      role="list"
      aria-label="Radios de référence"
    >
      <div className="objectives-radio-marquee flex w-max items-center gap-4 pr-4">
        {loop.map((radio, index) => (
          <div
            key={`${radio.name}-${index}`}
            role="listitem"
            aria-hidden={index >= radios.length ? true : undefined}
            className="flex h-20 w-44 shrink-0 items-center gap-3 rounded-2xl border border-border bg-card px-4 shadow-sm"
          >
            <BrandMark domain={radio.domain} name={radio.name} size="sm" />
            <span className="text-sm font-semibold leading-tight">{radio.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MesObjectifsPage() {
  return (
    <main className="overflow-hidden pb-24 md:pb-16">
      <style>{`@keyframes objectives-radio-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}.objectives-radio-marquee{animation:objectives-radio-scroll 36s linear infinite;will-change:transform}.objectives-radio-marquee:hover{animation-play-state:paused}@media(prefers-reduced-motion:reduce){.objectives-radio-marquee{animation:none;flex-wrap:wrap;width:auto;justify-content:center}}`}</style>

      <AnimatedSection>
        <section className="section-padding bg-muted/40">
          <div className="container-tight">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Target size={16} aria-hidden="true" /> Projet d'avenir
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold md:text-6xl">Mes objectifs</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Construire un parcours stable et cohérent entre communication, information, journalisme et radio. La
              formation reste un objectif important, avec un calendrier volontairement souple afin de laisser aussi la
              place à une expérience professionnelle stable.
            </p>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="section-padding" aria-labelledby="objectifs-bts">
          <div className="container-tight">
            <div className="flex items-center gap-3">
              <GraduationCap className="text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Projet de formation</p>
                <h2 id="objectifs-bts" className="font-display text-3xl font-bold">
                  BTS Communication
                </h2>
              </div>
            </div>
            <p className="mt-5 max-w-3xl leading-relaxed text-muted-foreground">
              Le BTS Communication reste la formation centrale envisagée pour renforcer mes compétences en stratégie,
              rédaction, création de contenus, médias et gestion de projets. Le calendrier n'est pas figé : l'objectif
              est de choisir la formule la plus cohérente au bon moment.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Card>
                <BookOpen className="text-primary" aria-hidden="true" />
                <p className="mt-3 font-semibold">BTS Communication</p>
              </Card>
              <Card>
                <School className="text-primary" aria-hidden="true" />
                <p className="mt-3 font-semibold">Alternance ou distance</p>
              </Card>
              <Card>
                <BriefcaseBusiness className="text-primary" aria-hidden="true" />
                <p className="mt-3 font-semibold">Priorité : situation stable</p>
              </Card>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {institutions.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <BrandMark domain={item.domain} name={item.name} localLogo={item.localLogo} />
                  <h3 className="mt-4 font-display text-xl font-semibold">
                    {item.name}
                    <span className="sr-only"> (nouvel onglet)</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">{item.place}</p>
                  <p className="mt-2 text-sm">{item.type}</p>
                </a>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <p className="font-semibold">Documents Talis</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="/bts/programme-bts-com-talis.pdf"
                  download
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Download size={14} aria-hidden="true" /> Programme PDF
                </a>
                <a
                  href="/bts/calendrier-bts-com-talis.pdf"
                  download
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Download size={14} aria-hidden="true" /> Calendrier indicatif
                </a>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="section-padding bg-muted/40" aria-labelledby="objectifs-journalisme">
          <div className="container-tight">
            <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-start gap-4">
                <FileSearch className="mt-1 shrink-0 text-primary" size={30} aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">Journalisme</p>
                  <h2 id="objectifs-journalisme" className="mt-1 font-display text-3xl font-bold">
                    Journaliste d'investigation
                  </h2>
                  <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
                    Ce qui m'intéresse est d'abord le travail d'enquête : partir d'un sujet, chercher ce qui n'est pas
                    immédiatement visible, confronter des versions, retrouver des documents et des témoins, vérifier
                    chaque élément et construire un récit journalistique solide. Le support peut être la radio, le
                    podcast, la presse écrite ou le web : l'investigation reste le cœur du métier que je vise.
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <Card>
                  <Search className="text-primary" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold">Enquêter sur le terrain</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Trouver des sujets, identifier les acteurs, rencontrer des témoins, conduire des entretiens
                    approfondis et suivre une enquête dans la durée.
                  </p>
                </Card>
                <Card>
                  <ShieldCheck className="text-primary" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold">Vérifier et protéger les sources</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Recouper les informations, analyser des documents, distinguer faits et affirmations, travailler avec
                    méthode et respecter la déontologie journalistique.
                  </p>
                </Card>
                <Card className="sm:col-span-2 md:col-span-1">
                  <Waves className="text-primary" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold">Construire et raconter l'enquête</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Articles approfondis, dossiers, reportages longs, séries documentaires, podcasts d'investigation,
                    témoignages et archives : choisir le format qui sert le mieux l'enquête.
                  </p>
                </Card>
              </div>

              <div className="mt-7 rounded-2xl bg-muted p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Compétences à développer
                </p>
                <p className="mt-3 text-sm leading-relaxed">
                  Techniques d'enquête · recherche documentaire · sources ouvertes · entretiens · fact-checking ·
                  recoupement · droit de la presse · déontologie · protection des sources · reportage de terrain ·
                  écriture journalistique presse et audio · prise de son · montage · documentaire · podcast et formats
                  longs.
                </p>
              </div>

              <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-primary">
                Écoles et formations envisageables
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {journalistSchools.map((school) => (
                  <SchoolCard key={school.name} school={school} />
                ))}
              </div>
            </div>

            <div className="mt-10 rounded-3xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-start gap-4">
                <Headphones className="mt-1 shrink-0 text-primary" size={30} aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">Animation</p>
                  <h2 className="mt-1 font-display text-3xl font-bold">Animateur radio</h2>
                  <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
                    Un projet différent : concevoir une émission, développer un ton, maîtriser le direct, mener des
                    interviews, créer une relation avec les auditeurs et participer à l'identité d'une antenne.
                  </p>
                </div>
              </div>
              <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-primary">
                Formations spécialisées
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {hostSchools.map((school) => (
                  <SchoolCard key={school.name} school={school} />
                ))}
              </div>
            </div>

            <RadioMarquee />
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
}
