export interface Service {
  id: string;
  title: string;
  description: string;
  features: string[];
  price: string;
  priceUnit: string;
  popular?: boolean;
}

export const services: Service[] = [
  {
    id: "consulting",
    title: "Conseil stratégique",
    description:
      "Un accompagnement personnalisé pour structurer votre projet, identifier vos priorités et définir une feuille de route claire.",
    features: [
      "Audit de situation",
      "Plan d'action sur 3 mois",
      "Rapport de recommandations",
      "Suivi mensuel",
    ],
    price: "490",
    priceUnit: "/ jour",
  },
  {
    id: "design",
    title: "Design & identité visuelle",
    description:
      "Création d'une identité visuelle cohérente et professionnelle : logo, charte graphique, supports digitaux et imprimés.",
    features: [
      "Logo et charte graphique",
      "Templates réseaux sociaux",
      "Supports de communication",
      "2 rounds de révisions",
    ],
    price: "1 200",
    priceUnit: "à partir de",
    popular: true,
  },
  {
    id: "web",
    title: "Site web & landing page",
    description:
      "Conception et développement de sites modernes, rapides et responsive pour valoriser votre activité et convertir vos visiteurs.",
    features: [
      "Design sur mesure",
      "Responsive mobile/tablette",
      "SEO de base",
      "Formation administration",
    ],
    price: "2 500",
    priceUnit: "à partir de",
  },
  {
    id: "coaching",
    title: "Coaching & formation",
    description:
      "Sessions individuelles ou collectives pour monter en compétences sur le digital, la communication et la productivité.",
    features: [
      "Sessions de 1h30",
      "Supports pédagogiques",
      "Exercices pratiques",
      "Suivi par email",
    ],
    price: "150",
    priceUnit: "/ session",
  },
];

export const pricingPlans: Service[] = [
  {
    id: "starter",
    title: "Starter",
    description: "Idéal pour démarrer sereinement et poser les bases de votre projet.",
    features: [
      "1 journée de conseil",
      "Rapport d'audit",
      "Plan d'action",
      "Échanges email",
    ],
    price: "490",
    priceUnit: "TTC",
  },
  {
    id: "pro",
    title: "Pro",
    description: "L'accompagnement complet pour structurer et faire grandir votre activité.",
    features: [
      "3 journées de conseil",
      "Identité visuelle complète",
      "Landing page one-page",
      "Suivi 1 mois inclus",
    ],
    price: "2 900",
    priceUnit: "TTC",
    popular: true,
  },
  {
    id: "premium",
    title: "Premium",
    description: "Un partenariat sur mesure pour les projets ambitieux et les lancements.",
    features: [
      "Accompagnement 3 mois",
      "Site web multi-pages",
      "Stratégie de contenu",
      "Coaching mensuel",
    ],
    price: "Sur mesure",
    priceUnit: "",
  },
];
