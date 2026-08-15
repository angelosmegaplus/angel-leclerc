import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Film, Loader2, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { FILM_CATALOG, coverFor } from "@/lib/film-catalog";
import { selectDailyRecommendations, type RecommendationCandidate, type ViewingSignal } from "@/lib/film-recommendations";

export const Route = createFileRoute("/admin-movix")({
  head: () => ({
    meta: [
      { title: "Films et séries | Angel OS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FilmsSeriesPage,
});

const SIGNALS_KEY = "angel-os-film-series-signals-v2";

function FilmsSeriesPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [signals, setSignals] = useState<ViewingSignal[]>([]);

  useEffect(() => { if (!loading && (!session || !isAdmin)) void navigate({ to: "/auth" }); }, [isAdmin, loading, navigate, session]);
  useEffect(() => {
    try { setSignals(JSON.parse(localStorage.getItem(SIGNALS_KEY) ?? "[]")); } catch { /* stockage local facultatif */ }
  }, []);

  const ranked = useMemo(() => selectDailyRecommendations(FILM_CATALOG, signals), [signals]);

  const saveSignals = (next: ViewingSignal[]) => {
    setSignals(next);
    try { localStorage.setItem(SIGNALS_KEY, JSON.stringify(next)); } catch { /* facultatif */ }
  };

  const registerSignal = (candidate: RecommendationCandidate, patch: Partial<ViewingSignal>) => {
    const existing = signals.find((signal) => signal.candidateId === candidate.id);
    const nextSignal: ViewingSignal = {
      candidateId: candidate.id,
      mediaType: candidate.mediaType,
      genreIds: candidate.genreIds,
      keywords: candidate.keywords,
      people: candidate.people,
      director: candidate.director,
      year: candidate.year,
      completion: existing?.completion ?? 0,
      liked: existing?.liked,
      rejected: existing?.rejected,
      ...patch,
    };
    saveSignals([nextSignal, ...signals.filter((signal) => signal.candidateId !== candidate.id)]);
  };

  if (loading || !session || !isAdmin) return <main className="grid min-h-screen place-items-center bg-[#050607] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;

  return (
    <main className="min-h-screen bg-[#050607] px-3 py-5 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1300px]">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-300"><Film className="h-5 w-5" /><span className="font-mono text-xs uppercase tracking-[.18em]">Angel OS · recommandations</span></div>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Films et séries</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">Ta petite sélection du moment. Ouvre une affiche pour voir sa fiche complète.</p>
          </div>
          <Link to="/admin" className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm text-white/70">Retour à Angel OS</Link>
        </header>

        <section className="mt-9">
          <div className="mb-4 flex items-center gap-2"><Moon className="h-5 w-5 text-red-300" /><h2 className="text-xl font-semibold">À regarder aujourd’hui</h2></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ranked.map(({ candidate, score }, index) => (
              <article key={candidate.id} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[.03]">
                <a href={`/admin-movix/${candidate.id}`} className="group block">
                  <div className="relative aspect-[2/3] overflow-hidden bg-[#101114]">
                    <img src={coverFor(candidate)} alt={candidate.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/55 to-transparent px-4 pb-4 pt-16">
                      <div className="mb-2 flex gap-2"><span className="rounded-full bg-red-500/80 px-2 py-1 text-[10px] font-bold uppercase">{index === 0 ? "Choix du jour" : candidate.mediaType === "movie" ? "Film" : "Série"}</span><span className="rounded-full bg-black/60 px-2 py-1 text-[10px]">{Math.round(score * 100)}%</span></div>
                      <h3 className="text-xl font-semibold tracking-tight">{candidate.title}</h3>
                      <p className="mt-1 text-xs text-white/60">{candidate.year} · {candidate.genreLabel}</p>
                    </div>
                  </div>
                </a>

                <div className="space-y-2 p-3">
                  <p className="px-1 text-xs text-white/45">Tu connais déjà ce titre ?</p>
                  <button type="button" onClick={() => registerSignal(candidate, { completion: 0.5, liked: true, rejected: false })} className="flex min-h-10 w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-left text-sm text-white/75"><span className="grid h-5 w-5 place-items-center rounded-md border border-white/20"><Check className="h-3 w-3" /></span>J’ai aimé</button>
                  <button type="button" onClick={() => registerSignal(candidate, { completion: 0.5, liked: false, rejected: true })} className="flex min-h-10 w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-left text-sm text-white/75"><span className="grid h-5 w-5 place-items-center rounded-md border border-white/20"><Check className="h-3 w-3" /></span>Je n’ai pas aimé</button>
                  <button type="button" onClick={() => registerSignal(candidate, { completion: 1, rejected: false })} className="flex min-h-10 w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-left text-sm text-white/75"><span className="grid h-5 w-5 place-items-center rounded-md border border-white/20"><Check className="h-3 w-3" /></span>Je l’ai déjà vu</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
