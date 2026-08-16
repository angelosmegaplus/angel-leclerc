import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Film, Loader2, RefreshCw, Search, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { FILM_CATALOG } from "@/lib/film-catalog";
import { getLiveFilmCatalog } from "@/lib/film-live.functions";
import { selectDailyRecommendations, type RecommendationCandidate } from "@/lib/film-recommendations";
import { MovixLauncherPanel } from "@/components/admin/MovixLauncherPanel";

export const Route = createFileRoute("/admin-movix")({
  head: () => ({ meta: [{ title: "Films et séries | Angel OS IA" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: FilmsSeriesPage,
});

type Filter = "all" | "movie" | "tv";

function localFallback(filter: Filter, query: string) {
  const q = query.trim().toLocaleLowerCase("fr");
  return FILM_CATALOG.filter((item) => filter === "all" || item.mediaType === filter).filter((item) => {
    if (q.length < 2) return true;
    return `${item.title} ${item.genreLabel} ${item.pitch}`.toLocaleLowerCase("fr").includes(q);
  });
}

function tmdbRoute(item: RecommendationCandidate) {
  const match = /^tmdb-(movie|tv)-(\d+)$/.exec(item.id);
  return match ? { mediaType: match[1] as "movie" | "tv", tmdbId: match[2] } : null;
}

function FilmsSeriesPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const loadCatalog = useServerFn(getLiveFilmCatalog);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!loading && (!session || !isAdmin)) void navigate({ to: "/auth" });
  }, [isAdmin, loading, navigate, session]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-films-live-tmdb", query, filter],
    queryFn: () => loadCatalog({ data: { query, mediaType: filter, page: 1 } }),
    enabled: Boolean(session && isAdmin),
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });

  const fallback = useMemo(() => localFallback(filter, query), [filter, query]);
  const catalog = useMemo<RecommendationCandidate[]>(() => data?.items?.length ? data.items : fallback, [data?.items, fallback]);
  const picks = useMemo(() => selectDailyRecommendations(catalog, []).slice(0, 5), [catalog]);
  const usingTmdb = data?.source === "tmdb" && Boolean(data.items.length);

  if (loading || !session || !isAdmin) {
    return <main className="grid min-h-screen place-items-center bg-[#050607] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  }

  return (
    <main className="min-h-screen bg-[#050607] px-4 py-6 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1450px]">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-300"><Film className="h-5 w-5" /><span className="font-mono text-[10px] uppercase tracking-[.18em]">Angel OS IA · cinéma personnel</span></div>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.055em] sm:text-5xl">Films et séries</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">TMDB alimente maintenant directement le catalogue, les affiches, les notes et la recherche. Le catalogue Angel OS local ne sert qu’en secours.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1.5 text-xs ${usingTmdb ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-amber-400/25 bg-amber-400/10 text-amber-100"}`}>{usingTmdb ? "TMDB connecté" : "Secours local"}</span>
            <Link to="/admin" className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm text-white/70">Retour à Angel OS</Link>
          </div>
        </header>

        <section className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={(event) => { event.preventDefault(); setQuery(draftQuery.trim()); }} className="flex min-h-12 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-3">
            <Search className="h-4 w-4 text-white/35" />
            <input value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} placeholder="Rechercher un film ou une série sur TMDB…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/25" />
            <button type="submit" className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold">Rechercher</button>
          </form>
          <div className="flex items-center gap-2">
            {(["all", "movie", "tv"] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-11 rounded-xl border px-3 text-xs ${filter === value ? "border-red-400/30 bg-red-500/15 text-red-100" : "border-white/10 bg-white/[.03] text-white/55"}`}>{value === "all" ? "Tout" : value === "movie" ? "Films" : "Séries"}</button>)}
            <button type="button" onClick={() => void refetch()} className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[.03] text-white/55" aria-label="Actualiser"><RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /></button>
          </div>
        </section>

        {!query && picks.length > 0 ? <section className="mt-9"><div className="flex items-end justify-between gap-3"><div><h2 className="text-2xl font-semibold tracking-[-.04em]">À regarder aujourd’hui</h2><p className="mt-1 text-xs text-white/35">Sélection calculée à partir du catalogue TMDB disponible.</p></div>{isLoading || isFetching ? <span className="inline-flex items-center gap-1.5 text-xs text-white/35"><Loader2 className="h-3.5 w-3.5 animate-spin" />TMDB</span> : null}</div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{picks.map(({ candidate }) => <MediaCard key={`pick-${candidate.id}`} item={candidate} />)}</div></section> : null}

        <section className="mt-10 border-t border-white/10 pt-7">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-semibold tracking-[-.04em]">{query ? `Résultats pour « ${query} »` : "Catalogue pour toi"}</h2><p className="mt-1 text-xs text-white/35">{catalog.length} titre{catalog.length > 1 ? "s" : ""} · source {usingTmdb ? "TMDB" : "locale de secours"}</p></div></div>
          {data?.source === "unavailable" ? <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[.06] px-4 py-3 text-xs leading-5 text-amber-100/75">TMDB n’a pas répondu correctement. Angel OS utilise temporairement son catalogue local et retentera au prochain chargement.</div> : null}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{catalog.map((item) => <MediaCard key={item.id} item={item} />)}</div>
        </section>

        <MovixLauncherPanel />
      </div>
    </main>
  );
}

function MediaCard({ item }: { item: RecommendationCandidate }) {
  const route = tmdbRoute(item);
  const content = <><div className="relative aspect-[2/3] overflow-hidden bg-[#111318]">{item.posterUrl ? <img src={item.posterUrl} alt={`Affiche de ${item.title}`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center px-4 text-center text-xs text-white/25">Affiche indisponible</div>}<div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" /><span className="absolute left-2 top-2 rounded-md bg-black/75 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/75">{item.mediaType === "movie" ? "Film" : "Série"}</span><div className="absolute inset-x-0 bottom-0 p-3"><h3 className="line-clamp-2 text-sm font-semibold">{item.title}</h3><div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/60"><span>{item.year}</span>{item.rating ? <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{item.rating.toFixed(1)}</span> : null}</div></div></div><div className="p-3"><p className="line-clamp-1 text-[10px] font-medium text-red-200/70">{item.genreLabel}</p><p className="mt-1.5 line-clamp-3 text-xs leading-5 text-white/45">{item.pitch}</p></div></>;
  const className = "group block overflow-hidden rounded-xl border border-white/10 bg-white/[.035] transition hover:-translate-y-1 hover:border-white/20";
  if (route) return <Link to="/admin-movix/tmdb/$mediaType/$tmdbId" params={route} className={className}>{content}</Link>;
  return <Link to="/admin-movix/$id" params={{ id: item.id }} className={className}>{content}</Link>;
}
