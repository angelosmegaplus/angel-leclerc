import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ExternalLink,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Waves,
} from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";

export const Route = createFileRoute("/mes-objectifs")({
  head: () => ({
    meta: [
      { title: "Mes objectifs — Angel Leclerc" },
      { name: "description", content: "Projet de formation et objectifs professionnels dans la communication, le journalisme d'investigation et la radio." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MesObjectifsPage,
});

const LOGO_VERSION = "20260822-1";
const local = (name: string) => `/logos/objectives/${name}.svg?v=${LOGO_VERSION}`;

type BrandData = { name: string; localLogo?: string; webLogo?: string; mark?: string };
type SchoolEntry = BrandData & { place: string; level: string; access: string; focus: string; href: string };

function SectionHeader({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        <Sparkles size={12} /> {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-[1.65rem] font-bold leading-tight text-foreground sm:text-3xl md:text-4xl">{title}</h2>
      {intro ? <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground md:mt-4 md:text-base">{intro}</p> : null}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md sm:p-6">{children}</div>;
}

const journalistSchools: SchoolEntry[] = [
  { name: "CFJ", place: "Paris / Lyon", level: "Diplôme visé Bac+5", access: "Après un premier cursus supérieur et admission sélective", focus: "Enquête, terrain, vérification de l'information, sources, reportage et formats longs.", href: "https://cfjparis.com/", localLogo: local("cfj"), mark: "CFJ" },
  { name: "IPJ Dauphine–PSL", place: "Paris", level: "Master Journalisme", access: "Admission sur concours après un cursus de niveau licence", focus: "Méthodes journalistiques, recherche documentaire, enquête, terrain, traitement des sources et déontologie.", href: "https://ipj.eu/", localLogo: local("ipj"), mark: "IPJ" },
  { name: "ESJ Lille", place: "Lille", level: "Diplôme généraliste niveau Master", access: "Plusieurs voies d'accès", focus: "Formation généraliste avec forte pratique du terrain, de la vérification, du reportage et du multimédia.", href: "https://esj-lille.fr/programmes/", localLogo: local("esj-lille"), mark: "ESJ" },
  { name: "EJT", place: "Toulouse", level: "Formation au métier de journaliste", access: "Admission propre à l'école", focus: "Reportage, terrain, recherche d'informations, interview et écriture journalistique.", href: "https://ejt.fr/", localLogo: local("ejt"), mark: "EJT" },
];

const hostSchools: SchoolEntry[] = [
  { name: "INA campus", place: "Bry-sur-Marne", level: "TFP Animateur / Animatrice radio", access: "Formation professionnalisante en alternance", focus: "Conception, production et animation de programmes radio et podcasts, avec pratique en studio.", href: "https://campus.ina.fr/formations-radio-a-ina-campus", localLogo: local("ina"), mark: "INA" },
  { name: "ISCPA · STUDEC", place: "Paris", level: "Animation et réalisation radio · Bac+2", access: "Accessible après le bac", focus: "Animation, réalisation, prise de parole, direct, préparation d'émission et fonctionnement d'un studio.", href: "https://www.iscpa-ecoles.com/formation/journalisme/formation-animation-radio", webLogo: "https://www.iscpa-ecoles.com/favicon.ico", mark: "ISCPA" },
  { name: "La Skol", place: "Rennes", level: "TFP Animateur / Animatrice radio", access: "Parcours en alternance", focus: "Animation, production, préparation éditoriale et pratique professionnelle de l'antenne.", href: "https://www.laskol.fr/", webLogo: "https://www.laskol.fr/wp-content/uploads/2023/11/logo_t_vert.png", mark: "LA SKOL" },
];

function BrandMark({ name, localLogo, webLogo, mark }: BrandData) {
  const sources = [webLogo, localLogo].filter(Boolean) as string[];
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = sources[sourceIndex];
  return (
    <span className="flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white p-2.5 shadow-sm">
      {src ? <img src={src} alt={`Logo ${name}`} className="h-full w-full object-contain" loading="lazy" decoding="async" onError={() => setSourceIndex((index) => index + 1)} /> : <span className="text-center font-display text-[13px] font-black uppercase leading-tight tracking-tight text-black">{mark ?? name}</span>}
    </span>
  );
}

function SchoolCard({ school }: { school: SchoolEntry }) {
  return (
    <a href={school.href} target="_blank" rel="noopener noreferrer" className="group flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-4"><BrandMark {...school} /><ExternalLink size={17} className="mt-1 shrink-0 text-muted-foreground group-hover:text-primary" /></div>
      <h3 className="mt-5 font-display text-lg font-semibold leading-tight text-foreground sm:text-xl">{school.name}</h3>
      <p className="mt-2 text-[11px] font-semibold uppercase leading-relaxed tracking-widest text-primary">{school.place} · {school.level}</p>
      <p className="mt-4 text-sm font-medium leading-relaxed text-foreground/90">{school.access}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{school.focus}</p>
    </a>
  );
}

function MesObjectifsPage() {
  return (
    <main className="overflow-hidden pb-24 md:pb-0">
      <AnimatedSection><section className="section-padding bg-background"><div className="container-tight"><SectionHeader eyebrow="Projet d'avenir" title="Mes objectifs" intro="Communication, journalisme et radio : plusieurs possibilités, avec une priorité donnée à une situation stable et à un parcours cohérent." /><div className="mx-auto mt-6 flex max-w-2xl items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-foreground/80"><TriangleAlert size={18} className="mt-0.5 shrink-0 text-amber-600" /><p><span className="font-semibold text-foreground">Page en cours de construction.</span> Des erreurs de texte, d’icônes ou de visuels peuvent encore être présentes.</p></div></div></section></AnimatedSection>
      <AnimatedSection><section className="section-padding bg-background"><div className="container-tight"><SectionHeader eyebrow="Voie principale · Journalisme" title="Journaliste d'investigation" intro="Enquêter, confronter les versions, retrouver des documents et des témoins, vérifier les faits et construire un récit solide." /><div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:mt-12"><YouTubeEmbed id="xcnYwQRZcGQ" title="Comment travaillent les journalistes d'investigation ?" /></div><div className="mt-6 grid gap-4 md:grid-cols-3"><Card><Search className="text-primary" size={22} /><h3 className="mt-4 font-semibold">Enquêter sur le terrain</h3></Card><Card><ShieldCheck className="text-primary" size={22} /><h3 className="mt-4 font-semibold">Vérifier les sources</h3></Card><Card><Waves className="text-primary" size={22} /><h3 className="mt-4 font-semibold">Construire l'enquête</h3></Card></div><p className="mt-10 text-center text-xs font-semibold uppercase tracking-widest text-primary">Écoles et formations envisageables</p><div className="mt-5 grid gap-4 md:grid-cols-2">{journalistSchools.map((school) => <SchoolCard key={school.name} school={school} />)}</div></div></section></AnimatedSection>
      <AnimatedSection><section className="section-padding bg-muted/40"><div className="container-tight"><SectionHeader eyebrow="Plan B · Radio" title="Animateur radio" intro="Une deuxième voie possible, davantage centrée sur le divertissement et la personnalité d'antenne : concevoir des émissions très rythmées, faire vivre le direct, jouer avec l'improvisation et l'humour, recevoir des invités, lancer des jeux et créer une vraie interaction avec les auditeurs." /><div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:mt-12"><YouTubeEmbed id="2eC3bFEnTlA" title="Présentation du métier d'animateur radio" /></div><p className="mt-10 text-center text-xs font-semibold uppercase tracking-widest text-primary">Formations spécialisées</p><div className="mt-5 grid gap-4 md:grid-cols-3">{hostSchools.map((school) => <SchoolCard key={school.name} school={school} />)}</div></div></section></AnimatedSection>
    </main>
  );
}
