export type GoogleServiceId =
  | "gmail"
  | "calendar"
  | "drive"
  | "contacts"
  | "youtube"
  | "youtube_analytics";

export type GoogleServiceDefinition = {
  id: GoogleServiceId;
  name: string;
  description: string;
  scopes: string[];
  api: string;
  features: string[];
};

/**
 * Capabilities are deliberately authorized independently. Google recommends
 * incremental authorization: ask for a scope when the user enables the
 * corresponding feature instead of requesting every Google permission upfront.
 */
export const GOOGLE_SERVICES: GoogleServiceDefinition[] = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Lire, classer et envoyer les mails depuis Angel OS.",
    scopes: ["https://www.googleapis.com/auth/gmail.modify"],
    api: "Gmail API",
    features: ["Boîte mail", "Candidatures", "Angel OS IA"],
  },
  {
    id: "calendar",
    name: "Google Agenda",
    description: "Lire les événements et alimenter l’agenda Angel OS.",
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    api: "Google Calendar API",
    features: ["Agenda", "Aperçu du jour", "Angel OS IA"],
  },
  {
    id: "drive",
    name: "Google Drive",
    description: "Lire les fichiers autorisés et les afficher dans la bibliothèque Angel OS.",
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    api: "Google Drive API",
    features: ["Fichiers", "Documents", "Angel OS IA"],
  },
  {
    id: "contacts",
    name: "Google Contacts",
    description: "Retrouver les contacts utiles aux mails, rendez-vous et candidatures.",
    scopes: ["https://www.googleapis.com/auth/contacts.readonly"],
    api: "People API",
    features: ["Contacts", "Destinataires", "Angel OS IA"],
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Accéder à la chaîne et préparer les fonctions de publication vidéo.",
    scopes: ["https://www.googleapis.com/auth/youtube.readonly"],
    api: "YouTube Data API v3",
    features: ["Studio", "Vidéos", "Chaîne"],
  },
  {
    id: "youtube_analytics",
    name: "YouTube Analytics",
    description: "Lire les statistiques de la chaîne pour les tableaux de bord Angel OS.",
    scopes: ["https://www.googleapis.com/auth/yt-analytics.readonly"],
    api: "YouTube Analytics API",
    features: ["Statistiques", "Studio", "Angel OS IA"],
  },
];

export const GOOGLE_IDENTITY_SCOPES = ["openid", "email", "profile"];

export function getGoogleService(id: string | undefined) {
  return GOOGLE_SERVICES.find((service) => service.id === id);
}

export function hasGoogleServiceScopes(granted: string[], service: GoogleServiceDefinition) {
  const set = new Set(granted);
  return service.scopes.every((scope) => set.has(scope));
}
