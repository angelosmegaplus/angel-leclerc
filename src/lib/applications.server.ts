import { getAccessToken } from "./oauth/oauth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type DatabaseClient = SupabaseClient<Database>;
type ApplicationUpdate = Database["public"]["Tables"]["applications"]["Update"];

type GmailMessage = {
  id: string;
  threadId: string;
  internalDate?: string;
  snippet?: string;
  payload?: { headers?: Array<{ name?: string; value?: string }> };
};

type ImportedApplication = {
  company: string;
  city: string | null;
  position: string;
  email: string | null;
  sent_at: string;
  follow_up_at: string | null;
  response: string | null;
  status: "envoyee" | "refusee";
  notes: string;
};

const RECIPIENT_COMPANIES: Record<string, string> = {
  "reservation@surehotel-sarlat.com": "Sure Hotel Sarlat",
  "recrutement@huttopia.com": "Huttopia Sarlat",
  "contact@camping-sarlat.com": "Camping Le Montant",
  "bvperigueux@hotmail.fr": "Bureau Vallée Périgueux",
  "leboudoirdu9@gmail.com": "Le Boudoir du 9",
  "bonjour@perimomes.com": "Périmômes",
  "eboutique@em-store.fr": "EM Store",
  "laboutique@laboutique-perigueux.fr": "La Boutique Périgueux",
  "ffriquet@cherie.fm": "Chérie FM Dordogne",
  "recrutement@ch-sarlat.fr": "Centre Hospitalier de Sarlat",
  "candidature@24.cerfrance.fr": "Cerfrance Sarlat",
  "communication@ats-sarlat.com": "ATS Ticketing",
  "contact@plaza-madeleine.com": "Plaza Madeleine",
  "pierre.delbourg@scaso.fr": "E.Leclerc Sarlat",
  "marliac@sarlat.leclerc": "E.Leclerc Sarlat",
  "contact@lecomptoirauthentique.com": "Le Comptoir Authentique",
  "contact@cellierduperigord.com": "Cellier du Périgord",
  "biocoopsarlat.contact@gmail.com": "Biocoop Sarlat",
  "recrutement@action.fr": "Action Sarlat",
  "julien.farinotti@decathlon.com": "Decathlon Sarlat",
  "contact@pepper-and-salt.fr": "Pepper & Salt",
  "info@sarlmaxima.com": "Sarl Maxima",
  "darty.sarlat@gmail.com": "Darty Sarlat",
  "recrutement@lidl.fr": "Lidl",
  "k.veyret@sarlat-tourisme.com": "Office de tourisme Sarlat",
  "recrutement@sarlat-tourisme.com": "Office de tourisme Sarlat",
  "communication@sarlat.fr": "Mairie de Sarlat",
  "service.grh@sarlat.fr": "Mairie de Sarlat",
  "pdv10720@mousquetaires.com": "Intermarché Sarlat",
  "alexis.piaton@radiofrance.com": "ici Périgord",
  "iciperigord@radiofrance.com": "ici Périgord",
  "infosaquariumperigord@gmail.com": "Aquarium du Périgord Noir",
  "contact@aquariumperigordnoir.fr": "Aquarium du Périgord Noir",
  "contact@cgrcinemas.fr": "CGR Cinémas",
  "direction@lebournat.fr": "Le Bournat",
  "contact@eyrignac.com": "Jardins d'Eyrignac",
  "grottes.de.cougnac@wanadoo.fr": "Grottes de Cougnac",
  "contact@lascaux.fr": "Lascaux",
  "contact@milandes.com": "Château des Milandes",
  "chateau@castelnaud.com": "Château de Castelnaud",
  "recrutement@kleber-rossillon.com": "Jardins de Marqueyssac",
  "chateau-de-puymartin@orange.fr": "Château de Puymartin",
  "c.terlizzi@vallee-dordogne.com": "Vallée de la Dordogne",
  "julien.robert@cinerex.fr": "Ciné Rex",
  "festival@festival-theatre-sarlat.com": "Festival des Jeux du Théâtre de Sarlat",
  "contact@sarlat-centreculturel.com": "Centre culturel de Sarlat",
  "centreculturel@sarlat.fr": "Centre culturel de Sarlat",
  "totem@radiototem.net": "Radio Totem",
  "contact@corailradio.com": "Corail Radio",
  "contact@radioslibresenperigord.com": "Radios Libres en Périgord",
  "studio.cahors@antenne-d-oc.fr": "Antenne d'Oc",
  "secretariat@antenne-d-oc.fr": "Antenne d'Oc",
  "direction@antenne-d-oc.fr": "Antenne d'Oc",
  "contact@happyradio.fr": "Happy Radio",
  "rvv@radiovalleevezere.com": "Radio Vallée Vézère",
  "tourisme@paysdefenelon.fr": "Office de tourisme du Pays de Fénelon",
  "lesarenesdebriveloisirs@gmail.com": "Les Arènes de Brive",
};

const GENERIC_MAIL_DOMAINS = new Set([
  "gmail.com",
  "hotmail.com",
  "hotmail.fr",
  "outlook.com",
  "outlook.fr",
  "orange.fr",
  "wanadoo.fr",
  "yahoo.com",
  "yahoo.fr",
  "laposte.net",
]);

function header(message: GmailMessage, name: string): string {
  return (
    message.payload?.headers?.find((item) => item.name?.toLowerCase() === name.toLowerCase())
      ?.value ?? ""
  );
}

function emailOf(value: string): string | null {
  const match = value.match(/<([^>]+@[^>]+)>/) ?? value.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
  return (match?.[1] ?? match?.[0] ?? "").toLowerCase() || null;
}

function cleanSubject(subject: string): string {
  return subject.replace(/^(re|tr|fwd?)\s*:\s*/i, "").trim();
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeCompany(value: string): boolean {
  const cleaned = value.replace(/^[-–—:|\s]+|[-–—:|\s]+$/g, "").trim();
  if (cleaned.length < 3 || cleaned.length > 80) return false;
  const normalized = normalizeText(cleaned);
  if (/^a-?\d{4}-\d+$/i.test(cleaned)) return false;
  if (/^(sarlat(?:-la-caneda)?|brive(?:-la-gaillarde)?|perigueux|bergerac|dordogne|marsac-sur-l'isle|monpazier)$/i.test(normalized)) return false;
  if (/^(septembre|octobre|novembre|decembre|janvier|fevrier|mars|avril|mai|juin|juillet|aout)\s+20\d{2}$/i.test(normalized)) return false;
  if (/^(candidature|alternance|candidature spontanee|retour concernant les offres d'alternance)$/i.test(normalized)) return false;
  if (/^(animateur|animateur bafa|community manager|chargee? de communication(?: \/ graphisme)?|marketing(?: &| et)? communication)$/i.test(normalized)) return false;
  if (/\b(bts communication|en alternance|alternance bts|candidature spontanee|offre d'alternance|contrat d'apprentissage)\b/i.test(normalized)) return false;
  return true;
}

function companyFromDomain(recipient: string | null): string | null {
  if (!recipient) return null;
  const domain = recipient.split("@")[1]?.toLowerCase();
  if (!domain || GENERIC_MAIL_DOMAINS.has(domain)) return null;
  const root = domain.split(".")[0];
  if (!root || /^(mail|email|contact|recrutement|info|bonjour|service)$/i.test(root)) return null;
  return root
    .split(/[-_]/)
    .filter(Boolean)
    .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
    .join(" ");
}

function companyOf(subject: string, recipient: string | null): string {
  if (recipient && RECIPIENT_COMPANIES[recipient]) return RECIPIENT_COMPANIES[recipient];

  const cleaned = cleanSubject(subject)
    .replace(/\b(?:objet\s*:\s*)?/gi, "")
    .replace(/\bcandidature\s+(?:spontanée\s+)?(?:pour\s+)?/gi, "")
    .replace(/\b(?:pour|en vue d['’]une)\s+alternance\b/gi, "")
    .replace(/\bbts\s+communication\b/gi, "")
    .replace(/\b(?:contrat d['’]apprentissage|apprentissage)\b/gi, "")
    .replace(/[–—|:]+/g, " - ")
    .replace(/\s+-\s+/g, " - ")
    .trim();

  const pieces = cleaned
    .split(/\s+-\s+/)
    .map((piece) => piece.trim())
    .filter(Boolean);

  const explicit = [...pieces].reverse().find(looksLikeCompany);
  if (explicit) return explicit;

  return companyFromDomain(recipient) ?? "Entreprise à identifier";
}

function cityOf(text: string): string | null {
  const normalized = normalizeText(text);
  if (normalized.includes("sarlat")) return "Sarlat-la-Canéda";
  if (normalized.includes("perigueux") || normalized.includes("marsac")) return "Périgueux";
  if (normalized.includes("brive")) return "Brive-la-Gaillarde";
  if (normalized.includes("bergerac")) return "Bergerac";
  return null;
}

function isoDate(message: GmailMessage): string {
  const raw = header(message, "Date");
  const date = raw ? new Date(raw) : new Date(Number(message.internalDate ?? Date.now()));
  return (Number.isNaN(date.getTime()) ? new Date() : date).toISOString().slice(0, 10);
}

function followUpDate(sentAt: string): string {
  const date = new Date(`${sentAt}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 10);
  return date.toISOString().slice(0, 10);
}

function rejection(text: string): boolean {
  return /malheureusement|au regret|ne (?:pouvons|pourrons|sommes) pas|pas (?:en mesure|de poste|de place)|pas donner suite|pas y répondre favorablement|candidature non retenue|refus|ne sera pas retenue|ne prenons pas d.alternant/i.test(
    text,
  );
}

function cleanReplyText(value: string): string {
  return value
    .replace(/<!doctype[^>]*>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function isInvalidReply(value: unknown): boolean {
  const text = String(value ?? "").toLowerCase();
  return (
    text.includes("<!doctype html") ||
    text.includes("this page didn't load") ||
    text.includes("something went wrong on our end") ||
    text.includes("id-preview-") ||
    text.includes("lovable.app")
  );
}

async function gmailGet<T>(token: string, path: string, params?: URLSearchParams): Promise<T> {
  const query = params?.toString();
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me${path}${query ? `?${query}` : ""}`,
    { headers: { Authorization: `Bearer ${token}`, accept: "application/json" } },
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Gmail a refusé la synchronisation (${response.status}) : ${detail.slice(0, 180)}`,
    );
  }
  return (await response.json()) as T;
}

async function messageMetadata(token: string, id: string): Promise<GmailMessage> {
  const params = new URLSearchParams({ format: "metadata" });
  for (const name of ["To", "From", "Subject", "Date"]) params.append("metadataHeaders", name);
  return gmailGet<GmailMessage>(token, `/messages/${id}`, params);
}

async function threadReply(token: string, threadId: string, ownEmail: string) {
  const params = new URLSearchParams({ format: "metadata" });
  for (const name of ["From", "Subject", "Date"]) params.append("metadataHeaders", name);
  const thread = await gmailGet<{ messages?: GmailMessage[] }>(
    token,
    `/threads/${threadId}`,
    params,
  );
  const replies = (thread.messages ?? []).filter((message) => {
    const from = emailOf(header(message, "From"));
    return from && from !== ownEmail.toLowerCase();
  });
  const latest = replies.at(-1);
  if (!latest) return null;
  const summary = cleanReplyText(
    [header(latest, "Subject"), latest.snippet].filter(Boolean).join(" — "),
  ).slice(0, 600);
  if (!summary || isInvalidReply(summary)) return null;
  return { summary, rejected: rejection(summary) };
}

function key(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function shouldRepairCompany(existingCompany: unknown, candidateCompany: string) {
  const current = String(existingCompany ?? "").trim();
  if (!current) return true;
  if (!looksLikeCompany(current)) return true;
  if (current === "Entreprise à identifier" && candidateCompany !== current) return true;
  return false;
}

export type ApplicationSyncResult = {
  status: "completed" | "partial" | "not_connected";
  imported: number;
  updated: number;
  skipped: number;
  message: string;
  syncedAt: string | null;
};

const GMAIL_PAGE_SIZE = 50;
const GMAIL_MAX_MESSAGES = 200;

async function candidateMessageIds(token: string) {
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const remaining = GMAIL_MAX_MESSAGES - ids.length;
    const params = new URLSearchParams({
      q: "in:sent (subject:candidature OR subject:alternance)",
      maxResults: String(Math.min(GMAIL_PAGE_SIZE, remaining)),
    });
    if (pageToken) params.set("pageToken", pageToken);

    const page = await gmailGet<{
      messages?: Array<{ id: string }>;
      nextPageToken?: string;
    }>(token, "/messages", params);
    ids.push(...(page.messages ?? []).map((message) => message.id));
    pageToken = page.nextPageToken;
  } while (pageToken && ids.length < GMAIL_MAX_MESSAGES);

  return { ids, truncated: Boolean(pageToken) };
}

async function candidateMessages(token: string, ids: string[]) {
  const messages: GmailMessage[] = [];
  for (let offset = 0; offset < ids.length; offset += 20) {
    const batch = ids.slice(offset, offset + 20);
    messages.push(...(await Promise.all(batch.map((id) => messageMetadata(token, id)))));
  }
  return messages;
}

export async function syncApplicationsForUser(
  userId: string,
  db: DatabaseClient,
): Promise<ApplicationSyncResult> {
  const token = await getAccessToken(userId, "google");
  if (!token) {
    return {
      status: "not_connected",
      imported: 0,
      updated: 0,
      skipped: 0,
      message: "Connexion Google requise pour la synchronisation automatique.",
      syncedAt: null,
    };
  }

  const profile = await gmailGet<{ emailAddress: string }>(token, "/profile");
  const listed = await candidateMessageIds(token);
  const messages = await candidateMessages(token, listed.ids);
  const originals = messages.filter((message) => {
    const subject = header(message, "Subject");
    return /candidature|alternance/i.test(subject) && !/^(re|tr|fwd?)\s*:/i.test(subject);
  });

  const candidates: ImportedApplication[] = [];
  for (let offset = 0; offset < originals.length; offset += 8) {
    const batch = originals.slice(offset, offset + 8);
    const replies = await Promise.all(
      batch.map((message) => threadReply(token, message.threadId, profile.emailAddress)),
    );
    batch.forEach((message, index) => {
      const subject = header(message, "Subject");
      const email = emailOf(header(message, "To"));
      const sentAt = isoDate(message);
      const reply = replies[index];
      const company = companyOf(subject, email);
      candidates.push({
        company,
        city: cityOf(`${subject} ${company} ${email ?? ""}`),
        position: "Alternance BTS Communication",
        email,
        sent_at: sentAt,
        follow_up_at: reply ? null : followUpDate(sentAt),
        response: reply?.summary ?? null,
        status: reply?.rejected ? "refusee" : "envoyee",
        notes: `Synchronisé automatiquement depuis Gmail. Objet : ${subject}`,
      });
    });
  }

  const { data: rows, error: readError } = await db
    .from("applications")
    .select("id, company, city, position, email, sent_at, follow_up_at, status, response, notes");
  if (readError) throw readError;
  const existing = (rows ?? []) as Array<Record<string, unknown>>;
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const match = existing.find((row) => {
      const sameDate = key(row.sent_at) === key(candidate.sent_at);
      if (candidate.email) return key(row.email) === key(candidate.email) && sameDate;
      return key(row.company) === key(candidate.company) && sameDate;
    });
    if (!match) {
      const { data, error } = await db.from("applications").insert(candidate).select("id").single();
      if (error) throw error;
      existing.push({ id: data.id, ...candidate });
      imported += 1;
      continue;
    }

    const patch: ApplicationUpdate = {};
    const invalidExistingResponse = isInvalidReply(match.response);
    if (invalidExistingResponse) {
      patch.response = candidate.response ?? null;
      patch.follow_up_at = candidate.response ? null : candidate.follow_up_at;
      if (["refusee", "envoyee", "relance"].includes(key(match.status))) {
        patch.status = candidate.status;
      }
    } else if (!match.response && candidate.response) {
      patch.response = candidate.response;
    }
    if (candidate.response && match.follow_up_at) patch.follow_up_at = null;
    if (candidate.status === "refusee" && ["envoyee", "relance"].includes(key(match.status))) {
      patch.status = "refusee";
      patch.follow_up_at = null;
    }
    if (shouldRepairCompany(match.company, candidate.company) && key(match.company) !== key(candidate.company)) {
      patch.company = candidate.company;
    }
    if (!match.city && candidate.city) patch.city = candidate.city;
    if (!match.position || !String(match.position).trim()) patch.position = candidate.position;
    if (!match.notes) patch.notes = candidate.notes;
    if (Object.keys(patch).length === 0) {
      skipped += 1;
      continue;
    }
    const { error } = await db.from("applications").update(patch).eq("id", String(match.id));
    if (error) throw error;
    Object.assign(match, patch);
    updated += 1;
  }

  const syncedAt = new Date().toISOString();
  const { data: connection, error: syncMetadataError } = await supabaseAdmin
    .from("oauth_connections")
    .update({ last_sync_at: syncedAt, updated_at: syncedAt })
    .eq("user_id", userId)
    .eq("provider", "google")
    .select("id")
    .maybeSingle();
  if (syncMetadataError) throw syncMetadataError;
  if (!connection) throw new Error("Connexion Google introuvable après la synchronisation.");

  const { error: activityError } = await db.from("activity_log").insert({
    source: "ai",
    action: "gmail_applications_sync",
    entity_type: "applications",
    details: {
      imported,
      updated,
      skipped,
      reviewed: candidates.length,
      listed: listed.ids.length,
      truncated: listed.truncated,
    },
  });
  if (activityError) throw activityError;

  return {
    status: listed.truncated ? "partial" : "completed",
    imported,
    updated,
    skipped,
    message: listed.truncated
      ? `${candidates.length} candidature(s) vérifiée(s) parmi les ${GMAIL_MAX_MESSAGES} messages les plus récents. La limite de sécurité a été atteinte : le contrôle est partiel.`
      : `${candidates.length} candidature(s) vérifiée(s), ${imported} ajoutée(s), ${updated} mise(s) à jour.`,
    syncedAt,
  };
}
