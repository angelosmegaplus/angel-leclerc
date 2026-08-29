import { useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Banknote,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleDollarSign,
  ExternalLink,
  Factory,
  FileText,
  Flag,
  GraduationCap,
  Handshake,
  HeartPulse,
  Landmark,
  Languages,
  MapPinned,
  Radio,
  Scale,
  Shield,
  Siren,
  Smartphone,
  Sparkles,
  TrainFront,
  Users,
  Vote,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";

type SourceLink = { label: string; href: string; kind?: "PDF" | "Site" | "Texte" | "Dossier" };
type PowerKey = "national" | "regional" | "shared";

type PolicyCardProps = {
  icon: LucideIcon;
  title: string;
  summary: string;
  detail: string;
  points: string[];
  badge?: string;
  sources?: SourceLink[];
  visual?: ReactNode;
  videoId?: string;
  videoTitle?: string;
};

const links = {
  rs: "https://www.republique-souveraine.fr/nosidees/",
  ifop: "https://www.ifop.com/wp-content/uploads/2025/08/121688_radioscopie_du_regionalisme_en_2025_ifop_rps_2025.08.18_compressed.pdf",
  senateSubsidiarity: "https://www.senat.fr/rap/r25-711/r25-7111.pdf",
  senateCorsica: "https://www.senat.fr/dossier-legislatif/pjl24-869.html",
  constitution: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000571356",
  deathPenalty: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006527559/",
  echr: "https://www.echr.coe.int/fr/european-convention-on-human-rights",
  serviceCivique: "https://www.service-civique.gouv.fr/",
  integration: "https://www.service-public.fr/particuliers/vosdroits/F17048",
  franceConnect: "https://www.franceconnect.gouv.fr/",
  franceServices: "https://www.france-services.gouv.fr/",
  franceTravail: "https://www.francetravail.fr/",
  inseeIllectronisme: "https://www.insee.fr/fr/statistiques/7633654",
};

const logos = {
  rs: "https://digitalpress.fra1.cdn.digitaloceanspaces.com/gp82d1z/2025/11/Nouveau-logo-RS-version-2023-2.png",
  franceConnect: "https://docs.partenaires.franceconnect.gouv.fr/images/fi/fc_avatar.png",
  franceServices: "https://www.justice.fr/sites/default/files/Logo_1_France_services_-_header%20%281%29.jpg",
  franceTravail: "https://travail-emploi.gouv.fr/sites/travail-emploi/files/styles/thumbnail_ondine_16_9/public/2024-05/france-travail.jpg.webp?itok=b4FXuoZw",
  laPoste: "https://collections.museedelaposte.fr/files/lp-logo-jaune-rvb_517fc034e06d2695cf8e8fb3475dfa6d.png",
  sncf: "https://cdn.iris-etourism.io/uploads/pays_voironnais_tourisme/sizes/355/140-31-2367372-800x520.webp",
};

const powerContent: Record<PowerKey, { title: string; lead: string; items: string[] }> = {
  national: {
    title: "Pouvoir national",
    lead: "Une seule règle française pour ce qui doit rester commun partout.",
    items: [
      "Constitution, citoyenneté, état civil national et libertés fondamentales",
      "Défense, armées, renseignement stratégique, diplomatie et frontières",
      "Nationalité, immigration au sens du droit d'entrée et de séjour, douanes et grands choix monétaires",
      "Terrorisme, trahison, espionnage, criminalité interrégionale et atteintes aux institutions nationales",
      "Socle national de Sécurité sociale, retraites, droit du travail et minima sociaux",
      "Grands réseaux stratégiques : rail national, énergie, télécommunications, autoroutes et infrastructures critiques",
      "Garanties nationales minimales en école, santé, environnement, sécurité et justice",
    ],
  },
  regional: {
    title: "Pouvoir régional",
    lead: "Tout pouvoir qui n'est pas réservé au niveau national revient par principe aux régions.",
    items: [
      "Parlement régional, exécutif régional, budget, fiscalité et administration propres",
      "Vraies lois régionales directement applicables dans le territoire",
      "Transports régionaux, logement, foncier, urbanisme et aménagement",
      "Économie, tourisme, agriculture, apprentissage, formation et aides aux entreprises",
      "Culture, langues régionales, médias régionaux et compléments scolaires",
      "Organisation des hôpitaux, prévention et carte sanitaire régionale",
      "Police régionale ou territoriale et sécurité quotidienne",
      "Tribunaux régionaux pour le droit régional, parquet régional et procédure régionale",
      "Prisons régionales et politique régionale d'exécution des peines",
      "Droit civil régional dans les domaines attribués et droit pénal régional pour les infractions régionales",
    ],
  },
  shared: {
    title: "Pouvoir partagé",
    lead: "Le niveau national fixe un minimum commun ; la région organise le reste et peut aller plus loin.",
    items: [
      "École : fondamentaux nationaux + histoire, langues, horaires et options régionales",
      "Santé : assurance nationale + organisation régionale des soins et recrutements",
      "Environnement : garanties nationales + règles régionales adaptées aux risques locaux",
      "Sécurité : forces nationales pour les missions stratégiques + forces territoriales pour le quotidien",
      "Énergie : stratégie nationale de souveraineté + implantation et priorités territoriales",
      "Infrastructures : continuité nationale + programmation régionale des besoins",
      "Solidarité : droits minimaux identiques partout + aides régionales supplémentaires financées localement",
    ],
  },
};

function LogoTile({ src, name, href }: { src: string; name: string; href?: string }) {
  const content = (
    <div className="flex h-20 min-w-[118px] max-w-[145px] flex-col items-center justify-center rounded-2xl border border-border bg-white px-3 py-2 shadow-sm">
      <img
        src={src}
        alt={`Logo ${name}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-10 max-w-full object-contain"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
      <span className="mt-1.5 line-clamp-1 text-center text-[10px] font-bold text-slate-700">{name}</span>
    </div>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="shrink-0">{content}</a>
  ) : content;
}

function LogoRail() {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <LogoTile src={logos.franceConnect} name="FranceConnect" href={links.franceConnect} />
      <LogoTile src={logos.franceServices} name="France Services" href={links.franceServices} />
      <LogoTile src={logos.franceTravail} name="France Travail" href={links.franceTravail} />
      <LogoTile src={logos.sncf} name="SNCF" />
      <LogoTile src={logos.laPoste} name="La Poste" />
    </div>
  );
}

function SourcePills({ sources }: { sources: SourceLink[] }) {
  if (!sources.length) return null;
  return (
    <div className="mt-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Sources à ouvrir</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {sources.map((source) => (
          <a
            key={`${source.label}-${source.href}`}
            href={source.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-[11px] font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <FileText className="h-3.5 w-3.5 text-primary" />
            {source.kind ? `${source.kind} · ` : ""}{source.label}
            <ExternalLink className="h-3 w-3" />
          </a>
        ))}
      </div>
    </div>
  );
}

function PolicyCard({ icon: Icon, title, summary, detail, points, badge, sources = [], visual, videoId, videoTitle }: PolicyCardProps) {
  return (
    <details className="group overflow-hidden rounded-[22px] border border-border bg-card shadow-sm transition-all open:border-primary/40 open:shadow-md">
      <summary className="flex min-h-[88px] cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden sm:p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          {badge ? <span className="mb-1.5 inline-flex rounded-full bg-primary/10 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-primary">{badge}</span> : null}
          <span className="block font-display text-[1.02rem] font-bold leading-snug text-foreground sm:text-lg">{title}</span>
          <span className="mt-1.5 block text-[13px] leading-5 text-muted-foreground sm:text-sm sm:leading-6">{summary}</span>
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-primary">
            Développer <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
          </span>
        </span>
      </summary>
      <div className="border-t border-border bg-background/55 px-4 pb-5 pt-4 sm:px-5 sm:pb-6">
        <p className="text-[13px] leading-6 text-foreground/85 sm:text-sm sm:leading-7">{detail}</p>
        {visual ? <div className="mt-4">{visual}</div> : null}
        <div className="mt-4 rounded-2xl border border-border bg-card p-3.5 sm:p-4">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary">Concrètement</p>
          <ul className="mt-3 space-y-2.5 text-[13px] leading-5 text-foreground/85 sm:text-sm sm:leading-6">
            {points.map((point) => (
              <li key={point} className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
        {videoId ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card p-1.5">
            <YouTubeEmbed videoId={videoId} title={videoTitle ?? title} />
          </div>
        ) : null}
        <SourcePills sources={sources} />
      </div>
    </details>
  );
}

function SectionTitle({ id, icon: Icon, eyebrow, title, lead }: { id: string; icon: LucideIcon; eyebrow: string; title: string; lead: string }) {
  return (
    <div id={id} className="scroll-mt-28 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm"><Icon className="h-5 w-5" /></span>
      <p className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mx-auto mt-2 max-w-3xl font-display text-[1.65rem] font-bold leading-[1.08] tracking-tight text-foreground sm:text-3xl md:text-4xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-[13px] leading-6 text-muted-foreground sm:text-base sm:leading-7">{lead}</p>
    </div>
  );
}

function PowerTabs() {
  const [active, setActive] = useState<PowerKey>("national");
  const current = powerContent[active];
  return (
    <div className="mt-6 overflow-hidden rounded-[22px] border border-border bg-card shadow-sm">
      <div className="grid grid-cols-3 gap-1 border-b border-border bg-muted/40 p-1.5">
        {([["national", "National"], ["regional", "Régional"], ["shared", "Partagé"]] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            aria-pressed={active === key}
            className={`min-h-11 rounded-2xl px-1.5 text-[11px] font-extrabold transition-colors sm:text-sm ${active === key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-background hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="font-display text-xl font-bold text-foreground">{current.title}</h3>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground sm:text-sm">{current.lead}</p>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {current.items.map((item) => <div key={item} className="rounded-2xl border border-border bg-background p-3 text-[12px] leading-5 text-foreground/85 sm:text-sm">{item}</div>)}
        </div>
      </div>
    </div>
  );
}

function JusticeFlow() {
  const steps = [
    ["1", "Aujourd'hui", "Une loi régionale ne peut pas autoriser la peine de mort : la Constitution française l'interdit."],
    ["2", "Niveau national", "Il faudrait d'abord modifier la Constitution et faire disparaître les engagements juridiques supérieurs incompatibles."],
    ["3", "Vote local", "Seulement ensuite, une région compétente en droit pénal pourrait organiser un référendum régional obligatoire."],
    ["4", "Loi régionale", "Si le référendum l'approuve, le Parlement régional pourrait voter une loi pénale précise. Les autres régions resteraient libres de ne pas le faire."],
  ];
  return (
    <div className="space-y-2">
      {steps.map(([n, title, text]) => (
        <div key={n} className="grid grid-cols-[34px_1fr] gap-3 rounded-2xl border border-border bg-card p-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-extrabold text-primary-foreground">{n}</span>
          <div><p className="text-[13px] font-bold text-foreground">{title}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground sm:text-xs">{text}</p></div>
        </div>
      ))}
    </div>
  );
}

function ServiceFlow() {
  const steps = [
    ["2 semaines", "Phase commune", "Vie collective, institutions, premiers secours, sport, sécurité civile, défense et découverte des missions publiques."],
    ["Choix", "Voie militaire ou civile", "Chaque jeune choisit ensuite une affectation militaire ou une mission civile d'intérêt général."],
    ["6 mois", "Service obligatoire", "Mission indemnisée et protégée socialement, adaptée aux aptitudes et à la situation de la personne."],
    ["Après", "Renouvellement volontaire", "Possibilité de prolonger la mission pour continuer à servir, se former ou se professionnaliser."],
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {steps.map(([time, title, text]) => (
        <div key={time} className="rounded-2xl border border-border bg-card p-3.5">
          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-primary">{time}</span>
          <p className="mt-2 text-sm font-bold text-foreground">{title}</p>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground sm:text-xs">{text}</p>
        </div>
      ))}
    </div>
  );
}

function IntegrationFlow() {
  const steps = [
    ["Entrée légale", "Ouvrir largement des voies légales et rapides, avec contrôle d'identité et de sécurité."],
    ["Bilan", "Évaluer le français, les compétences, les diplômes, la santé, la famille et le projet professionnel."],
    ["Formation intensive", "Français, institutions, droits, devoirs, laïcité des services publics, égalité femmes-hommes et formation professionnelle."],
    ["Travail et territoire", "Orienter vers une région disposant à la fois d'un logement, d'une formation et d'emplois correspondant au profil."],
    ["Autonomie", "Suivi intensif pendant les premiers mois, puis sortie du dispositif lorsque la personne travaille ou suit une formation et maîtrise les règles communes."],
  ];
  return (
    <div className="space-y-2">
      {steps.map(([title, text], index) => (
        <div key={title} className="grid grid-cols-[32px_1fr] gap-3 rounded-2xl border border-border bg-card p-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-extrabold text-primary">{index + 1}</span>
          <div><p className="text-[13px] font-bold text-foreground">{title}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground sm:text-xs">{text}</p></div>
        </div>
      ))}
    </div>
  );
}

function PublicServicesFlow() {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <div className="rounded-2xl bg-primary px-3 py-3 text-center text-sm font-extrabold text-primary-foreground">UNE ENTRÉE · compte + dossier + rendez-vous</div>
      <div className="my-2 text-center text-lg font-bold text-primary">↓</div>
      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold sm:text-xs">
        {["Social", "Travail", "Entreprise", "Impôts", "Retraite", "Région"].map((item) => <div key={item} className="rounded-xl border border-border bg-background px-1 py-2.5">{item}</div>)}
      </div>
      <p className="mt-3 text-center text-[10px] leading-4 text-muted-foreground">Une interface commune ne veut pas dire un fichier géant : chaque service garde uniquement les données dont il a besoin.</p>
    </div>
  );
}

const navItems = [
  ["institutions", "Régions"],
  ["justice", "Justice"],
  ["service", "Service national"],
  ["immigration", "Immigration"],
  ["services", "Services publics"],
  ["social", "Social & économie"],
  ["ecole", "École & santé"],
  ["souverainete", "Souveraineté"],
  ["sources-politique", "Sources"],
] as const;

export function PoliticalProgramMobile() {
  return (
    <div className="bg-background" data-politique-mobile-first="true">
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl sm:h-80 sm:w-80" />
          <div className="absolute -right-20 top-28 h-48 w-48 rounded-full bg-secondary/15 blur-3xl sm:h-72 sm:w-72" />
        </div>
        <div className="container-tight relative px-3 py-7 sm:px-6 sm:py-12 md:py-16">
          <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-[22px] border border-border bg-card shadow-sm">
              <div className="grid gap-3 p-3.5 sm:grid-cols-[132px_1fr] sm:items-center sm:p-4">
                <a href={links.rs} target="_blank" rel="noopener noreferrer" className="flex h-16 items-center justify-center rounded-2xl border border-border bg-white p-2 sm:h-20">
                  <img src={logos.rs} alt="Logo République Souveraine" className="h-full max-w-full object-contain" loading="eager" referrerPolicy="no-referrer" />
                </a>
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary">Engagement politique</p>
                  <h2 className="mt-1 font-display text-lg font-bold text-foreground">Adhérent à République Souveraine</h2>
                  <p className="mt-1.5 text-[12px] leading-5 text-muted-foreground sm:text-sm">Une grande partie de son programme est appréciée, notamment sur la souveraineté populaire, le RIC, la réindustrialisation et les services publics stratégiques. La page ci-dessous présente cependant un programme personnel distinct.</p>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-7 max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Programme politique personnel</span>
              <h1 className="mt-4 font-display text-[2.15rem] font-bold leading-[1.03] tracking-tight text-foreground sm:text-5xl md:text-6xl">Une France unie, sociale, souveraine et <span className="italic text-primary">régionaliste</span>.</h1>
              <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-6 text-muted-foreground sm:text-lg sm:leading-8">Une seule nation et une seule citoyenneté, mais des régions qui votent réellement leurs lois, disposent de leurs institutions et assument leurs décisions.</p>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center">
                {["Loi nationale + loi régionale", "RIC national + régional", "Services publics forts", "Souveraineté française"].map((item) => <span key={item} className="flex min-h-12 items-center justify-center rounded-2xl border border-border bg-card px-2.5 py-2 text-center text-[11px] font-bold text-foreground shadow-sm sm:text-xs">{item}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Sommaire du programme" className="sticky top-16 z-30 border-b border-border bg-background/94 backdrop-blur">
        <div className="container-tight flex gap-2 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
          {navItems.map(([id, label]) => <a key={id} href={`#${id}`} className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-border bg-card px-3 text-[11px] font-extrabold text-muted-foreground hover:border-primary hover:text-foreground">{label}</a>)}
        </div>
      </nav>

      <section className="px-3 py-11 sm:px-6 sm:py-16">
        <div className="container-tight px-0">
          <SectionTitle id="institutions" icon={Landmark} eyebrow="Organisation de la France" title="Qui décide de quoi ? La réponse doit tenir sur un écran." lead="La Constitution liste les pouvoirs nationaux. Tout le reste revient aux régions. Les matières partagées ont un socle français puis une organisation régionale." />
          <PowerTabs />
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <PolicyCard
              icon={Landmark}
              badge="Institutions"
              title="Un Parlement régional qui vote de vraies lois"
              summary="Le conseil régional devient un vrai pouvoir législatif régional, pas une simple administration."
              detail="Chaque région dispose d'un Parlement régional élu directement dans des circonscriptions territoriales. Il vote les lois régionales, le budget et les impôts régionaux. Le président de région est élu par ce Parlement, dirige l'administration et applique les textes votés. Une région ne demande pas l'autorisation de Paris pour une matière qui lui appartient constitutionnellement."
              points={[
                "Un conseiller régional élu par circonscription régionale ; les limites sont rééquilibrées régulièrement selon la population",
                "Le Parlement régional vote toute nouvelle règle importante dans les compétences régionales",
                "Le président de région propose des textes, gère les services, signe les contrats et applique les lois votées",
                "Un statut régional fixe l'organisation interne et ne peut être modifié profondément sans référendum régional",
                "Une Cour constitutionnelle tranche les conflits entre loi nationale et loi régionale",
                "Le Sénat devient la chambre des territoires : même nombre de sénateurs pour chaque région afin qu'une région peu peuplée ne disparaisse pas politiquement",
                "Six sénateurs par région, élus directement pour six ans, avec renouvellement par moitié tous les trois ans",
              ]}
              sources={[
                { label: "IFOP — régionalisme 2025", href: links.ifop, kind: "PDF" },
                { label: "Sénat — subsidiarité", href: links.senateSubsidiarity, kind: "PDF" },
              ]}
            />
            <PolicyCard
              icon={Languages}
              title="Régions historiques, langues et frontières choisies par les habitants"
              summary="La carte administrative peut évoluer ; l'identité régionale n'est pas figée par le découpage de 2015."
              detail="Le français reste la langue commune de toute la France. Une région peut cependant donner une place institutionnelle forte à une langue historique, financer son enseignement et l'utiliser dans ses services. Une modification importante des limites régionales exige le vote des populations concernées."
              points={[
                "Français langue nationale commune",
                "Co-officialité régionale possible pour une langue historique dans les services du territoire",
                "Histoire et géographie régionales intégrées au programme scolaire régional",
                "Référendum obligatoire pour réunifier, séparer ou déplacer un territoire entre régions",
                "Aucune frontière intérieure, aucun passeport régional et une seule nationalité française",
                "Une région peut obtenir un statut plus autonome qu'une autre si sa population l'approuve",
              ]}
              sources={[{ label: "IFOP — identités et pouvoir régional", href: links.ifop, kind: "PDF" }]}
            />
          </div>
        </div>
      </section>

      <section className="bg-muted/35 px-3 py-11 sm:px-6 sm:py-16">
        <div className="container-tight px-0">
          <SectionTitle id="justice" icon={Scale} eyebrow="Justice, prisons, police" title="La justice régionale est une vraie compétence, pas une note de bas de page." lead="Une région peut avoir ses tribunaux, son droit pénal régional, son parquet, ses prisons et sa police, avec des garanties constitutionnelles communes." />
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            <PolicyCard
              icon={Scale}
              badge="Justice régionale"
              title="Deux ordres de justice clairement séparés"
              summary="Le droit régional est jugé régionalement ; les crimes contre la Nation restent nationaux."
              detail="Les juridictions régionales appliquent les lois régionales. Les juridictions nationales gardent le droit national, les infractions contre les institutions françaises et les affaires traversant plusieurs régions. La Cour constitutionnelle protège les libertés fondamentales et arbitre les conflits de compétence."
              points={[
                "Tribunaux régionaux de première instance",
                "Cours d'appel régionales",
                "Cour supérieure régionale pour l'interprétation du droit régional",
                "Parquet régional chargé des infractions créées par la loi régionale",
                "Justice nationale pour terrorisme, trahison, espionnage, douanes et criminalité interrégionale",
                "Règles nationales minimales sur le procès équitable, la défense, la dignité et les libertés fondamentales",
              ]}
              visual={<div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center"><div className="rounded-2xl border border-border bg-card p-3 text-center"><p className="text-[9px] font-extrabold uppercase text-primary">National</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">Terrorisme · trahison · affaires interrégionales</p></div><Scale className="mx-auto h-5 w-5 text-primary" /><div className="rounded-2xl border border-border bg-card p-3 text-center"><p className="text-[9px] font-extrabold uppercase text-primary">Régional</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">Droit régional · tribunaux · prisons · peines</p></div></div>}
            />
            <PolicyCard
              icon={Building2}
              badge="Prisons"
              title="Des prisons régionales administrées par les régions"
              summary="Une région qui vote ses peines doit aussi assumer leur exécution."
              detail="La majorité des condamnations prononcées au titre d'une loi régionale sont exécutées dans un service pénitentiaire régional. La France conserve des établissements nationaux spécialisés pour certaines condamnations nationales ou les détenus présentant un risque exceptionnel."
              points={[
                "Administration pénitentiaire régionale et budget régional",
                "Construction, rénovation et gestion des prisons décidées régionalement",
                "Travail, formation, réinsertion et régimes de détention pouvant varier selon la région",
                "Standards nationaux obligatoires pour la dignité, la santé, la sécurité et les droits de la défense",
                "Prisons nationales spécialisées pour certains crimes nationaux et situations de haute sécurité",
              ]}
            />
            <PolicyCard
              icon={Siren}
              badge="Police territoriale"
              title="Une police locale mutualisée avec un responsable élu"
              summary="Les communes partagent leurs moyens au lieu d'avoir une police riche d'un côté et aucune de l'autre."
              detail="La police territoriale couvre un bassin de vie ou une intercommunalité. Les polices municipales existantes sont regroupées. Son directeur est directement élu par les habitants et porte la responsabilité politique de la sécurité quotidienne. Police nationale et gendarmerie restent présentes pour les enquêtes lourdes et les missions nationales."
              points={[
                "Circulation, stationnement, nuisances, marchés, événements et tranquillité publique",
                "Présence de proximité et prévention",
                "Directeur territorial élu directement",
                "Formation, déontologie, armement et garanties définis par un cadre national",
                "Contrôle du juge, du préfet et d'une inspection indépendante",
                "Aucun financement privé de la police territoriale",
              ]}
            />
            <PolicyCard
              icon={Shield}
              badge="Peine de mort"
              title="Rétablissement régional : possible seulement après une rupture juridique nationale préalable"
              summary="Aujourd'hui c'est impossible. Un référendum régional ne peut pas, à lui seul, contourner la Constitution française."
              detail="L'article 66-1 de la Constitution interdit aujourd'hui toute condamnation à mort. Des engagements européens et internationaux renforcent cette interdiction. Pour rendre juridiquement possible une décision régionale, il faudrait d'abord modifier le cadre constitutionnel national et faire en sorte que la France ne soit plus liée par les normes supérieures incompatibles. Ensuite seulement, une région dotée d'une compétence pénale pourrait organiser un référendum et voter une loi régionale."
              points={[
                "Aucune région ne peut actuellement rétablir la peine de mort",
                "Première étape : révision constitutionnelle nationale explicite",
                "Deuxième étape : règlement des engagements européens et internationaux incompatibles",
                "Troisième étape : référendum obligatoire dans la région concernée",
                "Quatrième étape : loi pénale régionale définissant précisément les crimes et la procédure",
                "Une autre région pourrait conserver l'abolition totale",
              ]}
              visual={<JusticeFlow />}
              sources={[
                { label: "Constitution — article 66-1", href: links.deathPenalty, kind: "Texte" },
                { label: "Convention européenne des droits de l'homme", href: links.echr, kind: "Site" },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="px-3 py-11 sm:px-6 sm:py-16">
        <div className="container-tight px-0">
          <SectionTitle id="service" icon={Flag} eyebrow="Jeunesse et engagement" title="Un service national obligatoire de six mois" lead="Une courte phase commune pour tous, puis un choix réel entre voie militaire et mission civile d'intérêt général." />
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            <PolicyCard
              icon={Flag}
              badge="Obligatoire"
              title="Deux semaines communes, puis six mois de service"
              summary="Le même départ pour tous, mais pas la même mission pour tout le monde."
              detail="Le service commence par une phase collective d'environ deux semaines consacrée aux institutions, aux premiers secours, au sport, à la sécurité civile, à la défense et à la vie en groupe. Ensuite, la personne choisit entre une voie militaire et une mission civile. Le service principal dure six mois."
              points={[
                "Recensement et préparation à partir de 16 ans",
                "Phase commune d'environ deux semaines",
                "Service principal à réaliser entre 18 et 25 ans avec reports possibles pour études, santé ou situation familiale sérieuse",
                "Voie militaire : armées, réserve, cyberdéfense, logistique, soutien ou sécurité civile selon aptitude",
                "Voie civile : hôpitaux, EHPAD, collectivités, environnement, patrimoine, secours, associations ou services publics",
                "Indemnité, protection sociale et prise en charge des frais indispensables",
                "Adaptation de la mission en cas de handicap ou de problème de santé compatible avec une autre forme de service",
                "Renouvellement ensuite volontaire par périodes supplémentaires",
              ]}
              visual={<ServiceFlow />}
              sources={[{ label: "Service Civique — fonctionnement des missions actuelles", href: links.serviceCivique, kind: "Site" }]}
            />
            <PolicyCard
              icon={Users}
              title="Des missions qui répondent à de vrais besoins"
              summary="Pas six mois d'occupation artificielle : les régions et l'État publient leurs besoins réels."
              detail="Une plateforme nationale rassemble les missions militaires et civiles disponibles. Les régions recensent les besoins sociaux, sanitaires, environnementaux et patrimoniaux. L'affectation tient compte des préférences, des compétences, de la proximité et des priorités publiques."
              points={[
                "Secours, prévention et sécurité civile",
                "Aide aux personnes âgées ou handicapées",
                "Soutien numérique dans les services publics",
                "Protection de l'environnement et entretien du patrimoine",
                "Soutien éducatif, sportif et culturel sous encadrement professionnel",
                "Armées, réserve, cyberdéfense, logistique et soutien",
                "Validation de compétences utilisable dans un CV ou un concours public",
              ]}
            />
          </div>
        </div>
      </section>

      <section className="bg-muted/35 px-3 py-11 sm:px-6 sm:py-16">
        <div className="container-tight px-0">
          <SectionTitle id="immigration" icon={Users} eyebrow="Immigration et intégration" title="Entrée légale plus simple, intégration beaucoup plus intensive" lead="Réduire la clandestinité et les années d'attente : une personne admise travaille, apprend le français, se forme et entre rapidement dans un parcours vers l'autonomie." />
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            <PolicyCard
              icon={Handshake}
              badge="Parcours obligatoire"
              title="Langue, institutions, formation et emploi dès le début"
              summary="L'accueil légal est large ; l'accompagnement intensif n'est pas facultatif."
              detail="Le système cherche à ouvrir des voies légales lisibles plutôt qu'à laisser les personnes dépendre de filières clandestines ou attendre des années sans droit au travail. Après l'admission, un parcours structuré commence immédiatement. Il transmet les règles communes et les compétences utiles sans imposer une religion ni une opinion politique."
              points={[
                "Procédure légale plus simple et plus rapide, sous réserve des contrôles de sécurité et de fraude",
                "Droit de travailler rapidement après l'admission",
                "Test de français puis formation intensive jusqu'à un niveau permettant la vie quotidienne et professionnelle",
                "Cours obligatoires sur les institutions, les droits, les devoirs, la laïcité des services publics et l'égalité femmes-hommes",
                "Évaluation des diplômes, savoir-faire et expériences, y compris par tests pratiques lorsque les documents manquent",
                "Formation professionnelle directement reliée aux besoins d'emploi",
                "Scolarisation immédiate des enfants",
                "Suivi individuel pendant les premiers mois",
              ]}
              visual={<IntegrationFlow />}
              sources={[{ label: "Service-Public — contrat d'intégration républicaine", href: links.integration, kind: "Site" }]}
            />
            <PolicyCard
              icon={MapPinned}
              badge="Orientation territoriale"
              title="Installer d'abord là où logement, formation et emploi existent"
              summary="L'intégration ne fonctionne pas si tout le monde est concentré dans les mêmes zones déjà saturées."
              detail="L'administration et les régions croisent les besoins d'emploi, les logements disponibles, la situation familiale, la santé et les compétences. La première implantation proposée correspond à un territoire capable d'accueillir réellement la personne. Une période de stabilité accompagne les aides publiques initiales, avec exceptions pour la famille, la santé, les études ou un meilleur emploi."
              points={[
                "Orientation construite avec les régions et France Travail",
                "Priorité aux territoires réunissant logement et emploi ou formation",
                "Contrat territorial initial pour les personnes logées et accompagnées par la puissance publique",
                "Changement possible pour famille proche, santé, études ou meilleure offre d'emploi",
                "Aides d'intégration liées à la participation réelle aux cours, rendez-vous et formations, hors secours d'urgence et protection des enfants",
                "Fin du dispositif spécial lorsque l'autonomie est atteinte ; mobilité ensuite selon les règles ordinaires",
              ]}
              sources={[{ label: "France Travail", href: links.franceTravail, kind: "Site" }]}
            />
          </div>
        </div>
      </section>

      <section className="px-3 py-11 sm:px-6 sm:py-16">
        <div className="container-tight px-0">
          <SectionTitle id="services" icon={Smartphone} eyebrow="État simple" title="Un compte, un guichet, une donnée transmise une fois" lead="Le citoyen voit un seul dossier. Derrière l'écran, les administrations restent spécialisées mais communiquent entre elles." />
          <div className="mt-5"><LogoRail /></div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <PolicyCard
              icon={Smartphone}
              badge="Services publics de France"
              title="Une seule porte devant, un réseau derrière"
              summary="Déménagement, emploi, prestations, entreprise, impôts : un seul tableau de bord."
              detail="La marque Services publics de France sert de façade commune. FranceConnect devient l'identité numérique d'entrée. France Services devient le réseau physique principal. Le citoyen n'a pas besoin de savoir quelle administration gère chaque partie de son dossier. Une information officielle déjà transmise n'est plus demandée cinq fois."
              points={[
                "Un compte citoyen, un dossier, une messagerie et un calendrier de rendez-vous",
                "FranceConnect comme porte d'entrée numérique commune",
                "France Services comme guichet physique principal",
                "Une donnée déclarée une fois puis transmise uniquement aux organismes autorisés",
                "Pas de super-fichier : les bases restent séparées et les accès sont limités au besoin d'en connaître",
                "Droit permanent à un accueil humain au guichet, par téléphone ou en visioconférence",
                "Mutualisation des logiciels, achats, centres d'appels, hébergement, cybersécurité et immobilier",
              ]}
              visual={<PublicServicesFlow />}
              sources={[
                { label: "FranceConnect", href: links.franceConnect, kind: "Site" },
                { label: "France Services", href: links.franceServices, kind: "Site" },
                { label: "Insee — éloignement du numérique", href: links.inseeIllectronisme, kind: "Site" },
              ]}
            />
            <PolicyCard
              icon={Factory}
              badge="Opérateurs stratégiques"
              title="Des grands réseaux publics nationaux, dirigés plus localement"
              summary="Le réseau reste français ; les directions régionales obtiennent de vrais budgets et des décisions rapides."
              detail="Les monopoles naturels et infrastructures critiques peuvent revenir sous contrôle public lorsqu'il est nécessaire de garantir l'accès, l'investissement ou la souveraineté. L'exploitation quotidienne est beaucoup plus régionalisée : une région peut accélérer une ligne, un réseau fibre ou un investissement énergétique sans attendre qu'un détail local soit décidé à Paris."
              points={[
                "France Télécom pour un grand réseau public de télécommunications, avec possibilité de conserver Orange comme marque commerciale",
                "Énergie de France pour coordonner production, réseaux, nucléaire, hydraulique et planification",
                "SNCF comme colonne vertébrale du rail national et de la coordination avec les mobilités régionales",
                "Société nationale des voies routières pour reprendre progressivement les autoroutes",
                "La Poste renforcée comme opérateur de proximité, d'identité et de coffre-fort documentaire",
                "France.Media pour mutualiser les moyens du service public audiovisuel tout en laissant les rédactions régionales décider localement",
              ]}
              visual={<div className="rounded-2xl border border-dashed border-border bg-muted/25 p-3 text-[11px] leading-5 text-muted-foreground"><strong className="text-foreground">Noms proposés :</strong> France Télécom, Énergie de France, Services publics de France et France.Media sont ici des projets politiques, pas des organismes officiellement créés sous cette forme.</div>}
            />
          </div>
        </div>
      </section>

      <section className="bg-muted/35 px-3 py-11 sm:px-6 sm:py-16">
        <div className="container-tight px-0">
          <SectionTitle id="social" icon={Handshake} eyebrow="Social, travail, économie" title="Protéger fortement, produire davantage, simplifier les contreparties" lead="La solidarité garantit les besoins essentiels ; la politique économique cherche ensuite l'autonomie par le logement, l'emploi, la formation et la production." />
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            <PolicyCard icon={Handshake} title="Salaires, retraites, logement et sortie de la rue" summary="Personne ne doit rester sans logement ou perdre l'accès à l'eau et au chauffage pendant une difficulté." detail="La protection sociale est forte mais coordonnée autour d'un seul parcours. Le CIAS, France Services, France Travail et les associations ne se renvoient plus le dossier : un référent organise logement, droits, santé, formation et retour à l'activité lorsque c'est possible." points={["Hausse des bas salaires et négociation régulière des grilles", "Pensions et principales prestations indexées sur l'inflation", "Protection contre les coupures d'eau, d'électricité et de chauffage dans la résidence principale", "Hébergement immédiat puis logement durable pour les personnes sans domicile", "CIAS, France Services et France Travail regroupés ou directement coordonnés", "Retour de l'âge légal de la retraite à 60 ans soumis à référendum avec plusieurs scénarios de financement publiés"]} />
            <PolicyCard icon={Factory} title="Réindustrialisation et protection économique" summary="L'argent public finance la production française avec des conditions, pas des subventions sans fin." detail="L'économie reste mixte : PME, indépendants, coopératives, grandes entreprises et opérateurs publics coexistent. L'État peut investir, préempter ou nationaliser lorsqu'une infrastructure ou une entreprise est stratégique. Les travailleurs prennent davantage part aux décisions des grandes entreprises." points={["Fonds souverain français d'investissement de long terme", "Marchés publics favorisant PME et production française lorsque le droit le permet", "Préemption ou prise de participation dans une entreprise stratégique menacée", "Représentation renforcée des salariés dans les conseils des grandes entreprises", "Participation aux bénéfices et droit de regard sur les délocalisations", "Reprises en coopérative facilitées", "Pôle bancaire public orienté vers PME, collectivités et industrie"]} sources={[{ label: "République Souveraine — orientations économiques", href: links.rs, kind: "Site" }]} />
            <PolicyCard icon={BriefcaseBusiness} title="Alternance et premier emploi : former au lieu d'exiger l'expérience" summary="Un débutant est recruté pour apprendre ; il ne doit pas déjà avoir cinq ans d'expérience." detail="Les aides à l'alternance et au premier emploi sont liées à un vrai tutorat et à des missions formatrices. Les compétences acquises dans les associations, projets personnels et emplois saisonniers sont reconnues." points={["Tutorat obligatoire et contrôlable", "Reconnaissance du bénévolat, des projets, des saisons et de la vie associative", "Incitations ciblées à l'embauche des juniors", "Contrôle des stages et alternances utilisés comme postes permanents déguisés", "Passerelles simples entre salariat, formation, reconversion et création d'entreprise"]} />
            <PolicyCard icon={CircleDollarSign} title="Fiscalité lisible, lutte contre la fraude et audit de la dette" summary="Faire contribuer davantage la rente et les très hauts patrimoines, tout en protégeant l'investissement productif." detail="La dette n'est ni un tabou ni de l'argent gratuit. Un audit public distingue investissement utile, intérêts, crises, erreurs, dépenses inefficaces et conséquences de privatisations. La fiscalité est simplifiée pour les ménages et petites entreprises." points={["Lutte renforcée contre l'évasion et la fraude fiscales", "Contribution accrue des très hauts patrimoines et grandes multinationales", "Fiscalité plus favorable aux PME qui investissent et produisent en France", "Réduction des niches inefficaces", "Dette possible lorsqu'elle finance une infrastructure ou une capacité productive durable", "Audit public avant toute décision exceptionnelle sur la dette"]} />
          </div>
        </div>
      </section>

      <section className="px-3 py-11 sm:px-6 sm:py-16">
        <div className="container-tight px-0">
          <SectionTitle id="ecole" icon={GraduationCap} eyebrow="École, santé, agriculture, mobilité" title="Même socle français, organisations régionales différentes" lead="L'égalité porte sur les droits et les objectifs. Les moyens concrets peuvent être différents entre une métropole, un territoire rural, une île ou un bassin industriel." />
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            <PolicyCard icon={GraduationCap} title="École : fondamentaux communs et liberté régionale" summary="Le français, les maths, l'histoire nationale et les sciences restent communs ; la région adapte le reste." detail="L'État définit les compétences minimales à maîtriser. Les régions organisent une partie des horaires, des langues, de la culture, des options et de la formation professionnelle selon leur histoire et leur économie." points={["Objectif de classes plus petites en primaire et au collège", "Fondamentaux concentrés le matin lorsque l'organisation locale le permet", "Sport, technologie, arts, projets et découverte professionnelle davantage l'après-midi", "Histoire, géographie et langues régionales renforcées", "Voies professionnelles et apprentissage revalorisés", "Établissements ouverts pour devoirs, clubs, sport et culture en fin de journée"]} />
            <PolicyCard icon={HeartPulse} title="Santé : Sécurité sociale nationale, soins organisés régionalement" summary="Les mêmes garanties de base partout, mais une région planifie ses hôpitaux et ses recrutements." detail="La région adapte la carte sanitaire, peut salarier des médecins, financer des logements pour soignants et décider de priorités correspondant à sa démographie. Les achats stratégiques et la solidarité financière restent mutualisés nationalement." points={["Remboursement renforcé des soins essentiels", "Maisons et centres de santé dans les bassins de vie", "Recrutement de soignants et secrétaires médicaux", "Ratios minimaux lorsque la sécurité des patients l'exige", "Pôle public du médicament pour les produits stratégiques", "Stocks et achats mutualisés nationalement, organisation des soins décidée régionalement"]} />
            <PolicyCard icon={Flag} title="Agriculture : revenu, souveraineté alimentaire et installation" summary="Un agriculteur doit pouvoir vivre de sa production et transmettre son exploitation." detail="La politique agricole protège la production française, accélère les aides et finance la transition au lieu de la transformer en série d'interdictions sans solution économique." points={["Mécanismes garantissant que les prix couvrent mieux les coûts de production", "Contrôle des marges abusives", "Aides versées plus vite via un guichet unique", "Normes comparables exigées pour les produits importés", "Soutien aux jeunes agriculteurs et à la transmission", "Protection des terres agricoles et lutte contre leur accaparement"]} />
            <PolicyCard icon={TrainFront} title="Transports et logement décidés au niveau du bassin de vie" summary="Une région rurale n'a pas besoin des mêmes solutions qu'une grande métropole." detail="Le rail national reste un réseau commun. Les régions pilotent fortement TER, cars, transports à la demande, tarification, logement et foncier. Elles peuvent rouvrir des lignes utiles ou développer une offre de cars correspondant réellement aux horaires de travail et d'études." points={["Réouverture des lignes ferroviaires réellement utiles", "TER, cars, fréquences et tarifs sous forte responsabilité régionale", "Transport à la demande et covoiturage public en zone rurale", "Billet unique lorsque plusieurs modes publics sont utilisés", "Construction, rénovation et foncier largement pilotés régionalement", "Règles spécifiques possibles dans les zones touristiques ou très tendues"]} />
          </div>
        </div>
      </section>

      <section className="bg-muted/35 px-3 py-11 sm:px-6 sm:py-16">
        <div className="container-tight px-0">
          <SectionTitle id="souverainete" icon={Flag} eyebrow="Énergie, médias, numérique, Europe" title="Décider en France, coopérer lorsqu'un projet est utile" lead="Donner davantage de pouvoir aux régions françaises ne signifie pas transférer davantage de souveraineté vers un niveau européen." />
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            <PolicyCard icon={Zap} title="Nucléaire et énergie publique" summary="Décarboner sans organiser la pénurie et conserver une filière industrielle complète." detail="Le nucléaire reste la colonne vertébrale pilotable de l'électricité française, avec hydraulique et renouvelables là où ils sont adaptés. La stratégie générale est nationale ; les régions participent aux implantations et aux priorités territoriales." points={["Prolonger les réacteurs validés par l'autorité de sûreté", "Construire de nouvelles capacités nucléaires et investir dans la recherche", "Grand opérateur public de l'énergie", "Solaire prioritaire sur bâtiments, parkings, friches et zones artificialisées", "Plans régionaux d'adaptation au changement climatique", "Rénovation thermique ciblée sur les logements les plus énergivores"]} />
            <PolicyCard icon={Radio} title="Médias pluralistes et numérique souverain" summary="Moins de concentration médiatique, plus de rédactions locales et des outils numériques français." detail="Les moyens techniques du service public peuvent être mutualisés sans centraliser toute la ligne éditoriale. Les rédactions régionales disposent d'une vraie autonomie. La commande publique soutient cloud, IA, logiciels ouverts, recherche et infrastructures critiques." points={["Limites renforcées à la concentration des médias", "Transparence des propriétaires et financements importants", "Soutien aux médias locaux, associatifs et indépendants", "Rédactions régionales autonomes dans le service public", "Soutien au logiciel libre et aux services numériques souverains", "Données critiques hébergées sous contrôle juridique français"]} />
            <PolicyCard icon={Flag} badge="Europe" title="Pas de transfert automatique de souveraineté à l'échelle européenne" summary="Coopération entre nations oui ; nouveaux pouvoirs transférés sans vote populaire non." detail="La France coopère sur la recherche, l'industrie, les transports, l'environnement ou des projets de défense précis. Tout nouveau transfert majeur de souveraineté doit être soumis à référendum. Lorsqu'une règle européenne empêche durablement un choix démocratique essentiel, la France négocie d'abord puis les citoyens tranchent la suite." points={["Aucun nouveau transfert majeur sans référendum", "Coopérations européennes par projets entre nations souveraines", "Renégociation ou dérogation lorsqu'une règle bloque une politique industrielle ou sociale essentielle", "Référendum national si un conflit fondamental ne peut plus être résolu", "Diplomatie indépendante sans alignement automatique sur une puissance ou un bloc"]} />
            <PolicyCard icon={Vote} title="RIC national et régional" summary="Les citoyens peuvent proposer, abroger ou trancher une grande décision entre deux élections." detail="Le référendum d'initiative citoyenne existe au niveau national et au niveau régional dans les matières relevant de la région. Certains changements, comme les frontières régionales ou un transfert majeur de souveraineté, passent obligatoirement par référendum." points={["RIC législatif et abrogatif", "RIC régional dans les compétences régionales", "Référendum obligatoire pour les frontières régionales", "Référendum national avant un transfert majeur supplémentaire de souveraineté", "Document d'information contradictoire publié avant chaque vote"]} videoId="NM03cUVKrMw" videoTitle="Le référendum d'initiative citoyenne en débat" />
          </div>
        </div>
      </section>

      <section id="sources-politique" className="scroll-mt-28 px-3 py-11 sm:px-6 sm:py-16">
        <div className="container-tight px-0">
          <div className="mx-auto max-w-4xl rounded-[22px] border border-border bg-card p-4 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></span>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary">Documents et vérification</p>
                <h2 className="mt-1 font-display text-xl font-bold text-foreground">Les sources documentent les faits ; elles n'approuvent pas automatiquement les propositions.</h2>
                <p className="mt-2 text-[12px] leading-5 text-muted-foreground sm:text-sm sm:leading-6">Le programme politique reste une proposition personnelle. Les documents IFOP, Sénat, Légifrance et services publics servent à vérifier les chiffres, le droit actuel et les mécanismes déjà existants.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {[
                ["IFOP — régionalisme 2025", links.ifop],
                ["Sénat — subsidiarité", links.senateSubsidiarity],
                ["Sénat — autonomie de la Corse", links.senateCorsica],
                ["Constitution française", links.constitution],
                ["FranceConnect", links.franceConnect],
                ["France Services", links.franceServices],
                ["Service Civique", links.serviceCivique],
                ["République Souveraine — programme", links.rs],
              ].map(([label, href]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3.5 py-3 text-[12px] font-bold text-foreground hover:border-primary hover:text-primary sm:text-sm"><span>{label}</span><ExternalLink className="h-4 w-4 shrink-0" /></a>)}
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-background p-1.5">
              <YouTubeEmbed videoId="s5tXNjOhe1A" title="Autonomie territoriale : débat parlementaire" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
