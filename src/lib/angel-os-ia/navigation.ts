export type AngelNavigationTarget = {
  tab: string;
  label: string;
  detail: string;
  aliases: string[];
  group: "Page" | "Section" | "Outil";
};

export const ANGEL_NAVIGATION_TARGETS: AngelNavigationTarget[] = [
  { tab: "dashboard", label: "Vue d'ensemble", detail: "Accueil de l'administration", aliases: ["accueil", "home", "tableau de bord", "aujourd'hui", "aperçu"], group: "Page" },
  { tab: "angel-ai", label: "Angel OS IA", detail: "Assistant et conversation privée", aliases: ["ia", "assistant", "discussion", "chat", "angel os ia"], group: "Page" },
  { tab: "candidatures", label: "Candidatures", detail: "Alternance et suivi des candidatures", aliases: ["alternance", "emploi", "recrutement", "relances", "entreprises"], group: "Page" },
  { tab: "messages", label: "Messages", detail: "Demandes reçues depuis le site", aliases: ["messages", "contacts", "demandes reçues"], group: "Page" },
  { tab: "boite-mail", label: "Boîte mail", detail: "Mails et Gmail", aliases: ["mail", "email", "gmail", "courriels", "boite mail"], group: "Page" },
  { tab: "articles", label: "Articles", detail: "Articles et publications du blog", aliases: ["article", "blog", "publications", "éditeur", "editeur"], group: "Page" },
  { tab: "agenda", label: "Agenda", detail: "Calendrier et prochains rendez-vous", aliases: ["calendrier", "rendez-vous", "rdv", "planning"], group: "Page" },
  { tab: "fichiers", label: "Fichiers", detail: "Documents, médias et stockage", aliases: ["documents", "drive", "stockage", "pdf", "pièces jointes", "medias"], group: "Page" },
  { tab: "studio", label: "Studio", detail: "Journalisme, audio et production", aliases: ["radio", "audio", "reportage", "interview", "journalisme", "production"], group: "Page" },
  { tab: "projets", label: "Projets", detail: "Projets et tâches", aliases: ["projet", "tâches", "taches", "todo"], group: "Page" },
  { tab: "activite", label: "Activité", detail: "Journal d'activité Angel OS", aliases: ["historique", "logs", "journal", "activité"], group: "Page" },
  { tab: "connexions", label: "Connexions", detail: "État des services connectés", aliases: ["services", "oauth", "openai", "google", "github", "vercel", "connexion"], group: "Page" },
  { tab: "notifications", label: "Notifications", detail: "Alertes et notifications", aliases: ["alertes", "notifications", "important"], group: "Page" },
  { tab: "automatisation", label: "Automatisations", detail: "Tâches et exécutions planifiées", aliases: ["automatisation", "cron", "tâches planifiées", "planification"], group: "Page" },
  { tab: "stats", label: "Statistiques", detail: "Mesures et audience", aliases: ["stats", "statistiques", "analytics", "audience"], group: "Page" },
  { tab: "contenus", label: "Parcours & services", detail: "Contenus structurants du site", aliases: ["parcours", "services", "contenus"], group: "Page" },
  { tab: "avis", label: "Avis et soutiens", detail: "Avis publiés et soutiens", aliases: ["avis", "soutiens", "témoignages", "temoignages"], group: "Page" },
  { tab: "abonnes", label: "Abonnés", detail: "Abonnés et communauté", aliases: ["abonnés", "abonnes", "newsletter", "communauté"], group: "Page" },
  { tab: "boutique", label: "Boutique", detail: "Produits et commandes", aliases: ["boutique", "shop", "commandes"], group: "Page" },
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
    .sort((a, b) => b.score - a.score || a.target.label.localeCompare(b.target.label, "fr"))
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
