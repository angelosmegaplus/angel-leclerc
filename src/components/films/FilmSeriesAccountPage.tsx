import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Brain, CheckCircle2, Film, Gauge, Heart, Info, Loader2, LogIn, Play, RefreshCw, Search, Sparkles, Star, ThumbsDown, Tv, UserRound, X } from "lucide-react";
import { MovixLauncherPanel } from "@/components/admin/MovixLauncherPanel";
import { FilmDetailsModal } from "@/components/films/FilmDetailsModal";
import { ProtonVpnBanner } from "@/components/films/ProtonVpnBanner";
import { useAuth } from "@/hooks/useAuth";
import { FILM_CATALOG } from "@/lib/film-catalog";
import { getFilmProviderHealth } from "@/lib/film-health.functions";
import { getLiveFilmCatalog } from "@/lib/film-live.functions";
import { hydrateTasteProfile, saveCloudTasteSignal } from "@/lib/film-taste.cloud";
import { loadTasteSignals, signalForCandidate, upsertTasteSignal } from "@/lib/film-taste.browser";
import { buildTasteProfile, confidenceFor, scoreCandidate, selectDailyRecommendations, type RecommendationCandidate, type ViewingSignal } from "@/lib/film-recommendations";

type Filter = "all" | "movie" | "tv";
type MovixTarget = { path: string; label: string; nonce: number } | null;

function localFallback(mediaType: Filter, query: string) {
  const q = query.trim().toLocaleLowerCase("fr");
  return FILM_CATALOG
    .filter((item) => mediaType === "all" || item.mediaType === mediaType)
    .filter((item) => !q || `${item.title} ${item.genreLabel} ${item.pitch} ${item.people.join(" ")}`.toLocaleLowerCase("fr").includes(q));
}

function movixPath(item: RecommendationCandidate) {
  const match = item.id.match(/^tmdb-(movie|tv)-(\d+)$/);
  if (!match) return null;
  return match[1] === "movie" ? `/watch/movie/${match[2]}` : `/tv/${match[2]}`;
}

async function enterCinemaMode() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch {}
  try {
    const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
    await orientation.lock?.("landscape");
  } catch {}
}

export function FilmSeriesAccountPage() {
  const { user, loading: authLoading } = useAuth();
  const loadCatalog = useServerFn(getLiveFilmCatalog);
  const loadProviderHealth = useServerFn(getFilmProviderHealth);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<Filter>("all");
  const [selected, setSelected] = useState<RecommendationCandidate | null>(null);
  const [signals, setSignals] = useState<ViewingSignal[]>([]);
  const [cloudState, setCloudState] = useState<"idle" | "syncing" | "synced" | "offline">("idle");
  const [movixTarget, setMovixTarget] = useState<MovixTarget>(null);

  const userId = user?.id || "";
  const profileLabel = user?.email || "Compte Angel Movies";

  useEffect(() => {
    if (!userId) {
      setSignals([]);
      setCloudState("idle");
      return;
    }
    let active = true;
    const local = loadTasteSignals(userId);
    setSignals(local);
    setCloudState("syncing");
    void hydrateTasteProfile(userId, local)
      .then((merged) => {
        if (!active) return;
        setSignals(merged);
        setCloudState("synced");
      })
      .catch(() => {
        if (active) setCloudState("offline");
      });
    return () => { active = false; };
  }, [userId]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["angel-movies-live-tmdb-v7", query, mediaType],
    queryFn: () => loadCatalog({ data: { query, mediaType } }),
    enabled: Boolean(userId),
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });

  const { data: health, isFetching: checkingHealth, refetch: refetchHealth } = useQuery({
    queryKey: ["angel-movies-provider-health-v7"],
    queryFn: () => loadProviderHealth(),
    enabled: Boolean(userId),
    staleTime: 60_000,
    retry: 1,
  });

  const fallback = useMemo(() => localFallback(mediaType, query), [mediaType, query]);
  const usingLocalFallback = !data || data.source === "unavailable";
  const catalog = useMemo<RecommendationCandidate[]>(() => usingLocalFallback ? fallback : data.items, [usingLocalFallback, fallback, data]);
  const taste = useMemo(() => buildTasteProfile(signals), [signals]);
  const ranked = useMemo(() => selectDailyRecommendations(catalog, signals, 24), [catalog, signals]);
  const picks = useMemo(() => ranked.map((entry) => entry.candidate), [ranked]);
  const confidence = useMemo(() => confidenceFor(signals), [signals]);
  const hero = !query ? picks[0] : null;

  function updateSignal(item: RecommendationCandidate, patch: Partial<ViewingSignal>) {
    if (!userId) return;
    const previous = signals.find((signal) => signal.candidateId === item.id);
    const next: ViewingSignal = { ...signalForCandidate(item, previous), ...patch, updatedAt: Date.now() };
    const updated = upsertTasteSignal(signals, next, userId);
    setSignals(updated);
    setCloudState("syncing");
    void saveCloudTasteSignal(userId, next)
      .then(() => setCloudState("synced"))
      .catch(() => setCloudState("offline"));
  }

  function play(item: RecommendationCandidate) {
    const path = movixPath(item);
    if (!path) return;
    void enterCinemaMode();
    setMovixTarget({ path, label: item.title, nonce: Date.now() });
    window.setTimeout(() => document.getElementById("movix-launcher")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  if (authLoading) {
    return <main className="grid min-h-[100dvh] place-items-center bg-[#070708] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  }

  if (!user) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#070708] px-4 text-white">
        <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[.035] p-7 shadow-2xl">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-400/10 text-violet-200"><Film className="h-6 w-6" /></div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-violet-200/70">Angel Movies</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.05em]">Ton cinéma, ton profil.</h1>
          <p className="mt-3 text-sm leading-6 text-white/50">Crée un compte ou connecte-toi pour retrouver tes likes, dislikes, contenus vus et recommandations personnalisées.</p>
          <a href="/auth?next=/films-series" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 font-semibold text-black"><LogIn className="h-4 w-4" />Créer mon compte / se connecter</a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#070708] text-white">
      <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#070708]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 sm:px-7 lg:px-10">
          <div className="flex shrink-0 items-center gap-2 font-semibold"><Film className="h-5 w-5 text-red-400" />Angel Movies</div>
          <form onSubmit={(event) => { event.preventDefault(); setQuery(draftQuery.trim()); }} className="ml-auto flex w-full max-w-xl items-center gap-2 rounded-full border border-white/10 bg-white/[.055] px-4">
            <Search className="h-4 w-4 shrink-0 text-white/35" />
            <input value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} placeholder="Rechercher un film ou une série…" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-white/25" />
            {draftQuery ? <button type="button" onClick={() => { setDraftQuery(""); setQuery(""); }} className="text-white/35"><X className="h-4 w-4" /></button> : null}
          </form>
        </div>
      </header>

      {hero ? (
        <section className="relative min-h-[430px] overflow-hidden border-b border-white/[.06] sm:min-h-[540px]">
          {hero.backdropUrl || hero.posterUrl ? <img src={hero.backdropUrl || hero.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" /> : null}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070708] via-[#070708]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070708] via-transparent to-[#070708]/25" />
          <div className="relative mx-auto flex min-h-[430px] max-w-[1500px] items-end px-4 pb-12 pt-24 sm:min-h-[540px] sm:px-7 lg:px-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-[11px] font-semibold text-violet-100"><Sparkles className="h-3.5 w-3.5" />{Math.round(scoreCandidate(hero, taste) * 100)}% pour toi</div>
              <h1 className="mt-4 text-5xl font-bold tracking-[-.065em] sm:text-7xl">{hero.title}</h1>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/55"><span>{hero.year}</span><span>{hero.mediaType === "movie" ? "Film" : "Série"}</span>{hero.rating ? <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-current text-amber-300" />{hero.rating.toFixed(1)}</span> : null}<span>{hero.genreLabel}</span></div>
              <p className="mt-5 line-clamp-4 max-w-xl text-base leading-7 text-white/70">{hero.pitch}</p>
              <div className="mt-7 flex flex-wrap gap-2"><button type="button" onClick={() => setSelected(hero)} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black"><Info className="h-4 w-4" />Fiche</button>{movixPath(hero) ? <button type="button" onClick={() => play(hero)} className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm font-semibold text-red-100"><Play className="h-4 w-4 fill-current" />Regarder sur Movix</button> : null}</div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mx-auto max-w-[1500px] px-4 pb-16 pt-7 sm:px-7 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(["all", "movie", "tv"] as const).map((value) => <button key={value} type="button" onClick={() => setMediaType(value)} className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold ${mediaType === value ? "border-white bg-white text-black" : "border-white/10 bg-white/[.035] text-white/55"}`}>{value === "movie" ? <Film className="h-3.5 w-3.5" /> : value === "tv" ? <Tv className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}{value === "all" ? "Tout" : value === "movie" ? "Films" : "Séries"}</button>)}
            <button type="button" onClick={() => void Promise.all([refetch(), refetchHealth()])} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[11px] text-white/45"><RefreshCw className={`h-3.5 w-3.5 ${isFetching || checkingHealth ? "animate-spin" : ""}`} />TMDB</button>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-white/55"><UserRound className="h-3.5 w-3.5" />{profileLabel}</span><span className="inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-400/[.07] px-3 py-2 text-violet-100/70"><Brain className="h-3.5 w-3.5" />{signals.length} avis · <Gauge className="h-3.5 w-3.5" />{confidence.percent}%</span></div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-white/35">
          <span className={`h-2 w-2 rounded-full ${health?.status === "ok" && !usingLocalFallback ? "bg-emerald-400" : "bg-amber-400"}`} />
          <span>{health?.status === "ok" && !usingLocalFallback ? "TMDB connecté" : "Catalogue local de secours"}</span>
          <span>•</span><span>{cloudState === "synced" ? "Profil synchronisé" : cloudState === "syncing" ? "Synchronisation…" : cloudState === "offline" ? "Hors ligne · copie locale active" : "Profil local"}</span>
          {(isLoading || isFetching) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        </div>

        <section className="mt-8 rounded-2xl border border-violet-400/15 bg-violet-400/[.055] p-4"><div className="flex gap-3"><Brain className="mt-0.5 h-5 w-5 text-violet-300" /><div><h2 className="font-semibold">Algorithme Angel Movies actif</h2><p className="mt-1 text-xs leading-5 text-white/45">Les likes, dislikes, contenus vus et préférences de style enrichissent ton profil. Plus tu utilises Angel Movies, plus le classement et les scores deviennent personnels.</p></div></div></section>

        {!query && picks.length > 1 ? <MediaGrid title="Recommandés pour toi" items={picks.slice(1, 13)} signals={signals} taste={taste} onSelect={setSelected} onSignal={updateSignal} onPlay={play} /> : null}
        <MediaGrid title={query ? `Résultats pour « ${query} »` : "Catalogue"} items={catalog} signals={signals} taste={taste} onSelect={setSelected} onSignal={updateSignal} onPlay={play} />

        <MovixLauncherPanel targetPath={movixTarget ? `${movixTarget.path}?angel=${movixTarget.nonce}` : null} targetLabel={movixTarget?.label} />
        <ProtonVpnBanner />
        <footer className="mt-14 border-t border-white/[.07] py-7 text-[11px] text-white/25">Angel Movies · Données et visuels : TMDB. Préférences : compte utilisateur + copie locale de secours.</footer>
      </div>

      {selected ? <FilmDetailsModal item={selected} signals={signals} profileKey={userId} onSignalsChange={(next) => { setSignals(next); const changed = next.find((signal) => signal.candidateId === selected.id); if (changed) void saveCloudTasteSignal(userId, changed).catch(() => setCloudState("offline")); }} onPlay={play} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}

function MediaGrid({ title, items, signals, taste, onSelect, onSignal, onPlay }: { title: string; items: RecommendationCandidate[]; signals: ViewingSignal[]; taste: ReturnType<typeof buildTasteProfile>; onSelect: (item: RecommendationCandidate) => void; onSignal: (item: RecommendationCandidate, patch: Partial<ViewingSignal>) => void; onPlay: (item: RecommendationCandidate) => void }) {
  return <section className="mt-10"><div className="flex items-end justify-between gap-4"><h2 className="text-2xl font-semibold tracking-[-.04em] sm:text-3xl">{title}</h2><span className="text-xs text-white/30">{items.length} titre{items.length > 1 ? "s" : ""}</span></div><div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{items.map((item) => <MediaCard key={`${title}-${item.id}`} item={item} signal={signals.find((signal) => signal.candidateId === item.id)} score={scoreCandidate(item, taste)} onSelect={onSelect} onSignal={onSignal} onPlay={onPlay} />)}</div>{!items.length ? <div className="mt-8 rounded-2xl border border-white/10 p-8 text-center text-sm text-white/40">Aucun résultat.</div> : null}</section>;
}

function MediaCard({ item, signal, score, onSelect, onSignal, onPlay }: { item: RecommendationCandidate; signal?: ViewingSignal; score: number; onSelect: (item: RecommendationCandidate) => void; onSignal: (item: RecommendationCandidate, patch: Partial<ViewingSignal>) => void; onPlay: (item: RecommendationCandidate) => void }) {
  const canPlay = Boolean(movixPath(item));
  return <article className="group min-w-0"><button type="button" onClick={() => onSelect(item)} className="block w-full text-left"><div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/[.08] bg-[#121216]">{item.posterUrl ? <img src={item.posterUrl} alt={`Affiche de ${item.title}`} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center p-4 text-center text-white/35">{item.title}</div>}<span className="absolute right-2 top-2 rounded-lg bg-violet-500/90 px-2 py-1 text-[10px] font-bold">{Math.round(score * 100)}%</span></div><h3 className="mt-2 line-clamp-1 text-sm font-semibold">{item.title}</h3><p className="mt-1 line-clamp-1 text-[11px] text-white/35">{item.year} · {item.genreLabel}</p></button><div className="mt-2 grid grid-cols-4 gap-1.5"><Action active={signal?.seen === true} label="Vu" onClick={() => onSignal(item, { seen: true, completion: 1 })}><CheckCircle2 className="h-3.5 w-3.5" /></Action><Action active={signal?.liked === true} label="J’aime" onClick={() => onSignal(item, { liked: true, rejected: false })}><Heart className="h-3.5 w-3.5" /></Action><Action active={signal?.liked === false || signal?.rejected === true} label="J’aime pas" onClick={() => onSignal(item, { liked: false, rejected: true })}><ThumbsDown className="h-3.5 w-3.5" /></Action><Action active={signal?.styleFit === "yes"} label="Style" onClick={() => onSignal(item, { styleFit: signal?.styleFit === "yes" ? "mixed" : "yes" })}><Sparkles className="h-3.5 w-3.5" /></Action></div>{canPlay ? <button type="button" onClick={() => onPlay(item)} className="mt-1.5 flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 text-[11px] font-semibold text-red-100"><Play className="h-3.5 w-3.5 fill-current" />Regarder sur Movix</button> : null}</article>;
}

function Action({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`flex min-h-9 min-w-0 items-center justify-center gap-1 rounded-lg border px-1 text-[10px] font-semibold ${active ? "border-violet-300 bg-violet-300 text-black" : "border-white/10 bg-white/[.035] text-white/45"}`}>{children}<span className="truncate">{label}</span></button>;
}
