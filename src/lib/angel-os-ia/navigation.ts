export type AngelNavigationTarget = {
  tab: string;
  label: string;
  detail: string;
  aliases: string[];
  group: "Page" | "Section" | "Outil";
  anchor?: string;
};

export const ANGEL_NAVIGATION_TARGETS: AngelNavigationTarget[] = [
  { tab: "dashboard", label: "Vue d'ensemble", detail: "Accueil de l'administration", aliases: ["accueil", "home", "tableau de bord", "aujourd'hui", "aperçu"], group: "Page" },
  { tab: "angel-ai", label: "IA Flamme OS", detail: "Assistant et conversation privée", aliases: ["ia", "assistant", "discussion", "chat", "flamme os ia", "angel os ia"], group: "Page" },
  { tab: "etudes-travail", label: "Études & Travail", detail: "BTS Communication CNED, emploi, intérim, organisation et mobilité", aliases: ["études", "etudes", "cned", "bts", "bts communication", "travail", "emploi", "intérim", "interim", "mobilité", "mobilite", "planning"], group: "Page" },
  { tab: "etudes-travail", label: "Archives des candidatures", detail: "Historique des candidatures conservé comme archive", aliases: ["anciennes candidatures", "archives candidatures", "historique alternance"], group: "Section", anchor: "archives" },
  { tab: "messages", label: "Messages & contacts", detail: "Demandes reçues depuis le site et suivi des échanges", aliases: ["messages", "contacts", "demandes reçues", "conversations", "échanges", "echanges"], group: "Page" },
  { tab: "boite-mail", label: "Boîte mail", detail: "Mails et Gmail", aliases: ["mail", "email", "gmail", "courriels", "boite mail"], group: "Page" },
  { tab: "boite-mail", label: "Mails importants", detail: "Messages importants et réponses à traiter", aliases: ["mails importants", "emails importants", "réponses mails", "mail urgent"], group: "Section", anchor: "important" },
  { tab: "articles", label: "Articles", detail: "Articles et publications du blog", aliases: ["article", "blog", "publications"], group: "Page" },
  { tab: "articles", label: "Éditeur d’article", detail: "Créer ou modifier un article", aliases: ["éditeur", "editeur", "éditeur article", "nouvel article", "modifier article", "rédiger article"], group: "Outil", anchor: "editor" },
  { tab: "agenda", label: "Agenda", detail: "Calendrier et prochains rendez-vous", aliases: ["calendrier", "rendez-vous", "rdv", "planning"], group: "Page" },
  { tab: "agenda", label: "Prochain rendez-vous", detail: "Événement ou rendez-vous à venir", aliases: ["prochain rdv", "prochain rendez vous", "prochain événement", "prochain evenement"], group: "Section", anchor: "next-event" },
  { tab: "fichiers", label: "Fichiers", detail: "Documents, médias et stockage", aliases: ["documents", "stockage", "pdf", "pièces jointes", "medias"], group: "Page" },
  { tab: "fichiers", label: "Stockage Google Drive", detail: "Archives lourdes et stockage hybride Drive", aliases: ["drive", "google drive", "stockage drive", "archive drive", "gros fichiers"], group: "Section", anchor: "drive" },
  { tab: "studio", label: "Studio", detail: "Journalisme, audio et production", aliases: ["radio", "audio", "reportage", "interview", "journalisme", "production"], group: "Page" },
  { tab: "studio", label: "Interviews", detail: "Préparation et suivi des interviews", aliases: ["interviews", "interview", "invités", "invites"], group: "Section", anchor: "interviews" },
  { tab: "studio", label: "Reportages", detail: "Reportages et sujets journalistiques", aliases: ["reportages", "reportage", "sujets"], group: "Section", anchor: "reportages" },
  { tab: "projets", label: "Projets", detail: "Projets et tâches", aliases: ["projet", "tâches", "taches", "todo"], group: "Page" },
  { tab: "activite", label: "Activité", detail: "Journal d'activité Flamme OS et suivi des actions", aliases: ["historique", "logs", "journal", "activité", "actions récentes", "activite"], group: "Page" },
  { tab: "connexions", label: "Connexions", detail: "État des services connectés", aliases: ["services", "oauth", "google", "github", "vercel", "connexion"], group: "Page" },
  { tab: "connexions", label: "État de l’IA", detail: "Clé IA et disponibilité du module IA de Flamme OS", aliases: ["openai", "clé openai", "cle openai", "openai api key", "api key", "clé ia", "etat ia"], group: "Section", anchor: "openai" },
  { tab: "connexions", label: "État Vercel", detail: "Publication et disponibilité Vercel", aliases: ["vercel", "publication vercel", "déploiement vercel", "deploiement vercel"], group: "Section", anchor: "vercel" },
  { tab: "connexions", label: "État GitHub", detail: "Dépôt, CI et publications GitHub", aliases: ["github", "ci github", "actions github", "dépôt github", "depot github"], group: "Section", anchor: "github" },
  { tab: "notifications", label: "Notifications", detail: "Alertes, événements importants et éléments à traiter", aliases: ["alertes", "notifications", "important", "événements", "evenements"], group: "Page" },
  { tab: "automatisation", label: "Automatisations", detail: "Tâches et exécutions planifiées", aliases: ["automatisation", "cron", "tâches planifiées", "planification"], group: "Page" },
  { tab: "automatisation", label: "Tâches en attente", detail: "Exécutions planifiées ou en attente", aliases: ["tâches en attente", "file attente", "queue", "travaux en attente"], group: "Section", anchor: "queue" },
  { tab: "stats", label: "Statistiques", detail: "Mesures et audience", aliases: ["stats", "statistiques", "analytics", "audience"], group: "Page" },
  { tab: "contenus", label: "Parcours & services", detail: "Contenus structurants du site", aliases: ["parcours", "services", "contenus"], group: "Page" },
  { tab: "avis", label: "Avis et soutiens", detail: "Avis publiés et soutiens", aliases: ["avis", "soutiens", "témoignages", "temoignages"], group: "Page" },
  { tab: "abonnes", label: "Contacts & abonnés", detail: "Abonnés, newsletter et contacts suivis depuis l’administration", aliases: ["abonnés", "abonnes", "newsletter", "contacts", "inscrits"], group: "Page" },
  { tab: "boutique", label: "Boutique", detail: "Produits et commandes", aliases: ["boutique", "shop", "commandes"], group: "Page" },
  { tab: "dashboard", label: "Films pour ce soir", detail: "Sélection personnelle Films & Séries", aliases: ["movix", "films ce soir", "film pour ce soir", "3 films", "recommandations films"], group: "Outil", anchor: "movix" },
  { tab: "dashboard", label: "Actualités personnalisées", detail: "Fil d’actualité de Flamme OS", aliases: ["actualités", "actualites", "news", "à la une", "a la une"], group: "Section", anchor: "news" },
  { tab: "dashboard", label: "Focus du jour", detail: "Priorités calculées par l’IA de Flamme OS", aliases: ["focus", "priorités", "priorites", "à faire aujourd'hui", "a faire aujourd hui"], group: "Section", anchor: "angel-os-ia-focus" },
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function navigationScore(query: string, target: AngelNavigationTarget) {
  const q = normalize(query);
  if (!q) return 0;
  const label = normalize(target.label);
  const detail = normalize(target.detail);
  const aliases = target.aliases.map(normalize);
  if (q === label || aliases.includes(q)) return 100;
  if (label.startsWith(q)) return 90;
  if (aliases.some((alias) => alias.startsWith(q))) return 84;
  if (label.includes(q)) return 78;
  if (aliases.some((alias) => alias.includes(q))) return 72;
  const words = q.split(" ").filter((word) => word.length > 1);
  const haystack = `${label} ${detail} ${aliases.join(" ")}`;
  const matched = words.filter((word) => haystack.includes(word)).length;
  if (!matched) return 0;
  return Math.round((matched / words.length) * 65);
}

export function searchNavigationTargets(query: string, limit = 8) {
  return ANGEL_NAVIGATION_TARGETS
    .map((target) => ({ target, score: navigationScore(query, target) }))
    .filter((item) => item.score >= 35)
    .sort((a, b) => b.score - a.score || (a.target.group === "Page" ? -1 : 1) || a.target.label.localeCompare(b.target.label, "fr"))
    .slice(0, limit);
}

export function resolveNavigationIntent(query: string) {
  const normalized = normalize(query);
  const looksLikeNavigation = /\b(ouvre|ouvrir|va|aller|affiche|montre|trouve|emmene|emmener|page|section|onglet)\b/.test(normalized);
  const best = searchNavigationTargets(query, 1)[0];
  if (!best) return null;
  if (best.score >= 82 || (looksLikeNavigation && best.score >= 45)) return best;
  return null;
}

export function looksLikeNaturalLanguage(query: string) {
  const trimmed = query.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  return words.length >= 5 || /[?!]/.test(trimmed) || /\b(comment|pourquoi|peux tu|est ce que|je voudrais|j aimerais|fais|cherche|analyse|explique)\b/i.test(trimmed);
}
