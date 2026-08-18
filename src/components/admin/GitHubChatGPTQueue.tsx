import { useEffect, useMemo, useState } from "react";
import { Github, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminStatus, type AdminStatusTone } from "./AdminStatus";

type WorkItem = { id: string; title: string; status: string; detail?: string; commit?: string };
type WorkPayload = { version: number; updatedAt: string; source: string; current?: WorkItem[]; waiting?: WorkItem[]; done?: WorkItem[] };
type Commit = { sha: string; html_url: string; commit: { message: string; author?: { date?: string } } };
type LiveAction = { id: string; kind: string; title: string; description: string | null; status: string; created_at: string; updated_at?: string | null };
type FeedItem = { key: string; title: string; detail?: string; status: string; kind: "queue" | "commit" | "action"; timestamp: number; label: string; href?: string; commit?: string };
type ProductionHealth = { release?: string | null; healthy?: boolean };

const RAW_QUEUE = "https://raw.githubusercontent.com/angelosmegaplus/angel-leclerc/main/runtime/chatgpt-work.json";
const COMMITS_API = "https://api.github.com/repos/angelosmegaplus/angel-leclerc/commits?sha=main&per_page=8";
const RELEASE_URL = "/api/angel-os/health";
const LIVE_REFRESH_MS = 5_000;
const COMMITS_REFRESH_MS = 90_000;
const MAX_VISIBLE_ITEMS = 5;
const MAX_ACTIVE_ITEMS = 4;

function bust(url: string) { return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`; }
function shortSha(value?: string) { return value ? value.slice(0, 7) : ""; }
function timeLabel(value?: string | null) { if (!value) return ""; const d = new Date(value); if (Number.isNaN(d.getTime())) return ""; return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(d); }
function isDone(status: string) { return ["done", "completed", "ready", "published", "resolved", "included"].includes(status); }
function isFailed(status: string) { return ["failed", "error", "rejected"].includes(status); }
function statusLabel(status: string, kind: FeedItem["kind"]) {
  if (status === "published") return "Publié";
  if (status === "waiting_publish") return "En attente de publication";
  if (status === "included") return "Déjà inclus";
  if (kind === "commit") return "Sur GitHub";
  if (["done", "completed", "ready", "resolved"].includes(status)) return "Terminé";
  if (isFailed(status)) return "Erreur";
  if (status === "running") return "En cours";
  if (status === "blocked") return "En pause";
  return "En attente";
}
function statusTone(status: string, kind: FeedItem["kind"]): AdminStatusTone {
  if (status === "published" || status === "included") return "success";
  if (isFailed(status)) return "error";
  if (status === "running") return "info";
  if (status === "waiting_publish") return "pending";
  if (kind === "commit") return "info";
  if (isDone(status)) return "success";
  return "pending";
}

export function GitHubChatGPTQueue() {
  const [queue, setQueue] = useState<WorkPayload | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [liveActions, setLiveActions] = useState<LiveAction[]>([]);
  const [productionSha, setProductionSha] = useState<string | null>(null);
  const [productionHealthy, setProductionHealthy] = useState<boolean | null>(null);
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
    } catch { }
  }

  async function refreshProduction() {
    try {
      const response = await fetch(bust(RELEASE_URL), { cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) { setProductionSha(null); setProductionHealthy(false); return; }
      const health = (await response.json()) as ProductionHealth;
      setProductionSha(typeof health.release === "string" && health.release ? health.release : null);
      setProductionHealthy(typeof health.healthy === "boolean" ? health.healthy : null);
    } catch { setProductionSha(null); setProductionHealthy(false); }
  }

  async function refreshAll() {
    if (refreshing) return;
    setRefreshing(true);
    try { await Promise.all([refreshQueue(), refreshCommits(), refreshProduction()]); }
    finally { setRefreshing(false); }
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  const feed = useMemo(() => {
    const activeItems: FeedItem[] = [];
    const completedItems: FeedItem[] = [];
    const queueTime = queue?.updatedAt ? new Date(queue.updatedAt).getTime() : Date.now();
    for (const item of queue?.current ?? []) activeItems.push({ key: `q-current-${item.id}`, title: item.title, detail: item.detail, status: item.status, kind: "queue", timestamp: queueTime + 3, label: "En cours", commit: item.commit });
    for (const item of queue?.waiting ?? []) activeItems.push({ key: `q-wait-${item.id}`, title: item.title, detail: item.detail, status: item.status, kind: "queue", timestamp: queueTime + 2, label: item.status === "waiting_publish" ? "En attente de publication" : "En attente", commit: item.commit });
    for (const item of queue?.done ?? []) completedItems.push({ key: `q-done-${item.id}`, title: item.title, detail: item.detail, status: item.status, kind: "queue", timestamp: queueTime + 1, label: "Terminé", commit: item.commit });
    for (const action of liveActions) {
      const timestamp = new Date(action.updated_at || action.created_at).getTime();
      const target = isDone(action.status) ? completedItems : activeItems;
      target.push({ key: `a-${action.id}`, title: action.title, detail: action.description || undefined, status: action.status, kind: "action", timestamp: Number.isFinite(timestamp) ? timestamp : 0, label: isDone(action.status) ? "Terminé" : "Demande" });
    }

    const productionIndex = productionSha ? commits.findIndex((commit) => commit.sha === productionSha) : -1;
    commits.forEach((commit, index) => {
      const timestamp = new Date(commit.commit.author?.date || 0).getTime();
      let status = "commit";
      if (productionSha && commit.sha === productionSha) status = "published";
      else if (productionIndex > -1 && index < productionIndex) status = "waiting_publish";
      else if (productionIndex > -1 && index > productionIndex) status = "included";
      const target = status === "published" || status === "included" ? completedItems : activeItems;
      target.push({ key: `c-${commit.sha}`, title: commit.commit.message.split("\n")[0], status, kind: "commit", timestamp: Number.isFinite(timestamp) ? timestamp : 0, label: "GitHub main", href: commit.html_url, commit: commit.sha });
    });

    const dedupe = (items: FeedItem[]) => { const result: FeedItem[] = []; const seen = new Set<string>(); for (const item of items.sort((a, b) => b.timestamp - a.timestamp)) { const key = `${item.title.toLowerCase()}-${item.commit || ""}`; if (seen.has(key)) continue; seen.add(key); result.push(item); } return result; };
    const active = dedupe(activeItems).slice(0, MAX_ACTIVE_ITEMS);
    const latestCompleted = dedupe(completedItems)[0];
    return (latestCompleted ? [...active, latestCompleted] : active).slice(0, MAX_VISIBLE_ITEMS);
  }, [queue, liveActions, commits, productionSha]);

  return <section className="rounded-[1.75rem] border border-white/10 bg-[#090b0d] p-4 sm:p-5" aria-label="Activité ChatGPT GitHub" data-no-refresh-queue="true">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white"><Github className="h-5 w-5" /></span><div><h2 className="font-semibold text-white">ChatGPT · GitHub</h2><p className="text-xs text-white/45">États GitHub et production réelle, sans faux « Publié ».</p><p className="mt-1 text-[10px] text-white/30">Production {productionSha ? shortSha(productionSha) : "non vérifiée"}{productionHealthy === false ? " · santé rouge" : productionHealthy === true ? " · santé verte" : ""}{lastSyncAt ? ` · ${timeLabel(lastSyncAt)}` : ""}</p></div></div>
      <button type="button" onClick={() => void refreshAll()} className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-xs text-white/65">{refreshing || loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}<span className="hidden sm:inline">Actualiser</span></button>
    </div>
    {error ? <div className="mt-4"><AdminStatus tone="error" compact>{error}</AdminStatus></div> : null}
    <div className="mt-4 divide-y divide-white/10">
      {feed.length === 0 ? <p className="py-4 text-sm text-white/40">Aucune activité récente.</p> : feed.map(item => {
        const row = <div className="flex items-start justify-between gap-4 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{item.title}</p>{item.detail ? <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/40">{item.detail}</p> : null}{item.commit ? <p className="mt-1 font-mono text-[10px] text-white/30">{shortSha(item.commit)}</p> : null}</div><AdminStatus tone={statusTone(item.status, item.kind)} compact>{statusLabel(item.status, item.kind)}</AdminStatus></div>;
        return item.href ? <a key={item.key} href={item.href} target="_blank" rel="noreferrer" className="block hover:bg-white/[.025]">{row}</a> : <div key={item.key}>{row}</div>;
      })}
    </div>
  </section>;
}
