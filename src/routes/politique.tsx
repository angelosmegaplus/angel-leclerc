import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeEuro,
  Briefcase,
  Building2,
  ChevronRight,
  Factory,
  Flag,
  Globe2,
  GraduationCap,
  Handshake,
  Home,
  Landmark,
  Languages,
  Map,
  Radio,
  Scale,
  Shield,
  TrainFront,
  Users,
  Vote,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/politique")({
  head: () => ({
    meta: [
      { title: "Politique — idées et propositions" },
      {
        name: "description",
        content:
          "Une synthèse politique complète : justice sociale, souveraineté, fédéralisme, démocratie, industrie, services publics, santé, éducation, sécurité, numérique, écologie et Europe.",
      },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "googlebot", content: "noindex, nofollow, noarchive" },
      { name: "bingbot", content: "noindex, nofollow, noarchive" },
      { property: "og:title", content: "Politique — idées et propositions" },
      {
        property: "og:description",
        content:
          "Une France sociale, souveraine, fédérale, productive et démocratique : une synthèse de propositions dans tous les grands domaines de l'action publique.",
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

const principles = [
  {
    icon: Handshake,
    title: "Sociale",
    text: "Le travail doit permettre de vivre, les services essentiels doivent rester accessibles et aucune personne ne doit être durablement abandonnée à la pauvreté ou à la rue.",
  },
  {
    icon: Flag,
    title: "Souveraine",
    text: "La France doit pouvoir décider de ses lois, de son économie, de son énergie, de ses infrastructures, de ses données et de sa politique internationale.",
  },
  {
    icon: Map,
    title: "Fédérale",
    text: "L'unité nationale n'impose pas l'uniformité : des régions fédérées peuvent disposer de lois, de budgets et d'institutions propres dans leurs compétences.",
  },
  {
    icon: Vote,
    title: "Démocratique",
    text: "Le vote ne doit pas donner un blanc-seing pour cinq ans. Référendums, transparence et contrôle citoyen doivent compléter la représentation parlementaire.",
  },
  {
    icon: Factory,
    title: "Productive",
    text: "La richesse doit reposer davantage sur le travail, l'industrie, l'agriculture, l'innovation et les infrastructures que sur la spéculation et les dépendances extérieures.",
  },
  {
    icon: Scale,
    title: "Pragmatique",
    text: "Une proposition doit être jugée sur ses effets, pas sur l'étiquette du parti qui l'a formulée. Le progrès utile compte davantage que les postures de camp.",
  },
];

const chapters: Chapter[] = [
  {
    id: "democratie",
    icon: Vote,
    eyebrow: "Démocratie et institutions",
    title: "Rendre du pouvoir aux citoyens entre deux élections",
    lead:
      "La politique doit redevenir une mission temporaire au service du pays. Le pouvoir représentatif reste indispensable, mais il doit être contrôlé, transparent et régulièrement complété par l'intervention directe des citoyens.",
    ideas: [
      {
        title: "Référendum d'initiative citoyenne",
        text: "Un RIC national pourrait être déclenché lorsqu'une proposition réunit le soutien de 10 % du corps électoral. Des mécanismes équivalents seraient créés aux niveaux régional et local avec des seuils adaptés.",
        points: [
          "RIC législatif, abrogatif et sur les grandes orientations",
          "Majorité des suffrages exprimés comme principe de décision",
          "Référendum obligatoire avant tout transfert majeur supplémentaire de souveraineté",
          "Possibilité de soumettre des choix sociaux structurants, comme l'âge légal de la retraite",
        ],
      },
      {
        title: "Des élus responsables, pas une profession à vie",
        text: "L'indemnisation des élus doit permettre l'indépendance, sans transformer le mandat en carrière protégée. Les avantages, frais et moyens de fonction doivent être publiés et justifiés.",
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
        text: "L'article 49.3 serait limité aux textes budgétaires. Son utilisation devrait être motivée publiquement et ne pourrait remplacer un véritable débat parlementaire.",
        points: [
          "Suivi public des projets de loi et amendements",
          "Budgets, subventions et marchés publics lisibles par tous",
          "Parrainage présidentiel par 500 élus ou par un million de citoyens vérifiés",
        ],
      },
      {
        title: "Anticorruption et fin de la République des copains",
        text: "Favoritisme, conflits d'intérêts, emplois de complaisance et réseaux d'influence doivent être combattus avec les mêmes exigences quel que soit le parti concerné.",
        points: [
          "Autorité anticorruption réellement indépendante et dotée de moyens d'enquête",
          "Open data sur les dépenses, contrats, subventions et grands projets",
          "Contrôle renforcé des marchés publics et du financement politique",
          "Protection des lanceurs d'alerte",
          "Renforcement de la lutte contre la fraude et l'évasion fiscales",
        ],
      },
      {
        title: "Sortir de la politique de supporters",
        text: "Une idée ne devient ni bonne parce qu'elle vient du bon camp, ni mauvaise parce qu'elle vient du mauvais. Les coopérations et coalitions doivent pouvoir se construire autour d'engagements communs sans obliger chaque organisation à se dissoudre.",
        points: [
          "Contrats de coalition courts et publics",
          "Partis et mouvements libres de conserver leur identité",
          "Priorité aux objectifs communs plutôt qu'aux guerres d'ego",
          "Refus de réduire toute la politique à un duel permanent entre blocs",
        ],
      },
    ],
  },
  {
    id: "federalisme",
    icon: Landmark,
    eyebrow: "France fédérale",
    title: "Une seule nation, plusieurs pouvoirs politiques",
    lead:
      "Le fédéralisme intérieur doit renforcer la France plutôt que la fragmenter. Les institutions nationales resteraient familières — Président, Gouvernement, Assemblée nationale et Sénat — tandis que les régions deviendraient de véritables entités fédérées disposant de compétences protégées par la Constitution.",
    ideas: [
      {
        title: "Ce qui reste national",
        text: "Les fonctions qui exigent une unité permanente resteraient exercées au niveau français. La citoyenneté, la solidarité et les grands intérêts stratégiques resteraient communs à tous.",
        points: [
          "Défense, armées et renseignement stratégique",
          "Diplomatie, nationalité et frontières",
          "Grandes garanties constitutionnelles et libertés fondamentales",
          "Politique macroéconomique et solidarité entre régions",
          "Grands réseaux et infrastructures d'intérêt national",
        ],
      },
      {
        title: "Des régions fédérées qui votent leurs propres lois",
        text: "Les régions ne recevraient plus une simple délégation révocable de Paris. La Constitution leur garantirait un véritable domaine législatif et fiscal.",
        points: [
          "Parlement régional élu et président régional chargé de l'exécution",
          "Lois régionales dans les compétences attribuées",
          "Budget propre et part de fiscalité régionale",
          "Pouvoirs forts en transports, logement, formation, culture, tourisme, agriculture, économie et aménagement",
          "Possibilité d'organisations différentes lorsque l'histoire ou la situation d'un territoire le justifie",
        ],
      },
      {
        title: "Deux niveaux de lois, une règle claire",
        text: "La Constitution serait supérieure aux deux niveaux. La loi nationale primerait dans les compétences nationales ; la loi régionale primerait dans les compétences régionales. Une juridiction constitutionnelle arbitrerait les conflits.",
        points: [
          "Compétences exclusives nationales",
          "Compétences exclusives régionales",
          "Compétences partagées précisément définies",
          "Aucune reprise unilatérale d'une compétence régionale par le pouvoir central",
        ],
      },
      {
        title: "Un Sénat réellement territorial",
        text: "Le Sénat deviendrait la chambre du pacte fédéral. Il représenterait les Français à travers leurs régions et devrait approuver les textes nationaux modifiant les compétences ou les finances territoriales.",
        points: [
          "Représentation garantie de chaque région",
          "Équilibre entre poids démographique et représentation territoriale",
          "Pouvoir renforcé sur toute révision du partage des compétences",
          "Protection de la solidarité et de l'unité nationale",
        ],
      },
      {
        title: "Retrouver les territoires historiques sans figer la carte",
        text: "Le découpage de 2015 n'a pas à devenir intouchable. Les frontières régionales pourraient être réexaminées selon l'histoire, la culture, les bassins de vie, l'économie et surtout le vote des habitants concernés.",
        points: [
          "Référendums locaux pour les modifications majeures de limites",
          "Reconnaissance des identités et cultures historiques",
          "Français comme langue nationale commune",
          "Co-officialité ou usage institutionnel d'une langue régionale lorsque le territoire le décide",
          "Histoire et géographie régionales davantage enseignées",
        ],
      },
      {
        title: "Autonomie oui, abandon des régions pauvres non",
        text: "Le fédéralisme ne doit pas transformer la France en compétition permanente entre territoires riches et pauvres. Une péréquation nationale garantirait un socle de services publics et de droits partout.",
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
      "La solidarité doit être forte parce qu'elle vise l'autonomie réelle. Aider signifie assurer les besoins fondamentaux, accompagner les difficultés et rouvrir un chemin vers le logement, l'activité ou la formation lorsque cela est possible.",
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
        text: "Une résidence principale ne doit pas devenir inhabitable à cause d'une difficulté financière ponctuelle. Les consommations vitales relèvent d'un service minimum protégé.",
        points: [
          "Interdiction des coupures d'eau dans la résidence principale",
          "Protection renforcée contre les coupures d'électricité et de chauffage",
          "Tarification sociale des consommations essentielles",
        ],
      },
      {
        title: "Sortir durablement de la rue",
        text: "L'objectif n'est pas de déplacer le sans-abrisme d'un quartier à l'autre ni d'ouvrir uniquement des places l'hiver. Chaque personne repérée à la rue doit pouvoir entrer dans un parcours coordonné.",
        points: [
          "Hébergement immédiat puis logement durable",
          "Santé, droits, papiers et accompagnement administratif",
          "Prévention des expulsions",
          "Lien direct avec l'emploi ou la formation lorsque la situation le permet",
          "CIAS, France Services, associations et France Travail coordonnés autour du même dossier",
        ],
      },
      {
        title: "Retraites : rendre la décision au pays",
        text: "Le retour de l'âge légal à 60 ans devrait pouvoir être tranché par référendum national après présentation transparente du financement et des variantes possibles.",
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
    eyebrow: "Travail, éducation et jeunesse",
    title: "Donner une première chance au lieu d'exiger une expérience impossible",
    lead:
      "La formation ne peut pas fonctionner si les débutants doivent être déjà expérimentés pour entrer dans l'entreprise. Le système scolaire, les employeurs et les pouvoirs publics doivent reconstruire des passerelles concrètes vers le travail.",
    ideas: [
      {
        title: "Protéger les travailleurs et les associer aux décisions",
        text: "Les aides publiques aux entreprises doivent créer des obligations. Une entreprise soutenue par la collectivité ne peut pas privatiser le bénéfice puis socialiser le coût d'une délocalisation.",
        points: [
          "Inspection du travail renforcée",
          "Lutte contre le travail dissimulé, les stages abusifs et les abus des plateformes",
          "Aides publiques conditionnées au maintien de l'emploi",
          "Représentants des salariés avec voix dans les grandes entreprises",
          "Droit de regard sur les délocalisations et participation accrue aux bénéfices",
          "Reprise en coopérative facilitée",
        ],
      },
      {
        title: "Alternance et premier emploi : former vraiment",
        text: "Un alternant ou un junior n'est pas un salarié confirmé à prix réduit. Les employeurs doivent pouvoir recruter un potentiel et consacrer du temps à sa progression.",
        points: [
          "Tutorat réellement assuré",
          "Incitations à l'embauche de débutants et à la formation interne",
          "Responsabilité accrue des écoles dans la recherche d'entreprises partenaires",
          "Publication transparente des taux réels d'alternance et d'insertion",
          "Reconnaissance des compétences acquises dans le bénévolat, les associations, les projets personnels et les emplois saisonniers",
        ],
      },
      {
        title: "Une école plus concentrée le matin, plus pratique l'après-midi",
        text: "Le socle national resterait exigeant, mais l'organisation du temps scolaire viserait davantage la concentration, la pratique et l'égalité entre familles.",
        points: [
          "Objectif de 20 élèves maximum en primaire et 25 au collège",
          "Priorité au français, aux mathématiques, à l'histoire et aux sciences",
          "Cours principalement de 8 h 30 à 15 h 30 du lundi au vendredi",
          "Matières de forte concentration le matin ; sport, technologie, arts, projets et découverte professionnelle davantage l'après-midi",
          "Établissements ouverts jusqu'à 18 h ou 19 h pour devoirs, culture, sport et clubs facultatifs",
          "Une part plus importante des devoirs réalisée à l'école",
        ],
      },
      {
        title: "Réhabiliter les voies professionnelles",
        text: "La réussite ne doit pas être mesurée au nombre d'années passées dans le supérieur. Un CAP, un bac professionnel ou un BTS bien relié à l'économie peut être plus utile qu'une poursuite d'études par défaut.",
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
        text: "Le passage à l'autonomie doit être moins brutal pour les étudiants et jeunes travailleurs, notamment lorsqu'ils ne disposent pas d'un soutien familial solide.",
        points: [
          "Repas universitaire à un euro",
          "Davantage de logements étudiants et transports accessibles",
          "Soutien aux jeunes en rupture familiale et meilleur accès au soutien psychologique",
          "Temps civique court autour des premiers secours, de la défense civile, des institutions, de l'environnement et des associations",
          "Soutien aux MJC, clubs, scoutismes, médias étudiants, projets culturels et mouvements d'éducation populaire",
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
      "Le système de santé doit retrouver des capacités humaines et industrielles. La simplification administrative n'a de sens que si elle libère du temps pour les soins et réduit les renoncements.",
    ideas: [
      {
        title: "Des soins essentiels mieux remboursés",
        text: "La prise en charge publique des soins prioritaires serait renforcée, avec une simplification des démarches et une meilleure couverture des postes souvent coûteux.",
        points: [
          "Remboursement pouvant atteindre 95 % pour certains soins prioritaires",
          "Dentaire, optique et audition mieux couverts",
          "Accès aux droits simplifié",
        ],
      },
      {
        title: "Des soignants là où vivent les habitants",
        text: "Chaque bassin de vie doit pouvoir s'appuyer sur des maisons ou centres de santé, avec des outils spécifiques pour les territoires sous-dotés.",
        points: [
          "Primes d'installation et logements",
          "Développement de l'exercice salarié",
          "Maisons de santé et équipes coordonnées",
          "Possibilité d'un service temporaire, compensé et concerté dans certaines zones pour de jeunes médecins",
        ],
      },
      {
        title: "Hôpitaux et EHPAD : remettre du personnel",
        text: "La fermeture comptable ne peut être le mode normal de gestion d'un service de santé. Les effectifs et conditions de travail doivent redevenir des critères centraux.",
        points: [
          "Plan de recrutement et revalorisations salariales",
          "Ratios minimums de soignants lorsque cela est pertinent",
          "Davantage de secrétaires médicaux pour décharger les soignants",
          "Conditions de vie et de travail renforcées en EHPAD",
        ],
      },
      {
        title: "Un pôle public du médicament",
        text: "La France doit pouvoir sécuriser certains médicaments essentiels, soutenir la recherche et éviter qu'une rupture de chaîne mondiale mette en danger l'accès aux traitements.",
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
      "Le projet ne repose ni sur la suppression de l'entreprise privée ni sur le laisser-faire. PME, artisans, indépendants, agriculteurs, coopératives, associations, grandes entreprises et opérateurs publics ont leur place, à condition que les secteurs stratégiques restent maîtrisés et que l'argent public serve l'intérêt général.",
    ideas: [
      {
        title: "Un État investisseur de long terme",
        text: "Un fonds souverain national financerait l'industrie, l'innovation, l'énergie, les infrastructures, le numérique, les relocalisations et les PME.",
        points: [
          "Capital patient plutôt que subventions sans contrepartie",
          "Soutien aux filières stratégiques et aux relocalisations",
          "Entrée au capital ou droit de préemption lorsque l'indépendance nationale est en jeu",
          "Possibilité de bloquer une vente stratégique ou d'organiser une reprise",
        ],
      },
      {
        title: "Protectionnisme assumé dans les marchés publics",
        text: "L'argent public doit pouvoir favoriser les productions françaises et européennes, les PME et les entreprises respectant des critères sociaux et environnementaux exigeants.",
        points: [
          "Part réservée aux PME",
          "Préférence de production française ou européenne lorsque juridiquement possible",
          "Exclusion des entreprises condamnées pour fraude grave ou délocalisation abusive liée à des aides publiques",
          "Clauses de maintien territorial lorsqu'une aide finance une implantation",
        ],
      },
      {
        title: "Banques au service de l'économie réelle",
        text: "L'épargne doit davantage financer l'investissement productif et les territoires. Le système bancaire doit distinguer clairement les dépôts du public des prises de risques spéculatives.",
        points: [
          "Séparation renforcée des activités de dépôt et spéculatives",
          "Pôle bancaire public",
          "Financement des collectivités, PME et coopératives",
          "Réduction de la dépendance du financement politique aux banques privées",
        ],
      },
      {
        title: "Nationaliser quand le secteur est réellement stratégique",
        text: "Le contrôle public n'est pas une fin idéologique. Il devient pertinent lorsqu'un monopole naturel, une infrastructure critique ou une dépendance nationale l'exige.",
        points: [
          "Énergie, autoroutes, ferroviaire, télécommunications et eau",
          "Certaines infrastructures numériques, ports, aéroports et industries stratégiques",
          "Nationalisation temporaire ou durable selon le besoin",
          "Objectifs précis, comptes publics, représentants des salariés et usagers, évaluation régulière",
        ],
      },
      {
        title: "Créer une petite entreprise sans apprendre l'administration par cœur",
        text: "Pour les activités non réglementées, créer ou gérer une petite entreprise devrait devenir presque aussi simple administrativement que créer une association.",
        points: [
          "Formulaire et dossier administratif uniques",
          "Statuts standards facultatifs",
          "Calendrier fiscal personnalisé",
          "Accompagnement gratuit la première année et droit à l'erreur renforcé",
          "Un portail pour immatriculation, Urssaf, fiscalité, aides, recrutement, formation, marchés publics et financement",
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
      "La complexité peut rester dans la machine ; elle ne doit plus être imposée à l'usager. L'objectif est un service public lisible, humain et numériquement cohérent, avec des compétences nationales et régionales clairement réparties.",
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
        text: "Simplifier ne signifie pas créer un super-fichier national. Les données resteraient dans les systèmes compétents et seraient échangées selon le besoin d'en connaître.",
        points: [
          "Chiffrement et droits d'accès minimaux",
          "Traçabilité : l'usager peut savoir qui a consulté une donnée sensible",
          "Architecture distribuée pour éviter une panne nationale unique",
          "Contrôle indépendant et normes de cybersécurité élevées",
        ],
      },
      {
        title: "Un droit au guichet humain",
        text: "Le numérique doit supprimer la paperasse inutile, pas les personnes. France Services et les guichets territoriaux deviendraient la porte physique commune de l'administration.",
        points: [
          "Accueil physique, téléphone et services itinérants maintenus",
          "Assistant social, emploi, logement, handicap, retraite, santé et démarches générales mieux coordonnés",
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
          "La Poste recentrée aussi sur l'identité, le coffre-fort documentaire, les communications sécurisées et l'inclusion numérique",
          "SNCF pensée comme colonne vertébrale de toute la mobilité publique, pas uniquement comme vendeur de trains",
          "Société nationale des voies routières pour la reprise progressive des autoroutes",
          "Énergie de France autour d'un grand pôle public de production, réseaux et planification",
          "France.Media comme plateforme publique radio, télévision, web, podcast et réseaux sociaux",
        ],
      },
      {
        title: "Mutualiser les doublons, pas supprimer l'expertise",
        text: "Les économies recherchées doivent venir des frontières administratives inutiles : logiciels redondants, contrats techniques parallèles, immobilier dispersé, fonctions support répétées et dossiers retraités plusieurs fois.",
        points: [
          "Achats et infrastructures numériques mutualisés",
          "Moins de justificatifs réclamés plusieurs fois",
          "Spécialistes maintenus là où leur expertise est nécessaire",
          "Résultats et économies publiés pour vérifier que la réforme tient ses promesses",
        ],
      },
    ],
  },
  {
    id: "agriculture",
    icon: Home,
    eyebrow: "Agriculture et alimentation",
    title: "Produire en France sans épuiser ceux qui nourrissent le pays",
    lead:
      "La souveraineté alimentaire exige une agriculture capable de vivre de sa production, de renouveler ses générations et de transformer ses pratiques sans être mise en concurrence avec des produits soumis à des normes beaucoup plus faibles.",
    ideas: [
      {
        title: "Un revenu agricole défendable",
        text: "Les prix payés aux producteurs doivent mieux refléter les coûts réels de production et limiter les marges disproportionnées dans la chaîne.",
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
      "La transition écologique doit rester compatible avec l'industrie, le pouvoir d'achat, la souveraineté et la sécurité d'approvisionnement. La science, l'efficacité réelle et l'adaptation des territoires doivent primer sur les symboles.",
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
        text: "EDF, les réseaux, l'hydraulique, la recherche, la planification et la sécurité d'approvisionnement doivent être coordonnés par une stratégie publique de long terme.",
        points: [
          "Réduction des intermédiaires purement financiers sans capacité de production",
          "Planification conjointe de l'électricité, du gaz, du stockage et des réseaux",
          "Possibilité d'élargir le pôle public à d'autres actifs stratégiques énergétiques",
        ],
      },
      {
        title: "Des renouvelables là où ils sont réellement utiles",
        text: "Le solaire doit être privilégié sur les bâtiments, parkings, friches et zones déjà artificialisées. Chaque projet doit tenir compte du paysage, des terres agricoles, de la biodiversité et de l'acceptation locale.",
      },
      {
        title: "Rénover et s'adapter au climat déjà présent",
        text: "Une agence publique de rénovation pourrait avancer certains financements, contrôler les travaux et cibler les ménages modestes. Les régions élaboreraient leurs propres plans contre incendies, sécheresses, inondations, canicules, érosion côtière et pénuries d'eau.",
      },
    ],
  },
  {
    id: "mobilites",
    icon: TrainFront,
    eyebrow: "Transports, logement et aménagement",
    title: "Organiser la vie quotidienne à l'échelle des bassins de vie",
    lead:
      "Le territoire français n'est pas composé uniquement de métropoles. Les politiques de mobilité, de logement et de foncier doivent pouvoir être beaucoup plus différentes entre un centre urbain tendu, une zone rurale, un littoral touristique et un bassin industriel.",
    ideas: [
      {
        title: "Le rail comme réseau public structurant",
        text: "Le ferroviaire resterait national pour les grandes lignes, la sécurité et l'interopérabilité, tandis que les régions piloteraient très largement les mobilités quotidiennes.",
        points: [
          "Réouverture des lignes réellement utiles et protection des petites lignes pertinentes",
          "Fret ferroviaire développé",
          "Correspondances mieux organisées et tarification sociale",
          "TER, cars, bus, fréquences et tarification locale sous forte responsabilité régionale",
          "Une recherche et, si possible, un billet unique pour le trajet complet",
        ],
      },
      {
        title: "Autoroutes : reprendre progressivement la rente",
        text: "Les concessions pourraient revenir sous contrôle public par non-renouvellement, rachat négocié ou reprise anticipée lorsque l'intérêt économique est démontré.",
        points: [
          "Opérateur public national",
          "Tarifs contrôlés",
          "Bénéfices réinvestis dans l'entretien et les transports",
        ],
      },
      {
        title: "Mobilité rurale sur mesure",
        text: "Les régions doivent pouvoir mixer cars publics, transport à la demande, correspondances avec les gares, covoiturage et tarifs jeunes selon la densité réelle du territoire.",
      },
      {
        title: "Logement et foncier : beaucoup plus de leviers régionaux",
        text: "Construction, rénovation, maîtrise du foncier et règles adaptées aux résidences secondaires ou aux zones touristiques peuvent varier fortement selon les territoires.",
        points: [
          "Objectif de logement accessible et de sortie du sans-abrisme",
          "Outils contre la spéculation foncière locale lorsqu'elle exclut les habitants permanents",
          "Rénovation énergétique accompagnée financièrement",
          "Planification régionale tenant compte des besoins réels de population et d'emploi",
        ],
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
        text: "La première réforme pénale consiste à faire fonctionner la justice existante : magistrats, greffiers, accueil des victimes et procédures plus lisibles.",
        points: [
          "Recrutement de magistrats et greffiers",
          "Réduction des délais",
          "Meilleur accueil et suivi des victimes",
          "Simplification des procédures sans supprimer les droits de la défense",
        ],
      },
      {
        title: "Fermeté sur les crimes graves, sanctions utiles sur le reste",
        text: "Viols, crimes contre les enfants, homicides, violences graves et réseaux criminels appellent une réponse lourde et rapide. Pour les infractions non violentes, réparation et travail d'intérêt général peuvent parfois être plus utiles qu'une courte incarcération désocialisante.",
        points: [
          "Peines lourdes pour les crimes graves avec individualisation judiciaire",
          "Travail d'intérêt général et réparation développés pour les délits adaptés",
          "Prévention de la récidive et alternatives à la prison lorsque la sécurité le permet",
          "Capacités pénitentiaires construites ou rénovées avec sécurité, dignité et séparation des profils",
        ],
      },
      {
        title: "Police nationale forte, police territoriale proche",
        text: "La police nationale et la gendarmerie conserveraient criminalité grave, renseignement, enquêtes judiciaires spécialisées et maintien de l'ordre. Les missions quotidiennes pourraient être mutualisées dans de véritables polices territoriales couvrant plusieurs communes.",
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
        text: "Les moyens de renseignement doivent être renforcés pour le terrorisme, les ingérences, le grand banditisme et les réseaux transnationaux, avec contrôle juridictionnel et parlementaire des moyens intrusifs.",
      },
      {
        title: "Peines exceptionnelles : le débat doit être juridiquement explicite",
        text: "Le rétablissement de la peine de mort pour un nombre extrêmement restreint de crimes — par exemple terrorisme meurtrier, crimes de masse ou trahison militaire dans des circonstances définies — peut être proposé politiquement. Il est impossible dans le cadre constitutionnel et conventionnel français actuel : une telle rupture supposerait donc une révision nationale explicite, la modification des engagements internationaux concernés et une décision démocratique directe.",
        points: [
          "Aucune région ne pourrait aujourd'hui contourner l'interdiction constitutionnelle nationale",
          "Dans un fédéralisme pénal plus large, une marge régionale sur la nature des peines ne serait possible que si la Constitution française l'autorisait d'abord",
          "Pour certains délinquants sexuels à haut risque de récidive, les traitements hormonaux réduisant la libido peuvent être débattus uniquement dans un cadre médical et judiciaire strict, avec suivi et garanties fondamentales",
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
      "Une politique migratoire peut être à la fois humaine, ferme et organisée. L'objectif est de réduire les réseaux clandestins en ouvrant des procédures légales plus lisibles, puis d'exiger un parcours intensif vers la langue, l'activité et l'autonomie.",
    ideas: [
      {
        title: "Commencer la procédure avant le départ lorsque c'est possible",
        text: "Ambassades et consulats pourraient devenir de véritables portes d'entrée pour l'asile, le travail, la formation et d'autres motifs légaux de séjour.",
        points: [
          "Dossiers plus simples et délais plus courts",
          "Vérification des condamnations graves, recherches internationales et liens établis avec des réseaux criminels ou violents",
          "Aucune enquête arbitraire sur la religion, l'origine ou les opinions ordinaires",
          "Première initiation au français, aux institutions, au logement et au marché du travail",
          "Évaluation pratique des compétences lorsque les diplômes sont incomplets",
        ],
      },
      {
        title: "Un passe de travail lié au parcours d'intégration",
        text: "Une personne admise provisoirement ou se signalant volontairement aux autorités entrerait rapidement dans un dispositif légal : droit de travailler, accompagnement et obligations d'intégration vont ensemble.",
        points: [
          "Droit de signer un contrat déclaré, de cotiser et de bénéficier du droit du travail",
          "Hébergement initial, soins essentiels, formation, transport et référent lorsque nécessaire",
          "Pas d'accès automatique immédiat aux prestations destinées à une installation durable ; les besoins essentiels sont d'abord fournis directement",
          "Adaptations pour maladie, handicap, grossesse, jeunes enfants ou incapacité temporaire de travailler",
        ],
      },
      {
        title: "Une intégration intensive, normalement en moins de six mois",
        text: "Le parcours doit transmettre les règles communes et préparer concrètement à la vie autonome, sans imposer une opinion politique, une religion ou l'effacement des origines.",
        points: [
          "Français intensif",
          "Institutions, droits, devoirs et lois françaises",
          "Égalité entre femmes et hommes, liberté de conscience et laïcité des institutions publiques",
          "Scolarisation des enfants",
          "Formation professionnelle et préparation à l'emploi",
          "Histoire et vie civique françaises, découverte de la commune et de la région d'accueil",
          "Participation possible à des activités locales, civiques ou associatives",
        ],
      },
      {
        title: "Orienter vers les territoires qui peuvent réellement accueillir et employer",
        text: "L'orientation initiale prendrait en compte compétences, emplois disponibles, métiers en tension, logement, situation familiale ou médicale et capacités locales des services publics.",
        points: [
          "Agriculture, bâtiment, industrie, hôtellerie-restauration, transports, entretien, aide à la personne et métiers techniques parmi les secteurs possibles",
          "Changement de territoire permis pour emploi sérieux, formation, santé, rapprochement familial, logement autonome ou situation exceptionnelle",
          "Les non-francophones et personnes relevant de l'asile peuvent être orientés immédiatement vers des services spécialisés plutôt que laissés seuls dans un guichet généraliste",
        ],
      },
      {
        title: "Une voie militaire strictement volontaire",
        text: "La Légion étrangère peut constituer, pour les personnes qui le souhaitent et remplissent ses conditions, une autre voie d'intégration. La sélection militaire reste autonome et une candidature ne garantit jamais l'incorporation.",
      },
      {
        title: "Régularisation durable après un parcours réussi",
        text: "La stabilité administrative doit devenir simple lorsque la personne travaille ou se forme sérieusement, respecte les lois, scolarise ses enfants et participe normalement à la société.",
        points: [
          "Titre durable après validation du parcours",
          "Ouverture progressive des droits sociaux ordinaires",
          "Regroupement familial après stabilité du séjour, ressources et logement adaptés",
          "Parcours d'intégration adapté pour les membres de la famille arrivant ensuite",
        ],
      },
    ],
  },
  {
    id: "medias-numerique",
    icon: Radio,
    eyebrow: "Médias, libertés et numérique",
    title: "Liberté de parole, pluralisme et souveraineté technologique",
    lead:
      "L'espace public est désormais partagé entre télévision, radio, presse, plateformes et créateurs. Les règles doivent protéger la liberté sans laisser quelques groupes privés ou quelques plateformes décider seuls de ce qui devient visible.",
    ideas: [
      {
        title: "Une liberté d'expression forte",
        text: "La liberté d'expression doit rester la règle, avec les limites déjà nécessaires contre les menaces, le harcèlement, la diffamation, les appels directs à la violence et les discriminations illégales.",
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
        text: "Les médias historiques ne doivent pas rester enfermés dans des règles conçues pour un autre âge pendant que les grandes plateformes fonctionnent comme un Far West. La convergence doit se faire dans les deux sens.",
        points: [
          "Alléger certaines contraintes obsolètes pesant sur radio et télévision",
          "Imposer progressivement aux très grands médias du web transparence des financements, règles de publicité et responsabilité éditoriale proportionnée",
          "Garantir des conditions de travail correctes dans les grandes structures numériques",
          "Éviter toute police de la pensée ou réglementation empêchant l'innovation",
        ],
      },
      {
        title: "France.Media : national par les moyens, régional dans les rédactions",
        text: "Le service public audiovisuel pourrait mutualiser davantage radio, télévision, web, podcasts et réseaux sociaux tout en donnant aux rédactions régionales une véritable autonomie éditoriale.",
        points: [
          "Un reportage décliné sur plusieurs formats plutôt que plusieurs structures doublonnées",
          "Antennes et identités éditoriales préservées",
          "Place accrue aux cultures et langues régionales",
          "Gouvernance protégeant les rédactions du pouvoir politique",
        ],
      },
      {
        title: "Souveraineté numérique",
        text: "La France et ses partenaires européens doivent être capables de produire des briques numériques essentielles plutôt que dépendre entièrement d'entreprises étrangères.",
        points: [
          "Fonds souverain pour calcul, IA, laboratoires, universités, jeunes entreprises et modèles ouverts",
          "Soutien à un moteur de recherche français et à un index européen indépendant",
          "Alternatives souveraines pour courriel, agenda, stockage, bureautique, visioconférence, cartographie, traduction et IA",
          "Commande publique utilisée comme levier d'industrialisation numérique",
          "Cloud et hébergement critiques placés sous exigences fortes de souveraineté et de sécurité",
        ],
      },
      {
        title: "Protéger les mineurs sans créer une société de surveillance",
        text: "Les protections d'âge et de sécurité en ligne doivent être proportionnées. Elles ne doivent pas devenir un prétexte à généraliser l'identification permanente, le traçage des conversations privées ou un fichier central de la vie numérique.",
        points: [
          "Priorité aux outils respectueux de la vie privée",
          "Contrôle judiciaire pour les moyens réellement intrusifs",
          "Responsabilité des plateformes et accompagnement des parents plutôt qu'une surveillance générale de tous les utilisateurs",
        ],
      },
    ],
  },
  {
    id: "europe",
    icon: Globe2,
    eyebrow: "Europe et politique internationale",
    title: "Coopérer avec les nations sans dissoudre la décision française",
    lead:
      "Le fédéralisme français concerne l'organisation intérieure du pays ; il n'implique aucun fédéralisme européen automatique. La coopération européenne doit rester un outil et non devenir une fin qui retire progressivement toute capacité de choix national.",
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
        text: "La première réponse doit être la négociation, la recherche d'alliés et la demande de dérogation. Si le conflit devient durable et touche un choix fondamental, les citoyens doivent pouvoir trancher la relation à maintenir avec le cadre européen concerné.",
        points: [
          "Aucune sortie automatique décidée par principe",
          "Aucune soumission automatique décidée par principe non plus",
          "Réforme, dérogation, nouvelle coopération ou rupture doivent pouvoir être comparées publiquement avant décision",
        ],
      },
      {
        title: "Une diplomatie indépendante",
        text: "La France doit rechercher la paix, le respect du droit international et ses propres intérêts sans alignement automatique sur une puissance étrangère ou un bloc.",
        points: [
          "Capacité diplomatique et militaire autonome",
          "Coopérations au cas par cas",
          "Francophonie renforcée en éducation, culture, recherche, économie, médias et mobilité étudiante",
        ],
      },
    ],
  },
  {
    id: "fiscalite",
    icon: BadgeEuro,
    eyebrow: "Fiscalité et dette",
    title: "Faire contribuer davantage la rente, protéger le travail et savoir où part l'argent",
    lead:
      "La fiscalité doit être lisible, financer les services communs et encourager l'économie productive. La dette peut financer un investissement utile, mais elle ne doit pas devenir une excuse pour ne jamais examiner l'efficacité de la dépense.",
    ideas: [
      {
        title: "Une fiscalité plus simple et plus productive",
        text: "Le système doit réduire les niches inefficaces et mieux distinguer l'investissement productif, le travail et les rentes ou stratégies d'optimisation agressive.",
        points: [
          "Lutte renforcée contre l'évasion fiscale",
          "Contribution accrue des grandes fortunes et multinationales",
          "Fiscalité favorable à la production et aux PME qui investissent en France",
          "Simplification des obligations pour les ménages et petites entreprises",
        ],
      },
      {
        title: "Auditer la dette avant les slogans",
        text: "Un audit public distinguerait investissements utiles, coûts des crises, intérêts, dépenses inefficaces, conséquences de privatisations et engagements hors bilan.",
        points: [
          "Pas d'annulation arbitraire de la dette",
          "Acceptation possible d'une dette temporaire lorsqu'elle finance une capacité productive ou une infrastructure durable",
          "Objectif de réduire la progression de la dette structurelle une fois les investissements engagés",
        ],
      },
      {
        title: "Des fonds citoyens fléchés, mais jamais un État à la carte",
        text: "Des particuliers ou entreprises pourraient contribuer volontairement à un projet public précisément défini : monument, centre de santé, ligne ferroviaire, recherche, haies, matériel hospitalier ou réduction de dette.",
        points: [
          "Objectif, montant, administration responsable et calendrier publiés avant la collecte",
          "Argent impossible à rediriger discrètement vers une autre dépense",
          "Suivi public des contrats, dépenses et résultats",
          "Avantage fiscal plafonné et étudié pour ne pas coûter davantage que la contribution reçue",
          "Aucun droit politique ou pouvoir de décision accordé au donateur",
          "Ces fonds ne remplacent ni l'impôt, ni le budget voté, ni la solidarité nationale",
        ],
      },
    ],
  },
];

function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-7">
      <h3 className="font-display text-xl font-bold tracking-tight text-foreground">{idea.title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">{idea.text}</p>
      {idea.points?.length ? (
        <ul className="mt-5 space-y-2.5 text-sm leading-6 text-foreground/85">
          {idea.points.map((point) => (
            <li key={point} className="flex gap-2.5">
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function ChapterSection({ chapter, index }: { chapter: Chapter; index: number }) {
  const Icon = chapter.icon;
  return (
    <section id={chapter.id} className={`scroll-mt-24 border-t border-border py-16 md:py-24 ${index % 2 === 1 ? "bg-muted/35" : "bg-background"}`}>
      <div className="container-tight">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{chapter.eyebrow}</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">{chapter.title}</h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">{chapter.lead}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {chapter.ideas.map((idea) => (
              <IdeaCard key={idea.title} idea={idea} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PolitiquePage() {
  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-hidden bg-background">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute top-1/4 -right-40 h-[500px] w-[500px] rounded-full bg-secondary/20 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          />
        </div>

        <div className="container-tight relative py-16 md:py-24 lg:py-28">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary backdrop-blur">
              <Flag className="h-3.5 w-3.5" aria-hidden />
              Politique
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.03] tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Une France sociale, souveraine, <span className="italic text-primary">fédérale</span> et démocratique.
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
              Cette page rassemble une ligne politique complète dans un même ensemble : protéger les personnes sans affaiblir le travail, rendre du pouvoir aux citoyens, reconstruire l'industrie, simplifier radicalement l'État, défendre la souveraineté française et donner aux régions de véritables libertés politiques sans renoncer à l'unité nationale.
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
              Les propositions sont présentées directement et de manière impersonnelle. Certaines sont immédiatement applicables ; d'autres supposeraient une révision constitutionnelle, une négociation européenne ou un référendum. L'objectif est de montrer la cohérence d'ensemble plutôt que de masquer les choix difficiles.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Justice sociale", "Souveraineté", "Fédéralisme", "Réindustrialisation", "Services publics", "Démocratie directe"].map((tag) => (
                <span key={tag} className="rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 py-14 md:py-18">
        <div className="container-tight">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Le fil conducteur</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Des idées qui ne rentrent pas dans une seule case
          </h2>
          <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
            Une politique sociale peut être patriote. Une politique souverainiste peut être fédérale à l'intérieur. Une économie de marché peut conserver de puissants opérateurs publics. La cohérence recherchée repose moins sur une étiquette que sur six principes.
          </p>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {principles.map((principle) => {
              const Icon = principle.icon;
              return (
                <article key={principle.title} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <Icon className="h-6 w-6 text-primary" aria-hidden />
                  <h3 className="mt-4 font-display text-xl font-bold text-foreground">{principle.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{principle.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-12">
        <div className="container-tight">
          <div className="flex flex-wrap gap-2">
            {chapters.map((chapter) => (
              <a
                key={chapter.id}
                href={`#${chapter.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {chapter.eyebrow}
                <ChevronRight className="h-3.5 w-3.5 text-primary" aria-hidden />
              </a>
            ))}
          </div>
        </div>
      </section>

      {chapters.map((chapter, index) => (
        <ChapterSection key={chapter.id} chapter={chapter} index={index} />
      ))}

      <section className="border-t border-border bg-foreground py-16 text-background md:py-24">
        <div className="container-tight">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">En synthèse</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-5xl">
              Une France forte parce qu'elle protège, produit, décide et fait confiance à ses territoires.
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-8 text-background/75 md:text-lg">
              Le projet cherche à réunir quatre choses souvent opposées artificiellement : une protection sociale élevée, une souveraineté nationale réelle, des libertés régionales comparables à celles d'une fédération et une économie productive laissant une place à l'initiative privée. L'État national resterait puissant là où l'unité est indispensable ; les régions deviendraient puissantes là où la proximité est plus efficace ; les citoyens disposeraient de moyens réels pour reprendre la décision lorsque les institutions s'éloignent d'eux.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/5 px-4 py-2 text-sm font-semibold text-background/85">
              Une nation commune. Des régions libres. Un État simple. Une démocratie vivante.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
