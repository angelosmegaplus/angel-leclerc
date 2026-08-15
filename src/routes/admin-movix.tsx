import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ExternalLink, Film, Heart, Loader2, Moon, Search, ThumbsDown, ThumbsUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  selectDailyRecommendations,
  type RecommendationCandidate,
  type ViewingSignal,
} from "@/lib/film-recommendations";

export const Route = createFileRoute("/admin-movix")({
  head: () => ({
    meta: [
      { title: "Films et séries | Angel OS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FilmsSeriesPage,
});

// Petit vivier éditorial. La tâche quotidienne peut renouveler ces candidats ;
// le classement final est recalculé localement avec le profil appris.
const CANDIDATES: RecommendationCandidate[] = [
  { id: "prisoners-2013", title: "Prisoners", year: 2013, mediaType: "movie", genreIds: [53, 80, 18], keywords: ["investigation", "mystery", "crime", "suspense"], people: ["Hugh Jackman", "Jake Gyllenhaal"], director: "Denis Villeneuve", popularity: 82, genreLabel: "Thriller · Crime", pitch: "Une disparition, une enquête tendue et une montée en pression constante." },
  { id: "talk-to-me-2022", title: "Talk to Me", year: 2022, mediaType: "movie", genreIds: [27, 53], keywords: ["supernatural", "possession", "suspense", "survival"], people: ["Sophie Wilde"], director: "Danny Philippou", popularity: 76, genreLabel: "Horreur · Surnaturel", pitch: "Un concept simple, du rythme et une possession qui dégénère très vite." },
  { id: "invisible-man-2020", title: "The Invisible Man", year: 2020, mediaType: "movie", genreIds: [27, 53, 878], keywords: ["suspense", "survival", "mystery", "stalking"], people: ["Elisabeth Moss"], director: "Leigh Whannell", popularity: 72, genreLabel: "Thriller · Horreur", pitch: "Paranoïa, menace invisible et suspense très efficace." },
  { id: "evil-dead-rise-2023", title: "Evil Dead Rise", year: 2023, mediaType: "movie", genreIds: [27, 53], keywords: ["possession", "supernatural", "survival", "gore"], people: ["Lily Sullivan", "Alyssa Sutherland"], director: "Lee Cronin", popularity: 79, genreLabel: "Horreur · Gore", pitch: "Une soirée familiale tourne au carnage avec très peu de temps mort." },
  { id: "missing-2023", title: "Missing", year: 2023, mediaType: "movie", genreIds: [53, 9648, 18], keywords: ["investigation", "mystery", "twist", "suspense"], people: ["Storm Reid"], director: "Will Merrick", popularity: 64, genreLabel: "Thriller · Mystère", pitch: "Une disparition racontée par les traces numériques, avec une intrigue qui avance vite." },
  { id: "watcher-2022", title: "Watcher", year: 2022, mediaType: "movie", genreIds: [53, 27], keywords: ["stalking", "suspense", "murder", "mystery"], people: ["Maika Monroe"], director: "Chloe Okuno", popularity: 49, genreLabel: "Thriller", pitch: "Une femme pense être suivie dans une ville qu'elle connaît à peine." },
  { id: "dexter-2006", title: "Dexter", year: 2006, mediaType: "tv", genreIds: [80, 18, 9648], keywords: ["serial_killer", "crime", "investigation", "murder"], people: ["Michael C. Hall"], popularity: 88, genreLabel: "Crime · Thriller", pitch: "Crime, enquête, personnage central très marqué et tension régulière." },
  { id: "bri-2023", title: "B.R.I.", year: 2023, mediaType: "tv", genreIds: [80, 18, 28], keywords: ["crime", "investigation", "police", "suspense"], people: ["Sofian Khammes"], popularity: 40, genreLabel: "Policier · Action", pitch: "Interventions, rivalités et enquêtes dans un format nerveux." },
];

const SIGNALS_KEY = "angel-os-film-series-signals-v2";
const FAVORITES_KEY = "angel-os-film-series-favorites";

function FilmsSeriesPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [signals, setSignals] = useState<ViewingSignal[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => { if (!loading && (!session || !isAdmin)) void navigate({ to: "/auth" }); }, [isAdmin, loading, navigate, session]);
  useEffect(() => {
    try {
      setSignals(JSON.parse(localStorage.getItem(SIGNALS_KEY) ?? "[]"));
      setFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]"));
    } catch { /* stockage local facultatif */ }
  }, []);

  const ranked = useMemo(() => selectDailyRecommendations(CANDIDATES, signals), [signals]);

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

  const toggleFavorite = (candidate: RecommendationCandidate) => {
    const next = favorites.includes(candidate.id) ? favorites.filter((id) => id !== candidate.id) : [candidate.id, ...favorites];
    setFavorites(next);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch { /* facultatif */ }
    if (!favorites.includes(candidate.id)) registerSignal(candidate, { liked: true, completion: Math.max(signals.find((s) => s.candidateId === candidate.id)?.completion ?? 0, 0.5), rejected: false });
  };

  if (loading || !session || !isAdmin) return <main className="grid min-h-screen place-items-center bg-[#050607] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;

  return (
    <main className="min-h-screen bg-[#050607] px-3 py-5 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1300px]">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-300"><Film className="h-5 w-5" /><span className="font-mono text-xs uppercase tracking-[.18em]">Angel OS · recommandations apprenantes</span></div>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Films et séries</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">Une petite sélection classée avec le moteur de profil inspiré de Movix. Plus tu lui indiques ce que tu regardes ou rejettes, plus elle s’affine.</p>
          </div>
          <Link to="/admin" className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm text-white/70">Retour à Angel OS</Link>
        </header>

        <section className="mt-9">
          <div className="mb-4 flex items-center gap-2"><Moon className="h-5 w-5 text-red-300" /><h2 className="text-xl font-semibold">À regarder aujourd’hui</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ranked.map(({ candidate, score }, index) => {
              const favorite = favorites.includes(candidate.id);
              return <article key={candidate.id} className="flex min-h-[360px] flex-col justify-between rounded-[1.7rem] border border-white/10 bg-gradient-to-b from-white/[.055] to-white/[.02] p-5">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-2"><span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-200">{index === 0 ? "Choix du jour" : candidate.mediaType === "movie" ? "Film" : "Série"}</span><span className="rounded-full bg-white/[.06] px-2.5 py-1 text-[10px] text-white/55">{Math.round(score * 100)}% profil</span></div>
                    <button type="button" onClick={() => toggleFavorite(candidate)} aria-label="Favori" className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${favorite ? "border-red-400/40 bg-red-500/15 text-red-300" : "border-white/10 text-white/35"}`}><Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} /></button>
                  </div>
                  <h3 className="mt-7 text-2xl font-semibold tracking-[-.04em]">{candidate.title}</h3>
                  <p className="mt-1 text-xs text-white/35">{candidate.year} · {candidate.genreLabel}</p>
                  <p className="mt-4 text-sm leading-relaxed text-white/60">{candidate.pitch}</p>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => registerSignal(candidate, { completion: 1, liked: true, rejected: false })} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-2 text-xs text-emerald-200"><Check className="h-3.5 w-3.5" /> Vu</button>
                    <button type="button" onClick={() => registerSignal(candidate, { completion: Math.max(signals.find((s) => s.candidateId === candidate.id)?.completion ?? 0, 0.5), liked: true, rejected: false })} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[.04] px-2 text-xs text-white/70"><ThumbsUp className="h-3.5 w-3.5" /> J’aime</button>
                    <button type="button" onClick={() => registerSignal(candidate, { completion: 0, liked: false, rejected: true })} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-red-400/20 bg-red-400/10 px-2 text-xs text-red-200"><ThumbsDown className="h-3.5 w-3.5" /> Pas pour moi</button>
                  </div>
                  <a href={`https://www.justwatch.com/fr/recherche?q=${encodeURIComponent(candidate.title)}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-black"><Search className="h-4 w-4" /> Où le regarder ? <ExternalLink className="h-3.5 w-3.5" /></a>
                </div>
              </article>;
            })}
          </div>
        </section>

        <p className="mt-7 text-xs leading-relaxed text-white/30">Classement : affinité genres 35 %, mots-clés 25 %, acteurs/réalisateurs 15 %, popularité 10 %, récence 10 %, format 5 %. Un contenu marqué « Vu » ou « Pas pour moi » sort des prochaines sélections.</p>
      </div>
    </main>
  );
}
