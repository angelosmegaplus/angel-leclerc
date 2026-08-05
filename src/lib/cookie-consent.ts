/**
 * Consentement cookies / stockage local.
 * Aucun script non nécessaire n'est déclenché avant un choix explicite.
 */
export const CONSENT_VERSION = "2026-08-05";
export const CONSENT_KEY = "alc_consent";

export type ConsentCategory = "necessary" | "audience" | "personalisation" | "embeds";

export type ConsentRecord = {
  version: string;
  date: string;
  categories: Record<ConsentCategory, boolean>;
};

export const CATEGORY_INFO: {
  id: ConsentCategory;
  label: string;
  purpose: string;
  examples: string;
  duration: string;
  locked?: boolean;
}[] = [
  {
    id: "necessary",
    label: "Nécessaires",
    purpose:
      "Fonctionnement du site : mémorisation de votre choix de cookies, session de connexion à l'espace personnel, panier de la boutique, sécurité des formulaires.",
    examples: "Consentement, authentification, panier, anti-robot",
    duration: "Session à 6 mois",
    locked: true,
  },
  {
    id: "audience",
    label: "Mesure d'audience",
    purpose:
      "Comptage anonyme des pages vues afin de savoir quels contenus sont consultés. Aucune régie publicitaire, aucun profilage.",
    examples: "Statistiques internes du site (identifiant de session temporaire)",
    duration: "Session",
  },
  {
    id: "personalisation",
    label: "Personnalisation",
    purpose:
      "Mémorisation de vos réponses en cours dans le parcours de contact et l'assistant, pour ne pas les ressaisir.",
    examples: "Brouillon du parcours Contact, état de l'assistant",
    duration: "Session",
  },
  {
    id: "embeds",
    label: "Services tiers / médias intégrés",
    purpose:
      "Affichage de contenus hébergés par des tiers (vidéos, lecteurs audio, cartes). Ces services peuvent déposer leurs propres cookies.",
    examples: "YouTube, lecteurs externes intégrés aux articles",
    duration: "Selon le prestataire",
  },
];

export const DEFAULT_CONSENT: Record<ConsentCategory, boolean> = {
  necessary: true,
  audience: false,
  personalisation: false,
  embeds: false,
};

export function readConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(categories: Record<ConsentCategory, boolean>): ConsentRecord {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    date: new Date().toISOString(),
    categories: { ...categories, necessary: true },
  };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
  } catch {
    /* stockage indisponible */
  }
  window.dispatchEvent(new CustomEvent("alc-consent-change", { detail: record }));
  return record;
}

export function clearConsent() {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* stockage indisponible */
  }
  window.dispatchEvent(new CustomEvent("alc-consent-change", { detail: null }));
}

export function openCookiePreferences() {
  window.dispatchEvent(new CustomEvent("alc-consent-open"));
}
