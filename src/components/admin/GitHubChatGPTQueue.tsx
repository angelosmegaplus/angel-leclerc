import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, GitCommitHorizontal, Github, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type WorkItem = { id: string; title: string; status: string; detail?: string; commit?: string };
type WorkPayload = { version: number; updatedAt: string; source: string; current?: WorkItem[]; waiting?: WorkItem[]; done?: WorkItem[] };
type Commit = { sha: string; html_url: string; commit: { message: string; author?: { date?: string } } };
type LiveAction = { id: string; kind: string; title: string; description: string | null; status: string; created_at: string; updated_at?: string | null };
type FeedItem = {
  key: string;
  title: string;
  detail?: string;
  status: string;
  kind: "queue" | "commit" | "action";
  timestamp: number;
  label: string;
  href?: string;
  commit?: string;
};

const RAW_QUEUE = "https://raw.githubusercontent.com/angelosmegaplus/angel-leclerc/main/runtime/chatgpt-work.json";
const COMMITS_API = "https://api.github.com/repos/angelosmegaplus/angel-leclerc/commits?sha=main&per_page=8";
const LIVE_REFRESH_MS = 5_000;
const COMMITS_REFRESH_MS = 90_000;
const MAX_VISIBLE_ITEMS = 5;
const MAX_ACTIVE_ITEMS = 4;

function bust(url: string) { return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`; }
function shortSha(value?: string) { return value ? value.slice(0, 7) : ""; }
function timeLabel(value?: string | null) { if (!value) return ""; const d = new Date(value); if (Number.isNaN(d.getTime())) return ""; return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(d); }
function isDone(status: string) { return ["done", "completed", "ready", "published", "resolved"].includes(status); }
function isFailed(status: string) { return ["failed", "error", "rejected"].includes(status); }
function statusLabel(status: string) {
  if (status === "commit") return "Commit main";
  if (isDone(status)) return "Publié / terminé";
  if (isFailed(status)) return "Erreur";
  if (status === "running") return "En cours";
  if (status === "waiting_publish") return "En attente de publication";
  if (status === "blocked") return "En pause";
  return "En attente";
}
function StatusIcon({ status, kind }: { status: string; kind: FeedItem["kind"] }) {
  if (kind === "commit") return <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-sky-400/25 bg-sky-400/10"><GitCommitHorizontal className="h-4 w-4 text-sky-300" /></span>;
  if (isDone(status)) return <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-emerald-500/25 bg-emerald-500/10"><CheckCircle2 className="h-4 w-4 text-emerald-300" /></span>;
  if (isFailed(status)) return <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-red-500/25 bg-red-500/10"><TriangleAlert className="h-4 w-4 text-red-300" /></span>;
  return <span className="flex h-6 w-6 shrink-0 items-center justify-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/10"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /></span>;
}

export function GitHubChatGPTQueue() {
  const [queue, setQueue] = useState<WorkPayload | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [liveActions, setLiveActions] = useState<LiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshQueue() {
    setError(null);
    try {
      const [queueResponse, actionsResult] = await Promise.all([
        fetch(bust(RAW_QUEUE), { cache: "no-store" }),
        supabase.from("ai_actions").select("id, kind, title, description, status, created_at, updated_at").in("kind", ["refresh_check", "chatgpt_task", "operator_request"]).in("status", ["pending", "running", "awaiting_operator", "completed", "failed", "rejected"]).order("created_at", { ascending: false }).limit(12),
      ]);
      if (!queueResponse.ok) throw new Error(`File GitHub indisponible (${queueResponse.status})`);
      setQueue((await queueResponse.json()) as WorkPayload);
      if (!actionsResult.error) setLiveActions((actionsResult.data ?? []) as LiveAction[]);
      setLastSyncAt(new Date().toISOString());
    } catch (err) { setError(err instanceof Error ? err.message : "Synchronisation GitHub indisponible"); }
    finally { setLoading(false); }
  }

  async function refreshCommits() {
    try {
      const response = await fetch(bust(COMMITS_API), { cache: "no-store", headers: { Accept: "application/vnd.github+json" } });
      if (response.ok) setCommits((await response.json()) as Commit[]);
    } catch { /* le fil reste utilisable avec les données déjà chargées */ }
  }

  async function refreshAll() {
    if (refreshing) return;
    setRefreshing(true);
    try { await Promise.all([refreshQueue(), refreshCommits()]); }
    finally { setRefreshing(false); }
  }

  useEffect(() => {
    void refreshAll();
    const q = window.setInterval(() => { if (!document.hidden) void refreshQueue(); }, LIVE_REFRESH_MS);
    const c = window.setInterval(() => { if (!document.hidden) void refreshCommits(); }, COMMITS_REFRESH_MS);
    const focus = () => void refreshAll();
    window.addEventListener("focus", focus);
    window.addEventListener("angel-os:chatgpt-queue-updated", focus);
    return () => {
      window.clearInterval(q);
      window.clearInterval(c);
      window.removeEventListener("focus", focus);
      window.removeEventListener("angel-os:chatgpt-queue-updated", focus);
    };
  }, []);

  const feed = useMemo(() => {
    const activeItems: FeedItem[] = [];
    const completedItems: FeedItem[] = [];
    const queueTime = queue?.updatedAt ? new Date(queue.updatedAt).getTime() : Date.now();

    for (const item of queue?.current ?? []) {
      activeItems.push({ key: `q-current-${item.id}`, title: item.title, detail: item.detail, status: item.status, kind: "queue", timestamp: queueTime + 3, label: "En cours", commit: item.commit });
    }
    for (const item of queue?.waiting ?? []) {
      activeItems.push({ key: `q-wait-${item.id}`, title: item.title, detail: item.detail, status: item.status, kind: "queue", timestamp: queueTime + 2, label: item.status === "waiting_publish" ? "Publication" : "En attente", commit: item.commit });
    }
    for (const item of queue?.done ?? []) {
      completedItems.push({ key: `q-done-${item.id}`, title: item.title, detail: item.detail, status: item.status, kind: "queue", timestamp: queueTime + 1, label: "Dernière publication", commit: item.commit });
    }
    for (const action of liveActions) {
      const timestamp = new Date(action.updated_at || action.created_at).getTime();
      const target = isDone(action.status) ? completedItems : activeItems;
      target.push({ key: `a-${action.id}`, title: action.title, detail: action.description || undefined, status: action.status, kind: "action", timestamp: Number.isFinite(timestamp) ? timestamp : 0, label: isDone(action.status) ? "Dernière publication" : "Demande" });
    }
    for (const commit of commits) {
      const timestamp = new Date(commit.commit.author?.date || 0).getTime();
      activeItems.push({ key: `c-${commit.sha}`, title: commit.commit.message.split("\n")[0], status: "commit", kind: "commit", timestamp: Number.isFinite(timestamp) ? timestamp : 0, label: "GitHub main", href: commit.html_url, commit: commit.sha });
    }

    const dedupe = (items: FeedItem[]) => {
      const result: FeedItem[] = [];
      const seen = new Set<string>();
      for (const item of items.sort((a, b) => b.timestamp - a.timestamp)) {
        const key = `${item.title.toLowerCase()}-${item.commit || ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(item);
      }
      return result;
    };

    const active = dedupe(activeItems).slice(0, MAX_ACTIVE_ITEMS);
    const latestPublished = dedupe(completedItems)[0];
    const result = latestPublished ? [...active, latestPublished] : active;
    return result.slice(0, MAX_VISIBLE_ITEMS);
  }, [queue, liveActions, commits]);

  return <section className="rounded-[1.75rem] border border-white/10 bg-[#090b0d] p-4 sm:p-5" aria-label="Activité ChatGPT GitHub" data-no-refresh-queue="true">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white"><Github className="h-5 w-5" /></span>
        <div><h2 className="font-semibold text-white">ChatGPT · GitHub en direct</h2><p className="text-xs text-white/45">Jusqu’à 4 éléments actuels + la dernière tâche publiée · 5 éléments maximum.</p><p className="mt-1 text-[10px] text-white/30">Actualisation toutes les 5 s{lastSyncAt ? ` · ${timeLabel(lastSyncAt)}` : ""}</p></div>
      </div>
      <button type="button" onClick={() => void refreshAll()} className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-xs text-white/65">{refreshing || loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}<span className="hidden sm:inline">Actualiser</span></button>
    </div>

    {error ? <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">{error}</p> : null}

    <div className="mt-4 space-y-2">
      {feed.length === 0 ? <div className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white/40">Aucune activité récente.</div> : feed.map(item => {
        const body = <div className={`rounded-xl border p-3 ${item.kind === "commit" ? "border-sky-400/20 bg-sky-400/[.04]" : isDone(item.status) ? "border-emerald-500/20 bg-emerald-500/[.045]" : isFailed(item.status) ? "border-red-500/20 bg-red-500/[.04]" : "border-amber-400/20 bg-amber-400/[.04]"}`}>
          <div className="flex items-start gap-2"><StatusIcon status={item.status} kind={item.kind} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-white">{item.title}</p><span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wide text-white/50">{item.label}</span><span className="text-[9px] text-white/35">{statusLabel(item.status)}</span></div>{item.detail ? <p className="mt-1 text-xs leading-relaxed text-white/45">{item.detail}</p> : null}{item.commit ? <p className="mt-2 font-mono text-[10px] text-white/35">{shortSha(item.commit)}</p> : null}</div></div>
        </div>;
        return item.href ? <a key={item.key} href={item.href} target="_blank" rel="noreferrer" className="block">{body}</a> : <div key={item.key}>{body}</div>;
      })}
    </div>
  </section>;
}
