import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
const MobilityMap = lazy(() => import("@/components/MobilityMap"));
import {
  MapPin,
  Bike,
  Calendar,
  Download,
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
import {
  contentQuery,
  iconFor,
  toStringList,
  toVideoList,
  type ContentItem,
} from "@/lib/content";

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
      <h2 className="mt-3 font-display text-[1.65rem] font-bold leading-tight text-foreground sm:text-3xl md:text-4xl">
        {title}
      </h2>
      {intro && (
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground md:mt-4 md:text-base">{intro}</p>
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
        "rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md sm:p-6 " +
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

      <div className="container-tight relative py-10 md:py-24">
        <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr] md:gap-10">
          <div className="order-2 md:order-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Calendar size={12} /> Disponible à partir de septembre 2026
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Angel <span className="italic text-primary">Leclerc</span>
            </h1>
            <p className="mt-3 font-display text-base text-foreground/80 sm:text-lg md:text-xl">
              Étudiant en communication — recherche d'alternance à Sarlat
            </p>
            <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground md:mt-6 md:text-base">
              Je recherche une entreprise pour préparer un BTS Communication en
              alternance à partir de septembre 2026. Création de contenus,
              rédaction, communication numérique, accueil du public et gestion
              de projets&nbsp;: je souhaite mettre mes compétences au service
              d'une structure située à Sarlat-la-Canéda ou dans ses environs
              accessibles en scooter.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap sm:gap-3 md:mt-8">
              <a
                href="#cv"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:justify-start"
              >
                <FileText size={16} /> Voir mon CV
              </a>
              <a
                href="/cv-angel-leclerc.pdf"
                download
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary sm:justify-start"
              >
                <Download size={16} /> Télécharger mon CV
              </a>
              <a
                href="#alternance"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary sm:justify-start"
              >
                <GraduationCap size={16} /> Voir le BTS Communication
              </a>
              <a
                href="#outils"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary sm:justify-start"
              >
                <Wrench size={16} /> Voir les outils utilisés
              </a>
            </div>
          </div>

          <div className="order-1 mx-auto flex w-full max-w-sm items-center justify-center md:order-2 md:mx-0">
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 -m-6 rounded-full bg-primary/15 blur-2xl"
              />
              <img
                src={photo.url}
                alt="Portrait d'Angel Leclerc"
                className="relative h-40 w-40 rounded-full border border-border object-cover shadow-lg sm:h-56 sm:w-56 md:h-64 md:w-64"
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
            eyebrow="Alternance 2026"
            title="Mon BTS Communication en alternance"
            intro="Je prépare un BTS Communication en alternance avec l'école Talis (campus de Périgueux) à partir de septembre 2026 et je recherche l'entreprise qui m'accueillera. Ma recherche se concentre sur Sarlat-la-Canéda et les communes proches, accessibles quotidiennement en scooter."
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

          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Ma zone de recherche
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Sarlat · zone prioritaire
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-foreground/70" /> Villes envisageables
                </span>
              </div>
            </div>
            <div className="mt-4 overflow-hidden border-y border-border">
              <ClientOnly fallback={<div className="h-[280px] w-full bg-muted sm:h-[300px]" />}>
                <Suspense fallback={<div className="h-[280px] w-full bg-muted sm:h-[300px]" />}>
                  <MobilityMap />
                </Suspense>
              </ClientOnly>
            </div>
            <p className="px-5 py-4 text-xs leading-relaxed text-muted-foreground">
              Je privilégie une alternance à Sarlat ou dans un rayon d'environ 10&nbsp;km,
              accessible en scooter au quotidien. Je peux toutefois envisager une opportunité
              plus éloignée si elle est réellement cohérente avec mon projet, avec possibilité
              de déménagement.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Projet de formation
                </p>
                <h4 className="mt-2 font-display text-xl font-semibold text-foreground">
                  Le BTS Communication en détail
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
              Mon projet d'études&nbsp;: intégrer un BTS Communication en
              alternance, puis poursuivre vers une formation spécialisée en
              information-communication ou en journalisme. Je prépare ce BTS
              avec l'école{" "}
              <strong className="text-foreground">Talis de Périgueux</strong>{" "}
              à partir de septembre 2026. Le BTS
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
                href="https://www.talis.community/campus/perigueux/"
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
                  <p className="text-xs text-muted-foreground">Campus Périgueux</p>
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
  context: string;
  missions: string[];
  tools: string;
  results: string;
  href?: string;
  linkLabel?: string;
  icon: LucideIcon;
};

const projects: Project[] = [
  {
    title: "Tombola Patrimoine",
    context:
      "Campagne de communication au service d'une tombola destinée à financer la restauration de la chapelle de la Visitation à Besançon.",
    missions: [
      "Création et amélioration du site internet de la campagne",
      "Définition de la stratégie de communication et du calendrier éditorial",
      "Rédaction et publication des contenus sur les réseaux sociaux",
      "Relations presse et recherche de relais médiatiques",
    ],
    tools: "Lovable · Canva · Meta Business Suite · rédaction web",
    results:
      "Une campagne visible en ligne et relayée par les médias locaux, avec un site clair pour informer et inciter à participer.",
    icon: PenLine,
  },
  {
    title: "Angel Leclerc Communication",
    context:
      "Création de mon activité de communication en tant qu'entrepreneur individuel.",
    missions: [
      "Construction de l'identité visuelle et de la ligne éditoriale",
      "Conception et mise en ligne du site internet",
      "Structuration de l'offre de services et des tarifs indicatifs",
    ],
    tools: "Lovable · Canva · Figma · Squarespace",
    results:
      "Un site professionnel en ligne, une offre lisible et un premier canal de contact pour les clients.",
    href: "https://www.angel-leclerc.fr",
    linkLabel: "Voir le projet",
    icon: Briefcase,
  },
  {
    title: "Angel OS — centre de contrôle numérique",
    context:
      "Conception d'un espace d'administration central pour piloter mon site, mes contenus et mon activité depuis une interface unique.",
    missions: [
      "Conception de l'interface mobile et de l'expérience d'installation en application",
      "Centralisation du CMS, des projets, candidatures, formulaires et statistiques",
      "Création d'outils d'assistance éditoriale et de suivi des automatisations",
      "Organisation des connexions aux services externes avec des états réellement vérifiables",
    ],
    tools: "React · TanStack Start · Supabase · GitHub · Lovable · Vercel",
    results:
      "Un centre de contrôle évolutif, directement intégré à angel-leclerc.fr, qui rassemble des fonctions auparavant dispersées.",
    href: "https://www.angel-leclerc.fr/admin",
    linkLabel: "Découvrir Angel OS",
    icon: Brain,
  },
  {
    title: "Blog et espace éditorial",
    context:
      "Création et développement du blog d'Angel Leclerc Communication pour publier des analyses, articles et retours d'expérience.",
    missions: [
      "Conception des pages d'articles et de la navigation éditoriale",
      "Mise en place des catégories, commentaires, favoris et statistiques",
      "Ajout d'indications transparentes sur l'utilisation éventuelle d'outils d'intelligence artificielle",
      "Optimisation de la lecture sur mobile et du partage des publications",
    ],
    tools: "Rédaction web · CMS · React · Supabase · Canva · outils d'IA",
    results:
      "Un espace de publication personnel relié au site professionnel et administrable depuis Angel OS.",
    href: "https://www.angel-leclerc.fr/articles",
    linkLabel: "Voir le blog",
    icon: BookOpen,
  },
  {
    title: "Projet d'émission jeunesse — Radio Bocage",
    context:
      "Service civique auprès de la Ligue de l'enseignement 03, au sein d'une radio associative.",
    missions: [
      "Réflexion sur le concept et le format de l'émission",
      "Recherche de sujets et préparation éditoriale",
      "Découverte de la production et du montage radiophonique",
    ],
    tools: "Rédaction · recherche · montage audio · MixPad",
    results:
      "Un concept d'émission jeunesse construit et une première expérience concrète de la production radio.",
    icon: Radio,
  },
  {
    title: "Créations graphiques et projets associatifs",
    context:
      "Missions ponctuelles de création de supports pour des projets personnels, professionnels et associatifs.",
    missions: [
      "Affiches, flyers et publications pour les réseaux sociaux",
      "Logos et identités visuelles simples",
      "Documents de présentation et supports numériques",
    ],
    tools: "Canva · Figma · Adobe",
    results:
      "Des supports homogènes et réutilisables, adaptés à chaque public et à chaque format.",
    icon: Palette,
  },
];

export function RealisationsSection() {
  const { data } = useQuery(contentQuery("projet"));
  const list: Project[] =
    data && data.length
      ? data.map((i: ContentItem) => ({
          title: i.title,
          context: i.description ?? "",
          missions: toStringList(i.bullets),
          tools: i.extra_label ?? "",
          results: i.extra_value ?? "",
          href: i.url ?? undefined,
          linkLabel: i.link_label ?? undefined,
          icon: iconFor(i.icon, PenLine),
        }))
      : projects;
  return (
    <AnimatedSection>
      <section id="realisations" className="section-padding bg-background scroll-mt-24">
        <div className="container-tight">
          <SectionHeader
            eyebrow="Portfolio"
            title="Projets sélectionnés"
            intro="Quelques projets qui montrent concrètement ma manière de travailler."
          />

          <div className="mt-8 grid md:mt-12 gap-6 md:grid-cols-2">
            {list.map((p) => (
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
                  {p.context}
                </p>

                {p.missions.length > 0 && (
                  <>
                    <p className="mt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Missions réalisées
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-foreground/90">
                      {p.missions.map((m) => (
                        <li key={m} className="flex gap-2">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {p.tools && (
                  <>
                    <p className="mt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Outils utilisés
                    </p>
                    <p className="mt-1 text-sm text-foreground/80">{p.tools}</p>
                  </>
                )}

                {p.results && (
                  <>
                    <p className="mt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Résultats
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {p.results}
                    </p>
                  </>
                )}
                {p.href ? (
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                  >
                    {p.linkLabel ?? "Voir le projet"} <ExternalLink size={14} />
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

          <div className="mt-8 grid md:mt-12 gap-6 md:grid-cols-2">
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
    role: "Apprenti — Baccalauréat professionnel Métiers de l'accueil",
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
  const { data } = useQuery(contentQuery("experience"));
  const list: Experience[] =
    data && data.length
      ? data.map((i: ContentItem) => ({
          role: i.title,
          org: i.subtitle ?? "",
          period: i.period ?? "",
          missions: toStringList(i.bullets),
          domain: i.logo_domain ?? undefined,
          fallbackIcon: iconFor(i.icon, Building2),
        }))
      : experiences;
  return (
    <AnimatedSection>
      <section id="experiences" className="section-padding bg-background scroll-mt-24">
        <div className="container-tight">
          <SectionHeader eyebrow="Parcours" title="Expériences professionnelles" />

          <div className="mt-8 space-y-4 md:mt-12">
            {list.map((exp, idx) => (
              <Card key={`${exp.role}-${idx}`}>
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
  const { data } = useQuery(contentQuery("formation"));
  const list = data ?? [];
  return (
    <AnimatedSection>
      <section id="formation" className="section-padding bg-muted/40 scroll-mt-24">
        <div className="container-tight">
          <SectionHeader
            eyebrow="Études"
            title="Formation"
            intro="Mon parcours actuel et mon projet de poursuite d'études en alternance."
          />

          <div className="mt-12 space-y-6">
            {list.map((item) => {
              const bullets = toStringList(item.bullets);
              const tags = toStringList(item.tags);
              const videos = toVideoList(item.videos);
              return (
                <Card key={item.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <span className="inline-flex h-[64px] w-[120px] shrink-0 items-center justify-center rounded-xl border border-border bg-background p-2">
                      {item.logo_domain ? (
                        <Logo domain={item.logo_domain} alt={item.subtitle ?? item.title} size={52} />
                      ) : (
                        <img
                          src="/logos/mfr.asso.fr.svg"
                          alt="Logo des Maisons familiales rurales (MFR)"
                          className="h-full w-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                        <h3 className="font-display text-lg font-semibold text-foreground">
                          {item.title}
                        </h3>
                        {item.period && (
                          <span className="text-xs font-medium uppercase tracking-widest text-primary">
                            {item.period}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-sm font-medium text-foreground/80">
                          {item.subtitle}
                        </p>
                      )}
                      {item.description && (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      {bullets.length > 0 && (
                        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                          {bullets.map((b) => (
                            <li key={b} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                      {tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {videos.length > 0 && (
                        <>
                          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            En vidéo
                          </p>
                          <div className="mt-3 grid gap-4 md:grid-cols-2">
                            {videos.map((v) => (
                              <YouTubeEmbed key={v.id} id={v.id} title={v.title ?? item.title} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
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
  const { data } = useQuery(contentQuery("certification"));
  const list =
    data && data.length
      ? data.map((i: ContentItem) => ({
          name: i.title,
          org: i.subtitle ?? "",
          detail: i.description ?? "",
          domain: i.logo_domain ?? undefined,
          icon: iconFor(i.icon, Award),
        }))
      : certifications;
  return (
    <AnimatedSection>
      <section id="certifications" className="section-padding bg-background scroll-mt-24">
        <div className="container-tight">
          <SectionHeader eyebrow="Attestations" title="Certifications" />

          <div className="mt-8 grid md:mt-12 gap-4 md:grid-cols-2">
            {list.map((c, idx) => (
              <Card key={`${c.name}-${idx}`} className="flex items-start gap-4">
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
  const { data } = useQuery(contentQuery("engagement"));
  const list =
    data && data.length
      ? data.map((i: ContentItem) => ({
          title: i.title,
          org: i.subtitle ?? "",
          period: i.period ?? undefined,
          description: i.description ?? "",
          icon: iconFor(i.icon, HeartHandshake),
        }))
      : engagements;
  return (
    <AnimatedSection>
      <section id="engagements" className="section-padding bg-muted/40 scroll-mt-24">
        <div className="container-tight">
          <SectionHeader eyebrow="Vie associative" title="Engagements associatifs" />

          <div className="mt-8 grid md:mt-12 gap-6 md:grid-cols-2">
            {list.map((e, idx) => (
              <Card key={`${e.org}-${idx}`} className="flex h-full flex-col">
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
      { name: "Canva Pro", domain: "canva.com", use: "Création de carrousels, affiches, identités visuelles et supports imprimés." },
      { name: "Adobe", domain: "adobe.com", use: "Retouches ponctuelles et exports pour supports print." },
    ],
  },
  {
    title: "Sites internet et publication",
    icon: PenLine,
    tools: [
      { name: "Lovable", domain: "lovable.dev", use: "Synchronisation, publication et services serveur de projets web." },
      { name: "Figma", domain: "figma.com", use: "Maquettes de sites et organisation d'interfaces." },
      { name: "Squarespace Domains", domain: "squarespace.com", use: "Enregistrement et gestion du nom de domaine." },
      { name: "Vercel", domain: "vercel.com", use: "Déploiement et hébergement de l'application web." },
      { name: "GitHub", domain: "github.com", use: "Gestion du code source, historique et publication des évolutions." },
      { name: "Supabase", domain: "supabase.com", use: "Base de données, authentification et stockage applicatif." },
      { name: "React et TanStack", domain: "tanstack.com", use: "Développement de l'interface et des fonctions du site." },
      { name: "Webnode", domain: "webnode.com", use: "Création rapide de sites vitrines et blogs." },
      { name: "Wix", domain: "wix.com", use: "Sites vitrines, boutiques et portfolios avec éditeur visuel." },
      { name: "Google Sites", domain: "sites.google.com", use: "Sites simples et pages collaboratives intégrées à Google Workspace." },
    ],
  },
  {
    title: "Bureautique et collaboration",
    icon: ClipboardList,
    tools: [
      { name: "Microsoft Office", domain: "microsoft.com", use: "Rédaction, présentations, tableaux de suivi et travail collaboratif." },
      { name: "Google Workspace", domain: "workspace.google.com", use: "Messagerie professionnelle, rédaction, présentations et travail collaboratif." },
    ],
  },
  {
    title: "Communication et réseaux sociaux",
    icon: Users,
    tools: [
      { name: "Meta Business Suite", domain: "business.facebook.com", use: "Programmation des publications, modération et suivi des performances." },
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
      { name: "MixPad", domain: "nch.com.au", use: "Montage audio, podcasts, jingles et identités sonores." },
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
      { name: "ChatGPT", domain: "chatgpt.com", use: "Recherche structurée, idéation, rédaction assistée et prototypage, avec vérification humaine systématique." },
      { name: "Gemini", domain: "gemini.google.com", use: "Recherche rapide et synthèse de sources, toujours revérifiées avant utilisation." },
      { name: "Claude", domain: "claude.ai", use: "Rédaction assistée, reformulation et analyse de documents, avec relecture humaine." },
      { name: "NotebookLM", domain: "notebooklm.google.com", use: "Organisation de sources et synthèse de documents pour préparer un contenu." },
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
                    <a
                      key={t.name}
                      href={t.domain ? `https://${t.domain}` : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
                    >
                      {t.domain ? (
                        <Logo domain={t.domain} alt={t.name} size={40} link={false} />
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
                    </a>
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
          <div className="mt-8 grid md:mt-12 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
