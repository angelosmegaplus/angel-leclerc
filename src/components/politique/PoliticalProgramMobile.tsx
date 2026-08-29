import { useState, type ReactNode } from "react";
import {
  BookOpen,
  Building2,
  ChevronDown,
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
  TrainFront,
  Users,
  Vote,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";

type SourceLink = { label: string; href: string; kind?: "PDF" | "Site" | "Texte" | "Dossier" };
type PowerKey = "national" | "regional" | "shared";

type PositionCardProps = {
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
  echr: "https://www.echr.coe.int/fr/european-convention-on-human-rights",
  serviceCivique: "https://www.service-civique.gouv.fr/",
  integration: "https://www.service-public.fr/particuliers/vosdroits/F17048",
  franceConnect: "https://www.franceconnect.gouv.fr/",
  franceServices: "https://www.france-services.gouv.fr/",
  franceTravail: "https://www.francetravail.fr/",
};

const logos = {
  franceConnect: "https://docs.partenaires.franceconnect.gouv.fr/images/fi/fc_avatar.png",
  franceServices: "https://www.justice.fr/sites/default/files/Logo_1_France_services_-_header%20%281%29.jpg",
  franceTravail: "https://travail-emploi.gouv.fr/sites/travail-emploi/files/styles/thumbnail_ondine_16_9/public/2024-05/france-travail.jpg.webp?itok=b4FXuoZw",
  laPoste: "https://collections.museedelaposte.fr/files/lp-logo-jaune-rvb_517fc034e06d2695cf8e8fb3475dfa6d.png",
  sncf: "https://cdn.iris-etourism.io/uploads/pays_voironnais_tourisme/sizes/355/140-31-2367372-800x520.webp",
};

const powerContent: Record<PowerKey, { title: string; lead: string; items: string[] }> = {
  national: {
    title: "Pouvoir national",
    lead: "La France reste une nation commune avec un État fort sur les fonctions qui exigent l'unité.",
    items: [
      "Constitution, citoyenneté, nationalité et libertés fondamentales",
      "Défense, armées, renseignement stratégique, diplomatie et frontières",
      "Grands réseaux stratégiques et continuité nationale",
      "Socle commun de protection sociale et de solidarité entre les territoires",
      "Infractions et affaires qui concernent directement la Nation ou plusieurs régions",
    ],
  },
  regional: {
    title: "Pouvoir régional",
    lead: "Les régions disposent de vraies institutions politiques et de compétences propres clairement garanties.",
    items: [
      "Parlement régional composé de conseillers régionaux élus au suffrage universel direct",
      "Président de région élu au suffrage universel direct",
      "Lois régionales dans les compétences attribuées à la région",
      "Budget, fiscalité régionale et administration propres dans le cadre constitutionnel",
      "Transports, logement, aménagement, économie, tourisme, culture et langues régionales",
      "Police territoriale, justice régionale, prisons régionales et droit régional dans les matières attribuées",
    ],
  },
  shared: {
    title: "Pouvoir partagé",
    lead: "Un socle français commun peut coexister avec une organisation régionale plus libre.",
    items: [
      "École et formation : garanties communes, adaptations régionales",
      "Santé : solidarité nationale, organisation territoriale des soins",
      "Sécurité : missions nationales et sécurité quotidienne territoriale",
      "Énergie et infrastructures : stratégie nationale, priorités régionales",
      "Solidarité : droits communs et compléments régionaux possibles",
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
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" className="shrink-0">{content}</a> : content;
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

function PositionCard({ icon: Icon, title, summary, detail, points, badge, sources = [], visual, videoId, videoTitle }: PositionCardProps) {
  return (
    <details className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all open:border-primary/40 open:shadow-md">
      <summary className="flex min-h-[88px] cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden sm:p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary">Ce que je défends</p>
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
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-sm"><Icon className="h-5 w-5" /></span>
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
    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="grid grid-cols-3 gap-1 border-b border-border bg-muted/40 p-1.5">
        {([["national", "National"], ["regional", "Régional"], ["shared", "Partagé"]] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            aria-pressed={active === key}
            className={`min-h-11 rounded-xl px-1.5 text-[11px] font-extrabold transition-colors sm:text-sm ${active === key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-background hover:text-foreground"}`}
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
    ["1", "Aujourd'hui", "La peine de mort est interdite par le droit constitutionnel français actuel."],
    ["2", "Décision nationale préalable", "Une évolution de ce point supposerait d'abord une modification du cadre national et des engagements juridiques incompatibles."],
    ["3", "Référendum régional", "Une région compétente en droit pénal ne pourrait se prononcer qu'ensuite, par référendum."],
    ["4", "Décision régionale", "Si le vote l'approuve, la région pourrait alors légiférer dans le cadre constitutionnel nouvellement défini."],
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
    ["≈ 2 semaines", "Phase commune", "Vie collective, institutions, premiers secours, sécurité civile et découverte des missions publiques."],
    ["Choix", "Voie militaire ou civile", "La suite se fait dans une affectation militaire ou une mission civile d'intérêt général."],
    ["6 mois", "Service national", "Le service est obligatoire et adapté aux aptitudes et aux situations individuelles."],
    ["Après", "Renouvellement volontaire", "La personne peut prolonger volontairement son engagement."],
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
    ["Admission", "Favoriser des voies légales et organisées plutôt que la clandestinité."],
    ["Français et vie civique", "Apprentissage intensif du français, des institutions, des droits et des devoirs."],
    ["Formation", "Apprendre un métier ou faire reconnaître des compétences déjà acquises."],
    ["Orientation", "Diriger prioritairement vers les territoires où existent logement, formation et besoins d'emploi."],
    ["Autonomie", "Accompagnement exigeant jusqu'à l'emploi, la formation ou une situation stable."],
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
      <div className="rounded-2xl bg-primary px-3 py-3 text-center text-sm font-extrabold text-primary-foreground">UNE ENTRÉE · dossier + démarches + rendez-vous</div>
      <div className="my-2 text-center text-lg font-bold text-primary">↓</div>
      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold sm:text-xs">
        {["Social", "Travail", "Entreprise", "Impôts", "Retraite", "Région"].map((item) => <div key={item} className="rounded-xl border border-border bg-background px-1 py-2.5">{item}</div>)}
      </div>
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
  ["territoires", "École, santé, mobilité"],
  ["souverainete", "Souveraineté"],
  ["sources-politique", "Sources"],
] as const;

export function PoliticalProgramMobile() {
  return (
    <div className="bg-background" data-politique-mobile-first="true">
      <section aria-hidden="true" className="hidden" />

      <nav aria-label="Sommaire de mes positions" className="sticky top-16 z-30 border-b border-border bg-background/94 backdrop-blur">
        <div className="container-tight flex gap-2 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map(([id, label]) => <a key={id} href={`#${id}`} className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-border bg-card px-3 text-[11px] font-extrabold text-muted-foreground hover:border-primary hover:text-foreground">{label}</a>)}
        </div>
      </nav>

      <section className="section-padding bg-background">
        <div className="container-tight">
          <SectionTitle id="institutions" icon={Landmark} eyebrow="Organisation de la France" title="Des régions politiques, mais une seule nation" lead="Le principe est simple : la France garde les fonctions communes ; les régions disposent de pouvoirs propres, d'élus directement choisis par les habitants et de vraies lois dans leurs domaines." />
          <PowerTabs />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <PositionCard
              icon={Landmark}
              badge="Institutions"
              title="Un Parlement régional élu directement par les habitants"
              summary="Les conseillers régionaux restent les représentants régionaux et sont élus au suffrage universel direct."
              detail="Le conseil régional devient un véritable Parlement régional. Les conseillers régionaux sont élus au suffrage universel direct par les habitants. Le président de région est lui aussi élu au suffrage universel direct. Le Parlement vote les lois régionales et le budget ; le président exerce l'exécutif et applique les décisions."
              points={[
                "Conseillers régionaux élus au suffrage universel direct",
                "Président de région élu au suffrage universel direct",
                "Parlement régional au centre de la décision politique régionale",
                "Lois régionales dans les compétences attribuées à la région",
                "Constitution et juridiction constitutionnelle pour arbitrer les conflits de compétence",
                "Sénat chargé de représenter les territoires au niveau national ; aucun nombre fixe de sénateurs n'est présenté ici comme une position arrêtée",
              ]}
              sources={[
                { label: "IFOP — régionalisme 2025", href: links.ifop, kind: "PDF" },
                { label: "Sénat — subsidiarité", href: links.senateSubsidiarity, kind: "PDF" },
              ]}
            />
            <PositionCard
              icon={Languages}
              title="Identités régionales, langues et territoires historiques"
              summary="L'unité nationale n'oblige pas à effacer les identités historiques."
              detail="Les régions doivent pouvoir mieux valoriser leurs drapeaux, leur histoire, leurs cultures et leurs langues. Le découpage administratif peut être réinterrogé lorsque les habitants souhaitent retrouver une cohérence historique ou culturelle."
              points={[
                "Français comme langue nationale commune",
                "Place institutionnelle renforcée pour les langues régionales lorsque le territoire le souhaite",
                "Histoire et géographie régionales davantage enseignées",
                "Consultation ou référendum des habitants pour les changements territoriaux importants",
                "Une seule citoyenneté française et maintien de l'unité nationale",
              ]}
              sources={[{ label: "IFOP — identités et pouvoir régional", href: links.ifop, kind: "PDF" }]}
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/40">
        <div className="container-tight">
          <SectionTitle id="justice" icon={Scale} eyebrow="Justice et sécurité" title="Une vraie justice régionale dans les compétences régionales" lead="Les régions peuvent disposer de leur justice, de leur police territoriale, de leurs prisons et de leur droit régional, tout en conservant un cadre constitutionnel commun." />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <PositionCard
              icon={Scale}
              badge="Justice régionale"
              title="Tribunaux, parquet et droit régional"
              summary="Une loi régionale doit pouvoir être appliquée par une justice régionale."
              detail="Les régions disposent de juridictions et d'un parquet compétents pour le droit régional. Les affaires relevant directement de la souveraineté nationale ou dépassant plusieurs régions restent traitées au niveau national. Je ne fixe pas ici une architecture détaillée de tribunaux qui n'a pas été arrêtée."
              points={[
                "Justice régionale pour le droit régional",
                "Parquet régional dans les compétences régionales",
                "Prisons régionales pour l'exécution des peines régionales",
                "Droit pénal régional possible dans les matières attribuées",
                "Garanties constitutionnelles communes pour les droits fondamentaux et le procès équitable",
              ]}
            />
            <PositionCard
              icon={Siren}
              badge="Police territoriale"
              title="Une police territoriale pour la sécurité quotidienne"
              summary="La proximité relève davantage du territoire ; les missions stratégiques restent nationales."
              detail="Je défends une police territoriale ou régionale chargée de la sécurité quotidienne et de la proximité. Les forces nationales conservent les missions qui exigent une cohérence française ou dépassent une région. Je ne fixe pas ici un mode d'élection particulier pour un directeur de police."
              points={[
                "Sécurité quotidienne et présence de proximité",
                "Coordination avec les autorités régionales et locales élues",
                "Cadre national de formation, de déontologie et de contrôle judiciaire",
                "Forces nationales maintenues pour les missions stratégiques et interrégionales",
              ]}
            />
            <PositionCard
              icon={Building2}
              badge="Prisons"
              title="Des prisons régionales lorsque la justice est régionale"
              summary="Une région qui vote une partie de son droit pénal doit pouvoir assumer l'exécution de ses peines."
              detail="Les prisons régionales font partie de la logique d'une justice régionale complète. Les droits fondamentaux, la dignité, la santé et la sécurité restent protégés par des garanties communes à toute la France."
              points={[
                "Administration pénitentiaire régionale dans les compétences attribuées",
                "Exécution régionale des peines créées par le droit régional",
                "Garanties nationales minimales de dignité, santé et sécurité",
              ]}
            />
            <PositionCard
              icon={Shield}
              badge="Peine de mort"
              title="Une décision régionale impossible sans changement national préalable"
              summary="Aujourd'hui, une région ne peut pas rétablir la peine de mort par elle-même."
              detail="La position défendue est qu'une région pourrait, dans un système où elle dispose d'une compétence pénale, décider de cette question uniquement après une modification préalable du cadre constitutionnel national et des engagements juridiques incompatibles, puis après un référendum dans la région concernée."
              points={[
                "Aucun rétablissement régional possible dans le droit français actuel",
                "Modification nationale préalable du cadre juridique",
                "Référendum dans la région concernée",
                "Décision limitée à la région si le cadre constitutionnel l'autorise",
              ]}
              visual={<JusticeFlow />}
              sources={[
                { label: "Constitution française", href: links.constitution, kind: "Texte" },
                { label: "Convention européenne des droits de l'homme", href: links.echr, kind: "Site" },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-tight">
          <SectionTitle id="service" icon={Flag} eyebrow="Jeunesse et engagement" title="Un service national obligatoire de six mois" lead="Une courte phase commune, puis un choix entre engagement militaire et mission civile d'intérêt général, avec possibilité de continuer volontairement ensuite." />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <PositionCard
              icon={Flag}
              badge="Service national"
              title="Environ deux semaines communes, puis six mois de service"
              summary="Le principe est fixé ; les détails administratifs ne sont pas inventés ici."
              detail="Le service commence par environ deux semaines communes, puis la personne choisit une voie militaire ou une mission civile d'intérêt général. La durée totale défendue est de six mois, avec possibilité de renouvellement volontaire."
              points={[
                "Service national obligatoire de six mois",
                "Environ deux semaines de phase commune",
                "Choix entre voie militaire et mission civile d'intérêt général",
                "Mission adaptée aux aptitudes et aux situations individuelles",
                "Renouvellement volontaire possible après la période obligatoire",
              ]}
              visual={<ServiceFlow />}
              sources={[{ label: "Service Civique — fonctionnement actuel des missions civiles", href: links.serviceCivique, kind: "Site" }]}
            />
            <PositionCard
              icon={Users}
              title="Des missions liées aux besoins réels du pays et des territoires"
              summary="L'objectif est d'être utile, pas d'occuper artificiellement les jeunes pendant six mois."
              detail="Les missions civiles peuvent répondre aux besoins des collectivités, des services publics, du patrimoine, de l'environnement ou de la solidarité. Les missions militaires restent liées aux armées et à la défense."
              points={[
                "Services publics et collectivités",
                "Solidarité, secours et sécurité civile",
                "Environnement et patrimoine",
                "Défense et missions militaires",
                "Orientation selon les besoins réels et les aptitudes",
              ]}
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/40">
        <div className="container-tight">
          <SectionTitle id="immigration" icon={Users} eyebrow="Immigration et intégration" title="Accueil légal large, intégration beaucoup plus exigeante" lead="L'idée centrale est de réduire la clandestinité tout en organisant immédiatement l'apprentissage du français, la formation, le travail et l'installation territoriale." />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <PositionCard
              icon={Handshake}
              badge="Intégration"
              title="Français, institutions, métier et autonomie"
              summary="L'accueil n'est pas seulement administratif : il doit mener rapidement vers l'autonomie."
              detail="Je défends des voies légales plus accessibles et, en contrepartie, un parcours d'intégration très poussé. Il comprend l'apprentissage du français, la compréhension des institutions et des règles communes, ainsi qu'une formation professionnelle lorsque cela est nécessaire."
              points={[
                "Apprentissage intensif du français",
                "Formation civique sur les institutions, les droits et les devoirs",
                "Reconnaissance des compétences et formation professionnelle",
                "Accès rapide au travail lorsque la situation juridique le permet",
                "Suivi jusqu'à une situation d'autonomie réelle",
              ]}
              visual={<IntegrationFlow />}
              sources={[{ label: "Service-Public — contrat d'intégration républicaine", href: links.integration, kind: "Site" }]}
            />
            <PositionCard
              icon={MapPinned}
              badge="Orientation territoriale"
              title="Orienter vers les territoires où existent logement, formation et emploi"
              summary="L'intégration doit aussi répondre aux besoins réels des territoires."
              detail="L'installation initiale peut être organisée avec les régions et France Travail afin d'éviter la concentration dans les mêmes zones et de rapprocher les personnes des logements, formations et emplois disponibles. Les aides liées au parcours d'intégration peuvent être conditionnées à une participation réelle, sans remettre en cause les secours d'urgence."
              points={[
                "Coordination entre État, régions et France Travail",
                "Orientation vers les territoires qui disposent de capacités d'accueil et de besoins d'emploi",
                "Formation liée aux besoins professionnels réels",
                "Contreparties liées à la participation au parcours d'intégration",
                "Objectif final : autonomie par le travail ou la formation",
              ]}
              sources={[{ label: "France Travail", href: links.franceTravail, kind: "Site" }]}
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-tight">
          <SectionTitle id="services" icon={Smartphone} eyebrow="Services publics" title="Un guichet simple devant, des services publics solides derrière" lead="Les démarches doivent être regroupées sans supprimer l'accueil humain, tandis que les grands secteurs stratégiques reviennent davantage sous contrôle public." />
          <div className="mt-5"><LogoRail /></div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <PositionCard
              icon={Smartphone}
              badge="Guichet unique"
              title="Un compte et une entrée commune pour les démarches"
              summary="Le citoyen ne doit plus courir d'une administration à l'autre pour le même dossier."
              detail="Je défends une entrée numérique commune, appuyée sur FranceConnect, mais aussi un réseau physique réellement accessible. Le CIAS, France Travail, France Services et les autres services doivent être regroupés ou directement coordonnés lorsqu'ils traitent les mêmes situations."
              points={[
                "Un compte et un tableau de bord communs pour les démarches",
                "FranceConnect comme porte d'entrée numérique",
                "Maintien de guichets physiques et d'un accueil humain",
                "CIAS, France Travail et France Services regroupés ou directement coordonnés",
                "Échanges automatiques entre administrations lorsque cela évite de redemander les mêmes justificatifs",
              ]}
              visual={<PublicServicesFlow />}
              sources={[
                { label: "FranceConnect", href: links.franceConnect, kind: "Site" },
                { label: "France Services", href: links.franceServices, kind: "Site" },
              ]}
            />
            <PositionCard
              icon={Factory}
              badge="Secteurs stratégiques"
              title="Reprendre le contrôle public des grands réseaux stratégiques"
              summary="Les secteurs indispensables à la souveraineté et aux services essentiels ne doivent pas dépendre uniquement de la logique de concurrence."
              detail="Parmi les idées déjà défendues figurent le retour d'un grand France Télécom, une Énergie de France regroupant les fonctions stratégiques de l'énergie, une SNCF élargie dans les mobilités, une reprise publique progressive des grands axes routiers, une La Poste renforcée et un service public des médias mieux coordonné."
              points={[
                "France Télécom, avec reprise de contrôle public du secteur des télécommunications",
                "Énergie de France pour coordonner les fonctions énergétiques stratégiques",
                "SNCF comme colonne vertébrale du rail et des mobilités publiques",
                "Reprise publique progressive des autoroutes et grands axes stratégiques",
                "La Poste renforcée dans les services de proximité et le numérique",
                "France Médias coordonné nationalement avec davantage de place pour les rédactions régionales",
              ]}
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/40">
        <div className="container-tight">
          <SectionTitle id="social" icon={Handshake} eyebrow="Social et économie" title="Protection sociale forte, production française et participation des travailleurs" lead="La ligne économique est sociale, souverainiste et productive : protéger les personnes, relocaliser, soutenir le travail et garder une place à l'initiative privée." />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <PositionCard
              icon={Handshake}
              title="Personne durablement à la rue"
              summary="Le sans-abrisme doit être traité comme un parcours à résoudre, pas comme une situation à gérer indéfiniment."
              detail="Je défends une prise en charge coordonnée qui commence par la mise à l'abri et le logement, puis réunit droits sociaux, santé, formation et emploi quand la situation le permet. Les organismes doivent travailler ensemble autour de la personne."
              points={[
                "Mise à l'abri et recherche rapide d'une solution de logement",
                "Accompagnement administratif et social coordonné",
                "Lien direct avec France Travail et la formation lorsque cela est possible",
                "CIAS comme point de coordination sociale de proximité",
                "Aides accompagnées de contreparties ou d'un parcours lorsque la situation de la personne le permet",
              ]}
            />
            <PositionCard
              icon={Factory}
              title="Réindustrialiser et relocaliser"
              summary="La France doit produire davantage de ce qu'elle consomme et protéger ses secteurs stratégiques."
              detail="Je défends une économie mixte : entreprises privées, PME, indépendants, coopératives et entreprises publiques peuvent coexister. L'État intervient davantage lorsqu'un secteur stratégique, une infrastructure ou une capacité industrielle essentielle est menacé."
              points={[
                "Relocalisation de la production et protection économique",
                "Réindustrialisation et soutien aux PME productives",
                "Contrôle public des secteurs stratégiques lorsque c'est nécessaire",
                "Participation accrue des travailleurs aux décisions et aux résultats des entreprises",
                "Coopératives et reprises par les salariés facilitées",
              ]}
              sources={[{ label: "République Souveraine — orientations économiques", href: links.rs, kind: "Site" }]}
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-tight">
          <SectionTitle id="territoires" icon={MapPinned} eyebrow="École, santé et mobilité" title="Un socle national, davantage de liberté d'organisation régionale" lead="Je n'ai pas arrêté ici un catalogue détaillé de mesures scolaires ou sanitaires. Le point de vue défendu porte surtout sur la répartition des responsabilités entre la France et les régions." />
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <PositionCard
              icon={GraduationCap}
              title="École et formation"
              summary="Les fondamentaux restent communs ; les régions peuvent mieux adapter les compléments à leur histoire et à leur économie."
              detail="Le socle national doit rester commun. Les régions peuvent toutefois avoir davantage de marge sur les langues régionales, l'histoire locale, la formation professionnelle et les réponses aux besoins économiques du territoire."
              points={[
                "Socle éducatif national commun",
                "Langues, histoire et culture régionales davantage valorisées",
                "Formation professionnelle davantage adaptée aux besoins régionaux",
              ]}
            />
            <PositionCard
              icon={HeartPulse}
              title="Santé"
              summary="La solidarité reste française ; l'organisation concrète des soins peut être davantage régionale."
              detail="Je défends surtout un partage clair : les garanties et la solidarité restent nationales, tandis que les régions peuvent organiser plus directement l'offre de soins selon les réalités locales."
              points={[
                "Garanties communes au niveau national",
                "Organisation territoriale des soins davantage confiée aux régions",
                "Adaptation aux réalités rurales, urbaines ou insulaires",
              ]}
            />
            <PositionCard
              icon={TrainFront}
              title="Transports"
              summary="Le réseau national reste cohérent, les régions décident davantage des mobilités quotidiennes."
              detail="Le rail national doit rester un grand réseau commun. Les régions disposent cependant d'une forte liberté d'organisation pour les TER, les cars, les transports à la demande et les réponses adaptées aux bassins de vie."
              points={[
                "Grand réseau ferroviaire national maintenu",
                "TER et cars davantage pilotés régionalement",
                "Solutions spécifiques pour les zones rurales et les bassins de vie",
              ]}
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/40">
        <div className="container-tight">
          <SectionTitle id="souverainete" icon={Flag} eyebrow="Souveraineté" title="Décider en France et coopérer entre nations" lead="Le régionalisme intérieur ne doit pas affaiblir la souveraineté française à l'extérieur." />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <PositionCard
              icon={Zap}
              title="Nucléaire et énergie stratégique"
              summary="Le nucléaire reste un pilier de la souveraineté énergétique française."
              detail="Je suis favorable au maintien et au développement d'une filière nucléaire française forte. L'énergie fait partie des secteurs qui justifient une stratégie nationale de long terme et un contrôle public important."
              points={[
                "Filière nucléaire française maintenue et développée",
                "Énergie considérée comme secteur stratégique",
                "Planification nationale de long terme",
                "Régions associées aux priorités et implantations territoriales",
              ]}
            />
            <PositionCard
              icon={Radio}
              title="Médias et numérique"
              summary="Des outils stratégiques nationaux, avec davantage de place pour les réalités régionales."
              detail="Le service public des médias peut être mieux coordonné au niveau national tout en donnant davantage d'autonomie aux rédactions régionales. La souveraineté numérique fait également partie des capacités stratégiques à préserver en France."
              points={[
                "Coordination renforcée du service public des médias",
                "Rédactions régionales davantage autonomes",
                "Infrastructures numériques stratégiques sous contrôle français",
              ]}
            />
            <PositionCard
              icon={Flag}
              badge="Europe"
              title="Coopération entre nations souveraines"
              summary="Coopérer lorsqu'un projet est utile ne signifie pas transférer toujours plus de pouvoir hors de France."
              detail="Je défends une coopération européenne entre nations souveraines, mais pas une intégration politique qui réduirait davantage la capacité de décision française. Les transferts majeurs de souveraineté doivent pouvoir être soumis au peuple."
              points={[
                "Coopérations européennes par projets utiles",
                "Priorité à la souveraineté nationale",
                "Refus de nouveaux transferts majeurs de pouvoir sans consentement populaire",
                "Europe des nations plutôt qu'effacement des États",
              ]}
            />
            <PositionCard
              icon={Vote}
              title="RIC national et régional"
              summary="Les citoyens doivent pouvoir intervenir directement entre deux élections."
              detail="Je défends le référendum d'initiative citoyenne au niveau national et au niveau régional dans les compétences correspondantes. Les grands changements territoriaux ou les transferts importants de souveraineté doivent également pouvoir être soumis directement aux citoyens."
              points={[
                "RIC national",
                "RIC régional dans les compétences régionales",
                "Référendums pour les grands changements territoriaux",
                "Référendum avant un transfert majeur supplémentaire de souveraineté",
              ]}
              videoId="NM03cUVKrMw"
              videoTitle="Le référendum d'initiative citoyenne en débat"
            />
          </div>
        </div>
      </section>

      <section id="sources-politique" className="section-padding scroll-mt-28 bg-background">
        <div className="container-tight">
          <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></span>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary">Documents et vérification</p>
                <h2 className="mt-1 font-display text-xl font-bold text-foreground">Les sources servent à documenter les faits, pas à inventer mes positions.</h2>
                <p className="mt-2 text-[12px] leading-5 text-muted-foreground sm:text-sm sm:leading-6">Cette page présente un point de vue personnel. Lorsqu'un détail institutionnel n'a pas été arrêté, il n'est plus présenté comme s'il s'agissait d'une position certaine.</p>
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
                ["République Souveraine — orientations", links.rs],
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
