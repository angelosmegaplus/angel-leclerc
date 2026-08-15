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
const LIVE_REFRESH_MS = 15_000;

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

function isDone(status: string) {
  return ["done", "completed", "ready", "published", "resolved"].includes(status);
}

function isFailed(status: string) {
  return ["failed", "error", "rejected"].includes(status);
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
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const [queueResponse, commitsResponse, actionsResult] = await Promise.all([
        fetch(bust(RAW_QUEUE), { cache: "no-store" }),
        fetch(COMMITS_API, { cache: "no-store", headers: { Accept: "application/vnd.github+json" } }),
        supabase
          .from("ai_actions")
          .select("id, kind, title, description, status, created_at, updated_at")
          .in("kind", ["refresh_check", "chatgpt_task", "operator_request"])
          .in("status", ["pending", "running", "awaiting_operator", "completed", "failed", "rejected"])
          .order("updated_at", { ascending: false })
          .limit(50),
      ]);
      if (!queueResponse.ok) throw new Error(`File GitHub indisponible (${queueResponse.status})`);
      setQueue((await queueResponse.json()) as WorkPayload);
      if (commitsResponse.ok) setCommits((await commitsResponse.json()) as Commit[]);
      if (!actionsResult.error) setLiveActions((actionsResult.data ?? []) as LiveAction[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Synchronisation GitHub indisponible");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), LIVE_REFRESH_MS);
    const onQueueUpdated = () => void refresh();
    window.addEventListener("angel-os:chatgpt-queue-updated", onQueueUpdated);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("angel-os:chatgpt-queue-updated", onQueueUpdated);
    };
  }, []);

  const items = useMemo(() => [
    ...(queue?.current ?? []).map((item) => ({ ...item, section: isDone(item.status) ? "Terminé" : "En cours" })),
    ...(queue?.waiting ?? []).map((item) => ({ ...item, section: "File d’attente" })),
    ...(queue?.done ?? []).slice(0, 8).map((item) => ({ ...item, section: "Terminé" })),
  ], [queue]);

  const pendingCount = liveActions.filter((item) => !isDone(item.status) && !isFailed(item.status)).length;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-[#090b0d] p-4 sm:p-5" aria-label="Activité ChatGPT GitHub" data-no-refresh-queue="true">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white"><Github className="h-5 w-5" /></span>
          <div>
            <h2 className="font-semibold text-white">ChatGPT · GitHub en direct</h2>
            <p className="text-xs text-white/45">Toutes les demandes de modification, leur état et les derniers commits de main.</p>
          </div>
        </div>
        <button type="button" onClick={() => void refresh()} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white/55 hover:text-white" aria-label="Actualiser GitHub">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </button>
      </div>

      {error ? <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">{error}</p> : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-white/70">Demandes de modification</p>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[10px] font-semibold text-amber-200">{pendingCount} en attente</span>
            </div>
            {liveActions.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white/40">Aucune demande enregistrée.</div>
            ) : liveActions.map((item) => {
              const done = isDone(item.status);
              const failed = isFailed(item.status);
              return (
                <div key={item.id} className={`rounded-xl border p-3 ${done ? "border-emerald-500/20 bg-emerald-500/[.055]" : failed ? "border-red-500/20 bg-red-500/[.045]" : "border-amber-400/20 bg-amber-400/[.045]"}`}>
                  <div className="flex items-start gap-2">
                    <StatusIcon status={item.status} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wide ${done ? "border-emerald-500/20 text-emerald-200/80" : failed ? "border-red-500/20 text-red-200/80" : "border-amber-400/20 text-amber-200/80"}`}>{statusLabel(item.status)}</span>
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
            <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-white/70">File GitHub</p>{queue?.updatedAt ? <span className="text-[10px] text-white/30">maj {dateLabel(queue.updatedAt)}</span> : null}</div>
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
          <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-white/45">Derniers commits main</p>
          {commits.length === 0 ? <div className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white/40">Aucun commit chargé.</div> : commits.map((commit) => (
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
