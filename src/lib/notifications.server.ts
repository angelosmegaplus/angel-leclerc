import type { SupabaseClient } from "@supabase/supabase-js";
import { emitAngelOSEvent } from "./angel-os-runtime";

export type PushConfig = { publicKey: string | null; serverReady: boolean };
export function readPushConfig(): PushConfig {
  const publicKey = process.env["VAPID_PUBLIC_KEY"] ?? null;
  const privateKey = process.env["VAPID_PRIVATE_KEY"] ?? null;
  return { publicKey, serverReady: Boolean(publicKey && privateKey) };
}

export type SyncReport = { created: number; kinds: string[]; pruned?: number };
type Db = SupabaseClient<any, any, any>;
type Candidate = { dedupe_key: string; kind: string; title: string; content: string | null; link: string | null };
const DAY = 86_400_000;

export async function buildRealNotifications(db: Db): Promise<Candidate[]> {
  const now = new Date();
  const out: Candidate[] = [];
  const [tasks, messages, aiActions, connections, interviews, articles] = await Promise.all([
    db.from("project_tasks").select("id,title,due_date,status").neq("status", "done").limit(100),
    db.from("contact_requests").select("id,full_name,created_at,is_read").eq("is_read", false).limit(50),
    db.from("ai_actions").select("id,title,status,resolved_at").eq("status", "done").limit(50),
    db.from("oauth_connections").select("provider,status,expires_at").limit(50),
    db.from("interviews").select("id,title,scheduled_at").limit(100),
    db.from("articles").select("id,title,slug,published,published_at").eq("published", true).limit(20),
  ]);

  for (const t of tasks.data ?? []) {
    if (!t.due_date) continue;
    const due = new Date(t.due_date.length <= 10 ? `${t.due_date}T12:00:00` : t.due_date);
    if (due < now) out.push({
      dedupe_key: `task_overdue:${t.id}:${t.due_date}`,
      kind: "task",
      title: `Tâche en retard : ${t.title}`,
      content: `Échéance dépassée depuis le ${due.toLocaleDateString("fr-FR")}.`,
      link: "/admin?tab=projets",
    });
  }

  for (const m of messages.data ?? []) out.push({
    dedupe_key: `message_new:${m.id}`,
    kind: "message",
    title: `Nouveau message de ${m.full_name}`,
    content: "Une demande non lue attend une réponse.",
    link: "/admin?tab=boite-mail",
  });

  for (const a of aiActions.data ?? []) {
    if (a.resolved_at && new Date(a.resolved_at).getTime() < now.getTime() - 7 * DAY) continue;
    out.push({
      dedupe_key: `ai_done:${a.id}`,
      kind: "ai",
      title: `Action Angel AI terminée : ${a.title}`,
      content: null,
      link: "/admin?tab=activite",
    });
  }

  for (const c of connections.data ?? []) {
    const expired = c.expires_at ? new Date(c.expires_at) < now : false;
    if (c.status === "reconnect_required" || c.status === "error" || expired) out.push({
      dedupe_key: `connection_issue:${c.provider}`,
      kind: "connection",
      title: `Connexion à rétablir : ${c.provider}`,
      content: "Le fournisseur demande une nouvelle autorisation.",
      link: "/admin-integrations",
    });
  }

  for (const i of interviews.data ?? []) {
    if (!i.scheduled_at) continue;
    const at = new Date(i.scheduled_at);
    const delta = at.getTime() - now.getTime();
    if (delta > 0 && delta < 2 * DAY) out.push({
      dedupe_key: `interview_soon:${i.id}:${i.scheduled_at}`,
      kind: "agenda",
      title: `Rendez-vous proche : ${i.title ?? "interview"}`,
      content: `Prévu le ${at.toLocaleString("fr-FR")}.`,
      link: "/admin?tab=agenda",
    });
  }

  for (const a of articles.data ?? []) {
    if (a.published_at && new Date(a.published_at).getTime() > now.getTime() - 3 * DAY) out.push({
      dedupe_key: `article_published:${a.id}:${a.published_at}`,
      kind: "publication",
      title: `Publication en ligne : ${a.title}`,
      content: null,
      link: `/articles/${a.slug}`,
    });
  }

  return out;
}

async function pruneNotifications(db: Db): Promise<number> {
  const readCutoff = new Date(Date.now() - 30 * DAY).toISOString();
  const staleCutoff = new Date(Date.now() - 90 * DAY).toISOString();
  let pruned = 0;

  const readDelete = await db.from("notifications").delete({ count: "exact" }).eq("is_read", true).lt("created_at", readCutoff);
  if (!readDelete.error) pruned += Number(readDelete.count ?? 0);

  const staleDelete = await db.from("notifications").delete({ count: "exact" }).lt("created_at", staleCutoff);
  if (!staleDelete.error) pruned += Number(staleDelete.count ?? 0);

  return pruned;
}

export async function syncNotifications(db: Db): Promise<SyncReport> {
  const pruned = await pruneNotifications(db).catch(() => 0);
  const candidates = await buildRealNotifications(db);
  if (!candidates.length) return { created: 0, kinds: [], pruned };

  const keys = candidates.map((c) => c.dedupe_key);
  const { data: existing } = await db.from("notifications").select("dedupe_key").in("dedupe_key", keys);
  const known = new Set((existing ?? []).map((r: { dedupe_key: string | null }) => r.dedupe_key));
  const fresh = candidates.filter((c) => !known.has(c.dedupe_key));
  if (!fresh.length) return { created: 0, kinds: [], pruned };

  const { error } = await db.from("notifications").insert(fresh);
  if (error) throw error;
  const kinds = [...new Set(fresh.map((f) => f.kind))];
  await emitAngelOSEvent("angel-os:notifications:synced", { created: fresh.length, pruned, kinds, at: new Date().toISOString() });
  return { created: fresh.length, kinds, pruned };
}
