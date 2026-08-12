import type { SupabaseClient } from "@supabase/supabase-js";

export type PushConfig = {
  /** Clé publique VAPID : seule valeur envoyée au navigateur (par conception). */
  publicKey: string | null;
  /** Le serveur peut-il réellement émettre un push ? */
  serverReady: boolean;
};

export function readPushConfig(): PushConfig {
  const publicKey = process.env["VAPID_PUBLIC_KEY"] ?? null;
  const privateKey = process.env["VAPID_PRIVATE_KEY"] ?? null;
  return { publicKey, serverReady: Boolean(publicKey && privateKey) };
}

export type SyncReport = { created: number; kinds: string[] };

type Db = SupabaseClient<any, any, any>;

type Candidate = {
  dedupe_key: string;
  kind: string;
  title: string;
  content: string | null;
  link: string | null;
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * Construit les notifications internes à partir d'évènements RÉELS d'Angel OS.
 * Aucune donnée fictive : si rien ne correspond, rien n'est créé.
 */
export async function buildRealNotifications(db: Db): Promise<Candidate[]> {
  const now = new Date();
  const out: Candidate[] = [];

  const [tasks, applications, messages, aiActions, connections, interviews, articles] =
    await Promise.all([
      db.from("project_tasks").select("id,title,due_date,status").neq("status", "done").limit(100),
      db.from("applications").select("id,company,position,follow_up_at,status").limit(100),
      db.from("contact_requests").select("id,full_name,created_at,is_read").eq("is_read", false).limit(50),
      db.from("ai_actions").select("id,title,status,resolved_at").eq("status", "done").limit(50),
      db.from("oauth_connections").select("provider,status,expires_at").limit(50),
      db.from("interviews").select("id,subject,scheduled_at").limit(100),
      db.from("articles").select("id,title,slug,published,published_at").eq("published", true).limit(20),
    ]);

  for (const t of tasks.data ?? []) {
    if (!t.due_date) continue;
    const due = new Date(t.due_date.length <= 10 ? `${t.due_date}T12:00:00` : t.due_date);
    if (due.getTime() < now.getTime()) {
      out.push({
        dedupe_key: `task_overdue:${t.id}:${t.due_date}`,
        kind: "task",
        title: `Tâche en retard : ${t.title}`,
        content: `Échéance dépassée depuis le ${due.toLocaleDateString("fr-FR")}.`,
        link: "/admin?tab=projets",
      });
    }
  }

  for (const a of applications.data ?? []) {
    if (!a.follow_up_at) continue;
    const at = new Date(a.follow_up_at.length <= 10 ? `${a.follow_up_at}T12:00:00` : a.follow_up_at);
    if (at.getTime() <= now.getTime() && a.status !== "accepted" && a.status !== "refused") {
      out.push({
        dedupe_key: `application_followup:${a.id}:${a.follow_up_at}`,
        kind: "application",
        title: `Candidature à relancer : ${a.company}`,
        content: a.position ? `Poste : ${a.position}.` : null,
        link: "/admin?tab=candidatures",
      });
    }
  }

  for (const m of messages.data ?? []) {
    out.push({
      dedupe_key: `message_new:${m.id}`,
      kind: "message",
      title: `Nouveau message de ${m.full_name}`,
      content: "Une demande non lue attend une réponse.",
      link: "/admin?tab=messages",
    });
  }

  for (const a of aiActions.data ?? []) {
    out.push({
      dedupe_key: `ai_done:${a.id}`,
      kind: "ai",
      title: `Action Angel AI terminée : ${a.title}`,
      content: null,
      link: "/admin?tab=angel-ai",
    });
  }

  for (const c of connections.data ?? []) {
    const expired = c.expires_at ? new Date(c.expires_at).getTime() < now.getTime() : false;
    if (c.status === "reconnect_required" || c.status === "error" || expired) {
      out.push({
        dedupe_key: `connection_issue:${c.provider}:${c.expires_at ?? c.status}`,
        kind: "connection",
        title: `Connexion à rétablir : ${c.provider}`,
        content: "Le fournisseur demande une nouvelle autorisation.",
        link: "/admin?tab=connexions",
      });
    }
  }

  for (const i of interviews.data ?? []) {
    if (!i.scheduled_at) continue;
    const at = new Date(i.scheduled_at);
    const delta = at.getTime() - now.getTime();
    if (delta > 0 && delta < 2 * DAY) {
      out.push({
        dedupe_key: `interview_soon:${i.id}:${i.scheduled_at}`,
        kind: "agenda",
        title: `Rendez-vous proche : ${i.subject ?? "interview"}`,
        content: `Prévu le ${at.toLocaleString("fr-FR")}.`,
        link: "/admin?tab=agenda",
      });
    }
  }

  for (const a of articles.data ?? []) {
    if (!a.published_at) continue;
    if (new Date(a.published_at).getTime() > now.getTime() - 3 * DAY) {
      out.push({
        dedupe_key: `article_published:${a.id}:${a.published_at}`,
        kind: "publication",
        title: `Publication en ligne : ${a.title}`,
        content: null,
        link: `/articles/${a.slug}`,
      });
    }
  }

  return out;
}

export async function syncNotifications(db: Db): Promise<SyncReport> {
  const candidates = await buildRealNotifications(db);
  if (candidates.length === 0) return { created: 0, kinds: [] };

  const keys = candidates.map((c) => c.dedupe_key);
  const { data: existing } = await db
    .from("notifications")
    .select("dedupe_key")
    .in("dedupe_key", keys);
  const known = new Set((existing ?? []).map((r: { dedupe_key: string | null }) => r.dedupe_key));
  const fresh = candidates.filter((c) => !known.has(c.dedupe_key));
  if (fresh.length === 0) return { created: 0, kinds: [] };

  const { error } = await db.from("notifications").insert(fresh);
  if (error) throw error;
  return { created: fresh.length, kinds: [...new Set(fresh.map((f) => f.kind))] };
}
