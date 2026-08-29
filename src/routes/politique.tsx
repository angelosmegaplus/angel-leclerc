import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeEuro,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  ChevronDown,
  ExternalLink,
  Factory,
  FileText,
  Flag,
  Globe2,
  Handshake,
  Landmark,
  Map,
  PlayCircle,
  Radio,
  Scale,
  Shield,
  Sparkles,
  TrainFront,
  Users,
  Vote,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";

export const Route = createFileRoute("/politique")({
  head: () => ({
    meta: [
      { title: "Politique — idées et propositions" },
      {
        name: "description",
        content:
          "Une synthèse politique complète : justice sociale, souveraineté, régionalisme, démocratie, industrie, services publics, santé, éducation, sécurité, numérique et écologie.",
      },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "googlebot", content: "noindex, nofollow, noarchive" },
      { name: "bingbot", content: "noindex, nofollow, noarchive" },
      { property: "og:title", content: "Politique — idées et propositions" },
      {
        property: "og:description",
        content:
          "Une France sociale, souveraine, régionaliste, productive et démocratique : propositions, chiffres, documents et débats.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PolitiquePage,
});

type Idea = {
  title: string;
  text: string;
  points?: string[];
};

type Chapter = {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  lead: string;
  ideas: Idea[];
};

type SourceDocument = {
  title: string;
  institution: string;
  year: string;
  category: "Régions" | "Démocratie" | "Industrie" | "Services publics";
  href: string;
  note: string;
  format: "PDF" | "Dossier";
};

const principles = [
  {
    icon: Handshake,
    title: "Sociale",
    text: "Le travail doit permettre de vivre et la solidarité doit empêcher qu'une difficulté temporaire devienne une exclusion durable.",
  },
  {
    icon: Flag,
    title: "Souveraine",
    text: "La France doit conserver la capacité de décider de ses lois, de son industrie, de son énergie, de ses infrastructures et de sa diplomatie.",
  },
  {
    icon: Map,
    title: "Régionaliste",
    text: "Une nation commune peut laisser à ses régions de véritables pouvoirs politiques, des budgets, des institutions et des lois adaptées à leurs réalités.",
  },
  {
    icon: Vote,
    title: "Démocratique",
    text: "Le vote ne doit pas donner un blanc-seing pour cinq ans : référendums, transparence et contrôle citoyen doivent compléter la représentation.",
  },
  {
    icon: Factory,
    title: "Productive",
    text: "L'industrie, l'agriculture, les infrastructures, les PME et l'innovation doivent redevenir le cœur de la création de richesse.",
  },
  {
    icon: Scale,
    title: "Pragmatique",
    text: "Une proposition doit être jugée sur ses effets réels, pas sur l'étiquette du camp qui l'a formulée.",
  },
];

const stats = [
  {
    value: "87 %",
    label: "favorables à des référendums d'initiative citoyenne sur les enjeux locaux",
    source: "IFOP, 2025",
  },
  {
    value: "73 %",
    label: "favorables à ce que les régions puissent adapter les lois nationales aux réalités locales",
    source: "IFOP, 2025",
  },
  {
    value: "68 %",
    label: "estiment que les collectivités locales n'ont pas assez de pouvoir face à l'État",
    source: "IFOP, 2025",
  },
  {
    value: "71 %",
    label: "soutiennent un renforcement considérable du pouvoir et des moyens des régions",
    source: "IFOP, 2025",
  },
];

const chapters: Chapter[] = [
  {
    id: "democratie",
    icon: Vote,
    eyebrow: "Démocratie et institutions",
    title: "Rendre du pouvoir aux citoyens entre deux élections",
    lead:
      "Le pouvoir représentatif reste indispensable, mais il doit être contrôlé, transparent et régulièrement complété par l'intervention directe des citoyens.",
    ideas: [
      {
        title: "Référendum d'initiative citoyenne",
        text: "Un RIC national pourrait être déclenché lorsqu'une proposition réunit un soutien populaire suffisamment large. Des mécanismes équivalents existeraient aux niveaux régional et local.",
        points: [
          "RIC législatif, abrogatif et sur les grandes orientations",
          "Seuil national de déclenchement autour de 10 % du corps électoral",
          "Référendums régionaux avec seuils adaptés à la population",
          "Référendum obligatoire avant tout transfert majeur supplémentaire de souveraineté",
          "Possibilité de trancher directement certaines réformes sociales structurantes",
        ],
      },
      {
        title: "Des élus responsables, pas une profession à vie",
        text: "L'indemnisation doit garantir l'indépendance des élus sans transformer le mandat en carrière protégée.",
        points: [
          "Deux mandats successifs maximum pour députés et sénateurs",
          "Limitation du cumul des fonctions exécutives",
          "Publication des votes, activités, frais et conflits d'intérêts",
          "Fin des avantages injustifiés après un mandat",
          "Les dépenses privées restent privées, même au sommet de l'État",
        ],
      },
      {
        title: "Un Parlement qui délibère réellement",
        text: "L'article 49.3 serait limité aux textes budgétaires et son utilisation devrait être publiquement motivée.",
        points: [
          "Suivi public des projets de loi et amendements",
          "Budgets, subventions et marchés publics lisibles par tous",
          "Parrainage présidentiel possible par les élus ou par un nombre élevé de citoyens vérifiés",
        ],
      },
      {
        title: "Anticorruption et fin des réseaux de faveur",
        text: "Favoritisme, conflits d'intérêts, emplois de complaisance et financement opaque doivent être combattus avec les mêmes exigences quel que soit le parti concerné.",
        points: [
          "Autorité anticorruption indépendante et dotée de moyens d'enquête",
          "Open data sur dépenses, contrats, subventions et grands projets",
          "Contrôle renforcé des marchés publics et du financement politique",
          "Protection des lanceurs d'alerte",
          "Renforcement de la lutte contre la fraude et l'évasion fiscales",
        ],
      },
      {
        title: "Sortir de la politique de supporters",
        text: "Une idée ne devient ni bonne parce qu'elle vient du bon camp, ni mauvaise parce qu'elle vient du mauvais.",
        points: [
          "Contrats de coalition courts et publics",
          "Partis et mouvements libres de conserver leur identité",
          "Priorité aux objectifs communs plutôt qu'aux guerres d'ego",
          "Refus de réduire toute la vie politique à un duel permanent entre deux blocs",
        ],
      },
    ],
  },
  {
    id: "regionalisme",
    icon: Map,
    eyebrow: "Régions et unité nationale",
    title: "Une seule France, plusieurs pouvoirs politiques",
    lead:
      "L'unité nationale n'exige pas que toutes les décisions soient prises à Paris. Le but est de conserver une nation, une citoyenneté et une solidarité communes tout en donnant aux régions un véritable pouvoir de décision.",
    ideas: [
      {
        title: "Ce qui reste national",
        text: "Les fonctions qui exigent une unité permanente resteraient exercées au niveau français.",
        points: [
          "Défense, armées et renseignement stratégique",
          "Diplomatie, nationalité et frontières",
          "Grandes garanties constitutionnelles et libertés fondamentales",
          "Solidarité financière entre territoires",
          "Grands réseaux et infrastructures d'intérêt national",
        ],
      },
      {
        title: "Des régions qui votent leurs propres lois",
        text: "Les régions ne recevraient plus seulement des compétences administratives. La Constitution leur garantirait un véritable domaine de décision politique et législative.",
        points: [
          "Parlement régional élu et exécutif régional responsable",
          "Lois régionales dans les compétences attribuées",
          "Budget propre et part de fiscalité régionale",
          "Pouvoirs forts en transports, logement, formation, culture, tourisme, agriculture, économie et aménagement",
          "Possibilité de statuts différents lorsque l'histoire ou la situation d'un territoire le justifie",
        ],
      },
      {
        title: "Deux niveaux de lois, une règle claire",
        text: "La Constitution resterait supérieure. La loi nationale s'appliquerait dans les compétences nationales ; la loi régionale s'imposerait dans les compétences régionales.",
        points: [
          "Compétences nationales clairement listées",
          "Compétences régionales clairement listées",
          "Compétences partagées précisément définies",
          "Juridiction constitutionnelle chargée d'arbitrer les conflits",
          "Aucune reprise unilatérale d'une compétence régionale par le pouvoir central",
        ],
      },
      {
        title: "Un Sénat réellement territorial",
        text: "Le Sénat deviendrait la chambre protectrice de l'équilibre entre l'État national et les régions.",
        points: [
          "Représentation garantie de chaque région",
          "Équilibre entre poids démographique et représentation territoriale",
          "Accord du Sénat nécessaire pour modifier les compétences ou les finances régionales",
          "Rôle explicite de protection de la solidarité nationale",
        ],
      },
      {
        title: "Retrouver les territoires historiques sans figer la carte",
        text: "Le découpage de 2015 n'a pas à devenir intouchable. Les frontières régionales pourraient être réexaminées selon l'histoire, la culture, les bassins de vie, l'économie et surtout le vote des habitants.",
        points: [
          "Référendums locaux pour les modifications majeures de limites",
          "Reconnaissance des identités et cultures historiques",
          "Français comme langue nationale commune",
          "Usage institutionnel ou co-officialité d'une langue régionale lorsque le territoire le décide",
          "Histoire et géographie régionales davantage enseignées",
        ],
      },
      {
        title: "Autonomie oui, abandon des territoires pauvres non",
        text: "Plus de liberté régionale ne doit pas transformer la France en compétition permanente entre territoires riches et pauvres.",
        points: [
          "Fonds national de solidarité territoriale",
          "Socles nationaux en santé, école et protection sociale",
          "Liberté pour une région d'aller plus loin avec ses propres moyens",
        ],
      },
    ],
  },
  {
    id: "social",
    icon: Handshake,
    eyebrow: "Pouvoir d'achat et solidarité",
    title: "Protéger sans installer durablement dans la dépendance",
    lead:
      "La solidarité doit garantir les besoins fondamentaux, prévenir l'exclusion et rouvrir un chemin vers le logement, l'activité ou la formation lorsque cela est possible.",
    ideas: [
      {
        title: "Salaires, pensions et prix essentiels",
        text: "Les bas salaires doivent progresser et les revenus sociaux ne doivent pas perdre mécaniquement leur valeur face à l'inflation.",
        points: [
          "Augmentation des bas salaires",
          "Indexation des pensions et prestations sur l'inflation",
          "Négociation régulière des grilles salariales",
          "Lutte contre les temps partiels imposés et les écarts de rémunération excessifs",
          "Baisse ou suspension temporaire de TVA sur certains produits essentiels en période de forte inflation",
          "Contrôle temporaire des marges ou prix lorsqu'une situation exceptionnelle le justifie",
        ],
      },
      {
        title: "Eau, énergie et chauffage : un minimum garanti",
        text: "Une résidence principale ne doit pas devenir inhabitable à cause d'une difficulté financière ponctuelle.",
        points: [
          "Interdiction des coupures d'eau dans la résidence principale",
          "Protection renforcée contre les coupures d'électricité et de chauffage",
          "Tarification sociale des consommations essentielles",
        ],
      },
      {
        title: "Sortir durablement de la rue",
        text: "L'objectif n'est pas de déplacer le sans-abrisme mais de construire un parcours coordonné vers la stabilité.",
        points: [
          "Hébergement immédiat puis logement durable",
          "Santé, droits, papiers et accompagnement administratif",
          "Prévention des expulsions",
          "Lien direct avec emploi ou formation lorsque la situation le permet",
          "CIAS, France Services, associations et France Travail coordonnés autour du même dossier",
        ],
      },
      {
        title: "Retraites : rendre la décision au pays",
        text: "Le retour de l'âge légal à 60 ans devrait pouvoir être tranché par référendum après présentation transparente des différentes options de financement.",
        points: [
          "Prise en compte des carrières longues et de la pénibilité",
          "Prise en compte du handicap, du chômage et des interruptions familiales",
          "Publication de plusieurs scénarios financiers avant le vote",
        ],
      },
    ],
  },
  {
    id: "travail-jeunesse",
    icon: Briefcase,
    eyebrow: "Travail, école et jeunesse",
    title: "Donner une première chance au lieu d'exiger une expérience impossible",
    lead:
      "La formation ne peut pas fonctionner si les débutants doivent déjà être expérimentés pour entrer dans l'entreprise.",
    ideas: [
      {
        title: "Protéger les travailleurs et les associer aux décisions",
        text: "Les aides publiques aux entreprises doivent créer des obligations et les salariés doivent avoir davantage de poids dans les choix stratégiques.",
        points: [
          "Inspection du travail renforcée",
          "Lutte contre travail dissimulé, stages abusifs et abus des plateformes",
          "Aides publiques conditionnées au maintien de l'emploi",
          "Représentants des salariés avec voix dans les grandes entreprises",
          "Droit de regard sur les délocalisations et participation accrue aux bénéfices",
          "Reprise en coopérative facilitée",
        ],
      },
      {
        title: "Alternance et premier emploi : former vraiment",
        text: "Un alternant ou un junior n'est pas un salarié confirmé à prix réduit.",
        points: [
          "Tutorat réellement assuré",
          "Incitations à l'embauche de débutants et à la formation interne",
          "Responsabilité accrue des écoles dans la recherche d'entreprises partenaires",
          "Publication des taux réels d'alternance et d'insertion",
          "Reconnaissance des compétences acquises dans bénévolat, associations, projets personnels et emplois saisonniers",
        ],
      },
      {
        title: "Une école plus concentrée le matin, plus pratique l'après-midi",
        text: "Le socle national resterait exigeant, mais l'organisation du temps scolaire viserait davantage la concentration, la pratique et l'égalité entre familles.",
        points: [
          "Objectif de 20 élèves maximum en primaire et 25 au collège",
          "Priorité au français, aux mathématiques, à l'histoire et aux sciences",
          "Cours principalement de 8 h 30 à 15 h 30 du lundi au vendredi",
          "Sport, technologie, arts, projets et découverte professionnelle davantage l'après-midi",
          "Établissements ouverts plus tard pour devoirs, culture, sport et clubs facultatifs",
          "Une part plus importante des devoirs réalisée à l'école",
        ],
      },
      {
        title: "Réhabiliter les voies professionnelles",
        text: "La réussite ne doit pas être mesurée uniquement au nombre d'années passées dans le supérieur.",
        points: [
          "Lycée professionnel revalorisé",
          "Apprentissage mieux encadré",
          "Formations adaptées aux besoins des bassins d'emploi",
          "Passerelles plus simples entre filières",
          "Lutte contre l'inflation artificielle des diplômes exigés pour des postes débutants",
        ],
      },
      {
        title: "Une politique de jeunesse concrète",
        text: "Le passage à l'autonomie doit être moins brutal pour les étudiants et jeunes travailleurs.",
        points: [
          "Repas universitaire à un euro",
          "Davantage de logements étudiants et transports accessibles",
          "Soutien aux jeunes en rupture familiale et meilleur accès au soutien psychologique",
          "Temps civique court autour des premiers secours, de la défense civile, des institutions et des associations",
          "Soutien aux MJC, clubs, médias étudiants, projets culturels et mouvements d'éducation populaire",
        ],
      },
    ],
  },
  {
    id: "sante",
    icon: Users,
    eyebrow: "Santé et protection sociale",
    title: "Soigner avant de gérer la pénurie",
    lead:
      "Le système de santé doit retrouver des capacités humaines et industrielles. La simplification administrative doit libérer du temps pour les soins.",
    ideas: [
      {
        title: "Des soins essentiels mieux remboursés",
        text: "La prise en charge publique des soins prioritaires serait renforcée.",
        points: [
          "Remboursement pouvant atteindre 95 % pour certains soins prioritaires",
          "Dentaire, optique et audition mieux couverts",
          "Accès aux droits simplifié",
        ],
      },
      {
        title: "Des soignants là où vivent les habitants",
        text: "Chaque bassin de vie doit pouvoir s'appuyer sur des maisons ou centres de santé.",
        points: [
          "Primes d'installation et logements",
          "Développement de l'exercice salarié",
          "Maisons de santé et équipes coordonnées",
          "Possibilité d'un service temporaire, compensé et concerté dans certaines zones pour de jeunes médecins",
        ],
      },
      {
        title: "Hôpitaux et EHPAD : remettre du personnel",
        text: "La fermeture comptable ne peut pas devenir le mode normal de gestion d'un service de santé.",
        points: [
          "Plan de recrutement et revalorisations salariales",
          "Ratios minimums de soignants lorsque cela est pertinent",
          "Davantage de secrétaires médicaux pour décharger les soignants",
          "Conditions de vie et de travail renforcées en EHPAD",
        ],
      },
      {
        title: "Un pôle public du médicament",
        text: "La France doit pouvoir sécuriser certains médicaments essentiels et éviter qu'une rupture mondiale mette en danger l'accès aux traitements.",
        points: [
          "Production publique ou sous contrôle public de médicaments stratégiques",
          "Stocks de sécurité",
          "Soutien aux usines françaises",
          "Recherche publique et partenariats industriels",
        ],
      },
    ],
  },
  {
    id: "economie",
    icon: Factory,
    eyebrow: "Économie et réindustrialisation",
    title: "Une économie mixte, sociale et productive",
    lead:
      "PME, artisans, indépendants, agriculteurs, coopératives, associations, grandes entreprises et opérateurs publics ont tous une place lorsque l'économie sert le pays plutôt que l'inverse.",
    ideas: [
      {
        title: "Un État investisseur de long terme",
        text: "Un fonds souverain national financerait industrie, innovation, énergie, infrastructures, numérique, relocalisations et PME.",
        points: [
          "Capital patient plutôt que subventions sans contrepartie",
          "Soutien aux filières stratégiques et aux relocalisations",
          "Entrée au capital ou droit de préemption lorsque l'indépendance nationale est en jeu",
          "Possibilité de bloquer une vente stratégique ou d'organiser une reprise",
        ],
      },
      {
        title: "Protection économique assumée dans les marchés publics",
        text: "L'argent public doit pouvoir favoriser les productions françaises, les PME et les entreprises respectant des critères sociaux et environnementaux élevés.",
        points: [
          "Part réservée aux PME",
          "Préférence de production française lorsque juridiquement possible",
          "Exclusion des entreprises condamnées pour fraude grave ou délocalisation abusive liée à des aides publiques",
          "Clauses de maintien territorial lorsqu'une aide finance une implantation",
        ],
      },
      {
        title: "Banques au service de l'économie réelle",
        text: "L'épargne doit davantage financer l'investissement productif et les territoires.",
        points: [
          "Séparation renforcée des activités de dépôt et spéculatives",
          "Pôle bancaire public",
          "Financement des collectivités, PME et coopératives",
          "Réduction de la dépendance du financement politique aux banques privées",
        ],
      },
      {
        title: "Nationaliser quand le secteur est réellement stratégique",
        text: "Le contrôle public devient pertinent lorsqu'un monopole naturel, une infrastructure critique ou une dépendance nationale l'exige.",
        points: [
          "Énergie, autoroutes, ferroviaire, télécommunications et eau",
          "Certaines infrastructures numériques, ports, aéroports et industries stratégiques",
          "Nationalisation temporaire ou durable selon le besoin",
          "Objectifs précis, comptes publics, représentants des salariés et usagers, évaluation régulière",
        ],
      },
      {
        title: "Créer une petite entreprise sans apprendre l'administration par cœur",
        text: "Pour les activités non réglementées, créer ou gérer une petite entreprise devrait devenir beaucoup plus simple administrativement.",
        points: [
          "Formulaire et dossier administratif uniques",
          "Statuts standards facultatifs",
          "Calendrier fiscal personnalisé",
          "Accompagnement gratuit la première année et droit à l'erreur renforcé",
          "Un portail pour immatriculation, Urssaf, fiscalité, aides, recrutement, formation et financement",
          "Un conseiller référent identifiable pour chaque PME qui en a besoin",
        ],
      },
    ],
  },
  {
    id: "services-publics",
    icon: Building2,
    eyebrow: "État et services publics",
    title: "Une seule porte d'entrée, une administration coordonnée derrière",
    lead:
      "La complexité peut rester dans la machine ; elle ne doit plus être imposée à l'usager. Le numérique doit simplifier les démarches sans supprimer l'accueil humain.",
    ideas: [
      {
        title: "Services publics de France",
        text: "Une marque et une interface communes pourraient réunir les démarches quotidiennes sans supprimer les spécialistes qui travaillent derrière.",
        points: [
          "Un compte citoyen et un tableau de bord communs",
          "Une information déclarée une fois puis transmise aux seuls services autorisés",
          "Suivi des démarches, documents et rendez-vous au même endroit",
          "FranceConnect étendu en véritable portail citoyen",
        ],
      },
      {
        title: "Interface unique, données distribuées",
        text: "Simplifier ne signifie pas créer un super-fichier national.",
        points: [
          "Chiffrement et droits d'accès minimaux",
          "Traçabilité des consultations de données sensibles",
          "Architecture distribuée pour éviter une panne nationale unique",
          "Contrôle indépendant et normes de cybersécurité élevées",
        ],
      },
      {
        title: "Un droit au guichet humain",
        text: "Le numérique doit supprimer la paperasse inutile, pas les personnes.",
        points: [
          "Accueil physique, téléphone et services itinérants maintenus",
          "Social, emploi, logement, handicap, retraite et santé mieux coordonnés",
          "Accompagnement spécifique pour les personnes éloignées du numérique",
        ],
      },
      {
        title: "France Travail et Entrepreneuriat",
        text: "Perdre un emploi, se former, devenir indépendant, reprendre une entreprise ou embaucher ne devraient plus être traités comme des mondes administratifs séparés.",
        points: [
          "Un même parcours emploi, formation, reconversion et création d'activité",
          "Priorités de formation largement pilotées par les régions",
          "Lien direct avec les besoins réels des filières locales",
        ],
      },
      {
        title: "Des grands opérateurs publics modernes",
        text: "Les réseaux stratégiques peuvent être nationaux tout en laissant leurs directions régionales décider beaucoup plus vite des priorités locales.",
        points: [
          "France Télécom comme opérateur public de réseau, Orange pouvant rester la marque grand public",
          "La Poste renforcée sur identité, coffre-fort documentaire, communications sécurisées et inclusion numérique",
          "SNCF pensée comme colonne vertébrale de toute la mobilité publique",
          "Société nationale des voies routières pour la reprise progressive des autoroutes",
          "Énergie de France autour d'un grand pôle public de production, réseaux et planification",
          "France.Media comme plateforme publique radio, télévision, web, podcast et réseaux sociaux",
        ],
      },
      {
        title: "Mutualiser les doublons, pas supprimer l'expertise",
        text: "Les économies recherchées doivent venir des logiciels redondants, contrats techniques parallèles, immobilier dispersé, fonctions support répétées et dossiers retraités plusieurs fois.",
      },
    ],
  },
  {
    id: "agriculture",
    icon: Flag,
    eyebrow: "Agriculture et alimentation",
    title: "Produire en France sans épuiser ceux qui nourrissent le pays",
    lead:
      "La souveraineté alimentaire exige une agriculture capable de vivre de sa production, de renouveler ses générations et de transformer ses pratiques sans être mise en concurrence avec des normes beaucoup plus faibles.",
    ideas: [
      {
        title: "Un revenu agricole défendable",
        text: "Les prix payés aux producteurs doivent mieux refléter les coûts réels de production.",
        points: [
          "Prix minimums garantis ou mécanismes équivalents",
          "Contrôle des marges abusives",
          "Aides versées plus rapidement et guichet unique",
          "Réduction ciblée de charges pesant directement sur la production",
        ],
      },
      {
        title: "Même marché, normes comparables",
        text: "Un produit importé qui ne respecte pas des normes sanitaires, sociales ou environnementales comparables ne doit pas bénéficier exactement du même accès au marché qu'un produit français soumis à ces obligations.",
      },
      {
        title: "Terres, installation et transition",
        text: "Le renouvellement agricole passe par l'accès au foncier et une transition écologique financée plutôt qu'imposée sans solution économique.",
        points: [
          "Soutien aux jeunes agriculteurs et à la transmission des exploitations",
          "Lutte contre l'accaparement des terres",
          "Protection des surfaces agricoles",
          "Agroécologie progressive, financée et adaptée aux territoires",
        ],
      },
    ],
  },
  {
    id: "energie",
    icon: Zap,
    eyebrow: "Énergie et écologie",
    title: "Décarboner en produisant, pas en organisant la pénurie",
    lead:
      "La transition écologique doit rester compatible avec l'industrie, le pouvoir d'achat, la souveraineté et la sécurité d'approvisionnement.",
    ideas: [
      {
        title: "Le nucléaire comme colonne vertébrale",
        text: "Une électricité abondante, pilotable et faiblement carbonée suppose de conserver et reconstruire une filière nucléaire française complète.",
        points: [
          "Prolongation des centrales validées par l'autorité de sûreté",
          "Construction de nouveaux réacteurs et investissement dans les EPR",
          "Recherche sur les petits réacteurs modulaires et la quatrième génération",
          "Filière industrielle, formation, déchets et sûreté financés sur le long terme",
          "Autorité de sûreté indépendante du pouvoir politique comme des producteurs",
        ],
      },
      {
        title: "Un grand service public de l'énergie",
        text: "Production, réseaux, hydraulique, recherche, planification et sécurité d'approvisionnement doivent être coordonnés par une stratégie publique de long terme.",
      },
      {
        title: "Des renouvelables là où ils sont réellement utiles",
        text: "Le solaire doit être privilégié sur bâtiments, parkings, friches et zones déjà artificialisées. Chaque projet doit tenir compte du paysage, des terres agricoles, de la biodiversité et de l'acceptation locale.",
      },
      {
        title: "Rénover et s'adapter au climat déjà présent",
        text: "Une agence publique de rénovation pourrait avancer certains financements, contrôler les travaux et cibler les ménages modestes. Les régions élaboreraient leurs propres plans d'adaptation aux risques climatiques.",
      },
    ],
  },
  {
    id: "mobilites",
    icon: TrainFront,
    eyebrow: "Transports, logement et aménagement",
    title: "Organiser la vie quotidienne à l'échelle des bassins de vie",
    lead:
      "Les politiques de mobilité, logement et foncier doivent pouvoir être très différentes entre centre urbain, zone rurale, littoral touristique et bassin industriel.",
    ideas: [
      {
        title: "Le rail comme réseau public structurant",
        text: "Les grandes lignes et la sécurité resteraient nationales tandis que les régions piloteraient largement les mobilités quotidiennes.",
        points: [
          "Réouverture des lignes réellement utiles",
          "Fret ferroviaire développé",
          "Correspondances mieux organisées et tarification sociale",
          "TER, cars, bus, fréquences et tarification locale sous forte responsabilité régionale",
          "Recherche et, si possible, billet unique pour le trajet complet",
        ],
      },
      {
        title: "Autoroutes : reprendre progressivement la rente",
        text: "Les concessions pourraient revenir sous contrôle public par non-renouvellement, rachat négocié ou reprise anticipée lorsque l'intérêt économique est démontré.",
      },
      {
        title: "Mobilité rurale sur mesure",
        text: "Les régions doivent pouvoir mixer cars publics, transport à la demande, correspondances avec les gares, covoiturage et tarifs jeunes selon la densité réelle du territoire.",
      },
      {
        title: "Logement et foncier : beaucoup plus de leviers régionaux",
        text: "Construction, rénovation, maîtrise du foncier et règles adaptées aux résidences secondaires ou aux zones touristiques peuvent varier fortement selon les territoires.",
      },
    ],
  },
  {
    id: "justice",
    icon: Shield,
    eyebrow: "Justice et sécurité",
    title: "Une autorité ferme, contrôlée et capable de fonctionner",
    lead:
      "La fermeté n'a de sens que si la justice juge dans des délais raisonnables, si les victimes sont accompagnées et si les forces de sécurité disposent de moyens tout en restant contrôlées par le droit.",
    ideas: [
      {
        title: "Des tribunaux qui ont les moyens de juger",
        text: "La première réforme pénale consiste à faire fonctionner la justice existante.",
        points: [
          "Recrutement de magistrats et greffiers",
          "Réduction des délais",
          "Meilleur accueil et suivi des victimes",
          "Simplification des procédures sans supprimer les droits de la défense",
        ],
      },
      {
        title: "Fermeté sur les crimes graves, sanctions utiles sur le reste",
        text: "Les crimes violents appellent une réponse lourde et rapide. Pour certaines infractions non violentes, réparation et travail d'intérêt général peuvent être plus utiles qu'une courte incarcération désocialisante.",
      },
      {
        title: "Police nationale forte, police territoriale proche",
        text: "La police nationale et la gendarmerie conserveraient les missions stratégiques. Les missions quotidiennes pourraient être mutualisées dans de véritables polices territoriales couvrant plusieurs communes.",
        points: [
          "Fusion possible des polices municipales à l'échelle d'un bassin de vie",
          "Directeur territorial de la sécurité pouvant être élu directement par les habitants",
          "Même formation et garanties nationales pour les agents",
          "Caméras-piétons, meilleurs équipements et conditions de travail",
          "Inspection indépendante des fautes et contrôle du juge",
        ],
      },
      {
        title: "Renseignement et criminalité organisée",
        text: "Les moyens de renseignement doivent être renforcés contre terrorisme, ingérences, grand banditisme et réseaux transnationaux, avec contrôle juridictionnel et parlementaire des moyens intrusifs.",
      },
      {
        title: "Peines exceptionnelles : assumer le débat juridique",
        text: "Le rétablissement de la peine de mort pour un nombre extrêmement restreint de crimes peut être proposé politiquement, mais il est impossible dans le cadre constitutionnel et conventionnel français actuel. Une telle rupture supposerait donc une décision nationale explicite, une révision juridique profonde et un vote démocratique direct.",
        points: [
          "Aucune région ne pourrait aujourd'hui contourner l'interdiction nationale",
          "Toute compétence pénale régionale future devrait être précisément autorisée et encadrée par la Constitution",
          "Les traitements médicaux proposés contre certains risques de récidive sexuelle ne pourraient relever que d'un cadre médical et judiciaire strict",
        ],
      },
    ],
  },
  {
    id: "immigration",
    icon: Users,
    eyebrow: "Immigration et intégration",
    title: "Rendre l'entrée légale plus simple et l'intégration beaucoup plus exigeante",
    lead:
      "Une politique migratoire peut être humaine, ferme et organisée : réduire les réseaux clandestins, ouvrir des procédures légales plus lisibles puis demander un parcours intensif vers la langue, l'activité et l'autonomie.",
    ideas: [
      {
        title: "Commencer la procédure avant le départ lorsque c'est possible",
        text: "Ambassades et consulats pourraient devenir de véritables portes d'entrée pour l'asile, le travail, la formation et d'autres motifs légaux de séjour.",
        points: [
          "Dossiers plus simples et délais plus courts",
          "Vérification des condamnations graves et liens établis avec des réseaux criminels ou violents",
          "Aucune enquête arbitraire sur religion, origine ou opinions ordinaires",
          "Première initiation au français, aux institutions, au logement et au marché du travail",
          "Évaluation pratique des compétences lorsque les diplômes sont incomplets",
        ],
      },
      {
        title: "Un passe de travail lié au parcours d'intégration",
        text: "Une personne admise provisoirement entrerait rapidement dans un dispositif légal : droit de travailler, accompagnement et obligations d'intégration vont ensemble.",
      },
      {
        title: "Une intégration intensive, normalement en moins de six mois",
        text: "Le parcours doit transmettre les règles communes et préparer concrètement à la vie autonome sans imposer une opinion politique, une religion ou l'effacement des origines.",
        points: [
          "Français intensif",
          "Institutions, droits, devoirs et lois françaises",
          "Égalité entre femmes et hommes, liberté de conscience et laïcité des institutions publiques",
          "Scolarisation des enfants",
          "Formation professionnelle et préparation à l'emploi",
          "Histoire et vie civique françaises, découverte de la commune et de la région d'accueil",
        ],
      },
      {
        title: "Orienter vers les territoires qui peuvent réellement accueillir et employer",
        text: "L'orientation initiale prendrait en compte compétences, emplois disponibles, métiers en tension, logement, situation familiale ou médicale et capacités locales des services publics.",
      },
      {
        title: "Une voie militaire strictement volontaire",
        text: "La Légion étrangère peut constituer, pour les personnes qui le souhaitent et remplissent ses conditions, une autre voie d'intégration. La sélection militaire reste autonome.",
      },
      {
        title: "Régularisation durable après un parcours réussi",
        text: "La stabilité administrative doit devenir simple lorsque la personne travaille ou se forme sérieusement, respecte les lois, scolarise ses enfants et participe normalement à la société.",
      },
    ],
  },
  {
    id: "medias-numerique",
    icon: Radio,
    eyebrow: "Médias, libertés et numérique",
    title: "Liberté de parole, pluralisme et souveraineté technologique",
    lead:
      "Télévision, radio, presse, plateformes et créateurs partagent désormais le même espace public. Les règles doivent protéger la liberté sans laisser quelques groupes décider seuls de ce qui devient visible.",
    ideas: [
      {
        title: "Une liberté d'expression forte",
        text: "La liberté d'expression doit rester la règle, avec les limites nécessaires contre menaces, harcèlement, diffamation, appels directs à la violence et discriminations illégales.",
      },
      {
        title: "Empêcher la concentration excessive des médias",
        text: "Le pluralisme exige de connaître les propriétaires, les financements et les relations économiques susceptibles de créer des conflits d'intérêts.",
        points: [
          "Limites renforcées à la concentration",
          "Transparence des propriétaires et financements importants",
          "Indépendance renforcée de l'audiovisuel public",
          "Soutien aux médias locaux, associatifs et indépendants",
          "Distinction claire entre information, opinion et contenu commercial",
        ],
      },
      {
        title: "Télévision et web : faire converger les responsabilités",
        text: "Les médias historiques ne doivent pas rester enfermés dans des règles conçues pour un autre âge pendant que les grandes plateformes fonctionnent avec des responsabilités très différentes.",
      },
      {
        title: "France.Media : national par les moyens, régional dans les rédactions",
        text: "Le service public audiovisuel pourrait mutualiser radio, télévision, web, podcasts et réseaux sociaux tout en donnant aux rédactions régionales une véritable autonomie éditoriale.",
      },
      {
        title: "Souveraineté numérique",
        text: "La France doit être capable de produire des briques numériques essentielles plutôt que dépendre entièrement d'entreprises étrangères.",
        points: [
          "Fonds souverain pour calcul, IA, laboratoires, universités, jeunes entreprises et modèles ouverts",
          "Soutien à un moteur de recherche français et à un index indépendant",
          "Alternatives souveraines pour courriel, agenda, stockage, bureautique, visioconférence, cartographie, traduction et IA",
          "Commande publique utilisée comme levier d'industrialisation numérique",
          "Cloud et hébergement critiques sous exigences fortes de souveraineté et de sécurité",
        ],
      },
      {
        title: "Protéger les mineurs sans créer une société de surveillance",
        text: "Les protections d'âge et de sécurité en ligne doivent être proportionnées et ne doivent pas devenir un prétexte à généraliser l'identification permanente ou le traçage des conversations privées.",
      },
    ],
  },
  {
    id: "international",
    icon: Globe2,
    eyebrow: "Europe et politique internationale",
    title: "Coopérer avec les nations sans dissoudre la décision française",
    lead:
      "Le régionalisme intérieur concerne l'organisation de la France. Les relations européennes sont une question distincte : la coopération peut être utile sans rendre automatique chaque nouveau transfert de pouvoir.",
    ideas: [
      {
        title: "Aucun nouveau transfert majeur sans référendum",
        text: "Toute délégation supplémentaire importante de souveraineté à l'Union européenne devrait être soumise directement aux citoyens français.",
      },
      {
        title: "Une Europe des nations et des projets",
        text: "Les coopérations européennes restent utiles lorsqu'elles augmentent les capacités réelles des pays sans supprimer leur responsabilité démocratique.",
        points: [
          "Industrie et recherche",
          "Énergie et environnement",
          "Transports et infrastructures",
          "Certains programmes de défense",
          "Coopérations universitaires, scientifiques et culturelles",
        ],
      },
      {
        title: "Quand une règle européenne bloque un choix démocratique essentiel",
        text: "La première réponse doit être la négociation, la recherche d'alliés et la demande de dérogation. Si le conflit devient durable et fondamental, les citoyens doivent pouvoir trancher.",
      },
      {
        title: "Une diplomatie indépendante",
        text: "La France doit rechercher la paix, le respect du droit international et ses propres intérêts sans alignement automatique sur une puissance étrangère ou un bloc.",
      },
    ],
  },
  {
    id: "fiscalite",
    icon: BadgeEuro,
    eyebrow: "Fiscalité et dette",
    title: "Faire contribuer davantage la rente, protéger le travail et savoir où part l'argent",
    lead:
      "La fiscalité doit être lisible, financer les services communs et encourager l'économie productive. La dette peut financer un investissement utile mais ne doit pas dispenser d'évaluer la dépense.",
    ideas: [
      {
        title: "Une fiscalité plus simple et plus productive",
        text: "Le système doit réduire les niches inefficaces et mieux distinguer investissement productif, travail, rentes et stratégies d'optimisation agressive.",
        points: [
          "Lutte renforcée contre l'évasion fiscale",
          "Contribution accrue des grandes fortunes et multinationales",
          "Fiscalité favorable à la production et aux PME qui investissent en France",
          "Simplification des obligations pour ménages et petites entreprises",
        ],
      },
      {
        title: "Auditer la dette avant les slogans",
        text: "Un audit public distinguerait investissements utiles, coûts des crises, intérêts, dépenses inefficaces, conséquences de privatisations et engagements hors bilan.",
        points: [
          "Pas d'annulation arbitraire de la dette",
          "Dette temporaire possible lorsqu'elle finance une capacité productive ou une infrastructure durable",
          "Réduction de la progression de la dette structurelle une fois les investissements engagés",
        ],
      },
      {
        title: "Des fonds citoyens fléchés, mais jamais un État à la carte",
        text: "Des particuliers ou entreprises pourraient contribuer volontairement à un projet public précisément défini avec traçabilité complète des dépenses.",
      },
    ],
  },
];

const sourceDocuments: SourceDocument[] = [
  {
    title: "Radioscopie du régionalisme en 2025",
    institution: "IFOP",
    year: "2025",
    category: "Régions",
    href: "https://www.ifop.com/wp-content/uploads/2025/08/121688_radioscopie_du_regionalisme_en_2025_ifop_rps_2025.08.18_compressed.pdf",
    note: "Enquête nationale et territoriale : pouvoir régional, adaptation locale des lois, référendums locaux, langues et identités régionales.",
    format: "PDF",
  },
  {
    title: "Libre administration des collectivités : une urgence démocratique et écologique",
    institution: "Sénat",
    year: "2025",
    category: "Régions",
    href: "https://www.senat.fr/rap/r24-834/r24-8341.pdf",
    note: "Commission d'enquête sur l'autonomie financière, les services publics de proximité et les capacités d'action des collectivités.",
    format: "PDF",
  },
  {
    title: "La subsidiarité en action : condition de la décentralisation ?",
    institution: "Sénat",
    year: "2026",
    category: "Régions",
    href: "https://www.senat.fr/rap/r25-711/r25-7111.pdf",
    note: "Rapport consacré au principe selon lequel la décision publique doit être prise au niveau le plus proche capable d'agir efficacement.",
    format: "PDF",
  },
  {
    title: "50 propositions pour le plein exercice des libertés locales",
    institution: "Sénat",
    year: "2020",
    category: "Régions",
    href: "https://www.senat.fr/fileadmin/Fichiers/Images/redaction_multimedia/2020/2020-Documents_pdf/20200702_Rapport_GT_Decentralisation.pdf",
    note: "Propositions sur autonomie locale, différenciation, responsabilités territoriales et rôle du Sénat.",
    format: "PDF",
  },
  {
    title: "Une Corse autonome au sein de la République",
    institution: "Sénat",
    year: "2026",
    category: "Régions",
    href: "https://www.senat.fr/dossier-legislatif/pjl24-869.html",
    note: "Dossier législatif actuel montrant qu'un pouvoir normatif régional renforcé est désormais un débat constitutionnel concret en France.",
    format: "Dossier",
  },
  {
    title: "Les politiques industrielles en France",
    institution: "France Stratégie",
    year: "2020",
    category: "Industrie",
    href: "https://www.strategie.gouv.fr/files/files/Publications/2020/politiques%20industrielles/fs-2020-rapport-politique_industrielle-novembre.pdf",
    note: "Rapport sur la désindustrialisation française, ses conséquences territoriales et les instruments de politique industrielle.",
    format: "PDF",
  },
  {
    title: "Dématérialisation et inégalités d'accès aux services publics",
    institution: "Défenseur des droits",
    year: "2019",
    category: "Services publics",
    href: "https://www.vie-publique.fr/files/rapport/pdf/194000048.pdf",
    note: "Rapport sur les gains possibles du numérique mais aussi les exclusions créées lorsqu'un service public devient uniquement numérique.",
    format: "PDF",
  },
];

const videos = [
  {
    id: "eUmCqyjSClw",
    title: "Référendum : outil démocratique ou populiste ?",
    source: "Public Sénat — 2025",
    note: "Débat contradictoire sur l'usage du référendum, ses avantages démocratiques et ses risques institutionnels.",
  },
  {
    id: "s5tXNjOhe1A",
    title: "Autonomie de la Corse : la possibilité d'une île ?",
    source: "LCP — Assemblée nationale — 2026",
    note: "Débat sur un statut régional doté de pouvoirs normatifs plus larges, avec arguments favorables et critiques constitutionnelles.",
  },
  {
    id: "NM03cUVKrMw",
    title: "Le Référendum d'initiative citoyenne en débat",
    source: "Public Sénat — 2018",
    note: "Un débat directement consacré au RIC et aux différentes formes de démocratie directe.",
  },
];

function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="fixed left-0 right-0 top-16 z-40 h-0.5 bg-transparent" aria-hidden>
      <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${progress}%` }} />
    </div>
  );
}

function SectionHeader({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        <Sparkles size={12} /> {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-[1.7rem] font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground md:text-base">{intro}</p>
    </div>
  );
}

function IdeaDisclosure({ idea }: { idea: Idea }) {
  return (
    <details className="group rounded-2xl border border-border bg-card shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all open:border-primary/35 open:shadow-md">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
        <div>
          <h3 className="font-display text-lg font-semibold leading-snug text-foreground">{idea.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground group-open:line-clamp-none">{idea.text}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-primary transition-transform group-open:rotate-180">
          <ChevronDown size={17} />
        </span>
      </summary>
      {idea.points?.length ? (
        <div className="border-t border-border px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <ul className="space-y-2.5 text-sm leading-relaxed text-foreground/85">
            {idea.points.map((point) => (
              <li key={point} className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </details>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-[480px] w-[480px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[420px] w-[420px] rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="container-tight relative py-12 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-[1.35fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Flag size={12} /> Politique
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.04] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Une France sociale, souveraine, <span className="italic text-primary">régionaliste</span> et démocratique.
            </h1>
            <p className="mt-6 max-w-2xl text-[0.98rem] leading-relaxed text-muted-foreground md:text-lg">
              Une ligne politique complète : protéger les personnes, reconstruire la production, simplifier l'État, rendre du pouvoir aux citoyens et laisser les régions décider réellement de ce qui relève de leurs réalités locales — sans renoncer à l'unité, à la solidarité ni à la fierté nationale.
            </p>
            <div className="mt-7 grid gap-2.5 sm:flex sm:flex-wrap">
              <a href="#propositions" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                <BookOpen size={16} /> Explorer les propositions
              </a>
              <a href="#chiffres" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary">
                <BarChart3 size={16} /> Voir les chiffres
              </a>
              <a href="#sources" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary">
                <FileText size={16} /> Ouvrir les sources
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Le fil conducteur</p>
            <div className="mt-5 space-y-3">
              {principles.map((principle) => {
                const Icon = principle.icon;
                return (
                  <div key={principle.title} className="flex gap-3 rounded-2xl border border-border bg-background p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={19} /></div>
                    <div>
                      <p className="font-semibold text-foreground">{principle.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{principle.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <AnimatedSection>
      <section id="chiffres" className="section-padding scroll-mt-24 bg-muted/40">
        <div className="container-tight">
          <SectionHeader
            eyebrow="Opinion publique"
            title="Le régionalisme n'est plus une idée marginale"
            intro="Ces chiffres viennent de la radioscopie IFOP du régionalisme publiée en 2025. Ils ne valident pas automatiquement chaque proposition de cette page, mais ils montrent qu'une demande de proximité, d'adaptation locale et de pouvoir régional existe largement dans l'opinion."
          />
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <article key={stat.value + stat.label} className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-transform hover:-translate-y-1">
                <p className="font-display text-4xl font-bold tracking-tight text-primary">{stat.value}</p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/85">{stat.label}</p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{stat.source}</p>
              </article>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-primary/25 bg-primary/5 p-4 text-center text-sm leading-relaxed text-muted-foreground">
            Source principale : enquête IFOP réalisée en juillet 2025 auprès de 2 000 personnes au niveau national et de sept échantillons territoriaux spécifiques.
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

function QuickNavigation() {
  return (
    <section id="propositions" className="scroll-mt-24 border-y border-border bg-background py-6">
      <div className="container-tight">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chapters.map((chapter) => {
            const Icon = chapter.icon;
            return (
              <a key={chapter.id} href={`#${chapter.id}`} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                <Icon size={14} className="text-primary" /> {chapter.eyebrow}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PolicyChapter({ chapter, index }: { chapter: Chapter; index: number }) {
  const Icon = chapter.icon;
  return (
    <AnimatedSection>
      <section id={chapter.id} className={`section-padding scroll-mt-24 ${index % 2 === 0 ? "bg-background" : "bg-muted/40"}`}>
        <div className="container-tight">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm"><Icon size={22} /></div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-primary">{chapter.eyebrow}</p>
            <h2 className="mt-3 font-display text-[1.7rem] font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">{chapter.title}</h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground md:text-base">{chapter.lead}</p>
          </div>
          <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:mt-10 md:grid-cols-2">
            {chapter.ideas.map((idea) => <IdeaDisclosure key={idea.title} idea={idea} />)}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

function EvidenceLibrary() {
  const categories = ["Tous", "Régions", "Démocratie", "Industrie", "Services publics"] as const;
  const [selected, setSelected] = useState<(typeof categories)[number]>("Tous");

  const visible = useMemo(
    () => selected === "Tous" ? sourceDocuments : sourceDocuments.filter((document) => document.category === selected),
    [selected],
  );

  return (
    <AnimatedSection>
      <section id="sources" className="section-padding scroll-mt-24 bg-muted/40">
        <div className="container-tight">
          <SectionHeader
            eyebrow="Documents et données"
            title="Vérifier, approfondir, contester"
            intro="Une proposition politique n'est pas une preuve en elle-même. Cette bibliothèque rassemble donc des enquêtes, rapports institutionnels et dossiers législatifs qui permettent de vérifier les constats, d'étudier les arguments et de replacer les propositions dans un débat réel."
          />

          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button key={category} type="button" onClick={() => setSelected(category)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${selected === category ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground"}`}>
                {category}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((document) => (
              <a key={document.href} href={document.href} target="_blank" rel="noopener noreferrer" className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
                    <FileText size={13} /> {document.format}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">{document.year}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-foreground">{document.title}</h3>
                <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-primary">{document.institution}</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{document.note}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                  Ouvrir la source <ExternalLink size={15} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

function VideosSection() {
  return (
    <AnimatedSection>
      <section id="videos" className="section-padding scroll-mt-24 bg-background">
        <div className="container-tight">
          <SectionHeader
            eyebrow="Débats vidéo"
            title="Voir les arguments, pas seulement les lire"
            intro="Les vidéos sélectionnées viennent de médias parlementaires. Elles présentent aussi des objections et des désaccords : le but est de comprendre le débat complet, pas de masquer les arguments contraires."
          />
          <div className="mt-9 grid gap-6 lg:grid-cols-3">
            {videos.map((video) => (
              <article key={video.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <YouTubeEmbed id={video.id} title={video.title} />
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary"><PlayCircle size={14} /> {video.source}</div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{video.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{video.note}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

function ClosingSection() {
  return (
    <AnimatedSection>
      <section className="section-padding bg-foreground text-background">
        <div className="container-tight">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">En synthèse</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-5xl">Une France forte parce qu'elle protège, produit, décide et fait confiance à ses territoires.</h2>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-background/75 md:text-lg">
              Le projet cherche à réunir une protection sociale élevée, une souveraineté nationale réelle, de grandes libertés régionales et une économie productive laissant une place à l'initiative privée. L'État national reste puissant là où l'unité est indispensable ; les régions deviennent puissantes là où la proximité est plus efficace ; les citoyens disposent de moyens réels pour reprendre la décision lorsque les institutions s'éloignent d'eux.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/5 px-4 py-2 text-sm font-semibold text-background/85">
              Une nation commune. Des régions libres. Un État simple. Une démocratie vivante.
            </div>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

function PolitiquePage() {
  return (
    <div className="pb-0" data-politique-page>
      <ReadingProgress />
      <HeroSection />
      <StatsSection />
      <QuickNavigation />
      {chapters.map((chapter, index) => <PolicyChapter key={chapter.id} chapter={chapter} index={index} />)}
      <EvidenceLibrary />
      <VideosSection />
      <ClosingSection />
    </div>
  );
}
