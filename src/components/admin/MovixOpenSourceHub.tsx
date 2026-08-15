import { useMemo, useState } from "react";
import { Clapperboard, Film, Heart, ListPlus, Search, Sparkles, Trophy, Tv, Users } from "lucide-react";

type MediaItem = {
  title: string;
  year: number;
  genre: string;
  kind: "Film" | "Série";
  pitch: string;
  score: number;
};

const CATALOG: MediaItem[] = [
  { title: "Prisoners", year: 2013, genre: "Thriller · Crime", kind: "Film", pitch: "Une disparition, une enquête tendue et une vraie montée en pression.", score: 9.2 },
  { title: "Talk to Me", year: 2022, genre: "Horreur · Surnaturel", kind: "Film", pitch: "Un concept simple, nerveux et une possession qui dégénère vite.", score: 8.8 },
  { title: "The Invisible Man", year: 2020, genre: "Thriller · Horreur", kind: "Film", pitch: "Paranoïa, menace invisible et suspense très efficace.", score: 8.7 },
  { title: "Evil Dead Rise", year: 2023, genre: "Horreur · Gore", kind: "Film", pitch: "Une soirée familiale vire au carnage sans perdre de temps.", score: 8.4 },
  { title: "Missing", year: 2023, genre: "Thriller · Mystère", kind: "Film", pitch: "Une disparition racontée à travers recherches et traces numériques.", score: 8.5 },
  { title: "Black Phone", year: 2021, genre: "Horreur · Thriller", kind: "Film", pitch: "Un ravisseur, une cave et un téléphone qui ne devrait plus fonctionner.", score: 8.2 },
  { title: "Dexter", year: 2006, genre: "Crime · Thriller", kind: "Série", pitch: "Double vie, enquête et tension constante autour d'un anti-héros méthodique.", score: 9.4 },
  { title: "Breaking Bad", year: 2008, genre: "Crime · Drame", kind: "Série", pitch: "Une transformation radicale portée par une tension qui monte saison après saison.", score: 9.6 },
  { title: "B.R.I.", year: 2023, genre: "Crime · Policier", kind: "Série", pitch: "Interventions, rivalités et pression opérationnelle dans une unité de terrain.", score: 8.6 },
  { title: "Le Bureau des légendes", year: 2015, genre: "Espionnage · Thriller", kind: "Série", pitch: "Espionnage français réaliste, dense et très tendu.", score: 9.0 },
];

const NAV = ["Accueil", "Films", "Séries", "Top 10", "Ma liste", "WatchParty"] as const;
type Tab = (typeof NAV)[number];

function cardGradient(index: number) {
  const gradients = [
    "from-red-950 via-[#181014] to-black",
    "from-indigo-950 via-[#111521] to-black",
    "from-emerald-950 via-[#101916] to-black",
    "from-amber-950 via-[#1b1510] to-black",
    "from-slate-800 via-[#14171c] to-black",
  ];
  return gradients[index % gradients.length];
}

export function MovixOpenSourceHub({
  favorites,
  onToggleFavorite,
}: {
  favorites: string[];
  onToggleFavorite: (title: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("Accueil");
  const [query, setQuery] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let items = CATALOG;
    if (tab === "Films") items = items.filter((item) => item.kind === "Film");
    if (tab === "Séries") items = items.filter((item) => item.kind === "Série");
    if (tab === "Top 10") items = [...items].sort((a, b) => b.score - a.score).slice(0, 10);
    if (tab === "Ma liste") items = items.filter((item) => favorites.includes(item.title));
    if (q) items = items.filter((item) => `${item.title} ${item.genre} ${item.kind}`.toLowerCase().includes(q));
    return items;
  }, [favorites, query, tab]);

  const hero = CATALOG[0];
  const createRoom = () => setRoomCode(Math.random().toString(36).slice(2, 8).toUpperCase());

  return (
    <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b0f] shadow-[0_24px_90px_rgba(0,0,0,.35)]">
      <div className="border-b border-white/10 bg-black/25 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-500 text-white shadow-lg shadow-red-950/30"><Clapperboard className="h-5 w-5" /></span>
            <div>
              <p className="text-lg font-black tracking-[-0.04em]">MOVIX <span className="text-red-500">PERSONAL</span></p>
              <p className="text-[11px] text-white/35">Interface inspirée de MovixOpenSource</p>
            </div>
          </div>
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un film, une série…" className="h-11 w-full rounded-full border border-white/10 bg-white/[.05] pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-red-500/40" />
          </div>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${tab === item ? "bg-white text-black" : "bg-white/[.045] text-white/55 hover:bg-white/[.08] hover:text-white"}`}>
              {item}
            </button>
          ))}
        </nav>
      </div>

      {tab === "WatchParty" ? (
        <div className="p-5 sm:p-7">
          <div className="rounded-[1.8rem] border border-red-500/20 bg-gradient-to-br from-red-950/45 via-[#101217] to-black p-6 sm:p-8">
            <div className="flex items-center gap-2 text-red-300"><Users className="h-5 w-5" /><h2 className="text-xl font-bold">WatchParty privée</h2></div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">Crée un code de salon pour organiser une séance avec tes propres sources légales ou personnelles. Ce module ne fournit aucun flux vidéo.</p>
            <button type="button" onClick={createRoom} className="mt-5 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-400">Créer un salon</button>
            {roomCode ? <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-5"><p className="text-xs uppercase tracking-[.16em] text-white/35">Code du salon</p><p className="mt-2 font-mono text-3xl font-black tracking-[.2em] text-white">{roomCode}</p></div> : null}
          </div>
        </div>
      ) : (
        <>
          {tab === "Accueil" ? (
            <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-red-950/70 via-[#161117] to-[#070809] px-5 py-8 sm:px-8 sm:py-12">
              <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />
              <div className="relative max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-red-300"><Sparkles className="h-4 w-4" /> Sélection Angel OS</div>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-6xl">{hero.title}</h2>
                <p className="mt-3 text-sm text-white/45">{hero.year} · {hero.genre} · note perso {hero.score}/10</p>
                <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/65">{hero.pitch}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <a href={`https://www.justwatch.com/fr/recherche?q=${encodeURIComponent(hero.title)}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-black"><Play className="h-4 w-4 fill-current" /> Où regarder</a>
                  <button type="button" onClick={() => onToggleFavorite(hero.title)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[.06] px-5 text-sm font-semibold text-white"><ListPlus className="h-4 w-4" /> {favorites.includes(hero.title) ? "Dans ma liste" : "Ajouter à ma liste"}</button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="p-5 sm:p-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {tab === "Top 10" ? <Trophy className="h-5 w-5 text-amber-300" /> : tab === "Séries" ? <Tv className="h-5 w-5 text-red-300" /> : <Film className="h-5 w-5 text-red-300" />}
                <h2 className="text-xl font-bold">{tab === "Accueil" ? "Tendances pour toi" : tab}</h2>
              </div>
              <span className="text-xs text-white/30">{visible.length} titre{visible.length > 1 ? "s" : ""}</span>
            </div>

            {visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/35">Aucun contenu dans cette vue pour le moment.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {visible.map((item, index) => {
                  const favorite = favorites.includes(item.title);
                  return (
                    <article key={item.title} className="group overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#0e1014] transition hover:-translate-y-1 hover:border-red-500/25">
                      <div className={`relative aspect-[4/3] bg-gradient-to-br ${cardGradient(index)} p-4`}>
                        {tab === "Top 10" ? <span className="absolute left-3 top-2 text-5xl font-black text-white/10">{index + 1}</span> : null}
                        <div className="absolute inset-x-4 bottom-4">
                          <span className="rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold text-white/65 backdrop-blur">{item.kind}</span>
                          <h3 className="mt-2 text-xl font-black tracking-[-0.04em] text-white">{item.title}</h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3 text-[11px] text-white/35"><span>{item.year}</span><span>{item.score}/10</span></div>
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/45">{item.pitch}</p>
                        <div className="mt-4 flex gap-2">
                          <a href={`https://www.justwatch.com/fr/recherche?q=${encodeURIComponent(item.title)}`} target="_blank" rel="noreferrer" className="flex min-h-9 flex-1 items-center justify-center rounded-lg bg-white text-xs font-bold text-black">Voir</a>
                          <button type="button" onClick={() => onToggleFavorite(item.title)} aria-label={favorite ? "Retirer de ma liste" : "Ajouter à ma liste"} className={`grid h-9 w-9 place-items-center rounded-lg border ${favorite ? "border-red-500/40 bg-red-500/15 text-red-300" : "border-white/10 bg-white/[.03] text-white/45"}`}><Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} /></button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {tab === "Accueil" ? (
              <div className="mt-8 grid gap-3 md:grid-cols-3">
                <button type="button" onClick={() => setTab("Films")} className="rounded-[1.5rem] border border-white/10 bg-white/[.035] p-5 text-left hover:bg-white/[.06]"><Film className="h-5 w-5 text-red-300" /><p className="mt-4 font-bold">Films</p><p className="mt-1 text-xs text-white/35">Horreur, thriller, crime et grosses sorties.</p></button>
                <button type="button" onClick={() => setTab("Séries")} className="rounded-[1.5rem] border border-white/10 bg-white/[.035] p-5 text-left hover:bg-white/[.06]"><Tv className="h-5 w-5 text-red-300" /><p className="mt-4 font-bold">Séries</p><p className="mt-1 text-xs text-white/35">Crime, suspense et séries à forte intrigue.</p></button>
                <button type="button" onClick={() => setTab("Top 10")} className="rounded-[1.5rem] border border-white/10 bg-white/[.035] p-5 text-left hover:bg-white/[.06]"><Trophy className="h-5 w-5 text-amber-300" /><p className="mt-4 font-bold">Top 10</p><p className="mt-1 text-xs text-white/35">Tes titres les mieux classés dans ce catalogue personnel.</p></button>
              </div>
            ) : null}
          </div>
        </>
      )}

      <div className="border-t border-white/10 px-5 py-4 text-[10px] leading-relaxed text-white/25 sm:px-7">
        Interface adaptée à partir des concepts de MovixOpenSource (movixcorp), sous CC BY-NC 4.0. Adaptation non commerciale pour Angel OS ; aucune couche proxy, bypass, DRM ou flux vidéo du projet original n’est intégrée.
      </div>
    </section>
  );
}
