import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";
import type { NewsCategory, NewsPayload } from "@/lib/news.functions";

const FILTERS: Array<{ key: NewsCategory; label: string }> = [
  { key: "une", label: "À la une" },
  { key: "politique", label: "Politique" },
  { key: "medias", label: "Radio & médias" },
  { key: "journalisme", label: "Journalisme & com" },
  { key: "ia", label: "IA & tech" },
  { key: "dordogne", label: "Sarlat & Dordogne" },
  { key: "emploi", label: "Emploi & alternance" },
];

const NEWS_REFRESH_MS = 15 * 60 * 1000;

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
  const query = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => {
      // Change the URL every 15 minutes so an old CDN response cannot keep
      // the admin homepage stuck on the same headlines for hours.
      const refreshBucket = Math.floor(Date.now() / NEWS_REFRESH_MS);
      const response = await fetch(`/api/admin/news?refresh=${refreshBucket}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Actualités indisponibles");
      return (await response.json()) as NewsPayload;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: NEWS_REFRESH_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  });

  const visible = useMemo(
    () => (query.data?.items ?? []).filter((item) => item.category === filter).slice(0, 8),
    [filter, query.data?.items],
  );

  return (
    <section className="mt-5 min-w-0 overflow-hidden rounded-[2rem] bg-white p-4 shadow-sm sm:p-6">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8def8] text-[#594b66]">
              <Newspaper className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#202124]">Actualités</h2>
              <p className="text-sm text-[#5f6368]">Veille web rafraîchie toutes les 15 minutes · « À la une » privilégie les sujets récents qui correspondent le mieux à vos centres d’intérêt.</p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/admin-actualites"
            className="hidden min-h-10 items-center rounded-full bg-[#d3e3fd] px-4 text-xs font-semibold text-[#0b57d0] sm:inline-flex"
          >
            Tout voir
          </Link>
          <button
            type="button"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="grid h-10 w-10 place-items-center rounded-full bg-[#f0f4f9] text-[#4f5660] transition-transform active:scale-95 disabled:opacity-40"
            aria-label="Actualiser les actualités"
          >
            <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <Link
        to="/admin-actualites"
        className="mt-3 inline-flex min-h-10 items-center rounded-full bg-[#d3e3fd] px-4 text-xs font-semibold text-[#0b57d0] sm:hidden"
      >
        Ouvrir la page complète
      </Link>

      <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((item) => {
          const active = item.key === filter;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-semibold transition-colors ${
                active
                  ? "bg-[#0b57d0] text-white"
                  : "bg-[#f0f4f9] text-[#4f5660] hover:bg-[#e4e9f1]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {query.isLoading ? (
        <div className="mt-4 grid gap-2 lg:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-[1.5rem] bg-[#f0f4f9]" />
          ))}
        </div>
      ) : query.isError || visible.length === 0 ? (
        <div className="mt-4 rounded-[1.5rem] bg-[#f0f4f9] px-4 py-5 text-sm text-[#5f6368]">
          Actualités momentanément indisponibles pour cette rubrique. Le reste d’Angel OS reste utilisable.
        </div>
      ) : (
        <div className="mt-4 grid min-w-0 gap-2 lg:grid-cols-2">
          {visible.map((item, index) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className={`group flex min-h-24 min-w-0 items-start gap-3 rounded-[1.5rem] p-4 transition-transform active:scale-[0.99] ${
                index % 3 === 0 ? "bg-[#e8def8]" : index % 3 === 1 ? "bg-[#d3e3fd]" : "bg-[#f0f4f9]"
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="line-clamp-3 block break-words text-sm font-semibold leading-snug text-[#202124] sm:line-clamp-2">
                  {item.title}
                </span>
                <span className="mt-3 flex min-w-0 items-center gap-2 text-[11px] font-medium text-[#5f6368]">
                  <span className="min-w-0 truncate">{item.source}</span>
                  {item.publishedAt ? <span className="shrink-0">{formatNewsDate(item.publishedAt)}</span> : null}
                </span>
              </span>
              <ExternalLink className="h-4 w-4 shrink-0 text-[#5f6368] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          ))}
        </div>
      )}

      {query.data?.fetchedAt ? (
        <p className="mt-3 text-[10px] font-medium text-[#80868b]">Mis à jour {formatNewsDate(query.data.fetchedAt)} · prochain rafraîchissement automatique sous 15 min</p>
      ) : null}
    </section>
  );
}
