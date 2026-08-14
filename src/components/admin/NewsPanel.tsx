import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminNews, type NewsCategory } from "@/lib/news.functions";

const FILTERS: Array<{ key: NewsCategory; label: string }> = [
  { key: "une", label: "À la une" },
  { key: "politique", label: "Politique & société" },
  { key: "medias", label: "Radio & médias" },
  { key: "journalisme", label: "Journalisme & com" },
  { key: "ia", label: "IA & tech" },
  { key: "dordogne", label: "Sarlat & Dordogne" },
  { key: "emploi", label: "Emploi & alternance" },
];

function formatNewsDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function NewsPanel() {
  const [filter, setFilter] = useState<NewsCategory>("une");
  const getNews = useServerFn(getAdminNews);
  const query = useQuery({
    queryKey: ["admin-news"],
    queryFn: () => getNews(),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const visible = useMemo(
    () => (query.data?.items ?? []).filter((item) => item.category === filter).slice(0, 8),
    [filter, query.data?.items],
  );

  return (
    <section className="mt-5 min-w-0 overflow-hidden border border-white/15 bg-[#111] p-3 sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 shrink-0 text-white/70" />
            <h2 className="text-xl font-light tracking-[-0.01em] text-white">actualités</h2>
          </div>
          <p className="mt-1 text-sm font-light text-white/50">
            À la une et veille personnalisée depuis le web.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
          className="grid h-10 w-10 shrink-0 place-items-center border border-white/20 text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40"
          aria-label="Actualiser les actualités"
        >
          <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((item) => {
          const active = item.key === filter;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`min-h-10 shrink-0 border px-3 text-xs font-medium transition-colors ${
                active
                  ? "border-[#0078d7] bg-[#0078d7] text-white"
                  : "border-white/20 bg-black text-white/60 hover:border-white/40 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {query.isLoading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-16 animate-pulse border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      ) : query.isError || visible.length === 0 ? (
        <div className="mt-4 border-l-4 border-white/20 py-2 pl-3 text-sm font-light text-white/50">
          Actualités momentanément indisponibles pour cette rubrique.
        </div>
      ) : (
        <div className="mt-4 grid min-w-0 gap-2 lg:grid-cols-2">
          {visible.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="group flex min-h-20 min-w-0 items-start gap-3 border border-white/12 bg-black p-3 transition-colors hover:border-white/30"
            >
              <span className="mt-1 h-10 w-1 shrink-0 bg-[#0078d7]" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="line-clamp-3 block break-words text-sm font-normal leading-snug text-white sm:line-clamp-2">
                  {item.title}
                </span>
                <span className="mt-2 flex min-w-0 items-center gap-2 text-[11px] text-white/40">
                  <span className="min-w-0 truncate">{item.source}</span>
                  {item.publishedAt ? <span className="shrink-0">{formatNewsDate(item.publishedAt)}</span> : null}
                </span>
              </span>
              <ExternalLink className="h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-white/60" />
            </a>
          ))}
        </div>
      )}

      {query.data?.fetchedAt ? (
        <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-white/25">
          mise à jour {formatNewsDate(query.data.fetchedAt)}
        </p>
      ) : null}
    </section>
  );
}
