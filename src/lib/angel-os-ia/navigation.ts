export type AngelNavigationTarget = {
  tab: string;
  label: string;
  detail: string;
  aliases: string[];
  group: "Page" | "Section" | "Outil";
  anchor?: string;
};

export const ANGEL_NAVIGATION_TARGETS: AngelNavigationTarget[] = [
  { tab: "dashboard", label: "Accueil", detail: "Vue d’ensemble de Flamme OS", aliases: ["accueil", "home", "tableau de bord", "aujourd'hui", "aperçu"], group: "Page" },
  { tab: "agenda", label: "Agenda", detail: "Google Calendar, rendez-vous, planning et échéances", aliases: ["agenda", "calendrier", "rendez-vous", "rdv", "planning", "semaine", "journée"], group: "Page" },
  { tab: "agenda", label: "Planning du jour", detail: "Rendez-vous et échéances de la journée", aliases: ["aujourd'hui", "planning aujourd'hui", "journée", "programme du jour"], group: "Section" },
  { tab: "projets", label: "Projets", detail: "Projets professionnels et personnels, tâches et échéances", aliases: ["projets", "projet", "tâches", "taches", "todo", "échéances", "echeances"], group: "Page" },
  { tab: "messages", label: "Messages", detail: "Demandes reçues et contacts à traiter", aliases: ["messages", "contacts", "demandes reçues", "demandes"], group: "Page" },
  { tab: "boite-mail", label: "Mail", detail: "Boîte mail et Gmail", aliases: ["mail", "email", "gmail", "courriels", "boite mail", "boîte mail"], group: "Page" },
  { tab: "boite-mail", label: "Mails importants", detail: "Messages importants et réponses à traiter", aliases: ["mails importants", "emails importants", "réponses mails", "mail urgent"], group: "Section", anchor: "important" },
  { tab: "fichiers", label: "Fichiers", detail: "Documents, médias, stockage et Google Drive", aliases: ["documents", "stockage", "pdf", "pièces jointes", "medias", "drive", "google drive"], group: "Page" },
  { tab: "articles", label: "Articles", detail: "Articles et publications du site", aliases: ["article", "blog", "publications", "contenus"], group: "Page" },
  { tab: "articles", label: "Éditeur d’article", detail: "Créer ou modifier un article", aliases: ["éditeur", "editeur", "éditeur article", "nouvel article", "modifier article", "rédiger article"], group: "Outil", anchor: "editor" },
  { tab: "contenus", label: "Contenus du site", detail: "Parcours, services et contenus structurants", aliases: ["parcours", "services", "contenus", "site"], group: "Page" },
  { tab: "studio", label: "Studio", detail: "Journalisme, audio et production", aliases: ["studio", "radio", "audio", "reportage", "interview", "journalisme", "production"], group: "Page" },
  { tab: "studio", label: "Interviews", detail: "Préparation et suivi des interviews", aliases: ["interviews", "interview", "invités", "invites"], group: "Section", anchor: "interviews" },
  { tab: "studio", label: "Reportages", detail: "Reportages et sujets journalistiques", aliases: ["reportages", "reportage", "sujets"], group: "Section", anchor: "reportages" },
  { tab: "automatisation", label: "Automatisations", detail: "Tâches et exécutions planifiées", aliases: ["automatisation", "automatisations", "cron", "tâches planifiées", "planification"], group: "Page" },
  { tab: "automatisation", label: "Tâches en attente", detail: "Exécutions planifiées ou en attente", aliases: ["tâches en attente", "file attente", "queue", "travaux en attente"], group: "Section", anchor: "queue" },
  { tab: "connexions", label: "Connexions", detail: "Google, GitHub, déploiement et services connectés", aliases: ["services", "oauth", "google", "github", "vercel", "connexion", "connexions"], group: "Page" },
  { tab: "connexions", label: "Google Calendar", detail: "État de la connexion Google Agenda", aliases: ["google calendar", "google agenda", "agenda google", "calendar"], group: "Section", anchor: "calendar" },
  { tab: "connexions", label: "Gmail", detail: "État de la connexion Gmail", aliases: ["gmail", "mail google", "google mail"], group: "Section", anchor: "gmail" },
  { tab: "connexions", label: "Google Drive", detail: "État de la connexion Google Drive", aliases: ["drive", "google drive", "stockage drive"], group: "Section", anchor: "drive" },
  { tab: "notifications", label: "Notifications", detail: "Alertes importantes de Flamme OS", aliases: ["alertes", "notifications", "important"], group: "Page" },
  { tab: "activite", label: "Activité", detail: "Journal d’activité de Flamme OS", aliases: ["historique", "logs", "journal", "activité"], group: "Page" },
  { tab: "stats", label: "Statistiques", detail: "Mesures, audience et activité", aliases: ["stats", "statistiques", "analytics", "audience"], group: "Page" },
  { tab: "abonnes", label: "Contacts & abonnés", detail: "Contacts, abonnés et newsletter", aliases: ["abonnés", "abonnes", "newsletter", "contacts"], group: "Page" },
  { tab: "avis", label: "Avis", detail: "Avis publiés et soutiens", aliases: ["avis", "soutiens", "témoignages", "temoignages"], group: "Page" },
  { tab: "boutique", label: "Boutique", detail: "Produits et commandes", aliases: ["boutique", "shop", "commandes"], group: "Page" },
  { tab: "parametres", label: "Paramètres", detail: "Préférences et réglages de Flamme OS", aliases: ["paramètres", "parametres", "réglages", "reglages", "settings"], group: "Page" },
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
