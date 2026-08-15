import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, Check, Eye, Film, Loader2, Moon, Star, ThumbsDown, ThumbsUp } from "lucide-react";
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
            <div className="flex items-center gap-2 text-red-300"><Film className="h-5 w-5" /><span className="font-mono text-xs uppercase tracking-[.18em]">Angel OS IA · Cinéthèque personnelle</span></div>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Films et séries</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Trois choix seulement, recalculés pour toi à partir de tes goûts, de ce que tu as aimé, rejeté ou déjà vu. Présentation directement inspirée de l’expérience Movix.</p>
          </div>
          <Link to="/admin" className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm text-white/70 transition hover:bg-white/[.08]">Retour à Angel OS</Link>
        </header>

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><Moon className="h-5 w-5 text-red-300" /><h2 className="text-xl font-semibold sm:text-2xl">Pour toi aujourd’hui</h2></div>
              <p className="mt-1 text-xs text-white/35">3 recommandations maximum · ouvre une affiche pour la fiche complète</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-4 lg:max-w-[760px] lg:gap-5">
            {ranked.map(({ candidate, score }, index) => {
              const signal = signals.find((item) => item.candidateId === candidate.id);
              const meta = metaById.get(candidate.id);
              const poster = tmdbImage(meta?.poster, "w500") || coverFor(candidate) || POSTER_FALLBACK;
              const rating = meta?.rating || candidate.rating;
              const year = meta?.year || candidate.year;
              const overview = meta?.overview || candidate.pitch;

              return <motion.article
                key={candidate.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.15) }}
                className="relative min-w-0"
              >
                <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[.045] shadow-[0_16px_45px_rgba(0,0,0,.25)] transition duration-200 ease-out hover:scale-[1.035] hover:border-white/20">
                  <Link to="/admin-movix/$id" params={{ id: candidate.id }} className="relative block aspect-[2/3] overflow-hidden bg-[#111318]">
                    <img
                      src={poster}
                      alt={`Affiche de ${candidate.title}`}
                      width={342}
                      height={513}
                      loading="eager"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-300"
                      onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = POSTER_FALLBACK; }}
                    />

                    <span className="absolute left-2 top-2 z-20 rounded-lg bg-black/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">
                      {candidate.mediaType === "movie" ? "Film" : "Série"}
                    </span>
                    <span className="absolute right-2 top-2 z-20 rounded-full border border-red-400/30 bg-red-600/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                      #{index + 1}
                    </span>

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent md:opacity-0 md:transition-opacity md:duration-300 md:group-hover:opacity-100" />
                    <div className="absolute inset-x-0 bottom-0 p-3 md:translate-y-2 md:opacity-0 md:transition md:duration-300 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                      <h3 className="line-clamp-1 text-sm font-bold text-white">{candidate.title}</h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {rating ? <span className="inline-flex items-center gap-1 text-xs text-white/80"><Star className="h-3 w-3 text-yellow-400" />{rating.toFixed(1)}</span> : null}
                        <span className="inline-flex items-center gap-1 text-xs text-white/60"><Calendar className="h-3 w-3" />{year}</span>
                        <span className="rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-200">{Math.round(score * 100)}% match</span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-xs leading-4 text-white/50">{overview}</p>
                    </div>
                  </Link>

                  <div className="grid grid-cols-3 gap-1.5 border-t border-white/5 bg-black/30 p-2">
                    <button type="button" onClick={() => registerSignal(candidate, { completion: 0.5, liked: true, rejected: false })} title="Aimé" className={`flex min-h-10 items-center justify-center gap-1 rounded-lg border px-1 text-[10px] transition ${signal?.liked === true ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-white/[.035] text-white/60 hover:bg-white/[.07]"}`}><ThumbsUp className="h-3.5 w-3.5" /><span className="hidden lg:inline">Aimé</span></button>
                    <button type="button" onClick={() => registerSignal(candidate, { completion: 0.5, liked: false, rejected: true })} title="Pas aimé" className={`flex min-h-10 items-center justify-center gap-1 rounded-lg border px-1 text-[10px] transition ${signal?.rejected ? "border-red-400/40 bg-red-500/15 text-red-200" : "border-white/10 bg-white/[.035] text-white/60 hover:bg-white/[.07]"}`}><ThumbsDown className="h-3.5 w-3.5" /><span className="hidden lg:inline">Non</span></button>
                    <button type="button" onClick={() => registerSignal(candidate, { completion: 1, rejected: false })} title="Déjà vu" className={`flex min-h-10 items-center justify-center gap-1 rounded-lg border px-1 text-[10px] transition ${signal?.completion && signal.completion >= 0.9 ? "border-blue-400/40 bg-blue-500/15 text-blue-200" : "border-white/10 bg-white/[.035] text-white/60 hover:bg-white/[.07]"}`}>{signal?.completion && signal.completion >= 0.9 ? <Check className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}<span className="hidden lg:inline">Vu</span></button>
                  </div>
                </div>
              </motion.article>;
            })}
          </div>
        </section>

        <MovixLauncherPanel />

        <footer className="mt-10 border-t border-white/10 py-5 text-[11px] leading-relaxed text-white/30">Expérience média personnelle adaptée de MovixOpenSource (movixcorp), avec autorisation d’usage privé communiquée par le propriétaire et attribution CC BY-NC 4.0 conservée. Métadonnées cinéma : TMDB lorsque configuré. Les préférences personnelles sont mémorisées par Angel OS IA.</footer>
      </div>
    </main>
  </MotionConfig>;
}
