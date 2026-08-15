import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Film, Loader2, Moon, Star } from "lucide-react";
import { motion, MotionConfig } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { FILM_CATALOG, coverFor } from "@/lib/film-catalog";
import { selectDailyRecommendations, type RecommendationCandidate, type ViewingSignal } from "@/lib/film-recommendations";

export const Route = createFileRoute("/admin-movix")({
  head: () => ({ meta: [{ title: "Films et séries | Angel OS" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: FilmsSeriesPage,
});

const SIGNALS_KEY = "angel-os-film-series-signals-v2";
const POSTER_FALLBACK = `data:image/svg+xml,${encodeURIComponent('<svg width="500" height="750" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111318"/><circle cx="250" cy="320" r="56" fill="#20242c"/><path d="M235 290h30l25 45-25 45h-30l25-45z" fill="#424957"/><text x="50%" y="470" fill="#717784" font-size="28" font-family="sans-serif" text-anchor="middle">FILMS &amp; SERIES</text></svg>')}`;

function FilmsSeriesPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [signals, setSignals] = useState<ViewingSignal[]>([]);

  useEffect(() => { if (!loading && (!session || !isAdmin)) void navigate({ to: "/auth" }); }, [isAdmin, loading, navigate, session]);
  useEffect(() => { try { setSignals(JSON.parse(localStorage.getItem(SIGNALS_KEY) ?? "[]")); } catch { /* optional */ } }, []);

  const ranked = useMemo(() => selectDailyRecommendations(FILM_CATALOG, signals), [signals]);
  const saveSignals = (next: ViewingSignal[]) => { setSignals(next); try { localStorage.setItem(SIGNALS_KEY, JSON.stringify(next)); } catch { /* optional */ } };
  const registerSignal = (candidate: RecommendationCandidate, patch: Partial<ViewingSignal>) => {
    const existing = signals.find((signal) => signal.candidateId === candidate.id);
    const nextSignal: ViewingSignal = { candidateId: candidate.id, mediaType: candidate.mediaType, genreIds: candidate.genreIds, keywords: candidate.keywords, people: candidate.people, director: candidate.director, year: candidate.year, completion: existing?.completion ?? 0, liked: existing?.liked, rejected: existing?.rejected, ...patch };
    saveSignals([nextSignal, ...signals.filter((signal) => signal.candidateId !== candidate.id)]);
  };

  if (loading || !session || !isAdmin) return <main className="grid min-h-screen place-items-center bg-[#050607] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;

  return <MotionConfig reducedMotion="user">
    <main className="min-h-screen bg-[#050607] px-4 py-6 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1300px]">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-300"><Film className="h-5 w-5" /><span className="font-mono text-xs uppercase tracking-[.18em]">Angel OS · recommandations</span></div>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Films et séries</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">Sélection courte, personnalisée et réévaluée selon tes réponses. Appuie sur une affiche pour ouvrir sa fiche.</p>
          </div>
          <Link to="/admin" className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm text-white/70 transition hover:bg-white/[.08]">Retour à Angel OS</Link>
        </header>

        <section className="mt-9">
          <div className="mb-4 flex items-center gap-2"><Moon className="h-5 w-5 text-red-300" /><h2 className="text-xl font-semibold sm:text-2xl">À regarder aujourd’hui</h2></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {ranked.map(({ candidate, score }, index) => {
              const signal = signals.find((item) => item.candidateId === candidate.id);
              return <motion.article
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
                whileHover={{ scale: 1.025 }}
                className="group overflow-hidden rounded-xl border border-white/10 bg-white/[.035] transition-colors hover:border-white/20"
              >
                <a href={`/admin-movix/${candidate.id}`} className="relative block aspect-[2/3] overflow-hidden bg-[#111318]">
                  <img
                    src={coverFor(candidate)}
                    alt={candidate.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                    onError={(event) => { const img = event.currentTarget; img.onerror = null; img.src = POSTER_FALLBACK; }}
                  />
                  <span className="absolute left-2 top-2 z-10 rounded-lg bg-black/65 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/85 backdrop-blur-sm">{index === 0 ? "Choix du jour" : candidate.mediaType === "movie" ? "Film" : "Série"}</span>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent md:opacity-0 md:transition-opacity md:duration-300 md:group-hover:opacity-100" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 md:translate-y-2 md:opacity-0 md:transition-all md:duration-300 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                    <h3 className="line-clamp-2 text-sm font-bold text-white sm:text-base">{candidate.title}</h3>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-white/70">
                      {candidate.rating ? <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-yellow-400" fill="currentColor" />{candidate.rating.toFixed(1)}</span> : null}
                      <span>{candidate.year}</span><span>{Math.round(score * 100)}%</span>
                    </div>
                  </div>
                </a>

                <div className="grid grid-cols-3 gap-1.5 border-t border-white/5 p-2">
                  <button type="button" onClick={() => registerSignal(candidate, { completion: 0.5, liked: true, rejected: false })} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-[10px] transition ${signal?.liked === true ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-white/[.035] text-white/60 hover:bg-white/[.07]"}`}><Check className="h-4 w-4" /><span>Aimé</span></button>
                  <button type="button" onClick={() => registerSignal(candidate, { completion: 0.5, liked: false, rejected: true })} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-[10px] transition ${signal?.rejected ? "border-red-400/40 bg-red-500/15 text-red-200" : "border-white/10 bg-white/[.035] text-white/60 hover:bg-white/[.07]"}`}><Check className="h-4 w-4" /><span>Pas aimé</span></button>
                  <button type="button" onClick={() => registerSignal(candidate, { completion: 1, rejected: false })} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-[10px] transition ${signal?.completion && signal.completion >= 0.9 ? "border-blue-400/40 bg-blue-500/15 text-blue-200" : "border-white/10 bg-white/[.035] text-white/60 hover:bg-white/[.07]"}`}><Check className="h-4 w-4" /><span>Déjà vu</span></button>
                </div>
              </motion.article>;
            })}
          </div>
        </section>

        <footer className="mt-10 border-t border-white/10 py-5 text-[11px] leading-relaxed text-white/30">Interface et patterns adaptés de MovixOpenSource (movixcorp), sous licence CC BY-NC 4.0. Adaptation Angel OS : recommandations privées, signaux personnels et liens légaux uniquement.</footer>
      </div>
    </main>
  </MotionConfig>;
}
