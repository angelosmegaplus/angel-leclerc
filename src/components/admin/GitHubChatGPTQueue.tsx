import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Github, Loader2, RefreshCw, TriangleAlert } from "lucide-react";

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

const RAW_QUEUE = "https://raw.githubusercontent.com/angelosmegaplus/angel-leclerc/main/runtime/chatgpt-work.json";
const COMMITS_API = "https://api.github.com/repos/angelosmegaplus/angel-leclerc/commits?sha=main&per_page=6";

function bust(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
}

function shortSha(value?: string) {
  return value ? value.slice(0, 7) : "";
}

function dateLabel(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function StatusIcon({ status }: { status: string }) {
  if (["done", "completed", "ready"].includes(status)) return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  if (["blocked", "failed"].includes(status)) return <TriangleAlert className="h-4 w-4 text-amber-300" />;
  return <Clock3 className="h-4 w-4 text-red-300" />;
}

export function GitHubChatGPTQueue() {
  const [queue, setQueue] = useState<WorkPayload | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const [queueResponse, commitsResponse] = await Promise.all([
        fetch(bust(RAW_QUEUE), { cache: "no-store" }),
        fetch(COMMITS_API, { cache: "no-store", headers: { Accept: "application/vnd.github+json" } }),
      ]);
      if (!queueResponse.ok) throw new Error(`File GitHub indisponible (${queueResponse.status})`);
      setQueue((await queueResponse.json()) as WorkPayload);
      if (commitsResponse.ok) setCommits((await commitsResponse.json()) as Commit[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Synchronisation GitHub indisponible");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 120_000);
    return () => window.clearInterval(timer);
  }, []);

  const items = useMemo(() => [
    ...(queue?.current ?? []).map((item) => ({ ...item, section: "En cours" })),
    ...(queue?.waiting ?? []).map((item) => ({ ...item, section: "File d’attente" })),
    ...(queue?.done ?? []).slice(0, 4).map((item) => ({ ...item, section: "Terminé" })),
  ], [queue]);

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-[#090b0d] p-4 sm:p-5" aria-label="Activité ChatGPT GitHub">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white"><Github className="h-5 w-5" /></span>
          <div>
            <h2 className="font-semibold text-white">ChatGPT · GitHub en direct</h2>
            <p className="text-xs text-white/45">Travail effectué, file d’attente et derniers commits de main.</p>
          </div>
        </div>
        <button type="button" onClick={() => void refresh()} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white/55 hover:text-white" aria-label="Actualiser GitHub">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </button>
      </div>

      {error ? <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">{error}</p> : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-red-300">File GitHub</p>{queue?.updatedAt ? <span className="text-[10px] text-white/30">maj {dateLabel(queue.updatedAt)}</span> : null}</div>
          {items.length === 0 ? <div className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white/40">Aucune demande enregistrée dans la file GitHub.</div> : items.map((item) => (
            <div key={`${item.section}-${item.id}`} className="rounded-xl border border-white/10 bg-white/[.03] p-3">
              <div className="flex items-start gap-2">
                <StatusIcon status={item.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-white">{item.title}</p><span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wide text-white/35">{item.section}</span></div>
                  {item.detail ? <p className="mt-1 text-xs leading-relaxed text-white/45">{item.detail}</p> : null}
                  {item.commit ? <p className="mt-2 font-mono text-[10px] text-red-300/70">commit {shortSha(item.commit)}</p> : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-white/45">Derniers commits main</p>
          {commits.length === 0 ? <div className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white/40">Aucun commit chargé.</div> : commits.map((commit) => (
            <a key={commit.sha} href={commit.html_url} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/10 bg-white/[.03] p-3 transition hover:border-red-500/20 hover:bg-white/[.05]">
              <div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] text-red-300">{shortSha(commit.sha)}</span><span className="text-[10px] text-white/30">{dateLabel(commit.commit.author?.date)}</span></div>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/65">{commit.commit.message.split("\n")[0]}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
