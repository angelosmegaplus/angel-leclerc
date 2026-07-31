import {
  MapPin,
  Bike,
  Calendar,
  Download,
  ArrowRight,
  Sparkles,
  Briefcase,
  GraduationCap,
  Award,
  HeartHandshake,
  Wrench,
  PenLine,
  Palette,
  Users,
  ClipboardList,
  ExternalLink,
  Radio,
  Building2,
  Landmark,
  Hammer,
  BookOpen,
  Tent,
  Archive,
  Mic,
  Video,
  Music,
  FileText,
  TreePine,
  Brain,
  Lightbulb,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import { Logo } from "@/components/Logo";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import photo from "@/assets/angel-leclerc.png.asset.json";
import talisLogo from "@/assets/talis-logo.png";

function SectionHeader({
  eyebrow,
  title,
  intro,
  id,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  id?: string;
}) {
  return (
    <div id={id} className="mx-auto max-w-2xl text-center scroll-mt-24">
      {eyebrow && (
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          <Sparkles size={12} />
          {eyebrow}
        </span>
      )}
      <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
        {title}
      </h2>
      {intro && (
        <p className="mt-4 text-muted-foreground leading-relaxed">{intro}</p>
      )}
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl border border-border bg-card p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md " +
        className
      }
    >
      {children}
    </div>
  );
}

function IntroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[420px] w-[420px] rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="container-tight relative py-16 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Calendar size={12} /> Disponible à partir de septembre 2026
            </span>
            <h1 className="mt-4 font-display text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
              Angel <span className="italic text-primary">Leclerc</span>
            </h1>
            <p className="mt-3 font-display text-lg text-foreground/80 md:text-xl">
              Étudiant en communication — recherche d'alternance à Sarlat
            </p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Je recherche une entreprise pour préparer un BTS Communication en
              alternance à partir de septembre 2026. Création de contenus,
              rédaction, communication numérique, accueil du public et gestion
              de projets&nbsp;: je souhaite mettre mes compétences au service
              d'une structure située à Sarlat-la-Canéda ou dans ses environs
              accessibles en scooter.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#cv"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <FileText size={16} /> Voir mon CV
              </a>
              <a
                href="/cv-angel-leclerc.pdf"
                download
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Download size={16} /> Télécharger mon CV
              </a>
              <a
                href="#alternance"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <GraduationCap size={16} /> Voir le BTS Communication
              </a>
              <a
                href="#passions"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Mic size={16} /> Mes passions
              </a>
              <a
                href="#realisations"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Voir mes réalisations
                <ArrowRight size={14} />
              </a>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-sm items-center justify-center md:mx-0">
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 -m-6 rounded-full bg-primary/15 blur-2xl"
              />
              <img
                src={photo.url}
                alt="Portrait d'Angel Leclerc"
                className="relative h-56 w-56 rounded-full border border-border object-cover shadow-lg md:h-64 md:w-64"
                width={256}
                height={256}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AlternanceSection() {
  const rows: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: GraduationCap, label: "Formation", value: "BTS Communication" },
    { icon: Calendar, label: "Début", value: "Septembre 2026" },
    { icon: MapPin, label: "Zone principale", value: "Sarlat-la-Canéda et communes proches" },
    { icon: Bike, label: "Mobilité", value: "Scooter — trajets quotidiens autour de Sarlat" },
    { icon: Building2, label: "Secteurs privilégiés", value: "Tourisme, culture, médias, collectivités, associations, commerce et services" },
    { icon: ClipboardList, label: "Missions recherchées", value: "Réseaux sociaux, rédaction, création graphique, communication digitale, événementiel, accueil et gestion de projet" },
  ];

  return (
    <AnimatedSection>
      <section id="alternance" className="section-padding bg-muted/40 scroll-mt-24">
        <div className="container-tight">
          <SectionHeader
            eyebrow="Recherche d'alternance"
            title="Ma recherche d'alternance"
            intro="Je recherche une entreprise pour préparer un BTS Communication en alternance à partir de septembre 2026. Ma recherche se concentre principalement sur Sarlat-la-Canéda et les communes proches accessibles quotidiennement en scooter."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {rows.map((r) => (
              <Card key={r.label} className="flex items-start gap-4">
                <div className="inline-flex shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
                  <r.icon size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {r.label}
                  </p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-foreground">
                    {r.value}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Projet de formation
                </p>
                <h4 className="mt-2 font-display text-xl font-semibold text-foreground">
                  Mon BTS Communication en alternance
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/bts/programme-bts-com-talis.pdf"
                  download
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  <Download size={14} /> Programme (PDF)
                </a>
                <a
                  href="/bts/calendrier-bts-com-talis.pdf"
                  download
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  <Download size={14} /> Calendrier (PDF)
                </a>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Je prépare un BTS Communication en alternance avec l'école{" "}
              <strong className="text-foreground">Talis de Périgueux</strong>{" "}
              à partir de septembre 2026. Mon objectif est de développer une
              expérience professionnelle solide dans la communication. À plus
              long terme, je souhaite poursuivre dans les domaines de
              l'information, de la communication ou du journalisme. Le BTS
              Communication est un diplôme d'État Bac+2 (niveau 5, RNCP 37198)
              préparé en 24 mois, dont environ{" "}
              <strong className="text-foreground">65 % du temps en entreprise</strong>.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { k: "Durée", v: "24 mois" },
                { k: "Volume", v: "1 351 h de formation" },
                { k: "Rythme", v: "≈ 35 % école · 65 % entreprise" },
              ].map((s) => (
                <div key={s.k} className="rounded-xl border border-border bg-background p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {s.k}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{s.v}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Blocs de compétences
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-foreground/90">
                  <li>• Élaboration et pilotage de la stratégie de communication</li>
                  <li>• Conception et mise en œuvre des solutions de communication</li>
                  <li>• Solutions media et digitales innovantes</li>
                  <li>• Culture de la communication, langue vivante, CEJM</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Planning prévisionnel
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-foreground/90">
                  <li>• Rentrée septembre 2026 · promotion 2028</li>
                  <li>• Année 1 (2026-2027) : 676 h — pics d'école oct., nov., mai</li>
                  <li>• Année 2 (2027-2028) : 675 h — examens printemps 2028</li>
                  <li>• Reste du temps : en entreprise, avec suivi tuteur</li>
                </ul>
              </div>
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              École de formation
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <a
                href="https://www.talis-business-school.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-xl border border-border bg-background p-4 transition-shadow hover:shadow-sm"
              >
                <img
                  src={talisLogo}
                  alt="Logo Talis Business School"
                  width={40}
                  height={40}
                  className="h-10 w-auto shrink-0 object-contain"
                  loading="lazy"
                />
                <div className="flex-1">
                  <p className="font-display text-sm font-semibold text-foreground group-hover:text-primary">
                    Talis
                  </p>
                  <p className="text-xs text-muted-foreground">Périgueux</p>
                </div>
                <ExternalLink size={14} className="text-muted-foreground" />
              </a>
            </div>

            <p className="mt-5 text-xs italic text-muted-foreground">
              Source : documents officiels de l'école Talis — campus Périgueux.
              Le calendrier détaillé jour par jour est disponible dans le PDF
              « Calendrier ».
            </p>

            <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              En vidéo
            </p>
            <div className="mt-3">
              <YouTubeEmbed
                id="Bz5m7zzdYzs"
                title="Présentation du BTS Communication"
              />
            </div>
          </div>

          <p className="mt-8 text-center text-sm italic text-muted-foreground">
            Je privilégie une entreprise située à Sarlat ou dans un secteur
            raisonnablement accessible en scooter.
          </p>
        </div>
      </section>
    </AnimatedSection>
  );
}

type Project = {
  title: string;
  description: string;
  tools: string;
  href?: string;
  icon: LucideIcon;
};

const projects: Project[] = [
  {
    title: "Tombola Patrimoine",
    description:
      "Participation à la communication d'une tombola destinée à financer la restauration de la chapelle de la Visitation à Besançon : création et amélioration du site internet, rédaction de contenus, publications sur les réseaux sociaux, recherche de relais médiatiques et coordination de la communication.",
    tools: "Lovable · Canva · Meta Business Suite · rédaction web",
    icon: PenLine,
  },
  {
    title: "Angel Leclerc Communication",
    description:
      "Création de mon identité professionnelle, de mon site internet et de mon offre de services autour de la gestion de projet, du conseil en communication et de la rédaction éditoriale.",
    tools: "Lovable · Canva · Figma · Squarespace",
    href: "https://www.angel-leclerc.fr",
    icon: Briefcase,
  },
  {
    title: "Projet d'émission jeunesse — Radio Bocage",
    description:
      "Participation au développement d'un projet d'émission jeunesse dans le cadre d'un service civique : réflexion sur le concept, recherche de sujets, préparation éditoriale et découverte de la production radiophonique.",
    tools: "Rédaction · recherche · montage audio · MixPad",
    icon: Radio,
  },
  {
    title: "Créations graphiques et projets associatifs",
    description:
      "Réalisation d'affiches, de publications, de logos, de documents de présentation et de supports numériques dans le cadre de projets personnels, professionnels et associatifs.",
    tools: "Canva · Figma · Adobe · IA générative",
    icon: Palette,
  },
];

export function RealisationsSection() {
  return (
    <AnimatedSection>
      <section id="realisations" className="section-padding bg-background scroll-mt-24">
        <div className="container-tight">
          <SectionHeader
            eyebrow="Portfolio"
            title="Mes réalisations"
            intro="Quelques projets qui montrent concrètement ma manière de travailler."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {projects.map((p) => (
              <Card key={p.title} className="flex h-full flex-col">
                <div className="flex items-center gap-4">
                  <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                    <p.icon size={22} />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {p.title}
                  </h3>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
                <p className="mt-4 text-xs font-medium text-foreground/70">
                  {p.tools}
                </p>
                {p.href ? (
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80"
                  >
                    Découvrir le site <ExternalLink size={14} />
                  </a>
                ) : null}
              </Card>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

const skills: { icon: LucideIcon; title: string; items: string[] }[] = [
  {
    icon: PenLine,
    title: "Communication et rédaction",
    items: [
      "Rédaction web et éditoriale",
      "Création de contenus",
      "Recherche et synthèse d'informations",
      "Préparation de publications",
      "Communication institutionnelle et associative",
      "Adaptation du message au public",
    ],
  },
  {
    icon: Palette,
    title: "Création numérique",
    items: [
      "Création d'affiches",
      "Publications pour les réseaux sociaux",
      "Identités visuelles simples",
      "Présentations",
      "Maquettes de sites internet",
      "Amélioration de supports existants",
    ],
  },
  {
    icon: ClipboardList,
    title: "Gestion de projet",
    items: [
      "Organisation des étapes d'un projet",
      "Coordination avec différents interlocuteurs",
      "Suivi des actions",
      "Recherche de prestataires ou de partenaires",
      "Respect des délais",
      "Autonomie",
    ],
  },
  {
    icon: Users,
    title: "Relationnel",
    items: [
      "Accueil du public",
      "Conseil et information",
      "Travail en équipe",
      "Animation de groupes",
      "Prise de responsabilités",
      "Adaptation à différents publics",
    ],
  },
];

export function SkillsSection() {
  return (
    <AnimatedSection>
      <section id="competences" className="section-padding bg-muted/40 scroll-mt-24">
        <div className="container-tight">
          <SectionHeader eyebrow="Savoir-faire" title="Mes compétences" />

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {skills.map((s) => (
              <Card key={s.title}>
                <div className="flex items-center gap-3">
                  <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                    <s.icon size={20} />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {s.title}
                  </h3>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {s.items.map((it) => (
                    <li key={it} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {it}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

type Experience = {
  role: string;
  org: string;
  period: string;
  missions: string[];
  domain?: string;
  fallbackIcon: LucideIcon;
};

const experiences: Experience[] = [
  {
    role: "Agent de propreté urbaine (emploi saisonnier)",
    org: "Mairie de Sarlat-la-Canéda",
    period: "Depuis juillet 2026",
    domain: "sarlat.fr",
    fallbackIcon: Building2,
    missions: [
      "Entretien et propreté des rues et espaces publics du centre historique",
      "Travail en équipe, en autonomie et en horaires matinaux",
      "Contact quotidien avec les habitants et les visiteurs",
      "Rigueur, ponctualité et sens du service public",
    ],
  },
  {
    role: "Apprenti — Bac Pro Accueil et Vente",
    org: "Office de Tourisme Val de Sioule",
    period: "2023 – 2025",
    domain: "valdesioule.com",
    fallbackIcon: Building2,
    missions: [
      "Accueil des visiteurs, vente de produits touristiques, gestion des demandes par téléphone et e-mail",
      "Création de livrets pour les hébergeurs, de livrets statistiques et d'affiches promotionnelles",
      "Montages vidéos et publications réseaux sociaux avec Canva",
      "Utilisation d'outils professionnels : Moka, Koesio, Avizi, Apidae, Brevo, Microsoft",
    ],
  },
  {
    role: "Service civique — développement d'une émission jeunesse",
    org: "Ligue de l'enseignement 03 · Radio Bocage",
    period: "2026 — 2 mois",
    domain: "laligue.org",
    fallbackIcon: Radio,
    missions: [
      "Réflexion sur le concept de l'émission",
      "Recherche et préparation de contenus",
      "Participation au développement du projet",
      "Découverte de la production radiophonique",
    ],
  },
  {
    role: "Missions ponctuelles auprès de particuliers et d'employeurs",
    org: "Intérim et petits travaux",
    period: "2026",
    fallbackIcon: Hammer,
    missions: [
      "Électricité, ménage, peinture, bûcheronnage et autres missions pratiques",
      "Développement de l'autonomie, de la ponctualité et de la polyvalence",
      "Adaptation rapide à différents environnements de travail",
    ],
  },
];

function ExperienceLogo({ exp }: { exp: Experience }) {
  if (exp.domain) return <Logo domain={exp.domain} alt={exp.org} size={52} />;
  return (
    <div className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary">
      <exp.fallbackIcon size={22} />
    </div>
  );
}

function ExperiencesSection() {
  return (
    <AnimatedSection>
      <section id="experiences" className="section-padding bg-background scroll-mt-24">
        <div className="container-tight">
          <SectionHeader eyebrow="Parcours" title="Expériences professionnelles" />

          <div className="mt-12 space-y-4">
            {experiences.map((exp) => (
              <Card key={exp.role}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <ExperienceLogo exp={exp} />
                  <div className="flex-1">
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {exp.role}
                      </h3>
                      <span className="text-xs font-medium uppercase tracking-widest text-primary">
                        {exp.period}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground/80">
                      {exp.org}
                    </p>
                    <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                      {exp.missions.map((m) => (
                        <li key={m} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

function FormationSection() {
  return (
    <AnimatedSection>
      <section id="formation" className="section-padding bg-muted/40 scroll-mt-24">
        <div className="container-tight">
          <SectionHeader
            eyebrow="Études"
            title="Formation"
            intro="Mon parcours actuel et mon projet de poursuite d'études en alternance."
          />

          <div className="mt-12">
            <Card>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <span className="inline-flex h-[64px] w-[120px] shrink-0 items-center justify-center rounded-xl border border-border bg-background p-2">
                  <img
                    src="/logos/mfr.asso.fr.svg"
                    alt="Logo des Maisons familiales rurales (MFR)"
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </span>
                <div className="flex-1">
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      Baccalauréat professionnel Métiers de l'accueil
                    </h3>
                    <span className="text-xs font-medium uppercase tracking-widest text-primary">
                      Sept. 2023 – Juil. 2025
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground/80">
                    MFR du Périgord noir — Salignac
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Diplôme de niveau 4 préparé en alternance dans une Maison
                    familiale rurale (MFR), un établissement de formation par
                    alternance qui associe périodes en entreprise et semaines de
                    cours en petits groupes. Le Bac Pro Métiers de l'accueil
                    forme à l'accueil physique et téléphonique, à la relation
                    client, à la vente de services et de produits, à la gestion
                    de l'information et au travail administratif au sein d'une
                    structure recevant du public.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Accueil, orientation et conseil des visiteurs et des clients
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Vente, gestion des demandes et suivi administratif
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Communication écrite et orale, outils numériques et bureautiques
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Deux ans en alternance à l'Office de Tourisme Val de Sioule
                    </li>
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Mention Bien
                    </span>
                    <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                      SST — Sauveteur secouriste du travail
                    </span>
                  </div>
                  <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    En vidéo
                  </p>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <YouTubeEmbed
                      id="knKUojBLR2I"
                      title="Bac Pro Métiers de l'accueil — présentation"
                    />
                    <YouTubeEmbed
                      id="03vn5fWIIOQ"
                      title="MFR du Périgord noir — Salignac"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

const certifications: {
  name: string;
  org: string;
  detail: string;
  domain?: string;
  icon?: LucideIcon;
}[] = [
  {
    name: "Les principes fondamentaux du marketing numérique",
    org: "Google",
    domain: "google.com",
    detail:
      "Certification en ligne couvrant le référencement, la publicité, les réseaux sociaux, l'e-mailing et l'analyse d'audience.",
  },
  {
    name: "BAFA",
    org: "Ligue de l'enseignement",
    domain: "laligue.org",
    detail:
      "Brevet d'aptitude aux fonctions d'animateur : encadrement de groupes d'enfants et de jeunes en accueils collectifs de mineurs.",
  },
  {
    name: "PSC1",
    org: "Prévention et secours civiques",
    icon: Award,
    detail:
      "Formation aux gestes de premiers secours : alerte, protection, malaises, hémorragies et réanimation.",
  },
  {
    name: "SST",
    org: "Sauveteur secouriste du travail",
    icon: Award,
    detail:
      "Prévention des risques professionnels et intervention en cas d'accident sur le lieu de travail.",
  },
];

function CertificationsSection() {
  return (
    <AnimatedSection>
      <section id="certifications" className="section-padding bg-background scroll-mt-24">
        <div className="container-tight">
          <SectionHeader eyebrow="Attestations" title="Certifications" />

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {certifications.map((c) => (
              <Card key={c.name} className="flex items-start gap-4">
                {c.domain ? (
                  <Logo domain={c.domain} alt={c.org} size={48} />
                ) : (
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary">
                    {c.icon && <c.icon size={22} />}
                  </div>
                )}
                <div>
                  <p className="font-display text-base font-semibold text-foreground">
                    {c.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{c.org}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {c.detail}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

const engagements: {
  title: string;
  org: string;
  period?: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Président d'association",
    org: "La Fraternité du Scoutisme",
    description:
      "Coordination associative, organisation de projets, communication, animation de bénévoles et gestion des responsabilités.",
    icon: HeartHandshake,
  },
  {
    title: "Chef scout",
    org: "Scouts et Guides de France · Scouts d'Europe",
    period: "3 ans",
    description:
      "Encadrement de jeunes, préparation d'activités, travail en équipe, organisation et prise de responsabilités.",
    icon: Tent,
  },
  {
    title: "Bénévole",
    org: "Réseau Baden-Powell — Archives Nationales du Scoutisme",
    description:
      "Contribution aux archives nationales du scoutisme : classement, recherche documentaire et valorisation du patrimoine.",
    icon: Archive,
  },
  {
    title: "Bénévole",
    org: "Amis de Renard Noir",
    description:
      "Pédagogie, formations et transmission auprès des jeunes bénévoles.",
    icon: BookOpen,
  },
];

function EngagementsSection() {
  return (
    <AnimatedSection>
      <section id="engagements" className="section-padding bg-muted/40 scroll-mt-24">
        <div className="container-tight">
          <SectionHeader eyebrow="Vie associative" title="Engagements associatifs" />

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {engagements.map((e) => (
              <Card key={e.org} className="flex h-full flex-col">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <e.icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      {e.title}
                    </h3>
                    <p className="text-sm font-medium text-foreground/80">
                      {e.org}
                    </p>
                    {e.period && (
                      <p className="text-xs uppercase tracking-widest text-primary">
                        {e.period}
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {e.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

type Tool = { name: string; domain?: string; use: string; icon?: LucideIcon };

const toolCategories: { title: string; icon: LucideIcon; tools: Tool[] }[] = [
  {
    title: "Création graphique",
    icon: Palette,
    tools: [
      { name: "Canva", domain: "canva.com", use: "Affiches, publications, présentations et supports visuels." },
      { name: "Adobe", domain: "adobe.com", use: "Retouches ponctuelles et exports pour supports print." },
    ],
  },
  {
    title: "Sites internet et publication",
    icon: PenLine,
    tools: [
      { name: "Lovable", domain: "lovable.dev", use: "Création et amélioration de sites internet." },
      { name: "Figma", domain: "figma.com", use: "Maquettes de sites et organisation d'interfaces." },
      { name: "Squarespace", domain: "squarespace.com", use: "Gestion de domaine et hébergement du site." },
      { name: "Webnode", domain: "webnode.com", use: "Création rapide de sites vitrines et blogs." },
      { name: "Wix", domain: "wix.com", use: "Sites vitrines, boutiques et portfolios avec éditeur visuel." },
      { name: "Google Sites", domain: "sites.google.com", use: "Sites simples et pages collaboratives intégrées à Google Workspace." },
    ],
  },
  {
    title: "Bureautique et collaboration",
    icon: ClipboardList,
    tools: [
      { name: "Microsoft Office", domain: "microsoft.com", use: "Word, Excel, PowerPoint pour documents et présentations." },
      { name: "Google Workspace", domain: "workspace.google.com", use: "Docs, Sheets, Drive et Gmail pour le travail en équipe." },
    ],
  },
  {
    title: "Communication et réseaux sociaux",
    icon: Users,
    tools: [
      { name: "Meta Business Suite", domain: "business.facebook.com", use: "Gestion centralisée de Facebook, Instagram et Threads : publication, planification et statistiques." },
      { name: "TikTok", domain: "tiktok.com", use: "Formats courts, tendances et contenus vidéo verticaux." },
      { name: "LinkedIn", domain: "linkedin.com", use: "Publications professionnelles et mise en réseau." },
      { name: "YouTube", domain: "youtube.com", use: "Création de chaînes, shorts et playlists vidéo." },
      { name: "Substack", domain: "substack.com", use: "Publication de mes articles et newsletters." },
      { name: "Brevo", domain: "brevo.com", use: "Campagnes e-mailing, newsletters et gestion de contacts." },
    ],
  },
  {
    title: "Audio et vidéo",
    icon: Video,
    tools: [
      { name: "MixPad", domain: "nch.com.au", use: "Montage audio pour projets radio." },
      { name: "CapCut", domain: "capcut.com", use: "Montage vidéo pour contenus courts et réseaux sociaux." },
    ],
  },
  {
    title: "Tourisme et gestion",
    icon: Landmark,
    tools: [
      { name: "Avizi", domain: "avizi.fr", use: "Gestion de vente et de billetterie en office de tourisme." },
      { name: "Koesio", domain: "koesio.com", use: "Outils de gestion utilisés en office de tourisme." },
      { name: "HelloAsso", domain: "helloasso.com", use: "Billetterie, adhésions et paiements en ligne pour les associations." },
      { name: "Moka", domain: "mokatourisme.fr", use: "Logiciel de gestion intégré et ERP dédié au tourisme." },
      { name: "Apidae", domain: "apidae-tourisme.com", use: "Système d'information touristique pour la collecte, la diffusion et l'enrichissement des données." },
    ],
  },
  {
    title: "Intelligence artificielle",
    icon: Sparkles,
    tools: [
      { name: "ChatGPT", domain: "chatgpt.com", use: "Recherche, organisation, rédaction et amélioration de contenus." },
    ],
  },
];

function ToolsSection() {
  return (
    <AnimatedSection>
      <section id="outils" className="section-padding bg-background scroll-mt-24">
        <div className="container-tight">
          <SectionHeader eyebrow="Boîte à outils" title="Outils utilisés" />

          <div className="mt-12 space-y-8">
            {toolCategories.map((cat) => (
              <div key={cat.title}>
                <div className="flex items-center gap-3">
                  <div className="inline-flex rounded-xl bg-primary/10 p-2.5 text-primary">
                    <cat.icon size={18} />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {cat.title}
                  </h3>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {cat.tools.map((t) => (
                    <div key={t.name} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                      {t.domain ? (
                        <Logo domain={t.domain} alt={t.name} size={40} />
                      ) : (
                        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary">
                          {t.icon ? <t.icon size={18} /> : <Wrench size={18} />}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {t.name}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {t.use}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

const passions: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Music,
    title: "Son, image et création",
    text: "Montage audio avec MixPad (jingles, habillages, podcasts), montage vidéo avec CapCut, identités sonores et logos animés. J'aime aussi concevoir des logos et des supports graphiques sur Canva.",
  },
  {
    icon: Lightbulb,
    title: "Innovation, marques et curiosité numérique",
    text: "J'aime imaginer des concepts de marque, innover et faire naître des projets. Je teste régulièrement de nouvelles applications, outils et solutions digitales.",
  },
  {
    icon: BookOpen,
    title: "Lecture, orgue et réflexion",
    text: "La lecture nourrit ma curiosité sur l'actualité, la société et la culture. La pratique de l'orgue m'apprend technique, écoute et sensibilité.",
  },
  {
    icon: TreePine,
    title: "Nature, contact humain et balades",
    text: "Je suis très extérieur : j'aime me balader dans la nature, découvrir de nouveaux paysages et aller au contact des gens. La nature et les échanges me ressourcent.",
  },
  {
    icon: Heart,
    title: "Culture et engagement",
    text: "Scoutisme, radio associative, service civique : je m'investis dans des projets collectifs et des causes qui me tiennent à cœur.",
  },
];

export function PassionsSection() {
  return (
    <AnimatedSection>
      <section id="passions" className="section-padding bg-background scroll-mt-24">
        <div className="container-tight">
          <SectionHeader
            eyebrow="Ce qui m'anime"
            title="Mes passions"
            intro="Au-delà de la communication, de nombreuses choses nourrissent ma créativité et mon envie de créer."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {passions.map((p) => (
              <Card key={p.title} className="flex h-full flex-col">
                <p.icon size={24} className="text-primary" />
                <h4 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {p.title}
                </h4>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {p.text}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

function CvSection() {
  return (
    <section id="cv" className="scroll-mt-24">
      <AnimatedSection>
        <div className="section-padding bg-muted/40">
          <div className="container-tight">
            <SectionHeader
              eyebrow="CV numérique"
              title="Mon parcours et mes compétences"
              intro="Un aperçu détaillé de mon expérience professionnelle, de ma formation et de mes certifications."
            />
          </div>
        </div>
      </AnimatedSection>
      <ExperiencesSection />
      <FormationSection />
      <CertificationsSection />
    </section>
  );
}

export function MyJourney() {
  return (
    <>
      <IntroSection />
      <AlternanceSection />
      <CvSection />
      <EngagementsSection />
      <ToolsSection />
    </>
  );
}
