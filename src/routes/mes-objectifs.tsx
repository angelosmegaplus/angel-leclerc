import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, BriefcaseBusiness, Download, ExternalLink, GraduationCap, Headphones, School, Target, Waves, Search, FileSearch, ShieldCheck } from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import { Logo } from "@/components/Logo";
import talisLogo from "@/assets/talis-logo.png";

export const Route = createFileRoute("/mes-objectifs")({
  head: () => ({
    meta: [
      { title: "Mes objectifs — Angel Leclerc" },
      { name: "description", content: "Projet d'études et objectifs professionnels d'Angel Leclerc dans la communication, le journalisme d'investigation, la presse et la radio." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MesObjectifsPage,
});

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md md:p-6 ${className}`}>{children}</div>
);

type BrandData = { name: string; domain: string; logoUrl?: string; localLogo?: string; mark?: string };
type SchoolEntry = BrandData & { place: string; level: string; access: string; focus: string; href: string };

const commons = (file: string) => `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(file)}`;

const institutions = [
  { name: "Talis", place: "Périgueux", type: "BTS Communication · alternance", href: "https://www.talis.community/campus/perigueux/", domain: "talis.community", localLogo: talisLogo },
  { name: "IBSAC", place: "Brive-la-Gaillarde", type: "BTS Communication · alternance envisageable", href: "https://www.ibsac.fr/", domain: "ibsac.fr", mark: "IBSAC" },
  { name: "CNED", place: "À distance", type: "BTS Communication · formation à distance", href: "https://www.cned.fr/bts/bts-communication", domain: "cned.fr", mark: "CNED" },
];

const journalistSchools: SchoolEntry[] = [
  { name: "CFJ", place: "Paris / Lyon", level: "Diplôme visé Bac+5", access: "Après un premier cursus supérieur et admission sélective", focus: "Enquête, terrain, vérification de l'information, sources, reportage et formats longs : une base solide pour évoluer vers le journalisme d'investigation, en presse comme en audio.", href: "https://cfjparis.com/formation/diplome-bac-plus-5/les-parcours/", domain: "cfjparis.com", logoUrl: commons("Logo CFJ.svg") },
  { name: "IPJ Dauphine–PSL", place: "Paris", level: "Master Journalisme", access: "Admission sur concours après un cursus de niveau licence", focus: "Méthodes journalistiques, enquête, recherche documentaire, terrain, traitement des sources, déontologie et production pour plusieurs formats éditoriaux.", href: "https://ipj.eu/", domain: "ipj.eu", logoUrl: commons("New Logo IPJ Dauphine-PSL 2019.png") },
  { name: "ESJ Lille", place: "Lille", level: "Diplôme généraliste niveau Master", access: "Plusieurs voies d'accès et diplôme généraliste", focus: "Formation généraliste reconnue avec forte pratique du terrain, vérification, reportage et journalisme multimédia, permettant ensuite de développer une spécialisation en enquête et investigation.", href: "https://esj-lille.fr/programmes/", domain: "esj-lille.fr", logoUrl: commons("ESJ-ULille.svg") },
  { name: "EJT", place: "Toulouse", level: "Formation au métier de journaliste", access: "Admission propre à l'école", focus: "Apprentissage du reportage, du terrain, de la recherche d'informations, de l'interview et de l'écriture journalistique pour différents supports.", href: "https://ejt.fr/", domain: "ejt.fr", logoUrl: commons("EjTlogo.png") },
];

const hostSchools: SchoolEntry[] = [
  { name: "INA campus", place: "Bry-sur-Marne", level: "TFP Animateur / Animatrice radio", access: "Formation professionnalisante en alternance", focus: "Conception, production et animation de programmes radio et podcasts, stratégie digitale, réseaux sociaux et pratique en studio.", href: "https://campus.ina.fr/formations-radio-a-ina-campus", domain: "ina.fr", logoUrl: commons("Logo INA.svg") },
  { name: "ISCPA · STUDEC", place: "Paris", level: "Animation et réalisation radio · Bac+2", access: "Accessible après le bac, hors Parcoursup", focus: "Animation, réalisation, prise de parole, conduite du direct, préparation d'émission et fonctionnement d'un studio professionnel.", href: "https://www.iscpa-ecoles.com/formation/journalisme/formation-animation-radio", domain: "iscpa-ecoles.com", mark: "ISCPA" },
  { name: "La Skol", place: "Rennes", level: "TFP Animateur / Animatrice radio", access: "Parcours en alternance", focus: "Animation, production, préparation éditoriale, pratique d'antenne et application professionnelle en radio.", href: "https://www.laskol.fr/", domain: "laskol.fr", mark: "LA SKOL" },
];

const radios: BrandData[] = [
  { name: "France Inter", domain: "franceinter.fr", logoUrl: commons("France Inter logo 2021.svg") },
  { name: "franceinfo", domain: "franceinfo.fr", mark: "franceinfo:" },
  { name: "ICI", domain: "radiofrance.fr", mark: "ICI" },
  { name: "RTL", domain: "rtl.fr", logoUrl: commons("RTL logo.svg") },
  { name: "Europe 1", domain: "europe1.fr", mark: "Europe 1" },
  { name: "Happy Radio", domain: "happyradio.fr", mark: "HAPPY" },
  { name: "RCF Notre-Dame", domain: "rcf.fr", mark: "RCF" },
  { name: "RMC", domain: "rmc.bfmtv.com", mark: "RMC" },
  { name: "NRJ", domain: "nrj.fr", mark: "NRJ" },
  { name: "Skyrock", domain: "skyrock.fm", mark: "SKYROCK" },
  { name: "Fun Radio", domain: "funradio.fr", mark: "FUN RADIO" },
  { name: "RFM", domain: "rfm.fr", mark: "RFM" },
  { name: "Europe 2", domain: "europe2.fr", mark: "EUROPE 2" },
  { name: "Sud Radio", domain: "sudradio.fr", mark: "SUD RADIO" },
  { name: "Radio Classique", domain: "radioclassique.fr", logoUrl: commons("Logo Radio Classique.svg") },
];

function BrandMark({ domain, name, size = "md", localLogo, logoUrl, mark }: BrandData & { size?: "sm" | "md" }) {
  const px = size === "sm" ? 48 : 64;
  const image = localLogo ?? logoUrl;
  if (image) {
    return (
      <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2" style={{ width: px, height: px }}>
        <img src={image} alt={`Logo ${name}`} className="h-full w-full object-contain" loading="lazy" decoding="async" />
      </span>
    );
  }
  if (mark) {
    return (
      <span className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-white px-2 text-center font-display text-[10px] font-black leading-tight tracking-tight text-black" style={{ width: px, height: px }} aria-label={`Identité ${name}`}>
        {mark}
      </span>
    );
  }
  return <Logo domain={domain} alt={`Logo ${name}`} size={px} link={false} />;
}

function SchoolCard({ school }: { school: SchoolEntry }) {
  return (
    <a href={school.href} target="_blank" rel="noopener noreferrer" className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md md:p-6">
      <div className="flex items-center justify-between gap-4">
        <BrandMark {...school} />
        <ExternalLink size={17} className="shrink-0 text-muted-foreground group-hover:text-primary" />
      </div>
      <h4 className="mt-6 font-display text-xl font-semibold leading-tight text-foreground group-hover:text-primary">{school.name}</h4>
      <p className="mt-3 text-xs font-semibold uppercase leading-relaxed tracking-wider text-primary">{school.place} · {school.level}</p>
      <p className="mt-5 text-sm font-medium leading-relaxed text-foreground/90">{school.access}</p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{school.focus}</p>
    </a>
  );
}

function RadioMarquee() {
  const loop = [...radios, ...radios];
  return (
    <div className="relative mt-12 overflow-hidden border-y border-border bg-background/80 py-5">
      <div className="objectives-radio-marquee flex w-max items-center gap-4 pr-4">
        {loop.map((radio, index) => (
          <div key={`${radio.name}-${index}`} className="flex h-20 w-44 shrink-0 items-center gap-3 rounded-2xl border border-border bg-card px-4 shadow-sm">
            <BrandMark {...radio} size="sm" />
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
      <style>{`@keyframes objectives-radio-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}.objectives-radio-marquee{animation:objectives-radio-scroll 36s linear infinite}.objectives-radio-marquee:hover{animation-play-state:paused}@media(prefers-reduced-motion:reduce){.objectives-radio-marquee{animation:none;flex-wrap:wrap;width:auto;justify-content:center}}`}</style>

      <AnimatedSection>
        <section className="section-padding bg-muted/40">
          <div className="container-tight">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary"><Target size={16} /> Projet d'avenir</span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight md:text-6xl">Mes objectifs</h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">Construire un parcours stable entre communication, journalisme et radio, avec un calendrier volontairement souple.</p>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="section-padding">
          <div className="container-tight">
            <div className="flex items-start gap-4">
              <GraduationCap className="mt-1 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Projet de formation</p>
                <h2 className="mt-3 font-display text-3xl font-bold leading-tight">BTS Communication</h2>
              </div>
            </div>
            <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">Renforcer mes compétences en stratégie, rédaction, création de contenus et gestion de projets, au moment le plus cohérent avec ma situation.</p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <Card><BookOpen className="text-primary" /><p className="mt-4 font-semibold">BTS Communication</p></Card>
              <Card><School className="text-primary" /><p className="mt-4 font-semibold">Alternance ou distance</p></Card>
              <Card><BriefcaseBusiness className="text-primary" /><p className="mt-4 font-semibold">Priorité : situation stable</p></Card>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {institutions.map((item) => (
                <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40">
                  <BrandMark {...item} />
                  <h3 className="mt-6 font-display text-xl font-semibold">{item.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.place}</p>
                  <p className="mt-4 text-sm leading-relaxed">{item.type}</p>
                </a>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-border bg-card p-6">
              <p className="font-semibold">Documents Talis</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="/bts/programme-bts-com-talis.pdf" download className="rounded-lg border px-3 py-2 text-xs"><Download size={14} className="inline" /> Programme PDF</a>
                <a href="/bts/calendrier-bts-com-talis.pdf" download className="rounded-lg border px-3 py-2 text-xs"><Download size={14} className="inline" /> Calendrier indicatif</a>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="section-padding bg-muted/40">
          <div className="container-tight">
            <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-start gap-4">
                <FileSearch className="mt-1 shrink-0 text-primary" size={30} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">Journalisme</p>
                  <h3 className="mt-3 font-display text-3xl font-bold leading-tight">Journaliste d'investigation</h3>
                  <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">Enquêter, confronter les versions, retrouver des documents et des témoins, vérifier les faits et construire un récit solide, en presse, en audio ou sur le web.</p>
                </div>
              </div>

              <div className="mt-9 grid gap-4 md:grid-cols-3">
                <Card><Search className="text-primary" /><h4 className="mt-4 font-semibold">Enquêter sur le terrain</h4><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Trouver des sujets, rencontrer des témoins, conduire des entretiens et suivre une enquête dans la durée.</p></Card>
                <Card><ShieldCheck className="text-primary" /><h4 className="mt-4 font-semibold">Vérifier et protéger les sources</h4><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Recouper, analyser des documents, distinguer faits et affirmations et respecter la déontologie.</p></Card>
                <Card><Waves className="text-primary" /><h4 className="mt-4 font-semibold">Construire l'enquête</h4><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Articles, dossiers, reportages longs, documentaires et podcasts d'investigation.</p></Card>
              </div>

              <div className="mt-9 rounded-2xl bg-muted p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Compétences à développer</p>
                <p className="mt-4 text-sm leading-relaxed">Techniques d'enquête · recherche documentaire · sources ouvertes · entretiens · fact-checking · recoupement · droit de la presse · déontologie · protection des sources · reportage · écriture presse et audio · montage · formats longs.</p>
              </div>

              <p className="mt-12 text-xs font-semibold uppercase tracking-widest text-primary">Écoles et formations envisageables</p>
              <div className="mt-6 grid gap-5 md:grid-cols-2">{journalistSchools.map((school) => <SchoolCard key={school.name} school={school} />)}</div>
            </div>

            <div className="mt-12 rounded-3xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-start gap-4">
                <Headphones className="mt-1 shrink-0 text-primary" size={30} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">Animation</p>
                  <h3 className="mt-3 font-display text-3xl font-bold leading-tight">Animateur radio</h3>
                  <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">Concevoir une émission, maîtriser le direct, mener des interviews et développer une identité d'antenne.</p>
                </div>
              </div>

              <p className="mt-12 text-xs font-semibold uppercase tracking-widest text-primary">Formations spécialisées</p>
              <div className="mt-6 grid gap-5 md:grid-cols-3">{hostSchools.map((school) => <SchoolCard key={school.name} school={school} />)}</div>
            </div>

            <RadioMarquee />
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
}
