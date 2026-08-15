import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ExternalLink, Film, Heart, Loader2, Moon, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin-movix")({
  head: () => ({
    meta: [
      { title: "Films et séries | Angel OS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FilmsSeriesPage,
});

type Pick = { title: string; year: number; kind: "Film" | "Série"; genre: string; pitch: string; score: number };

const PICKS: Pick[] = [
  { title: "Prisoners", year: 2013, kind: "Film", genre: "Thriller · Crime", pitch: "Une disparition, une enquête tendue et une montée en pression constante.", score: 96 },
  { title: "Talk to Me", year: 2022, kind: "Film", genre: "Horreur · Surnaturel", pitch: "Un concept simple, du rythme et une possession qui dégénère très vite.", score: 95 },
  { title: "The Invisible Man", year: 2020, kind: "Film", genre: "Thriller · Horreur", pitch: "Paranoïa, menace identifiable et suspense très efficace.", score: 93 },
  { title: "Evil Dead Rise", year: 2023, kind: "Film", genre: "Horreur · Gore", pitch: "Une soirée familiale tourne au carnage avec très peu de temps mort.", score: 92 },
  { title: "Missing", year: 2023, kind: "Film", genre: "Thriller · Mystère", pitch: "Une disparition racontée par les traces numériques, avec une intrigue qui avance vite.", score: 90 },
  { title: "Watcher", year: 2022, kind: "Film", genre: "Thriller", pitch: "Une femme pense être suivie dans une ville qu'elle connaît à peine.", score: 87 },
  { title: "Dexter", year: 2006, kind: "Série", genre: "Crime · Thriller", pitch: "Crime, enquête, personnage central très marqué et tension régulière.", score: 94 },
  { title: "B.R.I.", year: 2023, kind: "Série", genre: "Policier · Action", pitch: "Interventions, rivalités et enquêtes dans un format nerveux.", score: 91 },
];

const FAVORITES_KEY = "angel-os-film-series-favorites";

function dailySelection() {
  const day = Math.floor(new Date(new Date().setHours(0, 0, 0, 0)).getTime() / 86_400_000);
  const films = PICKS.filter((item) => item.kind === "Film");
  const series = PICKS.filter((item) => item.kind === "Série");
  return [films[day % films.length], films[(day + 2) % films.length], films[(day + 4) % films.length], series[day % series.length]];
}

function FilmsSeriesPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const picks = useMemo(dailySelection, []);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => { if (!loading && (!session || !isAdmin)) void navigate({ to: "/auth" }); }, [isAdmin, loading, navigate, session]);
  useEffect(() => { try { setFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]")); } catch { /* optional */ } }, []);

  const toggleFavorite = (title: string) => {
    const next = favorites.includes(title) ? favorites.filter((item) => item !== title) : [title, ...favorites];
    setFavorites(next);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch { /* optional */ }
  };

  if (loading || !session || !isAdmin) return <main className="grid min-h-screen place-items-center bg-[#050607] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;

  return (
    <main className="min-h-screen bg-[#050607] px-3 py-5 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1300px]">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-300"><Film className="h-5 w-5" /><span className="font-mono text-xs uppercase tracking-[.18em]">Angel OS · sélection personnelle</span></div>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Films et séries</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">Une petite sélection renouvelée chaque jour. Priorité aux films ; les séries restent secondaires.</p>
          </div>
          <Link to="/admin" className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm text-white/70">Retour à Angel OS</Link>
        </header>

        <section className="mt-9">
          <div className="mb-4 flex items-center gap-2"><Moon className="h-5 w-5 text-red-300" /><h2 className="text-xl font-semibold">À regarder aujourd'hui</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {picks.map((item, index) => {
              const favorite = favorites.includes(item.title);
              return <article key={item.title} className="flex min-h-[310px] flex-col justify-between rounded-[1.7rem] border border-white/10 bg-gradient-to-b from-white/[.055] to-white/[.02] p-5">
                <div>
                  <div className="flex items-start justify-between gap-2"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-200">{index === 0 ? "Choix du jour" : item.kind}</span><span className="rounded-full bg-white/[.06] px-2.5 py-1 text-[10px] text-white/55">{item.score}% compatible</span></div><button onClick={() => toggleFavorite(item.title)} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${favorite ? "border-red-400/40 bg-red-500/15 text-red-300" : "border-white/10 text-white/35"}`}><Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} /></button></div>
                  <h3 className="mt-7 text-2xl font-semibold tracking-[-.04em]">{item.title}</h3><p className="mt-1 text-xs text-white/35">{item.year} · {item.genre}</p><p className="mt-4 text-sm leading-relaxed text-white/60">{item.pitch}</p>
                </div>
                <a href={`https://www.justwatch.com/fr/recherche?q=${encodeURIComponent(item.title)}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-black"><Search className="h-4 w-4" /> Où le regarder ? <ExternalLink className="h-3.5 w-3.5" /></a>
              </article>;
            })}
          </div>
        </section>

        <p className="mt-7 text-xs leading-relaxed text-white/30">La sélection privilégie horreur, thriller, crime, policier et suspense, avec des intrigues fortes et un rythme soutenu. Les contenus très lents ou contemplatifs sont écartés. La disponibilité française est à privilégier.</p>
      </div>
    </main>
  );
}
