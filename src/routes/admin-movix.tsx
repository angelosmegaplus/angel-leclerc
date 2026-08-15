import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ExternalLink, Film, Heart, History, Loader2, Moon, Play, RotateCcw, Save, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { MovixOpenSourceHub } from "@/components/admin/MovixOpenSourceHub";

export const Route = createFileRoute("/admin-movix")({
  head: () => ({
    meta: [
      { title: "Movix | Angel OS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MovixPage,
});

type Movie = {
  title: string;
  year: number;
  genre: string;
  pitch: string;
};

const MOVIES: Movie[] = [
  { title: "Prisoners", year: 2013, genre: "Thriller · Crime", pitch: "Une disparition, une enquête tendue et une vraie montée en pression." },
  { title: "Talk to Me", year: 2022, genre: "Horreur · Surnaturel", pitch: "Concept simple, rythme rapide et possession qui dégénère très vite." },
  { title: "The Invisible Man", year: 2020, genre: "Thriller · Horreur", pitch: "Paranoïa, menace invisible et suspense très efficace." },
  { title: "Barbarian", year: 2022, genre: "Horreur · Thriller", pitch: "Une location étrange et une histoire qui change brutalement de direction." },
  { title: "The Guilty", year: 2021, genre: "Thriller · Crime", pitch: "Un opérateur d'urgence tente de sauver une inconnue uniquement par téléphone." },
  { title: "Nope", year: 2022, genre: "Horreur · Science-fiction", pitch: "Un phénomène impossible à comprendre transforme un ranch isolé en piège." },
  { title: "Watcher", year: 2022, genre: "Thriller", pitch: "Une femme pense être suivie dans une ville qu'elle connaît à peine." },
  { title: "Evil Dead Rise", year: 2023, genre: "Horreur · Gore", pitch: "Une soirée familiale tourne au carnage avec très peu de temps mort." },
  { title: "Missing", year: 2023, genre: "Thriller · Mystère", pitch: "Une disparition racontée à travers écrans, recherches et traces numériques." },
];

const URL_KEY = "angel-os-movix-personal-url";
const HISTORY_KEY = "angel-os-movix-history";
const FAVORITES_KEY = "angel-os-movix-favorites";
const LAST_CHECK_KEY = "angel-os-movix-last-reference-check";
const REFERENCE_URL = "https://movix.online/";

function dailyPicks() {
  const today = new Date();
  const daySeed = Math.floor(new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / 86_400_000);
  return [0, 1, 2].map((offset) => MOVIES[(daySeed * 3 + offset * 5) % MOVIES.length]);
}

function formatCheck(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Jamais";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function MovixPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [url, setUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lastCheckedAt, setLastCheckedAt] = useState("");
  const picks = useMemo(() => dailyPicks(), []);

  useEffect(() => {
    if (!loading && (!session || !isAdmin)) void navigate({ to: "/auth" });
  }, [isAdmin, loading, navigate, session]);

  useEffect(() => {
    try {
      const current = localStorage.getItem(URL_KEY) ?? "";
      setUrl(current);
      setSavedUrl(current);
      setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"));
      setFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]"));
      setLastCheckedAt(localStorage.getItem(LAST_CHECK_KEY) ?? "");
    } catch {
      // Le hub reste utilisable même si le stockage local est indisponible.
    }
  }, []);

  const saveUrl = () => {
    const value = url.trim();
    if (value && !/^https?:\/\//i.test(value)) return;
    try { localStorage.setItem(URL_KEY, value); } catch { /* stockage facultatif */ }
    setSavedUrl(value);
  };

  const openPersonalSource = () => {
    if (!savedUrl) return;
    try {
      const parsed = new URL(savedUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) return;
      const nextHistory = [parsed.hostname, ...history.filter((item) => item !== parsed.hostname)].slice(0, 8);
      setHistory(nextHistory);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory)); } catch { /* facultatif */ }
      window.open(parsed.toString(), "_blank", "noopener,noreferrer");
    } catch {
      // URL invalide : ne rien ouvrir.
    }
  };

  const checkReference = () => {
    const checkedAt = new Date().toISOString();
    setLastCheckedAt(checkedAt);
    try { localStorage.setItem(LAST_CHECK_KEY, checkedAt); } catch { /* facultatif */ }
    window.open(REFERENCE_URL, "_blank", "noopener,noreferrer");
  };

  const toggleFavorite = (title: string) => {
    const next = favorites.includes(title) ? favorites.filter((item) => item !== title) : [title, ...favorites].slice(0, 20);
    setFavorites(next);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch { /* facultatif */ }
  };

  if (loading || !session || !isAdmin) {
    return <main className="grid min-h-screen place-items-center bg-[#050607] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  }

  return (
    <main className="min-h-screen bg-[#050607] px-3 py-5 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-red-300"><Film className="h-5 w-5" /><span className="font-mono text-xs uppercase tracking-[.18em]">Angel OS · personnel</span></div>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em]">Movix</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">Hub personnel pour choisir un film et lancer une source que vous avez vous-même configurée.</p>
          </div>
          <Link to="/admin" className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm text-white/70 hover:text-white">Retour à Angel OS</Link>
        </div>

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2"><Moon className="h-5 w-5 text-red-300" /><h2 className="text-xl font-semibold">Ce soir</h2></div>
          <div className="grid gap-3 md:grid-cols-3">
            {picks.map((movie) => {
              const favorite = favorites.includes(movie.title);
              return (
                <article key={movie.title} className="flex min-h-60 flex-col justify-between rounded-[1.8rem] border border-white/10 bg-[#0b0d10] p-5 shadow-[0_18px_60px_rgba(0,0,0,.25)]">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-200">{movie.genre}</span>
                      <button type="button" onClick={() => toggleFavorite(movie.title)} aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"} className={`grid h-9 w-9 place-items-center rounded-full border ${favorite ? "border-red-500/30 bg-red-500/15 text-red-300" : "border-white/10 bg-white/[.03] text-white/40"}`}><Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} /></button>
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">{movie.title}</h3>
                    <p className="mt-1 text-xs text-white/35">{movie.year}</p>
                    <p className="mt-4 text-sm leading-relaxed text-white/60">{movie.pitch}</p>
                  </div>
                  <a href={`https://www.justwatch.com/fr/recherche?q=${encodeURIComponent(movie.title)}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black"><Search className="h-4 w-4" /> Où le regarder ?</a>
                </article>
              );
            })}
          </div>
        </section>

        <MovixOpenSourceHub favorites={favorites} onToggleFavorite={toggleFavorite} />

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#0b0d10] p-5 sm:p-6">
          <div className="flex items-center gap-2"><Play className="h-5 w-5 text-red-300" /><h2 className="text-xl font-semibold">Lanceur personnel</h2></div>
          <p className="mt-2 text-sm text-white/45">Enregistrez ici l’adresse d’un service ou serveur auquel vous avez le droit d’accéder. Angel OS ne modifie pas le contenu du site tiers.</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input value={url} onChange={(event) => setUrl(event.target.value)} type="url" placeholder="https://…" className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-red-500/40" />
            <button type="button" onClick={saveUrl} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-4 text-sm font-semibold"><Save className="h-4 w-4" /> Enregistrer</button>
            <button type="button" disabled={!savedUrl} onClick={openPersonalSource} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white disabled:opacity-40"><ExternalLink className="h-4 w-4" /> Ouvrir</button>
          </div>
          {savedUrl ? <p className="mt-3 truncate text-xs text-white/35">Source enregistrée : {savedUrl}</p> : null}
        </section>

        <section className="mt-5 rounded-[1.6rem] border border-white/10 bg-white/[.025] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-red-300" /><h2 className="font-semibold">Page de référence Movix</h2></div>
              <p className="mt-2 text-sm text-white/45">Utilisez cette page pour vérifier manuellement l’adresse publiée, puis mettez à jour le lanceur ci-dessus si nécessaire.</p>
              <p className="mt-2 text-xs text-white/30">Dernier contrôle : {lastCheckedAt ? formatCheck(lastCheckedAt) : "jamais"}</p>
            </div>
            <button type="button" onClick={checkReference} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-4 text-sm font-semibold text-white hover:bg-white/[.08]"><ExternalLink className="h-4 w-4" /> Vérifier l’adresse</button>
          </div>
        </section>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <section className="rounded-[1.6rem] border border-white/10 bg-white/[.025] p-5">
            <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-red-300" /><h2 className="font-semibold">Favoris</h2></div>
            {favorites.length ? <div className="mt-3 flex flex-wrap gap-2">{favorites.map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs text-white/60">{item}</span>)}</div> : <p className="mt-3 text-sm text-white/35">Aucun favori pour le moment.</p>}
          </section>
          <section className="rounded-[1.6rem] border border-white/10 bg-white/[.025] p-5">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><History className="h-4 w-4 text-red-300" /><h2 className="font-semibold">Historique des sources</h2></div>{history.length ? <button type="button" onClick={() => { setHistory([]); try { localStorage.removeItem(HISTORY_KEY); } catch { /* facultatif */ } }} className="text-white/35 hover:text-white"><RotateCcw className="h-4 w-4" /></button> : null}</div>
            {history.length ? <div className="mt-3 flex flex-wrap gap-2">{history.map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs text-white/60">{item}</span>)}</div> : <p className="mt-3 text-sm text-white/35">Aucune source ouverte récemment.</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
