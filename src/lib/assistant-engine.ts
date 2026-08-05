/**
 * Moteur local de l'assistant ALC.
 * Aucune API externe : intentions + mots-clés + contenu public du site.
 * Remplaçable plus tard par un appel modèle (même signature `answer()`).
 */

export type AssistantLink = { label: string; to: string; external?: boolean };

export type AssistantReply = {
  text: string;
  links?: AssistantLink[];
  suggestions?: string[];
};

const PHONE = "06 01 76 69 78";
const PHONE_HREF = "tel:+33601766978";
const EMAIL = "contact@angel-leclerc.fr";

export const DEFAULT_SUGGESTIONS = [
  "Quels services propose Angel ?",
  "Voir son parcours",
  "Parler d'un projet de communication",
  "Découvrir ses réalisations",
  "Le contacter",
];

export const WELCOME: AssistantReply = {
  text: "Bonjour ! Je suis l'assistant d'Angel Leclerc Communication. Posez-moi une question sur les services, le parcours, les tarifs ou un projet : je réponds à partir des informations publiques du site.",
  suggestions: DEFAULT_SUGGESTIONS,
};

const CONTACT_LINK: AssistantLink = { label: "Formulaire de contact", to: "/contact" };

function normalize(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s']/g, " ");
}

type Intent = {
  id: string;
  keywords: string[];
  reply: AssistantReply;
};

const INTENTS: Intent[] = [
  {
    id: "services",
    keywords: [
      "service", "services", "prestation", "prestations", "offre", "offres",
      "que fait", "que propose", "propose", "activite", "metier", "faire pour moi",
    ],
    reply: {
      text: "Trois activités principales : la gestion de projet (organisation, suivi, coordination des prestataires), le conseil en communication (analyse, objectifs, choix des supports et des messages) et la rédaction éditoriale (textes professionnels, institutionnels, journalistiques et web). En complément : affiche ou flyer, identité visuelle simple, recherche de prestataires et production audio/vidéo sur le terrain.",
      links: [{ label: "Voir les services", to: "/entreprise#services" }, CONTACT_LINK],
      suggestions: ["Quels sont les tarifs ?", "Comment se déroule une mission ?", "Le contacter"],
    },
  },
  {
    id: "tarifs",
    keywords: ["tarif", "tarifs", "prix", "cout", "combien", "budget", "devis", "facture", "euros"],
    reply: {
      text: "Toutes les prestations sont réalisées sur devis. Les montants affichés sont uniquement indicatifs : rédaction de textes à partir de 30 €, affiche ou flyer à partir de 50 €, identité visuelle simple à partir de 150 €. La coordination de prestataires et la production audio/vidéo sont sur devis. Le paiement se fait via Revolut Business, avec un acompte avant la mission et le solde après validation.",
      links: [{ label: "Détail des services et tarifs", to: "/entreprise#services" }, CONTACT_LINK],
      suggestions: ["Parler d'un projet de communication", "Comment se déroule une mission ?"],
    },
  },
  {
    id: "methode",
    keywords: ["methode", "deroule", "deroulement", "etape", "etapes", "process", "comment ca marche", "delai", "delais"],
    reply: {
      text: "Une mission se déroule en quatre étapes : premier échange pour comprendre le besoin, proposition écrite et chiffrée, réalisation et coordination, puis livraison et suivi. Les délais dépendent du projet et sont précisés dans la proposition.",
      links: [{ label: "La méthode en détail", to: "/entreprise#methode" }, CONTACT_LINK],
      suggestions: ["Quels sont les tarifs ?", "Le contacter"],
    },
  },
  {
    id: "parcours",
    keywords: [
      "parcours", "cv", "experience", "experiences", "formation", "diplome", "diplomes",
      "etude", "etudes", "competence", "competences", "profil", "qui est", "biographie",
    ],
    reply: {
      text: "Le parcours complet d'Angel est publié sur le site : expériences professionnelles, formations et diplômes, certifications, engagements associatifs et compétences. La page fait office de CV en ligne.",
      links: [{ label: "Voir le parcours / CV", to: "/parcours" }],
      suggestions: ["Il cherche une alternance ?", "Découvrir ses réalisations", "Quels services propose Angel ?"],
    },
  },
  {
    id: "alternance",
    keywords: ["alternance", "apprenti", "apprentissage", "bts", "stage", "recrut", "embauche", "ecole"],
    reply: {
      text: "Angel recherche une alternance en BTS Communication pour la rentrée 2026, avec les écoles IBSAC (Brive-la-Gaillarde) et Talis (Périgueux). Mission majoritairement communication, avec des activités complémentaires possibles (par exemple 60 % communication / 40 % vente). Les détails et la zone de mobilité sont sur la page Parcours.",
      links: [{ label: "Voir la recherche d'alternance", to: "/parcours" }, CONTACT_LINK],
      suggestions: ["Le contacter", "Voir son parcours"],
    },
  },
  {
    id: "realisations",
    keywords: ["realisation", "realisations", "projet realise", "projets", "portfolio", "reference", "references", "exemple", "exemples", "travaux"],
    reply: {
      text: "Les projets et réalisations sélectionnés sont présentés sur la page Parcours, et les articles publiés se trouvent dans le blog du site.",
      links: [{ label: "Réalisations", to: "/parcours" }, { label: "Blog", to: "/articles" }],
      suggestions: ["Quels services propose Angel ?", "Le contacter"],
    },
  },
  {
    id: "blog",
    keywords: ["blog", "article", "articles", "actualite", "actualites", "publication", "substack", "newsletter", "abonner"],
    reply: {
      text: "Les articles et réflexions sont publiés dans le blog du site, et une partie est également reprise sur Substack.",
      links: [
        { label: "Lire le blog", to: "/articles" },
        { label: "Substack", to: "https://blog.angel-leclerc.fr", external: true },
      ],
      suggestions: ["Quels services propose Angel ?", "Le contacter"],
    },
  },
  {
    id: "contact",
    keywords: ["contact", "contacter", "joindre", "email", "mail", "ecrire", "rendez", "rdv", "parler", "discuter", "adresse"],
    reply: {
      text: `Le plus simple est le formulaire de contact du site : vous décrivez votre besoin, avec pièce jointe possible. Vous pouvez aussi écrire à ${EMAIL}.`,
      links: [CONTACT_LINK],
      suggestions: ["Parler d'un projet de communication", "Quels sont les tarifs ?"],
    },
  },
  {
    id: "reseaux",
    keywords: ["linkedin", "instagram", "facebook", "reseau", "reseaux", "social"],
    reply: {
      text: "Angel Leclerc Communication est présent sur LinkedIn, Instagram et Facebook. Les liens sont disponibles en bas de chaque page du site.",
      links: [
        { label: "LinkedIn", to: "https://www.linkedin.com/company/angel-leclerc-communication/", external: true },
        { label: "Instagram", to: "https://www.instagram.com/angelof_com", external: true },
      ],
      suggestions: ["Le contacter", "Quels services propose Angel ?"],
    },
  },
  {
    id: "paiement",
    keywords: ["paiement", "payer", "revolut", "acompte", "reglement", "tva", "siret", "siren", "facture"],
    reply: {
      text: "Les paiements sont traités via Revolut Business : facture et lien de paiement sécurisé, acompte avant la mission et solde après validation. Angel Leclerc est entrepreneur individuel, TVA non applicable (article 293 B du CGI).",
      links: [{ label: "Mentions légales", to: "/mentions-legales" }, CONTACT_LINK],
    },
  },
  {
    id: "boutique",
    keywords: ["boutique", "acheter", "produit", "produits", "commande", "tshirt", "t shirt", "goodies", "panier"],
    reply: {
      text: "Une petite boutique existe sur le site, accessible depuis le pied de page.",
      links: [{ label: "Accéder à la boutique", to: "/boutique" }],
    },
  },
  {
    id: "salutation",
    keywords: ["bonjour", "salut", "bonsoir", "hello", "coucou", "hey"],
    reply: {
      text: "Bonjour ! Que puis-je vous dire sur Angel Leclerc Communication ?",
      suggestions: DEFAULT_SUGGESTIONS,
    },
  },
  {
    id: "merci",
    keywords: ["merci", "super", "parfait", "au revoir", "bonne journee"],
    reply: {
      text: "Avec plaisir ! N'hésitez pas si vous avez une autre question.",
      suggestions: DEFAULT_SUGGESTIONS,
    },
  },
];

/** Mots signalant un besoin de communication décrit par le visiteur. */
const NEED_KEYWORDS: { words: string[]; service: string; anchor: string }[] = [
  {
    words: ["logo", "identite", "charte", "graphisme", "graphique", "visuel"],
    service: "une identité visuelle simple (logo, couleurs, typographies)",
    anchor: "/entreprise#services",
  },
  {
    words: ["affiche", "flyer", "tract", "depliant", "brochure", "impression"],
    service: "la création d'une affiche ou d'un flyer",
    anchor: "/entreprise#services",
  },
  {
    words: ["texte", "redaction", "redige", "article", "communique", "interview", "reportage", "web", "site", "newsletter"],
    service: "la rédaction et les contenus éditoriaux",
    anchor: "/entreprise#services",
  },
  {
    words: ["strategie", "conseil", "visibilite", "notoriete", "audience", "cible", "plan de com", "reseaux sociaux"],
    service: "le conseil en communication",
    anchor: "/entreprise#services",
  },
  {
    words: ["evenement", "festival", "organisation", "coordination", "prestataire", "planning", "projet"],
    service: "la gestion de projet",
    anchor: "/entreprise#services",
  },
  {
    words: ["video", "audio", "podcast", "montage", "tournage", "photo"],
    service: "la production audio, vidéo ou numérique sur le terrain",
    anchor: "/entreprise#services",
  },
];

/** Signaux d'urgence ou de sérieux justifiant de proposer le téléphone. */
const URGENT_KEYWORDS = [
  "urgent", "urgence", "rapidement", "vite", "aujourd hui", "demain", "delai court",
  "appeler", "telephone", "tel", "appel", "joindre par telephone", "parler de vive voix",
  "devis rapide", "mairie", "entreprise", "association", "collectivite", "commande",
];

function score(text: string, keywords: string[]) {
  let s = 0;
  for (const k of keywords) if (text.includes(k)) s += k.split(" ").length;
  return s;
}

export function answer(input: string): AssistantReply {
  const text = normalize(input).replace(/\s+/g, " ").trim();
  if (!text) return WELCOME;

  const urgent = URGENT_KEYWORDS.some((k) => text.includes(k));

  // 1) Besoin décrit par le visiteur → résumé + service adapté + contact
  const needs = NEED_KEYWORDS.filter((n) => n.words.some((w) => text.includes(w)));
  const looksLikeNeed =
    needs.length > 0 &&
    (text.length > 40 ||
      /\b(je|nous|on|notre|mon|ma|mes|besoin|cherche|voudrais|aimerais|souhaite)\b/.test(text));

  if (looksLikeNeed) {
    const services = needs.slice(0, 2).map((n) => n.service);
    const links: AssistantLink[] = [
      { label: "Présenter mon projet", to: "/contact" },
      { label: "Voir les services", to: "/entreprise#services" },
    ];
    if (urgent) links.push({ label: `Appeler le ${PHONE}`, to: PHONE_HREF, external: true });
    return {
      text: `Si je résume, votre besoin porte sur ${services.join(" et ")}. C'est exactement le type de mission qu'Angel prend en charge. Le mieux est de décrire votre projet via le formulaire de contact : vous recevrez une proposition écrite et chiffrée après un premier échange.`,
      links,
      suggestions: ["Quels sont les tarifs ?", "Comment se déroule une mission ?"],
    };
  }

  // 2) Intentions par mots-clés
  let best: Intent | null = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    const s = score(text, intent.keywords);
    if (s > bestScore) {
      bestScore = s;
      best = intent;
    }
  }

  if (best && bestScore > 0) {
    const reply = best.reply;
    if (urgent && (best.id === "contact" || best.id === "tarifs" || best.id === "services")) {
      return {
        ...reply,
        text: `${reply.text} Si votre demande est urgente, vous pouvez appeler directement le ${PHONE}.`,
        links: [...(reply.links ?? []), { label: `Appeler le ${PHONE}`, to: PHONE_HREF, external: true }],
      };
    }
    return reply;
  }

  // 3) Repli élégant
  return {
    text: "Je n'ai pas trouvé cette information parmi les contenus publiés sur le site. Le mieux est de poser directement la question à Angel via le formulaire de contact : la réponse sera précise et personnalisée.",
    links: [CONTACT_LINK, { label: "Voir les services", to: "/entreprise#services" }],
    suggestions: DEFAULT_SUGGESTIONS,
  };
}
