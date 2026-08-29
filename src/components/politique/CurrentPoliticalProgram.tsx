import { useState, type ReactNode } from "react";
import {
  BadgeCheck,
  BookOpen,
  Briefcase,
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
  Map,
  Radio,
  Scale,
  Shield,
  Siren,
  Sparkles,
  TrainFront,
  Users,
  Vote,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";

type SourceLink = {
  label: string;
  href: string;
  kind?: "Site" | "PDF" | "Dossier" | "Décision";
};

type PolicyCardProps = {
  icon: LucideIcon;
  title: string;
  summary: string;
  detail: string;
  points: string[];
  sources?: SourceLink[];
  visual?: ReactNode;
  videoId?: string;
  videoTitle?: string;
  badge?: string;
};

type CompetenceKey = "national" | "regional" | "shared";

const rsLogo =
  "https://digitalpress.fra1.cdn.digitaloceanspaces.com/gp82d1z/2025/11/Nouveau-logo-RS-version-2023-2.png";

const ifopPdf =
  "https://www.ifop.com/wp-content/uploads/2025/08/121688_radioscopie_du_regionalisme_en_2025_ifop_rps_2025.08.18_compressed.pdf";

const commonSources = {
  rs: "https://www.republique-souveraine.fr/nosidees/",
  senateSubsidiarity: "https://www.senat.fr/rap/r25-711/r25-7111.pdf",
  senateCorsica: "https://www.senat.fr/dossier-legislatif/pjl24-869.html",
  deathPenalty:
    "https://qpc360.conseil-constitutionnel.fr/2020-02-28/decision-2019-827-qpc-28-fevrier-2020",
  echr: "https://www.echr.coe.int/fr/european-convention-on-human-rights",
  serviceCivique: "https://www.service-civique.gouv.fr/",
  integration: "https://www.service-public.fr/particuliers/vosdroits/F17450",
  republicanCommitment: "https://www.service-public.fr/particuliers/vosdroits/F38329",
  franceConnect: "https://www.franceconnect.gouv.fr/actualites/10-ans-franceconnect/",
  franceServices: "https://www.france-services.gouv.fr/",
};

const competenceContent: Record<
  CompetenceKey,
  { title: string; lead: string; items: string[] }
> = {
  national: {
    title: "Pouvoir national",
    lead: "Une seule France pour tout ce qui exige une décision commune.",
    items: [
      "Constitution, citoyenneté, état civil national et libertés fondamentales",
      "Défense, armées, renseignement stratégique, diplomatie et frontières",
      "Douanes, monnaie et grands choix de souveraineté économique",
      "Infractions contre la Nation : terrorisme, trahison, espionnage, criminalité interrégionale",
      "Socle national de Sécurité sociale, retraites, droits du travail et minima sociaux",
      "Grands réseaux stratégiques : énergie, rail national, télécommunications, autoroutes et infrastructures critiques",
      "Normes nationales minimales en santé, école, environnement et sécurité",
    ],
  },
  regional: {
    title: "Pouvoir régional",
    lead: "Tout ce qui n'est pas réservé au niveau national revient par principe aux régions.",
    items: [
      "Parlement régional, exécutif régional, budget et fiscalité régionale",
      "Lois régionales directement applicables dans le territoire",
      "Transports du quotidien, logement, foncier, urbanisme et aménagement",
      "Économie, tourisme, agriculture, formation professionnelle et aides aux entreprises",
      "Culture, langues régionales, médias régionaux et compléments scolaires",
      "Organisation des hôpitaux, prévention et politique sanitaire territoriale",
      "Police régionale ou territoriale et sécurité de proximité",
      "Justice régionale pour le droit régional, établissements pénitentiaires régionaux et politique d'exécution des peines",
      "Droit civil local dans les domaines transférés : logement, propriété, contrats locaux et vie économique",
      "Droit pénal régional pour les infractions régionales, dans les limites de la Constitution",
    ],
  },
  shared: {
    title: "Compétences partagées",
    lead: "Le niveau national fixe un socle ; la région choisit les moyens et peut aller plus loin.",
    items: [
      "École : programme commun national + histoire, langues et enseignements régionaux",
      "Santé : assurance et garanties nationales + organisation régionale des soins",
      "Environnement : seuils nationaux + règles régionales plus exigeantes ou adaptées",
      "Sécurité : forces nationales pour les missions stratégiques + forces territoriales pour le quotidien",
      "Énergie : plan national de souveraineté + implantation et priorités territoriales",
      "Infrastructures : continuité nationale + programmation régionale des besoins locaux",
      "Solidarité : droits minimaux identiques partout + compléments régionaux financés localement",
    ],
  },
};

function PolicyCard({
  icon: Icon,
  title,
  summary,
  detail,
  points,
  sources = [],
  visual,
  videoId,
  videoTitle,
  badge,
}: PolicyCardProps) {
  return (
    <details className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all open:border-primary/40 open:shadow-md">
      <summary className="flex min-h-24 cursor-pointer list-none items-start gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-primary transition-transform group-open:scale-105">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          {badge ? (
            <span className="mb-1.5 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              {badge}
            </span>
          ) : null}
          <span className="block font-display text-base font-bold leading-snug text-foreground sm:text-lg">
            {title}
          </span>
          <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
            {summary}
          </span>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Ouvrir le dossier <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
          </span>
        </span>
      </summary>

      <div className="border-t border-border bg-background/55 px-4 pb-5 pt-4 sm:px-5 sm:pb-6">
        <p className="text-sm leading-7 text-foreground/85">{detail}</p>

        {visual ? <div className="mt-4">{visual}</div> : null}

        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Concrètement</p>
          <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-foreground/85">
            {points.map((point) => (
              <li key={point} className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {videoId ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card p-2">
            <YouTubeEmbed videoId={videoId} title={videoTitle ?? title} />
          </div>
        ) : null}

        {sources.length ? (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Sources et documents à ouvrir
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sources.map((source) => (
                <a
                  key={`${source.label}-${source.href}`}
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>{source.kind ? `${source.kind} · ` : ""}{source.label}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </details>
  );
}

function SectionTitle({
  id,
  icon: Icon,
  eyebrow,
  title,
  lead,
}: {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  lead: string;
}) {
  return (
    <div id={id} className="scroll-mt-28">
      <div className="mx-auto max-w-3xl text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h2 className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{lead}</p>
      </div>
    </div>
  );
}

function CompetenceMap() {
  const [active, setActive] = useState<CompetenceKey>("national");
  const current = competenceContent[active];

  return (
    <div className="mt-7 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="grid grid-cols-3 border-b border-border bg-background/70 p-1.5">
        {([
          ["national", "National"],
          ["regional", "Régional"],
          ["shared", "Partagé"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={`min-h-11 rounded-2xl px-2 text-xs font-bold transition-colors sm:text-sm ${
              active === key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            aria-pressed={active === key}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {active === "national" ? <Flag className="h-5 w-5" /> : active === "regional" ? <Map className="h-5 w-5" /> : <Handshake className="h-5 w-5" />}
          </span>
          <div>
            <h3 className="font-display text-xl font-bold text-foreground">{current.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{current.lead}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {current.items.map((item) => (
            <div key={item} className="rounded-2xl border border-border bg-background p-3 text-sm leading-relaxed text-foreground/85">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function JusticeDiagram() {
  return (
    <div className="grid gap-2 rounded-2xl border border-border bg-card p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
      <div className="rounded-xl bg-muted/60 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Justice nationale</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Terrorisme · trahison · crimes interrégionaux · Constitution · droits fondamentaux</p>
      </div>
      <div className="flex items-center justify-center text-primary"><Scale className="h-5 w-5" /></div>
      <div className="rounded-xl bg-muted/60 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Justice régionale</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Infractions régionales · tribunaux · appels · prisons · exécution des peines</p>
      </div>
    </div>
  );
}

function ServiceTimeline() {
  const steps = [
    ["1", "Phase commune", "Environ deux semaines : vie collective, institutions, premiers secours, sport, défense, sécurité civile et découverte des missions publiques."],
    ["2", "Choix de la voie", "Chaque jeune choisit une voie militaire ou une mission civile d'intérêt général."],
    ["3", "Six mois de service", "Mission obligatoire, indemnisée, avec hébergement ou aide au logement selon la formule et protection sociale."],
    ["4", "Renouvellement volontaire", "Possibilité de prolonger ensuite par périodes supplémentaires pour continuer la mission ou se professionnaliser."],
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {steps.map(([n, title, text]) => (
        <div key={n} className="flex gap-3 rounded-2xl border border-border bg-card p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{n}</span>
          <div>
            <p className="text-sm font-bold text-foreground">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function IntegrationTimeline() {
  const steps = [
    ["Entrer légalement", "Procédure simple et rapide, contrôles de sécurité ciblés et droit de travailler rapidement."],
    ["Évaluer", "Français, compétences, diplômes, santé, situation familiale, expérience et projet professionnel."],
    ["Former", "Français intensif, institutions, lois, droits et devoirs, histoire commune, formation professionnelle."],
    ["Orienter", "Première implantation vers un territoire disposant d'un logement et de besoins d'emploi correspondant au profil."],
    ["Stabiliser", "Suivi pendant les premiers mois, accompagnement vers l'autonomie, puis liberté de mobilité normale une fois la situation stabilisée."],
  ];
  return (
    <div className="space-y-2">
      {steps.map(([title, text], index) => (
        <div key={title} className="grid grid-cols-[32px_1fr] gap-3 rounded-2xl border border-border bg-card p-3.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
          <div>
            <p className="text-sm font-bold text-foreground">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PublicServicesDiagram() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-center text-xs font-bold uppercase tracking-wider text-primary">Une entrée · plusieurs spécialistes derrière</p>
      <div className="mt-3 rounded-2xl bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground">
        Services publics de France · compte et guichet uniques
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-3">
        {["Social", "Travail", "Entreprise", "Impôts", "Retraite", "Collectivités"].map((item) => (
          <div key={item} className="rounded-xl border border-border bg-background px-2 py-3 font-semibold text-foreground">{item}</div>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">Une interface commune ne signifie pas un fichier unique : chaque service garde uniquement les données qu'il est autorisé à utiliser.</p>
    </div>
  );
}

function InstitutionRibbon() {
  const institutions = [
    ["FranceConnect", BadgeCheck],
    ["France Services", Building2],
    ["France Travail", Briefcase],
    ["SNCF", TrainFront],
    ["La Poste", FileText],
    ["France Télécom", Radio],
    ["Énergie de France", Zap],
    ["France.Media", Radio],
  ] as const;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {institutions.map(([name, Icon]) => (
        <span key={name} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground">
          <Icon className="h-3.5 w-3.5 text-primary" /> {name}
        </span>
      ))}
    </div>
  );
}

const quickNav = [
  ["federalisme-actuel", "Fédéralisme"],
  ["justice-actuelle", "Justice"],
  ["service-national", "Service national"],
  ["immigration-actuelle", "Immigration"],
  ["services-publics-actuels", "Services publics"],
  ["social-economie", "Social & économie"],
  ["ecole-sante", "École & santé"],
  ["souverainete", "Souveraineté"],
] as const;

export function CurrentPoliticalProgram() {
  return (
    <div className="bg-background" data-current-political-program="true">
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:20px_20px]" />
        </div>
        <div className="container-tight relative py-10 sm:py-14 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Programme personnel · version actuelle
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Une France unie, <span className="italic text-primary">fédérale</span>, sociale et souveraine.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[0.98rem] leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Une seule nation et une seule citoyenneté, mais des régions qui votent réellement leurs lois, lèvent une partie de leurs impôts, organisent leurs services et disposent de leurs propres institutions.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center">
              {["Loi nationale + loi régionale", "RIC national et régional", "Services publics forts", "Souveraineté française"].map((item) => (
                <span key={item} className="flex min-h-11 items-center justify-center rounded-2xl border border-border bg-card px-3 py-2 text-center text-xs font-semibold text-foreground shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-7 max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="grid items-center gap-4 p-4 sm:grid-cols-[150px_1fr] sm:p-5">
              <a href={commonSources.rs} target="_blank" rel="noopener noreferrer" className="flex h-20 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white p-2 sm:h-24">
                <img src={rsLogo} alt="Logo de République Souveraine" className="h-full w-full object-contain" loading="lazy" referrerPolicy="no-referrer" />
              </a>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Engagement politique</p>
                <h2 className="mt-1 font-display text-xl font-bold text-foreground">Adhérent à République Souveraine</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  J'apprécie une grande partie de son programme, notamment la souveraineté populaire, le RIC, la réindustrialisation et les services publics stratégiques. Les propositions ci-dessous présentent toutefois mon propre point de vue, en particulier sur une organisation beaucoup plus fédérale de la France.
                </p>
                <a href={commonSources.rs} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-bold text-foreground hover:border-primary hover:text-primary">
                  Voir le programme du mouvement <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Sommaire du programme" className="sticky top-16 z-30 border-b border-border bg-background/92 backdrop-blur">
        <div className="container-tight flex gap-2 overflow-x-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {quickNav.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
              {label}
            </a>
          ))}
        </div>
      </nav>

      <section className="section-padding bg-background">
        <div className="container-tight">
          <SectionTitle
            id="federalisme-actuel"
            icon={Landmark}
            eyebrow="Organisation de la France"
            title="Un partage du pouvoir écrit noir sur blanc"
            lead="Plus de formule du type ‘dans les compétences qui leur sont attribuées’ sans expliquer lesquelles. La Constitution doit dire qui décide de quoi, et tout pouvoir non réservé à la France revient aux régions."
          />
          <CompetenceMap />

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <PolicyCard
              icon={Landmark}
              badge="Institutions"
              title="Une Ve République fédérale sans changer tous les repères"
              summary="Président, Assemblée nationale et Sénat restent ; les régions deviennent de vrais pouvoirs politiques."
              detail="Le but n'est pas de remplacer tous les mots connus des Français. Le niveau national conserve les institutions familières. Chaque région dispose en parallèle d'un Parlement régional et d'un exécutif. Elle adopte un statut fondamental approuvé par ses habitants, mais ce texte reste inférieur à la Constitution française."
              points={[
                "Assemblée nationale élue selon la population et chargée de la loi nationale",
                "Sénat composé sur une base territoriale : chaque région fédérée envoie le même nombre de sénateurs afin de protéger les territoires face au seul poids démographique",
                "Six sénateurs par région, élus directement pour six ans, avec renouvellement régulier",
                "Le Sénat doit approuver toute modification des compétences, des finances ou des frontières régionales",
                "Parlement régional élu directement dans des circonscriptions territoriales",
                "Président de région élu par le Parlement régional puis chargé d'appliquer les lois régionales",
                "Statut fondamental de chaque région adopté ou modifié par référendum régional",
              ]}
              sources={[
                { label: "Radioscopie du régionalisme 2025", href: ifopPdf, kind: "PDF" },
                { label: "La subsidiarité en action", href: commonSources.senateSubsidiarity, kind: "PDF" },
              ]}
            />

            <PolicyCard
              icon={Scale}
              badge="Lois"
              title="Deux niveaux de lois, pas une simple adaptation administrative"
              summary="Une loi régionale est une vraie loi. Elle n'a pas besoin d'une autorisation de Paris si la matière appartient à la région."
              detail="La Constitution liste les domaines réservés au pouvoir national. Dans ces domaines, la loi française s'impose partout. Dans les autres, les régions peuvent légiférer directement. Pour les matières partagées, la loi nationale fixe un socle commun et les régions choisissent les règles d'application ou des garanties supplémentaires."
              points={[
                "La Constitution est toujours au-dessus des deux niveaux de loi",
                "La loi nationale prévaut seulement dans les matières nationales et sur les droits constitutionnels",
                "La loi régionale prévaut dans les matières régionales",
                "Les compétences non listées comme nationales sont régionales par défaut",
                "Une Cour constitutionnelle arbitre les conflits de compétence",
                "Le pouvoir national ne peut pas reprendre seul une compétence régionale : révision constitutionnelle et accord territorial nécessaires",
                "Une région peut obtenir un statut plus autonome qu'une autre si ses habitants l'approuvent",
              ]}
              sources={[
                { label: "Projet constitutionnel sur l'autonomie de la Corse", href: commonSources.senateCorsica, kind: "Dossier" },
                { label: "IFOP — pouvoir régional", href: ifopPdf, kind: "PDF" },
              ]}
              videoId="s5tXNjOhe1A"
              videoTitle="Autonomie de la Corse : débat parlementaire"
            />

            <PolicyCard
              icon={CircleDollarSign}
              badge="Finances"
              title="Des impôts régionaux et une solidarité nationale obligatoire"
              summary="Les régions financent une partie de leurs choix, mais un territoire pauvre ne doit jamais être abandonné."
              detail="Une région doit pouvoir lever des impôts et voter son budget pour être réellement responsable. En parallèle, la France conserve un mécanisme national de péréquation : une partie des recettes est mutualisée pour garantir un niveau minimal de services publics partout."
              points={[
                "Part régionale de l'impôt sur le revenu ou d'un impôt territorial clairement identifiable",
                "Taxes régionales possibles dans les domaines de compétence régionale",
                "Interdiction de créer des douanes ou barrières commerciales entre régions françaises",
                "Fonds national de solidarité territoriale automatique",
                "Publication d'un budget lisible montrant ce qui est payé au niveau national et au niveau régional",
                "Possibilité pour une région de financer des prestations ou services supplémentaires avec ses propres recettes",
              ]}
            />

            <PolicyCard
              icon={Languages}
              badge="Identités"
              title="Des régions historiques, des langues reconnues et une seule citoyenneté"
              summary="Être breton, alsacien, corse, basque, normand ou occitan ne s'oppose pas au fait d'être français."
              detail="Le découpage de 2015 n'est pas sacré. Les habitants peuvent demander une modification des limites régionales par référendum. Le français reste la langue commune de la France, mais une région peut donner un statut officiel local à une langue régionale et renforcer son enseignement."
              points={[
                "Référendum obligatoire pour une modification importante de frontière régionale",
                "Réunification ou séparation territoriale possible si les populations concernées l'approuvent",
                "Français langue nationale commune",
                "Co-officialité régionale possible pour une langue historique",
                "Histoire et géographie régionales intégrées aux programmes scolaires locaux",
                "Aucune frontière intérieure et une seule nationalité française",
              ]}
              sources={[{ label: "IFOP — identités, langues et limites régionales", href: ifopPdf, kind: "PDF" }]}
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/35">
        <div className="container-tight">
          <SectionTitle
            id="justice-actuelle"
            icon={Scale}
            eyebrow="Justice, prisons et sécurité"
            title="Une justice réellement partagée entre la France et les régions"
            lead="Une région ne gère pas seulement les transports ou la culture : elle peut disposer d'un droit régional, de tribunaux, d'un service pénitentiaire et d'une police correspondant à ses compétences."
          />
          <div className="mt-7 grid gap-3 lg:grid-cols-2">
            <PolicyCard
              icon={Scale}
              badge="Justice régionale"
              title="Tribunaux et droit pénal régional"
              summary="Les infractions régionales sont jugées par des juridictions régionales ; les crimes nationaux restent jugés au niveau français."
              detail="Le système judiciaire est double. Les juridictions régionales appliquent la loi régionale. Les juridictions nationales s'occupent du droit national et des infractions qui touchent directement la France entière. Une Cour constitutionnelle commune protège les droits fondamentaux et règle les conflits entre les deux ordres."
              visual={<JusticeDiagram />}
              points={[
                "Tribunaux régionaux de première instance",
                "Cours d'appel régionales",
                "Cour supérieure régionale pour l'interprétation du droit régional",
                "Juridictions nationales pour terrorisme, trahison, espionnage, douanes, criminalité organisée interrégionale et infractions contre les institutions nationales",
                "Cour constitutionnelle française au-dessus de tous pour la Constitution et les libertés fondamentales",
                "Coopération obligatoire entre parquets et forces de sécurité lorsqu'une affaire traverse plusieurs régions",
              ]}
            />

            <PolicyCard
              icon={Building2}
              badge="Prisons"
              title="Des prisons régionales, avec quelques établissements nationaux"
              summary="Une région qui vote son droit pénal doit aussi assumer l'exécution de ses peines."
              detail="Les régions administrent la majorité des établissements pénitentiaires correspondant à leurs condamnations. Le niveau national conserve des établissements spécialisés pour les condamnations nationales, le terrorisme ou les détenus présentant un risque interrégional exceptionnel."
              points={[
                "Administration pénitentiaire régionale financée par le budget régional",
                "Règles nationales minimales sur la dignité, la sécurité, la santé et les droits de la défense",
                "Régimes de détention, travail, formation et réinsertion pouvant varier d'une région à l'autre",
                "Établissements nationaux de haute sécurité pour certaines infractions nationales",
                "Transferts entre régions possibles sous contrôle judiciaire",
              ]}
            />

            <PolicyCard
              icon={Siren}
              badge="Police territoriale"
              title="Un responsable local de la sécurité directement choisi par les habitants"
              summary="Les polices municipales sont mutualisées à l'échelle du bassin de vie au lieu de rester morcelées commune par commune."
              detail="Une police territoriale regroupe les moyens municipaux de plusieurs communes. Son directeur est élu directement et devient publiquement responsable de la tranquillité quotidienne. Police nationale et gendarmerie restent chargées des enquêtes lourdes, du renseignement, du maintien de l'ordre national et de la criminalité grave."
              points={[
                "Fusion volontaire ou légale des polices municipales dans un bassin de vie cohérent",
                "Directeur territorial élu au suffrage universel direct",
                "Circulation, nuisances, marchés, événements, prévention et présence de proximité",
                "Formation, armement, déontologie et garanties définis par un cadre national",
                "Contrôle du préfet, du juge et d'une inspection indépendante",
                "Aucun financement privé du service de police",
              ]}
            />

            <PolicyCard
              icon={Shield}
              badge="Peine de mort"
              title="Une région pourrait la rétablir, mais seulement après deux verrous démocratiques"
              summary="Aujourd'hui c'est impossible. Dans le système proposé, la France devrait d'abord changer son cadre supérieur avant qu'une région puisse décider."
              detail="L'article 66-1 de la Constitution interdit actuellement toute condamnation à mort et les engagements internationaux de la France renforcent cette interdiction. Une région ne pourrait donc jamais la rétablir seule. Pour rendre un choix régional possible, il faudrait d'abord une révision constitutionnelle nationale et régler les engagements internationaux incompatibles. Ensuite seulement, une région ayant compétence pénale pourrait organiser un référendum régional et adopter une loi correspondante."
              points={[
                "Étape 1 : décision nationale explicite modifiant la Constitution",
                "Étape 2 : mise en conformité ou rupture avec les engagements internationaux qui interdisent la peine de mort",
                "Étape 3 : référendum obligatoire dans la région concernée",
                "Étape 4 : loi pénale régionale précisant les crimes concernés et la procédure",
                "Les autres régions resteraient libres de conserver l'abolition",
                "Aucune application possible tant que les verrous nationaux actuels demeurent",
              ]}
              sources={[
                { label: "Article 66-1 et décision constitutionnelle", href: commonSources.deathPenalty, kind: "Décision" },
                { label: "Convention européenne des droits de l'homme et protocoles", href: commonSources.echr, kind: "Site" },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-tight">
          <SectionTitle
            id="service-national"
            icon={Flag}
            eyebrow="Jeunesse et engagement"
            title="Un service national obligatoire de six mois"
            lead="Tout le monde participe, mais chacun peut choisir entre une voie militaire et une mission civile d'intérêt général."
          />
          <div className="mt-7 grid gap-3 lg:grid-cols-2">
            <PolicyCard
              icon={Flag}
              badge="Obligatoire"
              title="Deux semaines communes, puis chacun choisit sa voie"
              summary="Une phase courte de cohésion précède six mois de service militaire ou civique."
              detail="Le service commence par une période collective d'environ deux semaines destinée à donner à tous les mêmes bases : institutions, premiers secours, défense, sécurité civile, sport, vie collective, mémoire nationale et connaissance des services publics. Ensuite, chaque jeune choisit une affectation militaire ou civile."
              visual={<ServiceTimeline />}
              points={[
                "Recensement et préparation à partir de 16 ans",
                "Phase commune possible entre 16 et 18 ans, avec calendrier compatible avec la scolarité",
                "Service principal à réaliser entre 18 et 25 ans, avec report possible pour raisons sérieuses d'études, de santé ou de famille",
                "Voie militaire : armées, réserve, logistique, cyberdéfense, soutien ou sécurité civile selon aptitude",
                "Voie civile : hôpitaux, EHPAD, collectivités, environnement, patrimoine, secours, associations, écoles ou services publics",
                "Durée de six mois, indemnisée, protégée socialement et reconnue dans le CV",
                "Renouvellement ensuite volontaire par périodes supplémentaires",
                "Mission adaptée plutôt qu'exclusion automatique lorsque l'état de santé permet une autre forme de service",
              ]}
              sources={[{ label: "Service Civique — fonctionnement actuel des missions de 6 à 12 mois", href: commonSources.serviceCivique, kind: "Site" }]}
            />

            <PolicyCard
              icon={Users}
              title="Même obligation, nombreuses missions"
              summary="Le service national ne doit pas être six mois à faire semblant : chaque affectation répond à un besoin réel."
              detail="Les régions recensent leurs besoins civils, tandis que les armées recensent leurs besoins militaires. Une plateforme nationale permet de classer ses choix. L'affectation tient compte des préférences, des compétences, de la proximité et des besoins prioritaires."
              points={[
                "Secours et prévention des risques",
                "Aide aux personnes âgées ou handicapées",
                "Soutien administratif et numérique dans les services publics",
                "Protection de l'environnement et entretien du patrimoine",
                "Aide éducative, sportive et culturelle sous encadrement professionnel",
                "Armées, réserve opérationnelle, cyberdéfense et logistique",
                "Indemnité nationale minimale et prise en charge du transport lié à la mission",
                "Validation de compétences et passerelles vers emploi, concours publics ou réserve",
              ]}
              sources={[{ label: "Service Civique — domaines de mission existants", href: commonSources.serviceCivique, kind: "Site" }]}
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/35">
        <div className="container-tight">
          <SectionTitle
            id="immigration-actuelle"
            icon={Users}
            eyebrow="Immigration et intégration"
            title="Une entrée légale largement ouverte, avec une intégration très exigeante"
            lead="Le principe n'est pas de laisser les personnes dans l'attente ou dans des filières clandestines : entrée légale plus simple, puis langue, formation, travail et règles communes deviennent un parcours obligatoire."
          />
          <div className="mt-7 grid gap-3 lg:grid-cols-2">
            <PolicyCard
              icon={Handshake}
              badge="Contrat d'intégration"
              title="Accueillir, puis intégrer intensivement dès le premier jour"
              summary="Le droit de travailler arrive vite ; en contrepartie, le parcours d'intégration n'est pas facultatif."
              detail="L'objectif est de remplacer une partie de la clandestinité et de l'attente par des voies légales simples. Une personne admise entre rapidement dans un programme structuré de français, de connaissance des institutions, de formation et d'accès à l'emploi. Ce parcours n'impose aucune religion ni opinion politique : il transmet les règles communes et les compétences nécessaires à l'autonomie."
              visual={<IntegrationTimeline />}
              points={[
                "Procédure d'entrée ou de régularisation plus simple lorsqu'il n'existe pas de menace grave, de fraude caractérisée ou de criminalité grave",
                "Droit de travailler le plus tôt possible après l'admission",
                "Test initial de français et formation intensive jusqu'à un niveau permettant la vie quotidienne et professionnelle",
                "Cours obligatoires sur les institutions, les lois, la laïcité, l'égalité femmes-hommes, les droits et les devoirs",
                "Évaluation des diplômes, savoir-faire et expériences même lorsque les documents sont incomplets",
                "Formation professionnelle directement reliée aux besoins réels des territoires",
                "Scolarisation immédiate des enfants",
                "Suivi individuel pendant les premiers mois",
              ]}
              sources={[
                { label: "Service-Public — contrat d'intégration et apprentissage du français", href: commonSources.integration, kind: "Site" },
                { label: "Service-Public — engagement à respecter les principes de la République", href: commonSources.republicanCommitment, kind: "Site" },
              ]}
            />

            <PolicyCard
              icon={Map}
              badge="Planification"
              title="Orienter les nouveaux arrivants là où il y a logement, formation et travail"
              summary="Éviter de concentrer tout le monde dans les mêmes villes alors que d'autres territoires manquent de travailleurs."
              detail="Après l'évaluation, l'administration propose une première région d'installation en fonction de la situation familiale, des compétences, des emplois disponibles, des logements et des capacités des services publics. Une période initiale de stabilité évite de financer une formation dans un territoire pour voir immédiatement la personne disparaître ailleurs."
              points={[
                "Orientation nationale construite avec les régions et France Travail",
                "Priorité aux territoires disposant à la fois d'un besoin d'emploi et d'une capacité de logement",
                "Contrat territorial initial d'environ douze mois pour les personnes accompagnées et logées par la puissance publique",
                "Dérogation ou changement possible pour emploi meilleur, famille proche, santé, études ou situation personnelle sérieuse",
                "Aides d'intégration liées à la participation réelle aux cours, rendez-vous et formations, hors secours d'urgence et protection des enfants",
                "À la fin de la phase d'intégration, mêmes règles ordinaires de mobilité que pour les autres résidents",
                "Naturalisation possible ensuite selon durée de résidence, maîtrise du français, respect des lois et insertion réelle",
              ]}
              sources={[
                { label: "Service-Public — intégration et connaissance du français", href: commonSources.integration, kind: "Site" },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-tight">
          <SectionTitle
            id="services-publics-actuels"
            icon={Building2}
            eyebrow="État simple et opérateurs publics"
            title="Une seule porte d'entrée, des services coordonnés derrière"
            lead="Le citoyen ne devrait pas avoir à apprendre l'organigramme de l'État pour signaler un déménagement, perdre un emploi ou créer une entreprise."
          />
          <div className="mt-6"><InstitutionRibbon /></div>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <PolicyCard
              icon={Building2}
              badge="SPF"
              title="Services publics de France : un compte, un guichet, un dossier"
              summary="Le même accès numérique et physique pour le social, l'emploi, l'entreprise, les impôts et les démarches du quotidien."
              detail="La façade devient commune : même compte, même application, même réseau de guichets et même suivi des dossiers. Derrière, les spécialistes restent dans leurs métiers. Une donnée officielle déjà détenue n'est plus demandée cinq fois et chaque organisme ne reçoit que les informations dont il a besoin."
              visual={<PublicServicesDiagram />}
              points={[
                "FranceConnect devient la porte d'entrée du compte citoyen",
                "France Services devient le réseau physique principal",
                "Une information donnée une fois est transmise aux seuls organismes autorisés",
                "Dossier unique visible par l'usager mais données techniquement réparties",
                "Droit permanent à un accueil humain, au téléphone ou au guichet",
                "Mutualisation des logiciels, achats, centres d'appels, hébergement, cybersécurité et immobilier",
                "Directions régionales dotées de budgets et de marges de décision beaucoup plus importants",
              ]}
              sources={[
                { label: "FranceConnect — 45 millions d'utilisateurs en 2026", href: commonSources.franceConnect, kind: "Site" },
                { label: "France Services — réseau et services", href: commonSources.franceServices, kind: "Site" },
              ]}
            />

            <PolicyCard
              icon={Factory}
              badge="Nationalisations"
              title="Des opérateurs publics puissants dans les secteurs stratégiques"
              summary="Nationaliser quand la souveraineté, le monopole naturel ou le réseau critique le justifie."
              detail="L'économie reste mixte : entreprises privées, indépendants, coopératives et services publics coexistent. Mais les infrastructures dont tout le pays dépend doivent pouvoir revenir sous contrôle public afin d'investir sur le long terme plutôt que selon la seule rentabilité immédiate."
              points={[
                "France Télécom pour le réseau fixe, mobile et fibre, Orange pouvant rester la marque commerciale",
                "Énergie de France pour coordonner production, réseaux, nucléaire, hydraulique et planification",
                "SNCF élargie comme colonne vertébrale des mobilités publiques : rail, cars et coordination intermodale",
                "Société nationale des voies routières pour reprendre progressivement les autoroutes",
                "La Poste renforcée comme opérateur de proximité, d'identité et de coffre-fort documentaire",
                "France.Media réunissant radio, télévision, web et podcasts publics avec rédactions régionales autonomes",
                "Eau et infrastructures numériques critiques sous contrôle public lorsque le territoire l'exige",
              ]}
              sources={[{ label: "République Souveraine — nationalisations et politique industrielle", href: commonSources.rs, kind: "Site" }]}
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/35">
        <div className="container-tight">
          <SectionTitle
            id="social-economie"
            icon={Handshake}
            eyebrow="Social, travail et économie"
            title="Protéger fortement, produire davantage et demander des contreparties"
            lead="Une économie sociale n'est pas une économie immobile : elle doit augmenter les revenus du travail, sécuriser les besoins essentiels et reconstruire la production française."
          />
          <div className="mt-7 grid gap-3 lg:grid-cols-2">
            <PolicyCard
              icon={Handshake}
              title="Salaires, retraites, logement et sortie de la rue"
              summary="Personne ne doit être privé d'un besoin essentiel pendant qu'il retrouve une situation stable."
              detail="La solidarité garantit un socle élevé, mais l'accompagnement cherche rapidement une solution durable : logement, soins, droits, emploi ou formation. Les dispositifs sociaux et France Travail doivent fonctionner dans le même parcours plutôt que se renvoyer les dossiers."
              points={[
                "Hausse des bas salaires et négociation régulière des grilles",
                "Pensions et principales prestations indexées sur l'inflation",
                "Protection contre les coupures d'eau, d'électricité et de chauffage dans la résidence principale",
                "Hébergement immédiat puis logement durable pour les personnes sans domicile",
                "CIAS, France Services et France Travail regroupés ou coordonnés dans un même lieu",
                "Retraite à 60 ans soumise à référendum avec plusieurs scénarios de financement publiés avant le vote",
              ]}
            />

            <PolicyCard
              icon={Factory}
              title="Réindustrialisation, protection économique et participation des salariés"
              summary="L'État protège les secteurs stratégiques et les travailleurs participent davantage aux décisions des grandes entreprises."
              detail="Les aides publiques deviennent des investissements assortis de conditions : emploi, production, formation, localisation et partage de la valeur. La France peut protéger ses marchés publics et empêcher le rachat destructeur d'une entreprise stratégique."
              points={[
                "Fonds souverain français d'investissement de long terme",
                "Marchés publics favorisant les PME et la production française lorsque le cadre juridique le permet",
                "Préemption ou prise de participation publique dans les entreprises stratégiques menacées",
                "Représentation renforcée des salariés dans les conseils des grandes entreprises",
                "Participation aux bénéfices et droit de regard sur les délocalisations",
                "Reprises en coopérative facilitées",
                "Pôle bancaire public orienté vers PME, collectivités, industrie et transition",
              ]}
              sources={[{ label: "République Souveraine — orientations économiques", href: commonSources.rs, kind: "Site" }]}
            />

            <PolicyCard
              icon={Briefcase}
              title="Alternance et premier emploi : arrêter d'exiger cinq ans d'expérience"
              summary="Un débutant doit être recruté pour apprendre, pas pour être un salarié confirmé moins cher."
              detail="Les aides à l'alternance et au premier emploi sont conditionnées à un vrai tutorat et à des missions formatrices. Les écoles publient leurs taux réels d'alternance et développent un réseau d'entreprises partenaires."
              points={[
                "Tutorat obligatoire et contrôlable",
                "Reconnaissance du bénévolat, des projets personnels, des saisons et de la vie associative",
                "Incitations ciblées à l'embauche des juniors",
                "Contrôle des stages et alternances utilisés comme postes permanents déguisés",
                "Passerelles simples entre salariat, formation, reconversion et création d'entreprise",
              ]}
            />

            <PolicyCard
              icon={CircleDollarSign}
              title="Fiscalité lisible et audit de la dette"
              summary="Faire contribuer davantage la rente et les très hauts patrimoines, tout en protégeant le travail et l'investissement productif."
              detail="La dette ne doit servir ni de prétexte permanent à l'austérité ni être ignorée. Un audit public distingue investissement utile, intérêts, erreurs, crises, privatisations coûteuses et dépenses inefficaces."
              points={[
                "Lutte renforcée contre l'évasion et la fraude fiscales",
                "Contribution accrue des grandes fortunes et multinationales",
                "Fiscalité plus favorable aux PME qui investissent et produisent en France",
                "Réduction des niches inefficaces et simplification des déclarations",
                "Dette possible pour financer une infrastructure ou une capacité productive durable",
                "Audit public avant toute décision exceptionnelle sur la dette",
              ]}
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-tight">
          <SectionTitle
            id="ecole-sante"
            icon={GraduationCap}
            eyebrow="École, santé et territoires"
            title="Un socle français commun, puis beaucoup plus de liberté régionale"
            lead="L'égalité nationale porte sur les droits et les objectifs. L'organisation concrète peut être différente en Bretagne, en Alsace, en Provence ou dans un territoire rural."
          />
          <div className="mt-7 grid gap-3 lg:grid-cols-2">
            <PolicyCard
              icon={GraduationCap}
              title="École : fondamentaux communs, organisation régionale"
              summary="Le français, les maths, l'histoire nationale et les sciences restent un socle ; les régions ajoutent leurs priorités."
              detail="L'État définit les compétences minimales à maîtriser. Les régions organisent une partie des horaires, des options, des langues et de la formation professionnelle en fonction de leur histoire et de leur économie."
              points={[
                "Objectif de classes plus petites, notamment en primaire",
                "Fondamentaux concentrés le matin lorsque l'organisation locale le permet",
                "Sport, technologie, arts, projets et découverte professionnelle davantage l'après-midi",
                "Histoire, géographie et langues régionales renforcées",
                "Voies professionnelles et apprentissage revalorisés",
                "Établissements ouverts pour devoirs, clubs, sport et culture en fin de journée",
              ]}
            />

            <PolicyCard
              icon={HeartPulse}
              title="Santé : Sécurité sociale nationale, organisation régionale des soins"
              summary="Les droits restent communs, mais chaque région planifie ses hôpitaux, maisons de santé et priorités de recrutement."
              detail="Un habitant conserve les mêmes garanties de base dans toute la France. En revanche, la région peut adapter la carte sanitaire, salarier des médecins, financer des logements pour soignants, organiser la prévention et décider de priorités correspondant à sa démographie."
              points={[
                "Remboursement renforcé des soins essentiels",
                "Maisons et centres de santé dans les bassins de vie",
                "Recrutement de soignants et secrétaires médicaux",
                "Ratios minimaux lorsque la sécurité des patients l'exige",
                "Pôle public du médicament pour les produits stratégiques",
                "Mutualisation nationale des achats et stocks, planification régionale des besoins",
              ]}
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/35">
        <div className="container-tight">
          <SectionTitle
            id="souverainete"
            icon={Flag}
            eyebrow="Énergie, numérique, médias et international"
            title="Décider en France, coopérer quand c'est utile"
            lead="Donner davantage de pouvoir aux régions françaises ne signifie pas transférer davantage de souveraineté à une structure européenne. Le mouvement va vers le bas, pas vers le haut."
          />
          <div className="mt-7 grid gap-3 lg:grid-cols-2">
            <PolicyCard
              icon={Zap}
              title="Nucléaire, énergie publique et transition réaliste"
              summary="Décarboner sans organiser la pénurie et conserver une capacité industrielle complète."
              detail="Le nucléaire reste la colonne vertébrale pilotable de l'électricité française, avec hydraulique et renouvelables là où ils sont réellement utiles. L'État conserve la stratégie générale ; les régions pèsent sur l'implantation et les priorités locales."
              points={[
                "Prolonger les réacteurs validés par l'autorité de sûreté",
                "Construire de nouvelles capacités nucléaires et investir dans la recherche",
                "Grand opérateur public Énergie de France",
                "Solaire prioritaire sur bâtiments, parkings, friches et espaces artificialisés",
                "Plans régionaux d'adaptation au climat",
                "Rénovation thermique ciblée sur les logements les plus énergivores",
              ]}
            />

            <PolicyCard
              icon={Radio}
              title="Médias pluralistes et souveraineté numérique"
              summary="Moins de concentration, un service public régionalisé et des outils numériques français capables de fonctionner sans dépendance totale."
              detail="France.Media mutualise les moyens techniques du service public tout en laissant de vraies rédactions régionales décider de leur ligne locale. En numérique, la commande publique et un fonds souverain financent cloud, IA, logiciels ouverts, recherche et infrastructures critiques."
              points={[
                "Limites renforcées à la concentration des médias",
                "Transparence des propriétaires et financements importants",
                "Soutien aux médias locaux, associatifs et indépendants",
                "Rédactions régionales autonomes dans le service public",
                "Soutien au logiciel libre et aux services souverains de courriel, stockage, cartographie, IA et bureautique",
                "Hébergement des données critiques sous contrôle juridique français",
              ]}
            />

            <PolicyCard
              icon={Flag}
              badge="Europe"
              title="Pas d'Europe fédérale imposée à la France"
              summary="Coopérer entre nations oui ; transférer automatiquement de nouveaux pouvoirs non."
              detail="La France participe aux coopérations qui servent ses intérêts : recherche, industrie, transport, environnement ou défense de projets précis. Mais un nouveau transfert majeur de souveraineté doit être soumis à référendum. Lorsqu'une règle extérieure bloque durablement un choix démocratique essentiel, la France négocie d'abord, puis les citoyens tranchent la suite."
              points={[
                "Aucun nouveau transfert majeur de souveraineté sans référendum",
                "Primauté de la décision démocratique française dans les domaines que le peuple décide de reprendre",
                "Coopérations européennes par projets entre nations souveraines",
                "Renégociation ou dérogation lorsque des règles empêchent une politique industrielle ou sociale essentielle",
                "Référendum national si un conflit fondamental devient impossible à résoudre",
                "Diplomatie indépendante sans alignement automatique sur une puissance ou un bloc",
              ]}
              sources={[{ label: "République Souveraine — souveraineté et Union européenne", href: commonSources.rs, kind: "Site" }]}
            />

            <PolicyCard
              icon={Vote}
              title="RIC national et régional pour rendre la décision au peuple"
              summary="Le vote tous les cinq ans ne suffit pas lorsqu'une question majeure divise durablement le pays ou un territoire."
              detail="Le RIC peut proposer une loi, en abroger une ou soumettre une grande orientation au vote. Les régions disposent du même outil pour leur propre droit. Les changements de frontières et certains changements constitutionnels territoriaux passent obligatoirement par référendum."
              points={[
                "RIC législatif et abrogatif",
                "RIC régional dans le domaine de compétence de la région",
                "Référendum obligatoire pour les frontières régionales",
                "Référendum national avant transfert majeur supplémentaire de souveraineté",
                "Information contradictoire et documents publics avant chaque vote",
              ]}
              videoId="NM03cUVKrMw"
              videoTitle="Le référendum d'initiative citoyenne en débat"
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-tight">
          <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Lecture de la page</p>
                <h2 className="mt-1 font-display text-xl font-bold text-foreground">Un programme personnel, pas le programme officiel d'une organisation</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Les liens vers République Souveraine, le Sénat, l'IFOP ou les services publics servent à documenter les constats et les mécanismes existants. Ils ne signifient pas que ces institutions soutiennent toutes les propositions présentées ici.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {[
                ["IFOP — régionalisme 2025", ifopPdf],
                ["République Souveraine — orientations programmatiques", commonSources.rs],
                ["Sénat — subsidiarité", commonSources.senateSubsidiarity],
                ["Sénat — autonomie de la Corse", commonSources.senateCorsica],
                ["FranceConnect — 10 ans", commonSources.franceConnect],
                ["France Services", commonSources.franceServices],
              ].map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary">
                  <span>{label}</span><ExternalLink className="h-4 w-4 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
