import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Github, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type WorkItem = { id: string; title: string; status: string; detail?: string; commit?: string };
type WorkPayload = { version: number; updatedAt: string; source: string; current?: WorkItem[]; waiting?: WorkItem[]; done?: WorkItem[] };
type Commit = { sha: string; html_url: string; commit: { message: string; author?: { date?: string } } };
type LiveAction = { id: string; kind: string; title: string; description: string | null; status: string; created_at: string; updated_at?: string | null };

const RAW_QUEUE = "https://raw.githubusercontent.com/angelosmegaplus/angel-leclerc/main/runtime/chatgpt-work.json";
const COMMITS_API = "https://api.github.com/repos/angelosmegaplus/angel-leclerc/commits?sha=main&per_page=5";
const LIVE_REFRESH_MS = 5_000;
const COMMITS_REFRESH_MS = 90_000;
const MAX_PENDING_AGE_MS = 90 * 60 * 1000;
const MAX_VISIBLE_ITEMS = 5;

function bust(url: string) { return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`; }
function shortSha(value?: string) { return value ? value.slice(0, 7) : ""; }
function dateLabel(value?: string | null) { if (!value) return ""; const d = new Date(value); if (Number.isNaN(d.getTime())) return ""; return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d); }
function timeLabel(value?: string | null) { if (!value) return ""; const d = new Date(value); if (Number.isNaN(d.getTime())) return ""; return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(d); }
function isDone(status: string) { return ["done", "completed", "ready", "published", "resolved"].includes(status); }
function isFailed(status: string) { return ["failed", "error", "rejected"].includes(status); }
function isPending(status: string) { return !isDone(status) && !isFailed(status); }
function actionAgeMs(item: LiveAction, now = Date.now()) { const t = new Date(item.created_at).getTime(); return Number.isFinite(t) ? Math.max(0, now - t) : 0; }
function isOverdue(item: LiveAction, now = Date.now()) { return isPending(item.status) && actionAgeMs(item, now) >= MAX_PENDING_AGE_MS; }
function StatusIcon({ status }: { status: string }) {
  if (isDone(status)) return <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-emerald-500/25 bg-emerald-500/10" title="Terminé"><CheckCircle2 className="h-4 w-4 text-emerald-300" /></span>;
  if (isFailed(status)) return <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-red-500/25 bg-red-500/10" title="Erreur"><TriangleAlert className="h-4 w-4 text-red-300" /></span>;
  return <span className="flex h-6 w-6 shrink-0 items-center justify-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/10" title="En attente"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /></span>;
}
function statusLabel(status: string) { if (isDone(status)) return "Publié / terminé"; if (isFailed(status)) return "Erreur"; if (status === "running") return "En cours"; if (status === "blocked") return "En pause"; if (status === "waiting_publish") return "En attente de publication"; return "En attente"; }

export function GitHubChatGPTQueue() {
  const [queue, setQueue] = useState<WorkPayload | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [liveActions, setLiveActions] = useState<LiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastCommitSyncAt, setLastCommitSyncAt] = useState<string | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState(Date.now());

  async function refreshQueue() {
    setError(null);
    try {
      const [queueResponse, actionsResult] = await Promise.all([
        fetch(bust(RAW_QUEUE), { cache: "no-store" }),
        supabase.from("ai_actions").select("id, kind, title, description, status, created_at, updated_at").in("kind", ["refresh_check", "chatgpt_task", "operator_request"]).in("status", ["pending", "running", "awaiting_operator", "completed", "failed", "rejected"]).order("created_at", { ascending: false }).limit(20),
      ]);
      if (!queueResponse.ok) throw new Error(`File GitHub indisponible (${queueResponse.status})`);
      setQueue((await queueResponse.json()) as WorkPayload);
      if (!actionsResult.error) setLiveActions((actionsResult.data ?? []) as LiveAction[]);
      setLastSyncAt(new Date().toISOString()); setClock(Date.now());
    } catch (err) { setError(err instanceof Error ? err.message : "Synchronisation GitHub indisponible"); }
    finally { setLoading(false); }
  }
  async function refreshCommits() {
    try {
      const response = await fetch(bust(COMMITS_API), { cache: "no-store", headers: { Accept: "application/vnd.github+json" } });
      if (!response.ok) throw new Error(response.status === 403 || response.status === 429 ? "GitHub limite temporairement les actualisations des commits" : `Commits GitHub indisponibles (${response.status})`);
      setCommits((await response.json()) as Commit[]); setCommitError(null); setLastCommitSyncAt(new Date().toISOString());
    } catch (err) { setCommitError(err instanceof Error ? err.message : "Commits GitHub indisponibles"); }
  }
  async function refreshAll() { if (refreshing) return; setRefreshing(true); try { await Promise.all([refreshQueue(), refreshCommits()]); } finally { setRefreshing(false); } }

  useEffect(() => {
    void refreshAll();
    const q = window.setInterval(() => { if (!document.hidden) void refreshQueue(); }, LIVE_REFRESH_MS);
    const c = window.setInterval(() => { if (!document.hidden) void refreshCommits(); }, COMMITS_REFRESH_MS);
    const k = window.setInterval(() => setClock(Date.now()), 60_000);
    const focus = () => { setClock(Date.now()); void refreshAll(); };
    window.addEventListener("focus", focus); window.addEventListener("angel-os:chatgpt-queue-updated", focus);
    return () => { window.clearInterval(q); window.clearInterval(c); window.clearInterval(k); window.removeEventListener("focus", focus); window.removeEventListener("angel-os:chatgpt-queue-updated", focus); };
  }, []);

  const visibleItems = useMemo(() => {
    const pending = [...(queue?.current ?? []), ...(queue?.waiting ?? [])];
    const done = queue?.done ?? [];
    const selected: Array<WorkItem & { section: string }> = [];
    if (done[0]) selected.push({ ...done[0], section: "Vient d’être publié / terminé" });
    for (const item of pending) { if (selected.length >= MAX_VISIBLE_ITEMS) break; selected.push({ ...item, section: item.status === "waiting_publish" ? "En attente de publication" : item.status === "running" ? "En cours" : "En attente" }); }
    for (const item of done.slice(1)) { if (selected.length >= MAX_VISIBLE_ITEMS) break; selected.push({ ...item, section: "Récemment terminé" }); }
    return selected.slice(0, MAX_VISIBLE_ITEMS);
  }, [queue]);

  const recentActions = useMemo(() => [...liveActions].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, MAX_VISIBLE_ITEMS), [liveActions]);
  const pendingCount = liveActions.filter((item) => isPending(item.status)).length;
  const overdueCount = liveActions.filter((item) => isOverdue(item, clock)).length;

  return <section className="rounded-[1.75rem] border border-white/10 bg-[#090b0d] p-4 sm:p-5" aria-label="Activité ChatGPT GitHub" data-no-refresh-queue="true">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white"><Github className="h-5 w-5" /></span><div><h2 className="font-semibold text-white">ChatGPT · GitHub en direct</h2><p className="text-xs text-white/45">5 éléments maximum · du plus récent au plus ancien · publié, en cours et en attente.</p><p className="mt-1 text-[10px] text-white/30">File toutes les 5 s{lastSyncAt ? ` · ${timeLabel(lastSyncAt)}` : ""}</p></div></div><button type="button" onClick={() => void refreshAll()} className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-xs text-white/65">{refreshing || loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}<span className="hidden sm:inline">Actualiser</span></button></div>
    {error ? <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">{error}</p> : null}
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
      <div className="space-y-2"><div className="flex items-center justify-between gap-2"><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-white/70">Fil GitHub · 5 dernières priorités</p><span className="text-[10px] text-white/30">{pendingCount} en attente{overdueCount ? ` · ${overdueCount} > 1 h 30` : ""}</span></div>{visibleItems.length === 0 ? <div className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white/40">Aucun élément.</div> : visibleItems.map(item => <div key={`${item.section}-${item.id}`} className={`rounded-xl border p-3 ${isDone(item.status) ? "border-emerald-500/20 bg-emerald-500/[.045]" : isFailed(item.status) ? "border-red-500/20 bg-red-500/[.04]" : "border-amber-400/20 bg-amber-400/[.04]"}`}><div className="flex items-start gap-2"><StatusIcon status={item.status}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-white">{item.title}</p><span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wide text-white/50">{item.section}</span><span className="text-[9px] text-white/35">{statusLabel(item.status)}</span></div>{item.detail ? <p className="mt-1 text-xs leading-relaxed text-white/45">{item.detail}</p> : null}{item.commit ? <p className="mt-2 font-mono text-[10px] text-white/35">commit {shortSha(item.commit)}</p> : null}</div></div></div>)}</div>
      <div className="space-y-2"><div className="flex items-center justify-between gap-2"><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-white/45">Derniers commits main</p>{lastCommitSyncAt ? <span className="text-[10px] text-white/30">maj {timeLabel(lastCommitSyncAt)}</span> : null}</div>{commitError ? <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">{commitError}</p> : null}{commits.slice(0,5).map(commit => <a key={commit.sha} href={commit.html_url} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/10 bg-white/[.03] p-3"><div className="flex justify-between gap-3"><span className="font-mono text-[10px] text-white/60">{shortSha(commit.sha)}</span><span className="text-[10px] text-white/30">{dateLabel(commit.commit.author?.date)}</span></div><p className="mt-1 line-clamp-2 text-xs text-white/65">{commit.commit.message.split("\n")[0]}</p></a>)}</div>
    </div>
    {recentActions.length > 0 ? <p className="mt-3 text-[10px] text-white/25">Les demandes détaillées restent conservées dans l’historique ; seules les 5 priorités utiles sont affichées ici.</p> : null}
  </section>;
}
