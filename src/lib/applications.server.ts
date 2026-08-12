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

function companyOf(subject: string, recipient: string | null): string {
  if (recipient && RECIPIENT_COMPANIES[recipient]) return RECIPIENT_COMPANIES[recipient];
  const cleaned = cleanSubject(subject)
    .replace(/candidature\s+(?:spontanée\s+)?/gi, "")
    .replace(/(?:pour|en vue d['’]une)\s+alternance/gi, "")
    .replace(/bts\s+communication/gi, "")
    .replace(/[–—|:]+/g, "-")
    .replace(/^\s*-|\s*-\s*$/g, "")
    .trim();
  const pieces = cleaned
    .split(" - ")
    .map((piece) => piece.trim())
    .filter(Boolean);
  const fromSubject = pieces.at(-1);
  if (fromSubject && fromSubject.length > 2 && fromSubject.length < 90) return fromSubject;
  if (!recipient) return "Entreprise à identifier";
  const domain = recipient.split("@")[1]?.split(".")[0] ?? "Entreprise à identifier";
  return domain
    .split(/[-_]/)
    .filter(Boolean)
    .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
    .join(" ");
}

function cityOf(text: string): string | null {
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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
  const summary = [header(latest, "Subject"), latest.snippet]
    .filter(Boolean)
    .join(" — ")
    .slice(0, 600);
  return { summary, rejected: rejection(summary) };
}

function key(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
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
    .select("id, company, email, sent_at, follow_up_at, status, response, notes");
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
    if (!match.response && candidate.response) patch.response = candidate.response;
    if (candidate.response && match.follow_up_at) patch.follow_up_at = null;
    if (candidate.status === "refusee" && ["envoyee", "relance"].includes(key(match.status))) {
      patch.status = "refusee";
      patch.follow_up_at = null;
    }
    if (!match.notes) patch.notes = candidate.notes;
    if (Object.keys(patch).length === 0) {
      skipped += 1;
      continue;
    }
    const { error } = await db.from("applications").update(patch).eq("id", String(match.id));
    if (error) throw error;
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
