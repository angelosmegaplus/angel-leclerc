import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, ExternalLink, Loader2, Play, Star } from "lucide-react";
import { motion, MotionConfig } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { FILM_CATALOG, coverFor, getFilmById } from "@/lib/film-catalog";
import { getFilmDetail, tmdbImage, type Provider } from "@/lib/film-tmdb.functions";
import type { RecommendationCandidate, ViewingSignal } from "@/lib/film-recommendations";

export const Route = createFileRoute("/admin-movix/$id")({
  head: () => ({ meta: [{ title: "Fiche film | Angel OS" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: FilmDetailPage,
});

const SIGNALS_KEY = "angel-os-film-series-signals-v2";
const FALLBACK = `data:image/svg+xml,${encodeURIComponent('<svg width="500" height="750" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111318"/><text x="50%" y="48%" fill="#d1d5db" font-size="32" font-family="sans-serif" text-anchor="middle">ANGEL OS</text><text x="50%" y="54%" fill="#71717a" font-size="20" font-family="sans-serif" text-anchor="middle">FILMS &amp; SERIES</text></svg>')}`;

function ProviderList({ label, items }: { label: string; items: Provider[] }) {
  if (!items.length) return null;
  return <div className="mt-4"><p className="text-xs font-medium uppercase tracking-[.12em] text-white/35">{label}</p><div className="mt-2 flex flex-wrap gap-2">{items.map((provider) => <span key={provider.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] py-1.5 pl-1.5 pr-3 text-xs text-white/75">{provider.logo ? <img src={tmdbImage(provider.logo, "w92")!} alt="" className="h-7 w-7 rounded-lg" /> : null}{provider.name}</span>)}</div></div>;
}

function FilmDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const candidate = useMemo(() => getFilmById(id), [id]);
  const [signals, setSignals] = useState<ViewingSignal[]>([]);
  const [playingTrailer, setPlayingTrailer] = useState(false);
  const fetchDetail = useServerFn(getFilmDetail);

  useEffect(() => { if (!loading && (!session || !isAdmin)) void navigate({ to: "/auth" }); }, [isAdmin, loading, navigate, session]);
  useEffect(() => { try { setSignals(JSON.parse(localStorage.getItem(SIGNALS_KEY) ?? "[]")); } catch { /* optional */ } }, []);

  const { data: detail, isPending: detailLoading } = useQuery({
    queryKey: ["film-detail-tmdb", candidate?.id],
    queryFn: () => candidate ? fetchDetail({ data: { id: candidate.id, title: candidate.title, year: candidate.year, mediaType: candidate.mediaType } }) : Promise.resolve(null),
    enabled: Boolean(candidate),
    staleTime: 1000 * 60 * 60 * 12,
    retry: 1,
  });

  const registerSignal = (item: RecommendationCandidate, patch: Partial<ViewingSignal>, replaceAfter = false) => {
    const existing = signals.find((signal) => signal.candidateId === item.id);
    const nextSignal: ViewingSignal = { candidateId: item.id, mediaType: item.mediaType, genreIds: item.genreIds, keywords: item.keywords, people: item.people, director: item.director, year: item.year, completion: existing?.completion ?? 0, liked: existing?.liked, rejected: existing?.rejected, ...patch };
    const next = [nextSignal, ...signals.filter((signal) => signal.candidateId !== item.id)];
    setSignals(next);
    try { localStorage.setItem(SIGNALS_KEY, JSON.stringify(next)); } catch { /* optional */ }
    if (replaceAfter) void navigate({ to: "/admin-movix" });
  };

  const localRelated = useMemo(() => {
    if (!candidate) return [];
    return FILM_CATALOG.filter((item) => item.id !== candidate.id).map((item) => ({ item, overlap: item.genreIds.filter((genre) => candidate.genreIds.includes(genre)).length + item.keywords.filter((keyword) => candidate.keywords.includes(keyword)).length })).sort((a, b) => b.overlap - a.overlap).slice(0, 6).map(({ item }) => item);
  }, [candidate]);

  if (loading || !session || !isAdmin) return <main className="grid min-h-screen place-items-center bg-[#050607] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  if (!candidate) return <main className="grid min-h-screen place-items-center bg-[#050607] p-6 text-white"><div className="text-center"><h1 className="text-2xl font-semibold">Titre introuvable</h1><Link to="/admin-movix" className="mt-4 inline-block text-sm text-white/60">Retour à la sélection</Link></div></main>;

  const poster = tmdbImage(detail?.poster, "w500") || coverFor(candidate) || FALLBACK;
  const backdrop = tmdbImage(detail?.backdrop, "original") || candidate.backdropUrl || poster;
  const synopsis = detail?.overview || candidate.pitch;
  const rating = detail?.rating || candidate.rating;
  const year = detail?.year || String(candidate.year);
  const runtime = detail?.runtime || candidate.runtime || "";
  const genres = detail?.genres?.length ? detail.genres : candidate.genreLabel.split("·").map((genre) => genre.trim());
  const hasProviders = Boolean(detail && (detail.providers.flatrate.length || detail.providers.rent.length || detail.providers.buy.length));

  return <MotionConfig reducedMotion="user"><main className="min-h-screen bg-[#050607] text-white">
    <section className="relative overflow-hidden border-b border-white/10">
      <img src={backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 blur-[1px]" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = FALLBACK; }} />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050607] via-[#050607]/85 to-[#050607]/25" /><div className="absolute inset-0 bg-gradient-to-t from-[#050607] via-[#050607]/20 to-black/50" />
      <div className="relative mx-auto max-w-[1320px] px-4 pb-8 pt-5 sm:px-8 lg:px-10 lg:pb-12">
        <Link to="/admin-movix" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/80 backdrop-blur"><ArrowLeft className="h-4 w-4" /> Retour</Link>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-8 grid gap-6 sm:grid-cols-[180px_1fr] lg:grid-cols-[245px_1fr] lg:items-end">
          <img src={poster} alt={`Affiche de ${candidate.title}`} className="aspect-[2/3] w-[150px] rounded-2xl border border-white/10 object-cover shadow-2xl sm:w-full" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = FALLBACK; }} />
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/55"><span>{candidate.mediaType === "movie" ? "Film" : "Série"}</span><span>•</span><span>{year}</span>{runtime ? <><span>•</span><span>{runtime}</span></> : null}</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-.055em] sm:text-5xl lg:text-7xl">{detail?.title || candidate.title}</h1>
            {detail?.tagline ? <p className="mt-2 max-w-2xl text-sm italic text-white/45 sm:text-base">{detail.tagline}</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-2">{rating ? <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {rating.toFixed(1)}</span> : null}{genres.map((genre) => <span key={genre} className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/65">{genre}</span>)}</div>
            <p className="mt-5 max-w-3xl text-base leading-7 text-white/75 sm:text-lg">{synopsis}</p>
            {detail?.trailerKey ? <button type="button" onClick={() => setPlayingTrailer((value) => !value)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"><Play className="h-4 w-4 fill-current" />{playingTrailer ? "Masquer la bande-annonce" : "Lire la bande-annonce"}</button> : null}
          </div>
        </motion.div>
      </div>
    </section>

    <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-8 lg:px-10">
      {detailLoading ? <div className="mb-6 flex items-center gap-2 text-sm text-white/40"><Loader2 className="h-4 w-4 animate-spin" /> Chargement des données cinéma…</div> : null}
      {playingTrailer && detail?.trailerKey ? <section className="mb-9 overflow-hidden rounded-2xl border border-white/10 bg-black"><div className="aspect-video"><iframe src={`https://www.youtube-nocookie.com/embed/${detail.trailerKey}?autoplay=1&rel=0`} title={`Bande-annonce de ${candidate.title}`} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full" /></div></section> : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          {detail?.cast?.length ? <section><h2 className="text-xl font-semibold">Casting</h2><div className="mt-4 flex gap-4 overflow-x-auto pb-2">{detail.cast.map((person) => <div key={person.id} className="w-24 shrink-0"><div className="aspect-square overflow-hidden rounded-full border border-white/10 bg-white/[.04]">{person.photo ? <img src={tmdbImage(person.photo, "w185")!} alt={person.name} loading="lazy" className="h-full w-full object-cover" /> : null}</div><p className="mt-2 line-clamp-2 text-center text-xs font-medium text-white/80">{person.name}</p><p className="line-clamp-1 text-center text-[10px] text-white/35">{person.character}</p></div>)}</div></section> : <section><h2 className="text-xl font-semibold">Distribution principale</h2><p className="mt-3 text-sm leading-6 text-white/65">{candidate.people.join(" · ")}</p></section>}

          <section><h2 className="text-xl font-semibold">Pourquoi Angel OS te le recommande</h2><div className="mt-4 flex flex-wrap gap-2">{candidate.keywords.map((keyword) => <span key={keyword} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs text-white/60">{keyword.replaceAll("_", " ")}</span>)}</div></section>

          <section><h2 className="text-xl font-semibold">Titres proches</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{(detail?.similar?.length ? detail.similar.slice(0, 6).map((item) => ({ kind: "tmdb" as const, ...item })) : localRelated.map((item) => ({ kind: "local" as const, ...item }))).map((item) => item.kind === "local" ? <Link key={item.id} to="/admin-movix/$id" params={{ id: String(item.id) }} className="group overflow-hidden rounded-xl border border-white/10 bg-white/[.03]"><div className="relative aspect-[2/3]"><img src={coverFor(item)} alt={item.title} loading="lazy" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = FALLBACK; }} /><div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" /><p className="absolute inset-x-0 bottom-0 p-3 text-sm font-semibold">{item.title}</p></div></Link> : <div key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[.03]"><div className="relative aspect-[2/3]">{item.poster ? <img src={tmdbImage(item.poster, "w342")!} alt={item.title} loading="lazy" className="h-full w-full object-cover" /> : null}<div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" /><div className="absolute inset-x-0 bottom-0 p-3"><p className="line-clamp-2 text-sm font-semibold">{item.title}</p><p className="mt-1 text-[10px] text-white/45">{item.year}</p></div></div></div>)}</div></section>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-5">
          <section className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><h2 className="text-base font-semibold">Où le regarder en France</h2>{hasProviders && detail ? <><ProviderList label="Inclus dans l’abonnement" items={detail.providers.flatrate} /><ProviderList label="Location" items={detail.providers.rent} /><ProviderList label="Achat" items={detail.providers.buy} />{detail.providers.link ? <a href={detail.providers.link} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-red-200 underline underline-offset-4">Voir toutes les offres <ExternalLink className="h-3.5 w-3.5" /></a> : null}<p className="mt-3 text-[10px] leading-4 text-white/30">Disponibilité fournie par JustWatch via TMDB.</p></> : <><p className="mt-2 text-sm text-white/45">Aucune offre légale remontée automatiquement pour le moment.</p><a href={`https://www.justwatch.com/fr/recherche?q=${encodeURIComponent(candidate.title)}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs text-white/65 underline underline-offset-4">Rechercher sur JustWatch <ExternalLink className="h-3.5 w-3.5" /></a></>}</section>
          <section className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><h2 className="text-base font-semibold">Ton avis</h2><p className="mt-1 text-xs leading-5 text-white/40">Ces signaux modifient les prochaines recommandations.</p><div className="mt-4 space-y-2"><button type="button" onClick={() => registerSignal(candidate, { completion: 0.5, liked: true, rejected: false })} className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-3 text-left text-sm"><Check className="h-4 w-4" />J’ai aimé</button><button type="button" onClick={() => registerSignal(candidate, { completion: 0.5, liked: false, rejected: true }, true)} className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-3 text-left text-sm"><Check className="h-4 w-4" />Je n’ai pas aimé</button><button type="button" onClick={() => registerSignal(candidate, { completion: 1, rejected: false }, true)} className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-3 text-left text-sm"><Check className="h-4 w-4" />Je l’ai déjà vu</button></div></section>
        </aside>
      </div>
      <footer className="mt-10 border-t border-white/10 py-5 text-[11px] leading-relaxed text-white/30">Fiche inspirée de l’architecture média de MovixOpenSource (movixcorp), CC BY-NC 4.0. Aucun lecteur ou mécanisme de contournement n’est intégré ; les liens de disponibilité sont légaux.</footer>
    </div>
  </main></MotionConfig>;
}
