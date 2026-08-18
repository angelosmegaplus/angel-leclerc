import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";
import type { NewsCategory, NewsPayload } from "@/lib/news.functions";
import { GitHubChatGPTQueue } from "@/components/admin/GitHubChatGPTQueue";

const FILTERS: Array<{ key: NewsCategory; label: string }> = [
  { key: "une", label: "À la une" },
  { key: "politique", label: "Politique" },
  { key: "dordogne", label: "Sarlat & Dordogne" },
  { key: "tourisme", label: "Tourisme" },
  { key: "medias", label: "Radio & médias" },
  { key: "journalisme", label: "Journalisme & com" },
  { key: "emploi", label: "Emploi & alternance" },
  { key: "ia", label: "IA & tech" },
  { key: "scoutisme", label: "Scoutisme" },
];

const NEWS_REFRESH_MS = 15 * 60 * 1000;

function formatNewsDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function NewsPanel({ showQueue = true }: { showQueue?: boolean }) {
  const [filter, setFilter] = useState<NewsCategory>("une");
  const fetchPayload = async (refreshBucket: number) => {
    const response = await fetch(`/api/admin/news?refresh=${refreshBucket}`, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error("Actualités indisponibles");
    return (await response.json()) as NewsPayload;
  };
  const query = useQuery({
    queryKey: ["admin-news"],
    queryFn: () => fetchPayload(Math.floor(Date.now() / NEWS_REFRESH_MS)),
    staleTime: 5 * 60 * 1000,
    refetchOnReconnect: true,
    retry: 2,
  });
  const visible = useMemo(() => (query.data?.items ?? []).filter((item) => item.category === filter).slice(0, 8), [filter, query.data?.items]);

  return (
    <>
      {showQueue ? <GitHubChatGPTQueue /> : null}
      <section className="mt-5 min-w-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#090b0d]/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,.28)] sm:rounded-[1.75rem] sm:p-6">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300"><Newspaper className="h-5 w-5" /></span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-white sm:text-xl">Actualités</h2>
              <p className="mt-0.5 max-w-3xl text-xs leading-relaxed text-white/50 sm:text-sm">Politique, Sarlat, tourisme, radio et projets professionnels en priorité · actualisation toutes les 15 minutes.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link to="/admin-actualites" className="hidden min-h-10 items-center rounded-xl border border-red-500/20 bg-red-500/10 px-3 text-xs font-semibold text-red-200 transition hover:bg-red-500/15 sm:inline-flex">Tout voir</Link>
            <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white/60 transition hover:border-red-500/20 hover:text-white active:scale-95 disabled:opacity-40" aria-label="Actualiser les actualités"><RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /></button>
          </div>
        </div>

        <Link to="/admin-actualites" className="mt-3 inline-flex min-h-10 items-center rounded-xl border border-red-500/20 bg-red-500/10 px-3 text-xs font-semibold text-red-200 sm:hidden">Ouvrir la page complète</Link>

        <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((item) => {
            const active = item.key === filter;
            return <button key={item.key} type="button" onClick={() => setFilter(item.key)} aria-pressed={active} className={`min-h-10 shrink-0 rounded-xl border px-3 text-xs font-semibold transition-colors ${active ? "border-red-500/35 bg-red-500/15 text-red-100" : "border-white/10 bg-white/[.025] text-white/55 hover:border-red-500/20 hover:bg-red-500/[.04] hover:text-white"}`}>{item.label}</button>;
          })}
        </div>

        {query.isLoading ? (
          <div className="mt-4 grid gap-2 lg:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl border border-white/8 bg-white/[.035]" />)}</div>
        ) : query.isError || visible.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.025] px-4 py-5 text-sm text-white/50">Aucune actualité suffisamment pertinente ou récente pour cette rubrique.</div>
        ) : (
          <div className="mt-4 grid min-w-0 gap-2 lg:grid-cols-2">
            {visible.map((item) => (
              <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="group flex min-h-24 min-w-0 items-start gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-red-500/20 hover:bg-red-500/[.035] active:scale-[0.99]">
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-3 block break-words text-sm font-semibold leading-snug text-white sm:line-clamp-2">{item.title}</span>
                  <span className="mt-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-white/45"><span className="min-w-0 truncate">{item.source}</span>{item.publishedAt ? <span className="shrink-0 text-white/35">{formatNewsDate(item.publishedAt)}</span> : null}</span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-white/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-red-300" />
              </a>
            ))}
          </div>
        )}
        {query.data?.fetchedAt ? <p className="mt-3 text-[10px] font-medium text-white/35">Mis à jour {formatNewsDate(query.data.fetchedAt)}</p> : null}
      </section>
    </>
  );
}
