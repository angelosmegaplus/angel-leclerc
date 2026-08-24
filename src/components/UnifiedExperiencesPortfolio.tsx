import { useQuery } from "@tanstack/react-query";
import { BookOpen, Briefcase, ExternalLink, Palette, PenLine, Radio, Sparkles, type LucideIcon } from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import { contentQuery, iconFor, toStringList, type ContentItem } from "@/lib/content";

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

const digitalExperiences: Project = {
  title: "Expériences numériques — Angel OS & Flamme",
  context:
    "Conception et évolution de deux laboratoires numériques intégrés à angel-leclerc.fr : Angel OS pour l’administration, l’IA et l’automatisation ; Flamme pour la recherche, les services et le réseau social.",
  missions: [
    "Conception d’Angel OS comme centre de contrôle mobile pour administrer le site et centraliser des fonctions auparavant dispersées",
    "Création de Flamme : recherche Web avec Qwant ou Lilo, actualités, services numériques et IA Mistral",
    "Développement de Flamme Social : publications, stories, vidéos, forum, découverte et messagerie chiffrée",
    "Travail continu sur l’ergonomie mobile, la confidentialité, la modération et la sécurité des données",
    "Pilotage du développement assisté avec ChatGPT et Codex, du brief aux tests et aux itérations de production",
  ],
  tools: "ChatGPT · Codex · React · TypeScript · TanStack Start · Supabase · GitHub · Lovable · Vercel · Mistral · Qwant",
  results:
    "Un ensemble d’expériences numériques cohérent qui permet de tester concrètement des idées d’interface, d’intelligence artificielle, d’automatisation, de recherche et de réseau social.",
  href: "/experiences",
  linkLabel: "Découvrir les expériences",
  icon: Sparkles,
};

const fallbackProjects: Project[] = [
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
    context: "Création de mon activité de communication en tant qu'entrepreneur individuel.",
    missions: [
      "Construction de l'identité visuelle et de la ligne éditoriale",
      "Conception et mise en ligne du site internet",
      "Structuration de l'offre de services et des tarifs indicatifs",
    ],
    tools: "Lovable · Canva · Figma · Squarespace",
    results: "Un site professionnel en ligne, une offre lisible et un premier canal de contact pour les clients.",
    href: "https://www.angel-leclerc.fr",
    linkLabel: "Voir le projet",
    icon: Briefcase,
  },
  digitalExperiences,
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
    results: "Un espace de publication personnel relié au site professionnel et administrable depuis Angel OS.",
    href: "https://www.angel-leclerc.fr/articles",
    linkLabel: "Voir le blog",
    icon: BookOpen,
  },
  {
    title: "Projet d'émission jeunesse — Radio Bocage",
    context: "Service civique auprès de la Ligue de l'enseignement 03, au sein d'une radio associative.",
    missions: [
      "Réflexion sur le concept et le format de l'émission",
      "Recherche de sujets et préparation éditoriale",
      "Découverte de la production et du montage radiophonique",
    ],
    tools: "Rédaction · recherche · montage audio · MixPad",
    results: "Un concept d'émission jeunesse construit et une première expérience concrète de la production radio.",
    icon: Radio,
  },
  {
    title: "Créations graphiques et projets associatifs",
    context: "Missions ponctuelles de création de supports pour des projets personnels, professionnels et associatifs.",
    missions: [
      "Affiches, flyers et publications pour les réseaux sociaux",
      "Logos et identités visuelles simples",
      "Documents de présentation et supports numériques",
    ],
    tools: "Canva · Figma · Adobe",
    results: "Des supports homogènes et réutilisables, adaptés à chaque public et à chaque format.",
    icon: Palette,
  },
];

const legacyExperienceTitles = new Set([
  "Angel OS — centre de contrôle numérique",
  "Flamme — moteur de recherche bêta",
  "Flamme — réseau social",
  "Flamme social",
]);

export function UnifiedExperiencesPortfolio() {
  const { data } = useQuery(contentQuery("projet"));
  const source: Project[] = data?.length
    ? data.map((item: ContentItem) => ({
        title: item.title,
        context: item.description ?? "",
        missions: toStringList(item.bullets),
        tools: item.extra_label ?? "",
        results: item.extra_value ?? "",
        href: item.url ?? undefined,
        linkLabel: item.link_label ?? undefined,
        icon: iconFor(item.icon, PenLine),
      }))
    : fallbackProjects;

  const cleaned = source.filter(
    (project) => !legacyExperienceTitles.has(project.title) && project.title !== digitalExperiences.title,
  );
  const companyIndex = cleaned.findIndex((project) => project.title === "Angel Leclerc Communication");
  const list = companyIndex >= 0
    ? [...cleaned.slice(0, companyIndex + 1), digitalExperiences, ...cleaned.slice(companyIndex + 1)]
    : [digitalExperiences, ...cleaned];

  return (
    <AnimatedSection>
      <section id="realisations" className="section-padding scroll-mt-24 bg-background">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Sparkles size={12} /> Portfolio
            </span>
            <h2 className="mt-3 font-display text-[1.65rem] font-bold leading-tight text-foreground sm:text-3xl md:text-4xl">Projets sélectionnés</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground md:mt-4 md:text-base">Quelques projets qui montrent concrètement ma manière de travailler.</p>
          </div>

          <div className="mt-8 grid gap-6 md:mt-12 md:grid-cols-2">
            {list.map((project) => (
              <article key={project.title} className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary"><project.icon size={22} /></div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{project.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{project.context}</p>
                {project.missions.length > 0 && <><p className="mt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Missions réalisées</p><ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-foreground/90">{project.missions.map((mission) => <li key={mission} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary"/><span>{mission}</span></li>)}</ul></>}
                {project.tools && <><p className="mt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Outils utilisés</p><p className="mt-1 text-sm text-foreground/80">{project.tools}</p></>}
                {project.results && <><p className="mt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Résultats</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{project.results}</p></>}
                {project.href && <a href={project.href} className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10">{project.linkLabel ?? "Voir le projet"}<ExternalLink size={14}/></a>}
              </article>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}
