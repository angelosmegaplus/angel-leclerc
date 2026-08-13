/**
 * Transforme une erreur Supabase/PostgREST en message français explicite,
 * en conservant le détail technique exact pour le diagnostic.
 */
export function describeDbError(err: unknown): string {
  if (!err) return "Erreur inconnue.";

  const e = err as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
    status?: number;
    error_description?: string;
  };

  const raw = e.message || e.error_description || (typeof err === "string" ? err : "") || "";
  const code = e.code ? String(e.code) : "";

  let explanation = "";
  if (raw.includes("duplicate key") || code === "23505") {
    explanation = "Un article utilise déjà ce lien (slug). Changez le titre ou le slug.";
  } else if (code === "42501" || raw.toLowerCase().includes("row-level security")) {
    explanation =
      "Vous n'avez pas les droits pour cette action (compte non administrateur ou session expirée). Déconnectez-vous puis reconnectez-vous.";
  } else if (code === "23502") {
    explanation = "Un champ obligatoire est vide.";
  } else if (code === "23503") {
    explanation = "Référence invalide vers une autre donnée.";
  } else if (code === "22P02") {
    explanation = "Une valeur a un format invalide (date ou identifiant).";
  } else if (code === "PGRST204" || raw.includes("schema cache")) {
    explanation =
      "Une colonne attendue est absente de la base. La structure doit être mise à jour.";
  } else if (e.status === 401 || raw.includes("JWT")) {
    explanation = "Session expirée. Reconnectez-vous pour enregistrer.";
  } else if (raw.toLowerCase().includes("failed to fetch")) {
    explanation = "Connexion au serveur impossible. Vérifiez votre réseau.";
  }

  const technical = [
    code ? `code ${code}` : "",
    raw,
    e.details ? `détail : ${e.details}` : "",
    e.hint ? `piste : ${e.hint}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return explanation ? `${explanation} (${technical})` : technical || "Erreur inconnue.";
}
