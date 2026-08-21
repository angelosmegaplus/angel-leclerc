import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  BriefcaseBusiness,
  Download,
  ExternalLink,
  GraduationCap,
  Headphones,
  Mic2,
  Radio,
  Route as RouteIcon,
  School,
  Sparkles,
  Target,
  Waves,
} from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import talisLogo from "@/assets/talis-logo.png";

export const Route = createFileRoute("/mes-objectifs")({
  head: () => ({
    meta: [
      { title: "Mes objectifs — Angel Leclerc" },
      {
        name: "description",
        content:
          "Projet d'études et objectifs professionnels d'Angel Leclerc dans la communication, le journalisme et la radio.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MesObjectifsPage,
});

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md md:p-6 ${className}`}
  >
    {children}
  </div>
);

const institutions = [
  {
    name: "Talis",
    place: "Périgueux",
    type: "BTS Communication · alternance",
    href: "https://www.talis.community/campus/perigueux/",
    logo: talisLogo,
  },
  {
    name: "IBSAC",
    place: "Brive-la-Gaillarde",
    type: "BTS Communication · alternance envisageable",
    href: "https://www.ibsac.fr/",
    logo: "https://logo.clearbit.com/ibsac.fr",
  },
  {
    name: "CNED",
    place: "À distance",
    type: "BTS Communication · formation à distance",
    href: "https://www.cned.fr/bts/bts-communication",
    logo: "https://logo.clearbit.com/cned.fr",
  },
];

const journalistSchools = [
  {
    name: "CFJ",
    place: "Paris / Lyon",
    level: "Diplôme visé Bac+5",
    access: "Après un premier cursus supérieur et admission sélective",
    focus: "Spécialisation radio : flashs, journaux, reportages, interviews, chroniques, direct, podcast et documentaire sonore.",
    href: "https://cfjparis.com/formation/diplome-bac-plus-5/les-parcours/",
    logo: "https://logo.clearbit.com/cfjparis.com",
  },
  {
    name: "IPJ Dauphine–PSL",
    place: "Paris",
    level: "Master Journalisme",
    access: "Admission sur concours après un cursus de niveau licence",
    focus: "Formation généraliste très pratique avec spécialisation dans les médias et apprentissage des formats audio, du terrain et du travail de rédaction.",
    href: "https://ipj.eu/",
    logo: "https://ipj.eu/wp-content/uploads/2019/05/57289436_10157334597929642_6095062474292199424_o.png",
  },
  {
    name: "ESJ Lille",
    place: "Lille",
    level: "Diplôme généraliste niveau Master",
    access: "Plusieurs voies : Académie post-bac, licences spécialisées et diplôme généraliste",
    focus: "École reconnue par la profession avec studio radio, pratique intensive, journalisme de proximité, multimédia et spécialisations en seconde partie de cursus.",
    href: "https://esj-lille.fr/programmes/",
    logo: "https://esj-lille.fr/wp-content/uploads/2023/03/ecole-superieure-de-journalisme-de-lille-logo-ESJ-Lille.png",
  },
  {
    name: "EJT",
    place: "Toulouse",
    level: "Formation au métier de journaliste",
    access: "Admission propre à l'école",
    focus: "Formation à la presse, au web et à l'audiovisuel. Le secteur radio est encadré par des professionnels venant notamment de Radio France, RTL, Europe 1, RMC ou Sud Radio.",
    href: "https://ejt.fr/",
    logo: "https://logo.clearbit.com/ejt.fr",
  },
];

const hostSchools = [
  {
    name: "INA campus",
    place: "Bry-sur-Marne",
    level: "TFP Animateur / Animatrice radio",
    access: "Formation professionnalisante en alternance",
    focus: "Conception, production et animation de programmes radio et podcasts, stratégie digitale, réseaux sociaux, développement d'antenne et pratique en studio.",
    href: "https://campus.ina.fr/formations-radio-a-ina-campus",
    logo: "https://logo.clearbit.com/ina.fr",
  },
  {
    name: "ISCPA · STUDEC",
    place: "Paris",
    level: "Animation et réalisation radio · Bac+2",
    access: "Accessible après le bac, hors Parcoursup",
    focus: "Deux années très orientées pratique : animation, réalisation, prise de parole, conduite du direct, préparation d'émission et fonctionnement d'un studio professionnel.",
    href: "https://www.iscpa-ecoles.com/formation/journalisme/formation-animation-radio",
    logo: "https://logo.clearbit.com/iscpa-ecoles.com",
  },
  {
    name: "La Skol",
    place: "Rennes",
    level: "TFP Animateur / Animatrice radio",
    access: "Parcours en alternance",
    focus: "Organisme habilité pour le TFP Animateur radio : animation, production, préparation éditoriale, pratique d'antenne et application professionnelle en radio.",
    href: "https://www.cpnef-av.fr/les-formations/tfp-animateur-radio",
    logo: "https://logo.clearbit.com/laskol.fr",
  },
];

const radios = [
  { name: "France Inter", domain: "franceinter.fr" },
  { name: "franceinfo", domain: "franceinfo.fr" },
  { name: "ICI", domain: "radiofrance.fr" },
  { name: "RTL", domain: "rtl.fr" },
  { name: "Europe 1", domain: "europe1.fr" },
  { name: "RMC", domain: "rmc.bfmtv.com" },
  { name: "NRJ", domain: "nrj.fr" },
  { name: "Skyrock", domain: "skyrock.fm" },
  { name: "Fun Radio", domain: "funradio.fr" },
  { name: "RFM", domain: "rfm.fr" },
  { name: "Europe 2", domain: "europe2.fr" },
  { name: "Sud Radio", domain: "sudradio.fr" },
  { name: "Radio Classique", domain: "radioclassique.fr" },
];

function SchoolCard({ school }: { school: (typeof journalistSchools)[number] }) {
  return (
    <a
      href={school.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex min-h-14 items-center justify-between gap-4">
        <img
          src={school.logo}
          alt={`Logo ${school.name}`}
          className="max-h-12 max-w-36 rounded-md object-contain"
          loading="lazy"
        />
        <ExternalLink size={16} className="shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>
      <h4 className="mt-4 font-display text-lg font-semibold text-foreground group-hover:text-primary">{school.name}</h4>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary">{school.place} · {school.level}</p>
      <p className="mt-3 text-sm font-medium text-foreground/90">{school.access}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{school.focus}</p>
    </a>
  );
}

function RadioMarquee() {
  const loop = [...radios, ...radios];
  return (
    <div className="relative mt-10 overflow-hidden border-y border-border bg-background/80 py-5">
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent md:w-28" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent md:w-28" />
      <div className="objectives-radio-marquee flex w-max items-center gap-4 pr-4">
        {loop.map((radio, index) => (
          <div
            key={`${radio.name}-${index}`}
            className="flex h-20 w-40 shrink-0 items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 shadow-sm"
          >
            <img
              src={`https://logo.clearbit.com/${radio.domain}`}
              alt=""
              className="h-10 w-10 rounded-lg object-contain"
              loading="lazy"
            />
            <span className="max-w-20 text-sm font-semibold leading-tight text-foreground">{radio.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MesObjectifsPage() {
  return (
    <main className="overflow-hidden pb-24 md:pb-16">
      <style>{`
        @keyframes objectives-radio-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .objectives-radio-marquee {
          animation: objectives-radio-scroll 36s linear infinite;
        }
        .objectives-radio-marquee:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .objectives-radio-marquee { animation: none; flex-wrap: wrap; width: auto; justify-content: center; }
        }
      `}</style>

      <AnimatedSection>
        <section className="section-padding relative bg-muted/40">
          <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="container-tight relative">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                <Target size={16} /> Projet d'avenir
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold text-foreground md:text-6xl">Mes objectifs</h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Construire un parcours stable et cohérent entre communication, information et radio. La formation reste un objectif important, mais elle s'inscrit dans une trajectoire souple : elle peut être engagée au bon moment, tout en laissant la place à une expérience professionnelle stable si une opportunité intéressante se présente.
              </p>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="section-padding">
          <div className="container-tight">
            <div className="flex items-center gap-3">
              <GraduationCap className="text-primary" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Projet de formation</p>
                <h2 className="font-display text-3xl font-bold text-foreground">BTS Communication</h2>
              </div>
            </div>

            <p className="mt-5 max-w-3xl leading-relaxed text-muted-foreground">
              Le BTS Communication reste la formation centrale envisagée pour renforcer mes compétences en stratégie de communication, rédaction, création de contenus, médias, numérique et gestion de projets. Le calendrier n'est volontairement pas figé : l'objectif est de choisir la formule la plus cohérente avec ma situation professionnelle et personnelle au moment de l'inscription.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Card><BookOpen className="text-primary" size={22} /><p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Diplôme visé</p><p className="mt-1 font-semibold text-foreground">BTS Communication</p></Card>
              <Card><School className="text-primary" size={22} /><p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Formats possibles</p><p className="mt-1 font-semibold text-foreground">Alternance ou formation à distance</p></Card>
              <Card><BriefcaseBusiness className="text-primary" size={22} /><p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Priorité</p><p className="mt-1 font-semibold text-foreground">Construire une situation stable</p></Card>
            </div>

            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Établissements envisagés</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {institutions.map((institution) => (
                  <a key={institution.name} href={institution.href} target="_blank" rel="noopener noreferrer" className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                    <div className="flex h-14 items-center justify-between gap-4">
                      <img src={institution.logo} alt={`Logo ${institution.name}`} className="max-h-10 max-w-32 object-contain" loading="lazy" />
                      <ExternalLink size={16} className="text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                    <h3 className="mt-4 font-display text-xl font-semibold text-foreground group-hover:text-primary">{institution.name}</h3>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">{institution.place}</p>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/85">{institution.type}</p>
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Documents conservés</p><h3 className="mt-2 font-display text-xl font-semibold text-foreground">BTS Communication · Talis</h3></div>
                <div className="flex flex-wrap gap-2">
                  <a href="/bts/programme-bts-com-talis.pdf" download className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"><Download size={14} /> Programme PDF</a>
                  <a href="/bts/calendrier-bts-com-talis.pdf" download className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"><Download size={14} /> Calendrier indicatif</a>
                </div>
              </div>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Compétences travaillées</p><ul className="mt-3 space-y-2 text-sm text-foreground/90"><li>• Élaboration et pilotage d'une stratégie de communication</li><li>• Conception de solutions de communication</li><li>• Médias, numérique et contenus innovants</li><li>• Culture de la communication, langue vivante et CEJM</li></ul></div>
                <div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Logique du projet</p><ul className="mt-3 space-y-2 text-sm text-foreground/90"><li>• Consolider les bases en communication</li><li>• Développer une expérience professionnelle concrète</li><li>• Renforcer la rédaction, l'oral et la culture média</li><li>• Préparer ensuite une spécialisation vers la radio ou le journalisme</li></ul></div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8">
              <div className="flex items-start gap-4"><RouteIcon className="mt-1 shrink-0 text-primary" /><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Une trajectoire flexible</p><h3 className="mt-2 font-display text-xl font-semibold text-foreground">La stabilité avant le calendrier</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Le projet n'est pas construit autour d'une date limite. Si une opportunité professionnelle stable et cohérente se présente, elle peut devenir une étape du parcours avant la reprise d'études. Le BTS pourra ensuite être préparé en alternance à Périgueux ou à Brive, ou à distance avec le CNED selon la solution la plus adaptée.</p></div></div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="section-padding bg-muted/40">
          <div className="container-tight">
            <div className="flex items-center gap-3"><Radio className="text-primary" /><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Objectif professionnel</p><h2 className="font-display text-3xl font-bold text-foreground">Travailler à la radio</h2></div></div>
            <p className="mt-5 max-w-3xl leading-relaxed text-muted-foreground">Deux métiers m'intéressent particulièrement. Ils partagent le micro, la préparation éditoriale, la maîtrise de l'oral et le travail en équipe, mais correspondent à deux façons différentes de faire de la radio.</p>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <Card className="relative overflow-hidden">
                <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
                <Mic2 className="relative text-primary" size={28} />
                <h3 className="relative mt-4 font-display text-2xl font-semibold text-foreground">Journaliste radio</h3>
                <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">Le journaliste radio transforme l'actualité en information claire, vérifiée et adaptée à l'écoute. Il faut savoir chercher des sources, vérifier les faits, hiérarchiser rapidement, préparer et mener une interview, partir en reportage, écrire pour l'oral, enregistrer et monter du son, puis parfois présenter en direct.</p>
                <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
                  {['Écriture radio et voix','Reportage et interview','Flashs, journaux et direct','Montage, podcast et son','Déontologie et vérification','Culture générale et actualité'].map((skill) => <span key={skill} className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground">{skill}</span>)}
                </div>
                <p className="relative mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Parcours possible</p>
                <p className="relative mt-2 text-sm leading-relaxed text-foreground">BTS Communication → licence, BUT ou autre Bac+3 pertinent → concours d'une école reconnue ou Master de journalisme → spécialisation radio et expériences en rédaction. Le parcours peut aussi être construit progressivement par les stages, radios locales, podcasts et piges.</p>
                <a href="https://www.onisep.fr/ressources/univers-metier/metiers/journaliste-radio-et-tv" target="_blank" rel="noopener noreferrer" className="relative mt-4 inline-flex text-sm font-semibold text-primary hover:underline">Fiche métier Onisep →</a>
              </Card>

              <Card className="relative overflow-hidden">
                <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
                <Headphones className="relative text-primary" size={28} />
                <h3 className="relative mt-4 font-display text-2xl font-semibold text-foreground">Animateur radio</h3>
                <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">L'animateur radio porte l'identité d'une émission ou d'une tranche d'antenne. Il prépare le conducteur, lance les sujets et la musique, mène les échanges, donne du rythme, improvise, gère le direct, développe une relation avec les auditeurs et travaille avec la réalisation, la programmation et la production.</p>
                <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
                  {['Prise de parole et voix','Conduite du direct','Interview et chronique','Préparation d’émission','Programmation et culture radio','Réseaux sociaux et podcast'].map((skill) => <span key={skill} className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground">{skill}</span>)}
                </div>
                <p className="relative mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Parcours possible</p>
                <p className="relative mt-2 text-sm leading-relaxed text-foreground">BTS Communication ou expérience professionnelle → formation radio spécialisée ou TFP Animateur radio → alternance, radio locale, web-radio, podcast et bande démo → expériences d'antenne de plus en plus importantes. Ici, la pratique et la personnalité à l'antenne pèsent autant que le diplôme.</p>
                <a href="https://www.onisep.fr/ressources/univers-metier/metiers/animateur-animatrice-de-radio-et-de-television" target="_blank" rel="noopener noreferrer" className="relative mt-4 inline-flex text-sm font-semibold text-primary hover:underline">Fiche métier Onisep →</a>
              </Card>
            </div>

            <div className="mt-12">
              <div className="flex items-center gap-3"><GraduationCap className="text-primary" size={22} /><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Journalisme radio</p><h3 className="font-display text-2xl font-bold text-foreground">Écoles et formations à envisager</h3></div></div>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">Il n'existe pas une seule route. Les écoles reconnues par la profession restent une voie forte, mais l'entrée se prépare souvent après plusieurs années d'études supérieures. Le bon objectif est donc d'accumuler progressivement niveau académique, culture générale, pratique journalistique et expériences audio.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">{journalistSchools.map((school) => <SchoolCard key={school.name} school={school} />)}</div>
            </div>

            <div className="mt-12">
              <div className="flex items-center gap-3"><Waves className="text-primary" size={22} /><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Animation radio</p><h3 className="font-display text-2xl font-bold text-foreground">Formations très orientées antenne</h3></div></div>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">Pour l'animation, les formations les plus pertinentes sont celles qui mettent rapidement en studio et en situation professionnelle. Le TFP Animateur radio est une certification de branche pensée spécialement pour ce métier, tandis que d'autres écoles proposent des cursus Bac+2 centrés sur l'animation et la réalisation.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">{hostSchools.map((school) => <SchoolCard key={school.name} school={school as (typeof journalistSchools)[number]} />)}</div>
            </div>
          </div>

          <div className="mt-14">
            <div className="container-tight text-center"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Univers radio</p><h3 className="mt-2 font-display text-2xl font-bold text-foreground">Des antennes et des formats très différents</h3><p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Service public, radios généralistes, musicales, locales ou thématiques : l'objectif est de construire un profil capable de s'adapter à plusieurs univers d'antenne.</p></div>
            <RadioMarquee />
          </div>

          <div className="container-tight">
            <div className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-center gap-2 text-primary"><Sparkles size={18} /><p className="text-xs font-semibold uppercase tracking-widest">Trajectoire</p></div>
              <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-foreground md:flex-row md:flex-wrap md:items-center"><span className="rounded-xl bg-muted px-4 py-3">Stabilité professionnelle</span><span className="text-muted-foreground">→</span><span className="rounded-xl bg-muted px-4 py-3">BTS Communication au bon moment</span><span className="text-muted-foreground">→</span><span className="rounded-xl bg-muted px-4 py-3">Études spécialisées + pratique radio</span><span className="text-muted-foreground">→</span><span className="rounded-xl bg-primary/10 px-4 py-3 text-primary">Journalisme radio ou animation radio</span></div>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">Le parcours reste volontairement ouvert. Un emploi stable, une expérience dans une radio locale, un BTS, une école spécialisée ou un projet audio personnel peuvent se compléter au lieu de s'opposer. Le fil conducteur est de développer progressivement la rédaction, la culture générale, la technique audio, la présence au micro et une vraie expérience professionnelle.</p>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
}
