import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Film, Loader2, Moon, Star } from "lucide-react";
import { motion, MotionConfig } from "framer-motion";
import { MovixLauncherPanel } from "@/components/admin/MovixLauncherPanel";
import { useAuth } from "@/hooks/useAuth";
import { FILM_CATALOG, coverFor } from "@/lib/film-catalog";
import { getFilmCatalogMetadata, tmdbImage } from "@/lib/film-tmdb.functions";
import { selectDailyRecommendations, type RecommendationCandidate, type ViewingSignal } from "@/lib/film-recommendations";
import { rememberMediaPreference } from "@/lib/angel-os-ia/media-preferences.functions";

export const Route = createFileRoute("/admin-movix")({
  head: () => ({ meta: [{ title: "Films et séries | Angel OS IA" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: FilmsSeriesPage,
});

const SIGNALS_KEY = "angel-os-film-series-signals-v2";
const POSTER_FALLBACK = `data:image/svg+xml,${encodeURIComponent('<svg width="500" height="750" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111318"/><text x="50%" y="48%" fill="#d1d5db" font-size="32" font-family="sans-serif" text-anchor="middle">ANGEL OS IA</text><text x="50%" y="54%" fill="#71717a" font-size="20" font-family="sans-serif" text-anchor="middle">FILMS &amp; SERIES</text></svg>')}`;

function FilmsSeriesPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [signals, setSignals] = useState<ViewingSignal[]>([]);
  const fetchMetadata = useServerFn(getFilmCatalogMetadata);
  const rememberMedia = useServerFn(rememberMediaPreference);

  useEffect(() => { if (!loading && (!session || !isAdmin)) void navigate({ to: "/auth" }); }, [isAdmin, loading, navigate, session]);
  useEffect(() => { try { setSignals(JSON.parse(localStorage.getItem(SIGNALS_KEY) ?? "[]")); } catch { /* optional */ } }, []);

  const ranked = useMemo(() => selectDailyRecommendations(FILM_CATALOG, signals), [signals]);
  const lookupItems = useMemo(() => ranked.map(({ candidate }) => ({ id: candidate.id, title: candidate.title, year: candidate.year, mediaType: candidate.mediaType })), [ranked]);
  const { data: metadata = [] } = useQuery({
    queryKey: ["film-catalog-tmdb", lookupItems.map((item) => item.id).join("|")],
    queryFn: () => fetchMetadata({ data: { items: lookupItems } }),
    staleTime: 1000 * 60 * 60 * 12,
    retry: 1,
  });
  const metaById = useMemo(() => new Map(metadata.map((item) => [item.catalogId, item])), [metadata]);

  const saveSignals = (next: ViewingSignal[]) => { setSignals(next); try { localStorage.setItem(SIGNALS_KEY, JSON.stringify(next)); } catch { /* optional */ } };
  const registerSignal = (candidate: RecommendationCandidate, patch: Partial<ViewingSignal>) => {
    const existing = signals.find((signal) => signal.candidateId === candidate.id);
    const nextSignal: ViewingSignal = { candidateId: candidate.id, mediaType: candidate.mediaType, genreIds: candidate.genreIds, keywords: candidate.keywords, people: candidate.people, director: candidate.director, year: candidate.year, completion: existing?.completion ?? 0, liked: existing?.liked, rejected: existing?.rejected, ...patch };
    saveSignals([nextSignal, ...signals.filter((signal) => signal.candidateId !== candidate.id)]);
    void rememberMedia({ data: {
      candidateId: candidate.id,
      title: candidate.title,
      mediaType: candidate.mediaType,
      year: candidate.year,
      liked: nextSignal.liked,
      rejected: nextSignal.rejected,
      completion: nextSignal.completion,
      genreIds: candidate.genreIds,
      keywords: candidate.keywords,
      people: candidate.people,
      director: candidate.director,
    } }).catch(() => undefined);
  };

  if (loading || !session || !isAdmin) return <main className="grid min-h-screen place-items-center bg-[#050607] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;

  return <MotionConfig reducedMotion="user">
    <main className="min-h-screen bg-[#050607] px-4 py-6 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1380px]">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-300"><Film className="h-5 w-5" /><span className="font-mono text-xs uppercase tracking-[.18em]">Angel OS IA · Cinéthèque</span></div>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Films et séries</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Sélection personnelle quotidienne, fiches enrichies et recommandations apprenantes. Les abonnements légaux restent prioritaires ; le Movix Link Launcher est disponible plus bas comme raccourci secondaire.</p>
          </div>
          <Link to="/admin" className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm text-white/70 transition hover:bg-white/[.08]">Retour à Angel OS</Link>
        </header>

        <section className="mt-9">
          <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Moon className="h-5 w-5 text-red-300" /><h2 className="text-xl font-semibold sm:text-2xl">À regarder aujourd’hui</h2></div><p className="hidden text-xs text-white/35 sm:block">Appuie sur une affiche pour ouvrir la fiche complète</p></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
            {ranked.map(({ candidate, score }, index) => {
              const signal = signals.find((item) => item.candidateId === candidate.id);
              const meta = metaById.get(candidate.id);
              const poster = tmdbImage(meta?.poster, "w500") || coverFor(candidate) || POSTER_FALLBACK;
              return <motion.article key={candidate.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }} whileHover={{ scale: 1.018 }} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[.035] shadow-[0_18px_55px_rgba(0,0,0,.22)] transition-colors hover:border-white/20">
                <Link to="/admin-movix/$id" params={{ id: candidate.id }} className="relative block aspect-[2/3] overflow-hidden bg-[#111318]">
                  <img src={poster} alt={`Affiche de ${candidate.title}`} loading={index < 3 ? "eager" : "lazy"} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = POSTER_FALLBACK; }} />
                  <span className="absolute left-2 top-2 z-10 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">{index === 0 ? "Choix du jour" : candidate.mediaType === "movie" ? "Film" : "Série"}</span>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <h3 className="line-clamp-2 text-sm font-bold sm:text-base">{candidate.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/75">{(meta?.rating || candidate.rating) ? <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{(meta?.rating || candidate.rating)?.toFixed(1)}</span> : null}<span>{meta?.year || candidate.year}</span><span>{Math.round(score * 100)}% match</span></div>
                    <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-white/55">{meta?.overview || candidate.pitch}</p>
                  </div>
                </Link>
                <div className="grid grid-cols-3 gap-1.5 border-t border-white/5 p-2">
                  <button type="button" onClick={() => registerSignal(candidate, { completion: 0.5, liked: true, rejected: false })} className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-[10px] ${signal?.liked === true ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-white/[.035] text-white/60"}`}><Check className="h-4 w-4" />Aimé</button>
                  <button type="button" onClick={() => registerSignal(candidate, { completion: 0.5, liked: false, rejected: true })} className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-[10px] ${signal?.rejected ? "border-red-400/40 bg-red-500/15 text-red-200" : "border-white/10 bg-white/[.035] text-white/60"}`}><Check className="h-4 w-4" />Pas aimé</button>
                  <button type="button" onClick={() => registerSignal(candidate, { completion: 1, rejected: false })} className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-[10px] ${signal?.completion && signal.completion >= 0.9 ? "border-blue-400/40 bg-blue-500/15 text-blue-200" : "border-white/10 bg-white/[.035] text-white/60"}`}><Check className="h-4 w-4" />Déjà vu</button>
                </div>
              </motion.article>;
            })}
          </div>
        </section>

        <MovixLauncherPanel />

        <footer className="mt-10 border-t border-white/10 py-5 text-[11px] leading-relaxed text-white/30">Patterns et architecture média adaptés de MovixOpenSource (movixcorp), CC BY-NC 4.0. Métadonnées cinéma : TMDB lorsque configuré. Disponibilités légales : données fournisseurs TMDB/JustWatch. Les préférences personnelles sont mémorisées par Angel OS IA, tandis qu’Angel OS fournit les primitives système.</footer>
      </div>
    </main>
  </MotionConfig>;
}
