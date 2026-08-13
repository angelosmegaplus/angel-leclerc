import { supabase } from "@/integrations/supabase/client";

export type FieldType =
  | "text"
  | "textarea"
  | "date"
  | "datetime"
  | "select"
  | "url"
  | "email"
  | "tel"
  | "number"
  | "tags";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  help?: string;
  full?: boolean;
};

export type Row = Record<string, unknown> & { id: string; created_at?: string };

/** Tables Angel OS gérées par le module CRUD générique. */
export type AngelTable =
  | "projects"
  | "project_tasks"
  | "applications"
  | "contacts_sources"
  | "reportages"
  | "interviews"
  | "investigations"
  | "press_review"
  | "notifications"
  | "activity_log"
  | "ai_messages";

const anyDb = supabase as unknown as {
  from: (t: string) => any;
};

export async function listRows(table: AngelTable, orderBy = "created_at"): Promise<Row[]> {
  const { data, error } = await anyDb
    .from(table)
    .select("*")
    .order(orderBy, { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as Row[];
}

export async function upsertRow(
  table: AngelTable,
  values: Record<string, unknown>,
  id?: string | null,
): Promise<Row> {
  const query = id
    ? anyDb.from(table).update(values).eq("id", id).select().single()
    : anyDb.from(table).insert(values).select().single();
  const { data, error } = await query;
  if (error) throw error;
  return data as Row;
}

export async function deleteRow(table: AngelTable, id: string) {
  const { error } = await anyDb.from(table).delete().eq("id", id);
  if (error) throw error;
}

/** Journalise une action ; ne bloque jamais l'opération principale. */
export async function logActivity(
  action: string,
  entityType: string,
  entityId?: string | null,
  details: Record<string, unknown> = {},
  source: "user" | "ai" | "system" = "user",
) {
  try {
    await anyDb.from("activity_log").insert({
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      details,
      source,
    });
  } catch {
    /* journalisation non bloquante */
  }
}

export function fmtDate(value: unknown): string {
  if (!value || typeof value !== "string") return "";
  const d = new Date(value.length <= 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function str(row: Row, key: string): string {
  const v = row[key];
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export function tagsOf(row: Row, key = "tags"): string[] {
  const v = row[key];
  return Array.isArray(v) ? v.filter((t): t is string => typeof t === "string") : [];
}

// ---------- Schémas de champs ----------

const S = (value: string, label: string) => ({ value, label });

export const PROJECT_STATUSES = [
  S("idee", "Idée"),
  S("a_faire", "À faire"),
  S("en_cours", "En cours"),
  S("en_attente", "En attente"),
  S("termine", "Terminé"),
  S("archive", "Archivé"),
];

export const PRIORITIES = [S("basse", "Basse"), S("normale", "Normale"), S("haute", "Haute")];

export const APPLICATION_STATUSES = [
  S("a_envoyer", "À envoyer"),
  S("envoyee", "Envoyée"),
  S("relance", "Relancée"),
  S("entretien", "Entretien"),
  S("acceptee", "Acceptée"),
  S("refusee", "Refusée"),
  S("sans_reponse", "Sans réponse"),
];

export const APPLICATION_CITIES = [
  "Sarlat-la-Canéda",
  "Périgueux",
  "Brive-la-Gaillarde",
  "Bergerac",
];

export const projectFields: Field[] = [
  { name: "title", label: "Titre", type: "text", required: true, full: true },
  { name: "status", label: "Statut", type: "select", options: PROJECT_STATUSES },
  { name: "priority", label: "Priorité", type: "select", options: PRIORITIES },
  { name: "due_date", label: "Échéance", type: "date" },
  { name: "client_name", label: "Client / structure", type: "text" },
  { name: "description", label: "Description", type: "textarea", full: true },
  { name: "notes", label: "Notes", type: "textarea", full: true },
];

export const alcProjectFields: Field[] = [
  ...projectFields,
  { name: "amount_cents", label: "Montant (centimes)", type: "number" },
  {
    name: "payment_status",
    label: "Paiement",
    type: "select",
    options: [
      S("", "—"),
      S("devis", "Devis envoyé"),
      S("acompte", "Acompte reçu"),
      S("solde", "Soldé"),
    ],
  },
];

export const taskFields: Field[] = [
  { name: "title", label: "Tâche", type: "text", required: true, full: true },
  {
    name: "status",
    label: "Statut",
    type: "select",
    options: [
      S("a_faire", "À faire"),
      S("en_cours", "En cours"),
      S("en_attente", "En attente"),
      S("termine", "Terminé"),
    ],
  },
  { name: "priority", label: "Priorité", type: "select", options: PRIORITIES },
  { name: "due_date", label: "Échéance", type: "date" },
  { name: "notes", label: "Notes", type: "textarea", full: true },
];

export const applicationFields: Field[] = [
  { name: "company", label: "Entreprise", type: "text", required: true },
  { name: "city", label: "Ville", type: "text" },
  { name: "position", label: "Poste", type: "text" },
  { name: "status", label: "Statut", type: "select", options: APPLICATION_STATUSES },
  { name: "contact_name", label: "Contact", type: "text" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "phone", label: "Téléphone", type: "tel" },
  { name: "sent_at", label: "Date d'envoi", type: "date" },
  { name: "follow_up_at", label: "Relance prévue", type: "date" },
  { name: "document_url", label: "Document (URL)", type: "url" },
  { name: "response", label: "Réponse reçue", type: "textarea", full: true },
  { name: "notes", label: "Notes", type: "textarea", full: true },
];

export const contactFields: Field[] = [
  { name: "last_name", label: "Nom", type: "text", required: true },
  { name: "first_name", label: "Prénom", type: "text" },
  { name: "organization", label: "Organisation", type: "text" },
  { name: "role", label: "Fonction", type: "text" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "phone", label: "Téléphone", type: "tel" },
  {
    name: "kind",
    label: "Type",
    type: "select",
    options: [S("contact", "Contact"), S("source", "Source"), S("client", "Client")],
  },
  { name: "tags", label: "Étiquettes", type: "tags" },
  { name: "notes", label: "Notes", type: "textarea", full: true },
];

export const reportageFields: Field[] = [
  { name: "title", label: "Titre", type: "text", required: true, full: true },
  {
    name: "status",
    label: "Statut",
    type: "select",
    options: [
      S("idee", "Idée"),
      S("en_cours", "En cours"),
      S("a_rediger", "À rédiger"),
      S("publie", "Publié"),
    ],
  },
  { name: "event_date", label: "Date", type: "date" },
  { name: "location", label: "Lieu", type: "text" },
  { name: "media_url", label: "Média (URL)", type: "url" },
  { name: "tags", label: "Étiquettes", type: "tags" },
  { name: "notes", label: "Notes de terrain", type: "textarea", full: true },
];

export const interviewFields: Field[] = [
  { name: "title", label: "Titre", type: "text", required: true },
  { name: "person", label: "Personne interrogée", type: "text" },
  {
    name: "status",
    label: "Statut",
    type: "select",
    options: [
      S("a_preparer", "À préparer"),
      S("enregistre", "Enregistré"),
      S("transcrit", "Transcrit"),
      S("valide", "Validé"),
    ],
  },
  { name: "scheduled_at", label: "Date et heure", type: "datetime" },
  { name: "media_url", label: "Média (URL)", type: "url" },
  { name: "questions", label: "Questions", type: "textarea", full: true },
  { name: "notes", label: "Notes", type: "textarea", full: true },
];

export const investigationFields: Field[] = [
  { name: "title", label: "Titre", type: "text", required: true },
  {
    name: "status",
    label: "Statut",
    type: "select",
    options: [
      S("ouverte", "Ouverte"),
      S("en_cours", "En cours"),
      S("en_pause", "En pause"),
      S("close", "Close"),
    ],
  },
  { name: "summary", label: "Résumé", type: "textarea", full: true },
  {
    name: "facts",
    label: "Faits vérifiés",
    type: "textarea",
    full: true,
    help: "Uniquement ce qui est sourcé et confirmé.",
  },
  {
    name: "hypotheses",
    label: "Hypothèses à vérifier",
    type: "textarea",
    full: true,
    help: "Pistes non confirmées — à ne jamais publier telles quelles.",
  },
  { name: "timeline", label: "Chronologie", type: "textarea", full: true },
  { name: "notes", label: "Notes", type: "textarea", full: true },
];

export const pressReviewFields: Field[] = [
  { name: "title", label: "Titre", type: "text", required: true },
  { name: "source", label: "Média / source", type: "text" },
  { name: "url", label: "Adresse web", type: "url", full: true },
  { name: "tags", label: "Étiquettes", type: "tags" },
  { name: "notes", label: "Notes", type: "textarea", full: true },
];

/** Badges éditoriaux proposables (distincts des catégories thématiques). */
export const EDITORIAL_BADGES = [
  "Analyse",
  "Opinion",
  "Décryptage",
  "Local",
  "Sarlat",
  "Dordogne",
  "Technologie",
  "IA",
  "Culture",
  "Religion",
  "International",
  "Mise à jour",
  "À lire",
] as const;
