import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, ExternalLink, Loader2, Play, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { directTmdbImage, getDirectTmdbDetail } from "@/lib/film-tmdb-direct.functions";
import type { ViewingSignal } from "@/lib/film-recommendations";

export const Route = createFileRoute("/admin-movix/tmdb/$mediaType/$tmdbId")({
  head: () => ({ meta: [{ title: "Fiche TMDB | Angel OS" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: TmdbDetailPage,
});

const SIGNALS_KEY = "angel-os-film-series-signals-v2";

function TmdbDetailPage() {
  const { mediaType, tmdbId } = Route.useParams();
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const loadDetail = useServerFn(getDirectTmdbDetail);
  const [playingTrailer, setPlayingTrailer] = useState(false);
  const [signals, setSignals] = useState<ViewingSignal[]>([]);
  const safeType = mediaType === "tv" ? "tv" as const : "movie" as const;
  const candidateId = `tmdb-${safeType}-${tmdbId}`;

  useEffect(() => {
    if (!loading && (!session || !isAdmin)) void navigate({ to: "/auth" });
  }, [isAdmin, loading, navigate, session]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(SIGNALS_KEY) ?? "[]");
      setSignals(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSignals([]);
    }
  }, []);

  const { data: detail, isLoading, isError } = useQuery({
    queryKey: ["tmdb-direct-detail", safeType, tmdbId],
    queryFn: () => loadDetail({ data: { mediaType: safeType, tmdbId } }),
    enabled: Boolean(session && isAdmin),
    staleTime: 12 * 60 * 60 * 1000,
    retry: 1,
  });

  const currentSignal = useMemo(() => signals.find((signal) => signal.candidateId === candidateId), [candidateId, signals]);

  const registerSignal = (patch: Partial<ViewingSignal>, returnAfter = false) => {
    if (!detail) return;
    const nextSignal: ViewingSignal = {
      candidateId,
      mediaType: detail.mediaType,
      genreIds: detail.genreIds,
      keywords: detail.genres.map((genre) => genre.toLocaleLowerCase("fr").replace(/\s+/g, "_")),
      people: detail.cast.slice(0, 8).map((person) => person.name),
      year: Number(detail.year) || new Date().getFullYear(),
      completion: currentSignal?.completion ?? 0,
      liked: currentSignal?.liked,
      rejected: currentSignal?.rejected,
      ...patch,
    };
    const next = [nextSignal, ...signals.filter((signal) => signal.candidateId !== candidateId)];
    setSignals(next);
    try { localStorage.setItem(SIGNALS_KEY, JSON.stringify(next)); } catch { /* optional local preference storage */ }
    if (returnAfter) void navigate({ to: "/admin-movix" });
  };

  if (loading || !session || !isAdmin) return <main className="grid min-h-screen place-items-center bg-[#050607] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  if (isLoading) return <main className="grid min-h-screen place-items-center bg-[#050607] text-white"><div className="flex items-center gap-2 text-sm text-white/50"><Loader2 className="h-5 w-5 animate-spin" />Chargement TMDB…</div></main>;
  if (isError || !detail) return <main className="grid min-h-screen place-items-center bg-[#050607] p-6 text-white"><div className="text-center"><h1 className="text-2xl font-semibold">Fiche TMDB indisponible</h1><p className="mt-2 text-sm text-white/45">Angel OS réessaiera automatiquement au prochain appel.</p><Link to="/admin-movix" className="mt-5 inline-block rounded-xl border border-white/10 px-4 py-2 text-sm">Retour au catalogue</Link></div></main>;

  const poster = directTmdbImage(detail.poster, "w500");
  const backdrop = directTmdbImage(detail.backdrop, "original") || poster;
  const providers = [...detail.providers.flatrate, ...detail.providers.rent, ...detail.providers.buy].filter((provider, index, all) => all.findIndex((item) => item.id === provider.id) === index);

  return <main className="min-h-screen bg-[#050607] text-white">
    <section className="relative overflow-hidden border-b border-white/10">
      {backdrop ? <img src={backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" /> : null}
      <div className="absolute inset-0 bg-gradient-to-r from-[#050607] via-[#050607]/90 to-[#050607]/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050607] via-transparent to-black/50" />
      <div className="relative mx-auto max-w-[1320px] px-4 pb-10 pt-5 sm:px-8 lg:px-10">
        <Link to="/admin-movix" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/80 backdrop-blur"><ArrowLeft className="h-4 w-4" />Retour au catalogue</Link>
        <div className="mt-8 grid gap-7 sm:grid-cols-[190px_1fr] lg:grid-cols-[250px_1fr] lg:items-end">
          <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/[.03] shadow-2xl">{poster ? <img src={poster} alt={`Affiche de ${detail.title}`} className="h-full w-full object-cover" /> : null}</div>
          <div><div className="flex flex-wrap items-center gap-2 text-xs text-white/50"><span>{safeType === "movie" ? "Film" : "Série"}</span>{detail.year ? <><span>•</span><span>{detail.year}</span></> : null}{detail.runtime ? <><span>•</span><span>{detail.runtime}</span></> : null}</div><h1 className="mt-3 text-4xl font-semibold tracking-[-.055em] sm:text-5xl lg:text-7xl">{detail.title}</h1>{detail.tagline ? <p className="mt-2 max-w-2xl text-sm italic text-white/45 sm:text-base">{detail.tagline}</p> : null}<div className="mt-4 flex flex-wrap items-center gap-2">{detail.rating ? <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{detail.rating.toFixed(1)}</span> : null}{detail.genres.map((genre) => <span key={genre} className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/65">{genre}</span>)}</div><p className="mt-5 max-w-3xl text-base leading-7 text-white/75 sm:text-lg">{detail.overview || "Synopsis indisponible."}</p>{detail.trailerKey ? <button type="button" onClick={() => setPlayingTrailer((value) => !value)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"><Play className="h-4 w-4 fill-current" />{playingTrailer ? "Masquer la bande-annonce" : "Lire la bande-annonce"}</button> : null}</div>
        </div>
      </div>
    </section>

    <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-8 lg:px-10">
      {playingTrailer && detail.trailerKey ? <section className="mb-9 overflow-hidden rounded-2xl border border-white/10 bg-black"><div className="aspect-video"><iframe src={`https://www.youtube-nocookie.com/embed/${detail.trailerKey}?autoplay=1&rel=0`} title={`Bande-annonce de ${detail.title}`} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full" /></div></section> : null}
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-9">
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5 sm:p-6"><h2 className="text-xl font-semibold">Synopsis</h2><p className="mt-4 text-sm leading-7 text-white/70 sm:text-base">{detail.overview || "Aucun synopsis disponible."}</p></section>
          {detail.cast.length ? <section><h2 className="text-xl font-semibold">Casting</h2><div className="mt-4 flex gap-4 overflow-x-auto pb-2">{detail.cast.map((person) => <div key={person.id} className="w-24 shrink-0"><div className="aspect-square overflow-hidden rounded-full border border-white/10 bg-white/[.04]">{person.photo ? <img src={directTmdbImage(person.photo, "w185")!} alt={person.name} loading="lazy" className="h-full w-full object-cover" /> : null}</div><p className="mt-2 line-clamp-2 text-center text-xs font-medium text-white/80">{person.name}</p><p className="line-clamp-1 text-center text-[10px] text-white/35">{person.character}</p></div>)}</div></section> : null}
        </div>
        <aside className="h-fit space-y-4 lg:sticky lg:top-5">
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><h2 className="text-lg font-semibold">Ton avis</h2><p className="mt-1 text-xs leading-5 text-white/40">Tes choix entraînent directement la sélection personnalisée.</p><div className="mt-4 space-y-2"><button type="button" onClick={() => registerSignal({ completion: 0.6, liked: true, rejected: false })} className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 text-left text-sm ${currentSignal?.liked && !currentSignal.rejected ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/[.04]"}`}><ThumbsUp className="h-4 w-4" />J’aime</button><button type="button" onClick={() => registerSignal({ completion: 0.5, liked: false, rejected: true }, true)} className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 text-left text-sm ${currentSignal?.rejected ? "border-red-400/35 bg-red-400/10 text-red-100" : "border-white/10 bg-white/[.04]"}`}><ThumbsDown className="h-4 w-4" />Je n’aime pas</button><button type="button" onClick={() => registerSignal({ completion: 1, rejected: false }, true)} className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 text-left text-sm ${currentSignal?.completion === 1 && !currentSignal.rejected ? "border-blue-400/35 bg-blue-400/10 text-blue-100" : "border-white/10 bg-white/[.04]"}`}><Check className="h-4 w-4" />Déjà vu</button></div></section>
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><h2 className="text-lg font-semibold">Disponible en France</h2>{providers.length ? <div className="mt-4 flex flex-wrap gap-2">{providers.map((provider) => <span key={provider.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] py-1.5 pl-1.5 pr-3 text-xs text-white/75">{provider.logo ? <img src={directTmdbImage(provider.logo, "w92")!} alt="" className="h-7 w-7 rounded-lg" /> : null}{provider.name}</span>)}</div> : <p className="mt-3 text-sm text-white/40">Aucune plateforme remontée par TMDB pour la France.</p>}{detail.providers.link ? <a href={detail.providers.link} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs text-red-200">Voir les disponibilités <ExternalLink className="h-3.5 w-3.5" /></a> : null}</section>
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="text-[10px] uppercase tracking-[.14em] text-white/35">Source</p><p className="mt-2 text-sm text-white/75">TMDB #{detail.tmdbId}</p><p className="mt-1 text-xs leading-5 text-white/35">Données chargées côté serveur puis utilisées par l’algorithme personnel Angel OS.</p></section>
        </aside>
      </div>
    </div>
  </main>;
}
