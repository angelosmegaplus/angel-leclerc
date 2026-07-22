import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  HeartPulse,
  Tent,
  BookOpen,
  Flag,
  Check,
  RotateCcw,
  MousePointerClick,
  GraduationCap,
  ExternalLink,
  Linkedin,
  Newspaper,
  Briefcase,
  Target,
  type LucideIcon,
} from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";

// ---------- Logo helper ----------

type LogoSource =
  | { kind: "img"; src: string; alt: string }
  | { kind: "icon"; icon: LucideIcon }
  | { kind: "text"; label: string };

function LogoBox({ source, size = 56 }: { source: LogoSource; size?: number }) {
  return (
    <div
      className="inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-background"
      style={{ width: size, height: size }}
      aria-hidden={source.kind === "text" ? undefined : true}
    >
      {source.kind === "img" && (
        <img
          src={source.src}
          alt={source.alt}
          width={size - 16}
          height={size - 16}
          loading="lazy"
          className="max-h-[70%] max-w-[70%] object-contain"
        />
      )}
      {source.kind === "icon" && (
        <source.icon size={Math.round(size * 0.5)} className="text-primary" />
      )}
      {source.kind === "text" && (
        <span className="px-1 text-center text-[10px] font-semibold leading-tight text-foreground">
          {source.label}
        </span>
      )}
    </div>
  );
}

const favicon = (domain: string) =>
  `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;

// ---------- Data ----------

type Card = {
  title: string;
  org: string;
  period: string;
  meta?: string;
  logo: LogoSource;
  description: string;
  skills?: string[];
};

const formation: Card[] = [
  {
    title: "Baccalauréat professionnel Métiers de l'accueil",
    org: "MFR-CFA du Périgord noir",
    period: "Septembre 2023 – juillet 2025",
    meta: "Mention Bien",
    logo: {
      kind: "img",
      src: favicon("mfr-perigordnoir.fr"),
      alt: "Logo MFR-CFA du Périgord noir",
    },
    description:
      "Formation centrée sur l'accueil multicanal, l'information, le conseil, l'orientation du public, la vente, la gestion des demandes, les tâches administratives et la communication. Cette formation réalisée en alternance m'a permis de développer une forte aisance orale, de l'autonomie, de la polyvalence et une bonne capacité d'adaptation. Le parcours a également été enrichi par un voyage d'étude Erasmus de deux semaines en Irlande, apportant une ouverture internationale et une pratique concrète de l'anglais.",
    skills: [
      "Accueil multicanal",
      "Information du public",
      "Communication orale",
      "Vente",
      "Gestion administrative",
      "Création de supports",
      "Travail en équipe",
      "Anglais",
      "SST (sauveteur secouriste du travail)",
    ],
  },
];

const experiences: Card[] = [
  {
    title: "Apprenti — Bac Pro Accueil et Vente",
    org: "Office de Tourisme Val de Sioule",
    period: "Septembre 2023 – juillet 2025",
    logo: {
      kind: "img",
      src: favicon("valdesioule.com"),
      alt: "Logo Office de Tourisme Val de Sioule",
    },
    description:
      "Deux années d'alternance dans un office de tourisme intercommunal. Accueil des visiteurs, vente de produits touristiques, gestion des demandes par téléphone et e-mail. Création de livrets pour les hébergeurs, de livrets statistiques et d'affiches promotionnelles. Réalisation de montages vidéos et de publications pour les réseaux sociaux avec Canva. Analyse et mise à jour de l'agenda des animations sur le site web. Découverte concrète de la communication touristique et spécialisation autour de l'intelligence artificielle et de ses usages.",
    skills: [
      "Accueil physique & téléphonique",
      "Vente conseil",
      "Création de supports print",
      "Community management",
      "Montage vidéo",
      "Gestion de bases de données",
      "Moka, Koesio, Avizi, Apidae, Brevo",
      "Conseil œnotouristique",
    ],
  },
  {
    title: "Animateur radio",
    org: "Ligue de l'enseignement 03 — Radio Bocage",
    period: "2026 — 2 mois",
    logo: {
      kind: "img",
      src: favicon("laligue03.fr"),
      alt: "Logo Ligue de l'enseignement de l'Allier",
    },
    description:
      "Mission au sein d'une radio associative locale portée par la Ligue de l'enseignement de l'Allier. Recherche de sujets, rédaction et conduite d'interviews, préparation et animation d'émissions en direct. Une expérience qui a renforcé mon aisance à l'oral, mon sens de l'écoute et mon rapport à l'information.",
    skills: [
      "Rédaction d'interviews",
      "Préparation d'émissions",
      "Animation en direct",
      "Prise de son",
      "Écoute active",
      "Recherche de sujets",
    ],
  },
  {
    title: "Missions d'intérim",
    org: "Différents employeurs",
    period: "2026",
    logo: { kind: "icon", icon: Briefcase },
    description:
      "Missions ponctuelles réalisées en parallèle de mes projets : électricité, ménage, peinture, bûcheronnage. Une expérience de polyvalence, de rigueur et d'adaptation à des environnements de travail variés.",
    skills: [
      "Polyvalence",
      "Rigueur",
      "Adaptation",
      "Travail manuel",
    ],
  },
];

const certifications: Card[] = [
  {
    title: "Les principes fondamentaux du marketing digital",
    org: "Google",
    period: "Obtenue en avril 2026",
    logo: { kind: "img", src: favicon("google.com"), alt: "Logo Google" },
    description:
      "Formation consacrée aux bases du marketing numérique, de la visibilité en ligne, de la communication digitale et de la présence d'une organisation sur Internet.",
  },
  {
    title: "BAFA",
    org: "Ligue de l'enseignement de l'Allier",
    period: "",
    logo: {
      kind: "img",
      src: favicon("laligue03.fr"),
      alt: "Logo Ligue de l'enseignement de l'Allier",
    },
    description:
      "Le BAFA (Brevet d'Aptitude aux Fonctions d'Animateur) est un diplôme d'État qui atteste de la capacité à encadrer des enfants et des adolescents dans des activités de loisirs, de vacances et de jeunesse. Il se déroule en trois étapes : une session de formation générale, un stage pratique en structure d'accueil, puis une session d'approfondissement. La Ligue de l'Enseignement est une fédération d'éducation populaire reconnue d'utilité publique, qui forme des animateurs engagés dans une démarche d'éducation active, de citoyenneté et de laïcité. J'ai suivi une formation orientée animation en centre de vacances et de loisirs (CVL), avec une spécialité scoutisme pour les tranches d'âge 7-12 ans puis 12-17 ans. Grâce à cette certification, je peux conduire des activités, animer des groupes de mineurs et garantir leur sécurité dans un cadre éducatif.",
    skills: [
      "Animation pédagogique",
      "Encadrement de mineurs",
      "Préparation d'activités",
      "Gestion de groupe",
      "Sécurité des jeunes",
      "Projet éducatif",
      "Laïcité & citoyenneté",
    ],
  },
  {
    title: "PSC1",
    org: "Prévention et secours civiques de niveau 1",
    period: "",
    logo: { kind: "icon", icon: HeartPulse },
    description:
      "Formation aux gestes de premiers secours et aux comportements à adopter face à une situation d'urgence.",
  },
];

const engagements: Card[] = [
  {
    title: "Président d'association",
    org: "La Fraternité du Scoutisme",
    period: "Décembre 2024 – janvier 2026",
    logo: { kind: "icon", icon: Flag },
    description:
      "Relance d'une association nationale interscoute et intergénérationnelle laissée à l'abandon depuis plusieurs années. Réalisation d'un important travail de communication, de création de contenus, d'animation d'une communauté, d'organisation de rencontres et de conférences, de recherches historiques et pédagogiques, de développement d'un forum et de valorisation de l'histoire du scoutisme.",
    skills: [
      "Gestion associative",
      "Communication",
      "Création de contenus",
      "Organisation d'événements",
      "Recherche",
      "Animation de communauté",
      "Gestion de projet",
    ],
  },
  {
    title: "Chef scout",
    org: "Expérience au sein de différents mouvements scouts",
    period: "Septembre 2022 – août 2025",
    logo: { kind: "icon", icon: Tent },
    description:
      "Le scoutisme est un mouvement d'éducation active fondé sur l'apprentissage par le jeu, la nature et la vie en collectivité. En tant que chef scout, j'ai encadré des enfants et des adolescents (principalement de 7 à 12 ans) dans des activités variées : camps, sorties, cérémonies, ateliers créatifs et projets d'unité. Cet engagement développe des qualités essentielles : fiabilité, responsabilité, autonomie, solidarité, créativité et capacité à gérer des situations imprévues. J'ai appris à concevoir des activités pédagogiques, à animer un groupe de mineurs en toute sécurité, à travailler en équipe de chefs et à transmettre des valeurs de respect et d'engagement.",
    skills: [
      "Encadrement de mineurs",
      "Fiabilité & engagement",
      "Créativité pédagogique",
      "Organisation de camps",
      "Gestion de groupe",
      "Travail d'équipe",
      "Prise de responsabilités",
      "Adaptation sur le terrain",
    ],
  },
  {
    title: "Bénévole",
    org: "Réseau Baden-Powell",
    period: "Depuis juillet 2024",
    logo: { kind: "icon", icon: BookOpen },
    description:
      "Participation aux activités du Réseau Baden-Powell, notamment autour des archives nationales, de la conservation de documents et de la transmission de l'histoire du scoutisme.",
    skills: [
      "Archives",
      "Recherche documentaire",
      "Histoire du scoutisme",
      "Classement de documents",
      "Transmission",
      "Travail associatif",
    ],
  },
];

// ---------- Flashcard ----------

function Flashcard({ card }: { card: Card }) {
  const [open, setOpen] = useState(false);
  return (
    <article
      className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-shadow hover:shadow-md"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-4 p-5 text-left md:p-6"
      >
        <LogoBox source={card.logo} size={64} />
        <div className="min-w-0 flex-1">
          <h4 className="font-display text-lg font-semibold text-foreground md:text-xl">
            {card.title}
          </h4>
          <p className="mt-1 text-sm font-medium text-foreground/90">{card.org}</p>
          {card.period && (
            <p className="mt-0.5 text-xs text-muted-foreground">{card.period}</p>
          )}
          {card.meta && (
            <p className="mt-0.5 text-xs italic text-muted-foreground">{card.meta}</p>
          )}
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-primary">
            {open ? (
              <>
                <RotateCcw size={12} /> Refermer la carte
              </>
            ) : (
              <>
                <MousePointerClick size={12} /> Appuyer pour voir le détail
              </>
            )}
          </p>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border bg-card"
          >
            <div className="space-y-4 p-5 md:p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {card.description}
              </p>
              {card.skills && card.skills.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                    Compétences
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {card.skills.map((s) => (
                      <li
                        key={s}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                      >
                        <Check size={12} className="text-primary" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

// ---------- Carousel ----------

function Carousel({ cards, label }: { cards: Card[]; label: string }) {
  const [index, setIndex] = useState(0);
  const count = cards.length;
  const go = (n: number) => setIndex(((n % count) + count) % count);
  return (
    <div className="relative">
      <div className="mx-auto max-w-2xl">
        <div className="relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              drag={count > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(index + 1);
                else if (info.offset.x > 60) go(index - 1);
              }}
            >
              <Flashcard card={cards[index]} />
            </motion.div>
          </AnimatePresence>
        </div>

        {count > 1 && (
          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label={`${label} — précédent`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1.5">
              {cards.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`${label} — carte ${i + 1}`}
                  aria-current={i === index}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-6 bg-primary" : "w-2 bg-border"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label={`${label} — suivant`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Tools ----------

type Tool = { name: string; source: LogoSource; hint?: string };

const toolCategories: { title: string; note?: string; tools: Tool[] }[] = [
  {
    title: "Création graphique",
    tools: [
      {
        name: "Canva",
        source: { kind: "img", src: favicon("canva.com"), alt: "Logo Canva" },
        hint: "Outil de création graphique en ligne pour affiches, publications, présentations et supports visuels.",
      },
      {
        name: "Figma",
        source: { kind: "img", src: favicon("figma.com"), alt: "Logo Figma" },
        hint: "Éditeur collaboratif pour concevoir des maquettes de sites, d'applications et d'interfaces.",
      },
    ],
  },
  {
    title: "Sites internet et publication",
    tools: [
      {
        name: "Lovable",
        source: { kind: "img", src: favicon("lovable.dev"), alt: "Logo Lovable" },
        hint: "Plateforme de création de sites internet et d'applications assistée par intelligence artificielle.",
      },
      {
        name: "Squarespace",
        source: { kind: "img", src: favicon("squarespace.com"), alt: "Logo Squarespace" },
        hint: "Hébergeur et créateur de sites vitrines, également utilisé pour enregistrer des noms de domaine.",
      },
    ],
  },
  {
    title: "Bureautique et collaboration",
    tools: [
      {
        name: "Microsoft Office",
        source: { kind: "img", src: favicon("office.com"), alt: "Logo Microsoft Office" },
        hint: "Suite bureautique regroupant Word, Excel, PowerPoint, Outlook et d'autres logiciels professionnels.",
      },
      {
        name: "Microsoft Word",
        source: { kind: "img", src: favicon("microsoft.com"), alt: "Logo Microsoft Word" },
        hint: "Traitement de texte pour rédiger et mettre en forme des documents.",
      },
      {
        name: "Microsoft Excel",
        source: { kind: "img", src: favicon("microsoft.com"), alt: "Logo Microsoft Excel" },
        hint: "Tableur pour organiser des données, réaliser des calculs et créer des tableaux.",
      },
      {
        name: "Microsoft PowerPoint",
        source: { kind: "img", src: favicon("microsoft.com"), alt: "Logo Microsoft PowerPoint" },
        hint: "Logiciel de création de présentations et de diaporamas.",
      },
      {
        name: "Outlook",
        source: { kind: "img", src: favicon("outlook.com"), alt: "Logo Outlook" },
        hint: "Messagerie professionnelle avec calendrier et gestion de contacts.",
      },
      {
        name: "Google Workspace",
        source: { kind: "img", src: favicon("workspace.google.com"), alt: "Logo Google Workspace" },
        hint: "Suite collaborative de Google : messagerie, agenda, stockage et outils bureautiques en ligne.",
      },
      {
        name: "Google Docs",
        source: { kind: "img", src: favicon("docs.google.com"), alt: "Logo Google Docs" },
        hint: "Traitement de texte en ligne permettant la rédaction collaborative en temps réel.",
      },
      {
        name: "Google Sheets",
        source: { kind: "img", src: favicon("sheets.google.com"), alt: "Logo Google Sheets" },
        hint: "Tableur en ligne pour créer et partager des feuilles de calcul.",
      },
      {
        name: "Google Drive",
        source: { kind: "img", src: favicon("drive.google.com"), alt: "Logo Google Drive" },
        hint: "Service de stockage et de partage de fichiers en ligne.",
      },
      {
        name: "Gmail",
        source: { kind: "img", src: favicon("mail.google.com"), alt: "Logo Gmail" },
        hint: "Messagerie électronique de Google.",
      },
    ],
  },
  {
    title: "Communication et réseaux sociaux",
    tools: [
      {
        name: "Meta Business Suite",
        source: { kind: "img", src: favicon("business.facebook.com"), alt: "Logo Meta Business Suite" },
        hint: "Outil de gestion des pages Facebook et Instagram : publications, messages et statistiques.",
      },
      {
        name: "Facebook",
        source: { kind: "img", src: favicon("facebook.com"), alt: "Logo Facebook" },
        hint: "Réseau social généraliste utilisé pour la communication de pages et de communautés.",
      },
      {
        name: "Instagram",
        source: { kind: "img", src: favicon("instagram.com"), alt: "Logo Instagram" },
        hint: "Réseau social visuel centré sur les photos, vidéos et stories.",
      },
      {
        name: "LinkedIn",
        source: { kind: "img", src: favicon("linkedin.com"), alt: "Logo LinkedIn" },
        hint: "Réseau social professionnel pour la présence et la communication d'entreprise.",
      },
    ],
  },
  {
    title: "Audio",
    tools: [
      {
        name: "MixPad",
        source: { kind: "img", src: favicon("nch.com.au"), alt: "Logo MixPad" },
        hint: "Logiciel de mixage et de montage audio multipiste pour émissions, podcasts et jingles.",
      },
    ],
  },
  {
    title: "Gestion touristique et données",
    tools: [
      {
        name: "Avizi",
        source: { kind: "img", src: favicon("avizi.fr"), alt: "Logo Avizi" },
        hint: "Logiciel de caisse et de gestion des ventes utilisé par les offices de tourisme.",
      },
      {
        name: "Koesio",
        source: { kind: "img", src: favicon("koesio.com"), alt: "Logo Koesio" },
        hint: "Solution numérique pour la gestion administrative et bureautique des structures.",
      },
    ],
  },
  {
    title: "Intelligence artificielle",
    note:
      "Utilisation pour la recherche, l'organisation des informations, la rédaction, la mise en forme de contenus et l'amélioration de supports.",
    tools: [
      {
        name: "ChatGPT",
        source: { kind: "img", src: favicon("chatgpt.com"), alt: "Logo ChatGPT" },
        hint: "Assistant conversationnel d'OpenAI utilisé pour la recherche d'informations et l'aide à la rédaction.",
      },
      {
        name: "Intelligence artificielle générative",
        source: { kind: "icon", icon: Lightbulb },
        hint: "Ensemble d'outils capables de générer du texte, des images ou des idées à partir d'instructions.",
      },
    ],
  },
];

function ToolChip({ tool }: { tool: Tool }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card">
        {tool.source.kind === "img" ? (
          <img
            src={tool.source.src}
            alt={tool.source.alt}
            width={24}
            height={24}
            loading="lazy"
            className="h-6 w-6 object-contain"
          />
        ) : tool.source.kind === "icon" ? (
          <tool.source.icon size={18} className="text-primary" />
        ) : (
          <span className="text-[10px] font-semibold text-foreground">
            {tool.source.label}
          </span>
        )}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{tool.name}</p>
        {tool.hint && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {tool.hint}
          </p>
        )}
      </div>
    </li>
  );
}

// ---------- Subsection wrapper ----------

function Subsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-16">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <h3 className="font-display text-xl font-semibold text-foreground md:text-2xl">
            {title}
          </h3>
          <span className="h-px flex-1 bg-border" />
        </div>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}

// ---------- Main section ----------

export function MyJourney() {
  return (
    <section
      id="parcours"
      className="section-padding border-y border-border bg-card"
    >
      <div className="container-tight">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Section personnelle
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
            Mon parcours
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            Passionné par la communication, l'information et les projets qui ont du
            sens, j'ai construit un parcours mêlant accueil du public, tourisme,
            création de contenus, gestion de projet et engagement associatif. Après
            un baccalauréat professionnel obtenu avec mention Bien, je souhaite
            poursuivre mon parcours en BTS Communication en alternance, avec
            l'objectif de m'orienter ensuite vers le journalisme.
          </p>
          <div className="mt-6 rounded-2xl border border-border bg-background p-5 text-left md:p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Pour découvrir l'intégralité de mon parcours professionnel
              (expériences, missions, recommandations), je vous invite à
              consulter mon profil LinkedIn.
            </p>
            <a
              href="https://www.linkedin.com/in/angel-leclerc"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Linkedin size={16} aria-hidden="true" />
              Visiter mon profil LinkedIn
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="mt-8">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="inline-flex shrink-0 rounded-xl bg-primary/10 p-3">
                <GraduationCap size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground md:text-xl">
                  Je recherche un BTS Communication en alternance
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Le BTS Communication est un diplôme d'État de niveau 5 (Bac+2)
                  reconnu par le Ministère de l'Enseignement supérieur. Il se
                  prépare en deux ans, après un baccalauréat, et forme à la
                  conception, à la mise en œuvre, au suivi et à l'évaluation
                  d'actions de communication commerciale, institutionnelle,
                  numérique et événementielle.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Je suis ouvert à des missions variées, à condition que la
                  communication reste majoritaire. Par exemple : 60 % de communication
                  et 40 % de vente, d'accueil ou d'autres activités complémentaires.
                </p>
                <p className="mt-3 text-sm font-medium text-foreground">
                  Contactez-moi si vous avez une opportunité d'apprentissage.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                  Rythme en alternance
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Environ deux jours en centre de formation et trois jours en
                  entreprise chaque semaine, sur une durée de deux ans. Le
                  rythme peut varier légèrement selon l'école et l'entreprise
                  d'accueil.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                  Statut et contrat
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Contrat d'apprentissage. Formation prise en charge par
                  l'entreprise via l'OPCO. Rémunération de l'apprenti selon la
                  grille légale, définie par l'âge et l'année de contrat.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                  Matières professionnelles
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <li>• Cultures de la communication</li>
                  <li>• Relations commerciales</li>
                  <li>• Projet et pratiques de la communication</li>
                  <li>• Veille opérationnelle et outils numériques</li>
                  <li>• Ateliers de production</li>
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                  Matières générales
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <li>• Culture générale et expression</li>
                  <li>• Langue vivante étrangère (anglais)</li>
                  <li>• Économie, droit et management</li>
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 md:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                  Compétences visées
                </p>
                <ul className="mt-2 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                  <li>• Concevoir et piloter une stratégie de communication</li>
                  <li>• Réaliser des supports print et numériques</li>
                  <li>• Gérer les réseaux sociaux et le contenu web</li>
                  <li>• Assurer les relations presse et médias</li>
                  <li>• Organiser des événements et opérations</li>
                  <li>• Gérer un budget et coordonner des prestataires</li>
                  <li>• Suivre les indicateurs et évaluer les actions</li>
                  <li>• Assurer une veille métier et concurrentielle</li>
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 md:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                  Épreuves d'examen
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <li>• Culture générale et expression (écrit)</li>
                  <li>• Langue vivante étrangère (oral et écrit)</li>
                  <li>• Cultures de la communication (écrit)</li>
                  <li>• Économie, droit et management (écrit)</li>
                  <li>• Projet et pratiques de la communication (oral, dossier)</li>
                  <li>• Relations commerciales (oral)</li>
                  <li>• Activités professionnelles (dossier et soutenance)</li>
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 md:col-span-2">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
                  <Briefcase size={12} aria-hidden="true" />
                  Métiers accessibles après le BTS Communication
                </p>
                <ul className="mt-2 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                  <li>• Chargé(e) de communication</li>
                  <li>• Assistant(e) chef de projet en agence</li>
                  <li>• Community manager / social media manager</li>
                  <li>• Chargé(e) de communication digitale</li>
                  <li>• Attaché(e) de presse junior</li>
                  <li>• Assistant(e) événementiel</li>
                  <li>• Assistant(e) marketing</li>
                  <li>• Chargé(e) des relations publiques</li>
                  <li>• Média planneur junior</li>
                  <li>• Concepteur-rédacteur junior</li>
                  <li>• Chargé(e) de clientèle en agence de communication</li>
                  <li>• Chargé(e) de communication interne</li>
                </ul>
              </div>
              <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 md:col-span-2">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
                  <Target size={12} aria-hidden="true" />
                  Mon objectif après le BTS
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  Poursuivre en <strong>BUT Information-Communication,
                  parcours Journalisme</strong> (Bachelor Universitaire de
                  Technologie, diplôme national de niveau 6, Bac+3), ou dans
                  un parcours similaire orienté vers les métiers de
                  l'information et des médias.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Ce diplôme forme aux techniques du journalisme (écrit, radio,
                  télévision, web), à la déontologie de l'information, à la
                  recherche et à la vérification des sources, ainsi qu'à la
                  production de contenus pour tous types de médias.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 md:col-span-2">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
                  <Newspaper size={12} aria-hidden="true" />
                  Pour en savoir plus sur le BTS Communication
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Sources officielles et médias spécialisés qui présentent le diplôme :
                </p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    {
                      name: "Onisep",
                      desc: "Office national d'information sur les enseignements et les professions.",
                      href: "https://www.onisep.fr/ressources/univers-formation/formations/post-bac/bts-communication",
                      domain: "onisep.fr",
                    },
                    {
                      name: "L'Étudiant",
                      desc: "Média de référence sur l'orientation et les études supérieures.",
                      href: "https://www.letudiant.fr/etudes/bts/bts-communication.html",
                      domain: "letudiant.fr",
                    },
                    {
                      name: "Studyrama",
                      desc: "Portail d'information sur les formations et les métiers.",
                      href: "https://www.studyrama.com/formations/diplomes/bts/bts-communication-16.html",
                      domain: "studyrama.com",
                    },
                    {
                      name: "Diplomeo",
                      desc: "Guide des formations post-bac en France.",
                      href: "https://diplomeo.com/etablissements-formations-bts_communication",
                      domain: "diplomeo.com",
                    },
                    {
                      name: "France Travail",
                      desc: "Fiches métiers officielles de l'ex Pôle emploi.",
                      href: "https://www.francetravail.fr/candidat/decouvrir-les-metiers-en-video/les-metiers/communication.html",
                      domain: "francetravail.fr",
                    },
                    {
                      name: "Éduscol",
                      desc: "Portail du Ministère de l'Éducation nationale : référentiel officiel du diplôme.",
                      href: "https://eduscol.education.fr/sti/formations/bts-communication",
                      domain: "education.fr",
                    },
                  ].map((s) => (
                    <li key={s.name}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/50"
                      >
                        <img
                          src={favicon(s.domain)}
                          alt={`Logo ${s.name}`}
                          width={24}
                          height={24}
                          loading="lazy"
                          className="h-6 w-6 shrink-0 object-contain"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                            {s.name}
                          </p>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {s.desc}
                          </p>
                        </div>
                        <ExternalLink
                          size={12}
                          className="mt-1 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-primary">
              Écoles visées
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <a
                href="https://www.ibsac.fr/esc-communication/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <img
                  src={favicon("ibsac.fr")}
                  alt="Logo IBSAC"
                  width={32}
                  height={32}
                  loading="lazy"
                  className="h-8 w-8 object-contain"
                />
                <div>
                  <p className="font-display text-sm font-semibold text-foreground group-hover:text-primary">
                    IBSAC
                  </p>
                  <p className="text-xs text-muted-foreground">Brive-la-Gaillarde</p>
                </div>
                <ExternalLink
                  size={14}
                  className="ml-auto text-muted-foreground"
                  aria-hidden="true"
                />
              </a>
              <a
                href="https://www.talis.community/formations/bts-communication/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <img
                  src={favicon("talis.community")}
                  alt="Logo Talis"
                  width={32}
                  height={32}
                  loading="lazy"
                  className="h-8 w-8 object-contain"
                />
                <div>
                  <p className="font-display text-sm font-semibold text-foreground group-hover:text-primary">
                    Talis
                  </p>
                  <p className="text-xs text-muted-foreground">Périgueux</p>
                </div>
                <ExternalLink
                  size={14}
                  className="ml-auto text-muted-foreground"
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>
        </AnimatedSection>

        <Subsection title="Expériences professionnelles">
          <Carousel cards={experiences} label="Expériences professionnelles" />
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs italic text-muted-foreground">
            Pour l'historique complet, les recommandations et les missions détaillées,
            rendez-vous sur mon profil LinkedIn.
          </p>
        </Subsection>

        <Subsection title="Formation">
          <div className="mx-auto max-w-2xl">
            <Flashcard card={formation[0]} />
          </div>
        </Subsection>

        <Subsection title="Certifications">
          <Carousel cards={certifications} label="Certifications" />
        </Subsection>

        <Subsection title="Engagements associatifs">
          <Carousel cards={engagements} label="Engagements associatifs" />
        </Subsection>

        <Subsection title="Outils utilisés">
          <div className="mx-auto max-w-4xl">
            <p className="text-center text-sm text-muted-foreground">
              Outils utilisés dans le cadre de mes formations, de mes expériences
              professionnelles et de mes projets.
            </p>
            <div className="mt-8 space-y-8">
              {toolCategories.map((cat) => (
                <div key={cat.title}>
                  <h4 className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
                    {cat.title}
                  </h4>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {cat.tools.map((t) => (
                      <ToolChip key={t.name} tool={t} />
                    ))}
                  </ul>
                  {cat.note && (
                    <p className="mt-2 text-xs italic text-muted-foreground">
                      {cat.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Subsection>
      </div>
    </section>
  );
}

// ---------- Portfolio placeholder ----------

export function PortfolioPlaceholder() {
  return (
    <section id="portfolio" className="section-padding bg-background">
      <div className="container-tight">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Portfolio
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
            Mes réalisations
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Cette section sera enrichie progressivement au fil des projets.
          </p>
        </AnimatedSection>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 md:p-8">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Portfolio visuel
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Affiches, identités visuelles, logos, publications réseaux sociaux,
              documents d'information, sites internet, maquettes numériques et
              campagnes de communication.
            </p>
            <p className="mt-4 text-xs italic text-muted-foreground/80">
              Bientôt disponible.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 md:p-8">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Portfolio audio
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Émissions de radio, interviews, chroniques, jingles, bandes-annonces,
              montages audio et identités sonores.
            </p>
            <p className="mt-4 text-xs italic text-muted-foreground/80">
              Bientôt disponible.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}