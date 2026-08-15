import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Github, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type WorkItem = {
  id: string;
  title: string;
  status: string;
  detail?: string;
  commit?: string;
};

type WorkPayload = {
  version: number;
  updatedAt: string;
  source: string;
  current?: WorkItem[];
  waiting?: WorkItem[];
  done?: WorkItem[];
};

type Commit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: { date?: string };
  };
};

type LiveAction = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
};

const RAW_QUEUE = "https://raw.githubusercontent.com/angelosmegaplus/angel-leclerc/main/runtime/chatgpt-work.json";
const COMMITS_API = "https://api.github.com/repos/angelosmegaplus/angel-leclerc/commits?sha=main&per_page=6";
const LIVE_REFRESH_MS = 5_000;
const COMMITS_REFRESH_MS = 90_000;
const MAX_PENDING_AGE_MS = 90 * 60 * 1000;

function bust(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
}

function shortSha(value?: string) {
  return value ? value.slice(0, 7) : "";
}

function dateLabel(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function timeLabel(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(date);
}

function isDone(status: string) {
  return ["done", "completed", "ready", "published", "resolved"].includes(status);
}

function isFailed(status: string) {
  return ["failed", "error", "rejected"].includes(status);
}

function isPending(status: string) {
  return !isDone(status) && !isFailed(status);
}

function actionAgeMs(item: LiveAction, now = Date.now()) {
  const createdAt = new Date(item.created_at).getTime();
  return Number.isFinite(createdAt) ? Math.max(0, now - createdAt) : 0;
}

function isOverdue(item: LiveAction, now = Date.now()) {
  return isPending(item.status) && actionAgeMs(item, now) >= MAX_PENDING_AGE_MS;
}

function StatusIcon({ status }: { status: string }) {
  if (isDone(status)) {
    return (
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-emerald-500/25 bg-emerald-500/10" title="Terminé">
        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
      </span>
    );
  }
  if (isFailed(status)) {
    return (
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-red-500/25 bg-red-500/10" title="Erreur">
        <TriangleAlert className="h-4 w-4 text-red-300" />
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/10" title="En attente">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
      <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
    </span>
  );
}

function statusLabel(status: string) {
  if (isDone(status)) return "Terminé";
  if (isFailed(status)) return "Erreur";
  if (status === "running") return "En cours";
  if (status === "blocked") return "En pause";
  if (status === "waiting_publish") return "En attente de publication";
  return "En attente";
}

function actionKindLabel(kind: string) {
  if (kind === "refresh_check") return "Actualisation demandée";
  if (kind === "operator_request") return "Modification demandée";
  return "Tâche ChatGPT";
}

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
        supabase
          .from("ai_actions")
          .select("id, kind, title, description, status, created_at, updated_at")
          .in("kind", ["refresh_check", "chatgpt_task", "operator_request"])
          .in("status", ["pending", "running", "awaiting_operator", "completed", "failed", "rejected"])
          .order("created_at", { ascending: true })
          .limit(50),
      ]);
      if (!queueResponse.ok) throw new Error(`File GitHub indisponible (${queueResponse.status})`);
      setQueue((await queueResponse.json()) as WorkPayload);
      if (!actionsResult.error) setLiveActions((actionsResult.data ?? []) as LiveAction[]);
      setLastSyncAt(new Date().toISOString());
      setClock(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Synchronisation GitHub indisponible");
    } finally {
      setLoading(false);
    }
  }

  async function refreshCommits() {
    try {
      const response = await fetch(bust(COMMITS_API), {
        cache: "no-store",
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!response.ok) {
        if (response.status === 403 || response.status === 429) {
          throw new Error("GitHub limite temporairement les actualisations des commits");
        }
        throw new Error(`Commits GitHub indisponibles (${response.status})`);
      }
      const data = (await response.json()) as Commit[];
      setCommits(data);
      setCommitError(null);
      setLastCommitSyncAt(new Date().toISOString());
    } catch (err) {
      setCommitError(err instanceof Error ? err.message : "Commits GitHub indisponibles");
    }
  }

  async function refreshAll() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([refreshQueue(), refreshCommits()]);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refreshAll();
    const queueTimer = window.setInterval(() => {
      if (!document.hidden) void refreshQueue();
    }, LIVE_REFRESH_MS);
    const commitsTimer = window.setInterval(() => {
      if (!document.hidden) void refreshCommits();
    }, COMMITS_REFRESH_MS);
    const clockTimer = window.setInterval(() => setClock(Date.now()), 60_000);
    const onQueueUpdated = () => void refreshQueue();
    const onFocus = () => {
      setClock(Date.now());
      void refreshQueue();
      void refreshCommits();
    };
    const onVisibility = () => {
      if (!document.hidden) {
        setClock(Date.now());
        void refreshQueue();
        void refreshCommits();
      }
    };
    const onOnline = () => void refreshAll();
    window.addEventListener("angel-os:chatgpt-queue-updated", onQueueUpdated);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(queueTimer);
      window.clearInterval(commitsTimer);
      window.clearInterval(clockTimer);
      window.removeEventListener("angel-os:chatgpt-queue-updated", onQueueUpdated);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const items = useMemo(() => [
    ...(queue?.current ?? []).map((item) => ({ ...item, section: isDone(item.status) ? "Terminé" : "En cours" })),
    ...(queue?.waiting ?? []).map((item) => ({ ...item, section: "File d’attente" })),
    ...(queue?.done ?? []).slice(0, 8).map((item) => ({ ...item, section: "Terminé" })),
  ], [queue]);

  const prioritizedLiveActions = useMemo(() => {
    return [...liveActions].sort((a, b) => {
      const aPending = isPending(a.status);
      const bPending = isPending(b.status);
      if (aPending !== bPending) return aPending ? -1 : 1;

      const aOverdue = isOverdue(a, clock);
      const bOverdue = isOverdue(b, clock);
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

      const aCreated = new Date(a.created_at).getTime();
      const bCreated = new Date(b.created_at).getTime();
      return aCreated - bCreated;
    });
  }, [liveActions, clock]);

  const pendingCount = liveActions.filter((item) => isPending(item.status)).length;
  const overdueCount = liveActions.filter((item) => isOverdue(item, clock)).length;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-[#090b0d] p-4 sm:p-5" aria-label="Activité ChatGPT GitHub" data-no-refresh-queue="true">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white"><Github className="h-5 w-5" /></span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-white">ChatGPT · GitHub en direct</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> En direct
              </span>
            </div>
            <p className="text-xs text-white/45">Demandes traitées par ancienneté. Toute modification encore en attente après 1 h 30 passe automatiquement en priorité renforcée.</p>
            <p className="mt-1 text-[10px] text-white/30">File toutes les 5 s{lastSyncAt ? ` · synchro ${timeLabel(lastSyncAt)}` : ""} · commits toutes les 90 s{lastCommitSyncAt ? ` · ${timeLabel(lastCommitSyncAt)}` : ""}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refreshAll()}
          className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-xs font-medium text-white/65 transition hover:border-white/20 hover:bg-white/[.07] hover:text-white active:scale-[.98]"
          aria-label="Actualiser GitHub maintenant"
          title="Actualiser la file et les commits maintenant"
        >
          {refreshing || loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>

      {error ? <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">{error}</p> : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-white/70">Demandes de modification · priorité aux plus anciennes</p>
              <div className="flex items-center gap-2">
                {overdueCount > 0 ? <span className="rounded-full border border-red-400/25 bg-red-400/10 px-2 py-1 text-[10px] font-semibold text-red-200">{overdueCount} priorité &gt; 1 h 30</span> : null}
                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[10px] font-semibold text-amber-200">{pendingCount} en attente</span>
              </div>
            </div>
            {prioritizedLiveActions.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white/40">Aucune demande enregistrée.</div>
            ) : prioritizedLiveActions.map((item) => {
              const done = isDone(item.status);
              const failed = isFailed(item.status);
              const overdue = isOverdue(item, clock);
              return (
                <div key={item.id} className={`rounded-xl border p-3 ${done ? "border-emerald-500/20 bg-emerald-500/[.055]" : failed ? "border-red-500/20 bg-red-500/[.045]" : overdue ? "border-red-400/35 bg-red-400/[.06]" : "border-amber-400/20 bg-amber-400/[.045]"}`}>
                  <div className="flex items-start gap-2">
                    <StatusIcon status={item.status} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wide ${done ? "border-emerald-500/20 text-emerald-200/80" : failed ? "border-red-500/20 text-red-200/80" : "border-amber-400/20 text-amber-200/80"}`}>{statusLabel(item.status)}</span>
                        {overdue ? <span className="rounded-full border border-red-400/25 bg-red-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-200">Priorité · +1 h 30</span> : null}
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wide text-white/35">{actionKindLabel(item.kind)}</span>
                      </div>
                      {item.description ? <p className="mt-1 text-xs leading-relaxed text-white/45">{item.description}</p> : null}
                      <p className="mt-2 text-[10px] text-white/30">{done ? "terminé" : "demandé"} {dateLabel(done ? item.updated_at : item.created_at)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-white/70">File GitHub</p>{queue?.updatedAt ? <span className="text-[10px] text-white/30">source maj {dateLabel(queue.updatedAt)}</span> : null}</div>
            {items.length === 0 ? <div className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white/40">Aucune demande enregistrée dans la file GitHub.</div> : items.map((item) => {
              const done = isDone(item.status);
              const failed = isFailed(item.status);
              return (
                <div key={`${item.section}-${item.id}`} className={`rounded-xl border p-3 ${done ? "border-emerald-500/20 bg-emerald-500/[.045]" : failed ? "border-red-500/20 bg-red-500/[.04]" : "border-amber-400/20 bg-amber-400/[.04]"}`}>
                  <div className="flex items-start gap-2">
                    <StatusIcon status={item.status} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wide ${done ? "border-emerald-500/20 text-emerald-200/80" : "border-amber-400/20 text-amber-200/80"}`}>{statusLabel(item.status)}</span>
                      </div>
                      {item.detail ? <p className="mt-1 text-xs leading-relaxed text-white/45">{item.detail}</p> : null}
                      {item.commit ? <p className="mt-2 font-mono text-[10px] text-white/35">commit {shortSha(item.commit)}</p> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-white/45">Derniers commits main · en direct</p>
            {lastCommitSyncAt ? <span className="text-[10px] text-white/30">maj {timeLabel(lastCommitSyncAt)}</span> : null}
          </div>
          {commitError ? <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">{commitError}. Les derniers commits déjà chargés restent affichés.</p> : null}
          {commits.length === 0 ? <div className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white/40">Chargement des commits GitHub…</div> : commits.map((commit) => (
            <a key={commit.sha} href={commit.html_url} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/10 bg-white/[.03] p-3 transition hover:border-white/20 hover:bg-white/[.05]">
              <div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] text-white/60">{shortSha(commit.sha)}</span><span className="text-[10px] text-white/30">{dateLabel(commit.commit.author?.date)}</span></div>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/65">{commit.commit.message.split("\n")[0]}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
