import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Brain, CheckCircle2, Film, Gauge, Heart, Info, Loader2, LogIn, Play, RefreshCw, Search, Sparkles, Star, ThumbsDown, Tv, UserRound, X } from "lucide-react";
import { MovixLauncherPanel } from "@/components/admin/MovixLauncherPanel";
import { FilmDetailsModal } from "@/components/films/FilmDetailsModal";
import { useAuth } from "@/hooks/useAuth";
import { FILM_CATALOG } from "@/lib/film-catalog";
import { getFilmProviderHealth } from "@/lib/film-health.functions";
import { getLiveFilmCatalog } from "@/lib/film-live.functions";
import { hydrateTasteProfile, saveCloudTasteSignal } from "@/lib/film-taste.cloud";
import { loadTasteSignals, signalForCandidate, upsertTasteSignal } from "@/lib/film-taste.browser";
import { buildTasteProfile, confidenceFor, scoreCandidate, selectDailyRecommendations, type RecommendationCandidate, type ViewingSignal } from "@/lib/film-recommendations";

type Filter = "all" | "movie" | "tv" | "documentary";
type MovixTarget = { path: string; label: string; nonce: number } | null;
type TasteSeed = { mediaType: "movie" | "tv"; id: number };

function localFallback(mediaType: Filter, query: string) {
  const q = query.trim().toLocaleLowerCase("fr");
  return FILM_CATALOG
    .filter((item) => mediaType === "all" || (mediaType === "documentary" ? item.genreIds.includes(99) : item.mediaType === mediaType))
    .filter((item) => !q || `${item.title} ${item.genreLabel} ${item.pitch} ${item.people.join(" ")}`.toLocaleLowerCase("fr").includes(q));
}

function movixPath(item: RecommendationCandidate) {
  const match = item.id.match(/^tmdb-(movie|tv)-(\d+)$/);
  if (!match) return null;
  return match[1] === "movie" ? `/watch/movie/${match[2]}` : `/tv/${match[2]}`;
}

function seedsFromSignals(signals: ViewingSignal[]): TasteSeed[] {
  return [...signals]
    .filter((signal) => signal.liked === true || (signal.rating ?? 0) >= 4 || signal.styleFit === "yes")
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    .map((signal) => {
      const match = signal.candidateId.match(/^tmdb-(movie|tv)-(\d+)$/);
      return match ? { mediaType: match[1] as "movie" | "tv", id: Number(match[2]) } : null;
    })
    .filter((seed): seed is TasteSeed => Boolean(seed?.id))
    .filter((seed, index, all) => all.findIndex((candidate) => candidate.mediaType === seed.mediaType && candidate.id === seed.id) === index)
    .slice(0, 4);
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
  const profileLabel = user?.user_metadata?.display_name || user?.email || "Compte Angel Movies";

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

  const tasteSeeds = useMemo(() => seedsFromSignals(signals), [signals]);
  const seedKey = useMemo(() => tasteSeeds.map((seed) => `${seed.mediaType}:${seed.id}`).join(","), [tasteSeeds]);
  const apiMediaType = mediaType === "documentary" ? "all" : mediaType;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["angel-movies-live-tmdb-v10", userId, query, mediaType, seedKey],
    queryFn: () => loadCatalog({ data: { query, mediaType: apiMediaType, seeds: tasteSeeds } }),
    enabled: Boolean(userId),
    staleTime: 60_000,
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
  const rawCatalog = useMemo<RecommendationCandidate[]>(() => usingLocalFallback ? fallback : data.items, [usingLocalFallback, fallback, data]);
  const catalog = useMemo(() => mediaType === "documentary" ? rawCatalog.filter((item) => item.genreIds.includes(99)) : rawCatalog, [rawCatalog, mediaType]);
  const taste = useMemo(() => buildTasteProfile(signals), [signals]);
  const ranked = useMemo(() => selectDailyRecommendations(catalog, signals, 30), [catalog, signals]);
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
          <p className="mt-3 text-sm leading-6 text-white/50">Crée un compte Angel Movies classique. Aucun accès administrateur n’est nécessaire.</p>
          <a href="/movies-auth?mode=signup" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 font-semibold text-black"><LogIn className="h-4 w-4" />Créer mon compte / se connecter</a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#070708] text-white">
      <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#070708]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-3 py-3 pr-24 sm:flex-row sm:items-center sm:gap-3 sm:px-7 sm:pr-28 lg:px-10 lg:pr-28">
          <div className="flex shrink-0 items-center gap-2 font-semibold"><Film className="h-5 w-5 text-red-400" />Angel Movies</div>
          <form onSubmit={(event) => { event.preventDefault(); setQuery(draftQuery.trim()); }} className="flex w-full min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[.055] px-3 sm:ml-auto sm:max-w-xl sm:px-4">
            <Search className="h-4 w-4 shrink-0 text-white/35" />
            <input value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} placeholder="Film, série ou documentaire…" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-white/25" />
            {draftQuery ? <button type="button" onClick={() => { setDraftQuery(""); setQuery(""); }} className="shrink-0 text-white/35"><X className="h-4 w-4" /></button> : null}
          </form>
        </div>
      </header>

      {hero ? (
        <section className="relative min-h-[400px] overflow-hidden border-b border-white/[.06] sm:min-h-[540px]">
          {hero.backdropUrl || hero.posterUrl ? <img src={hero.backdropUrl || hero.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" /> : null}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070708] via-[#070708]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070708] via-transparent to-[#070708]/25" />
          <div className="relative mx-auto flex min-h-[400px] max-w-[1500px] items-end px-4 pb-9 pt-20 sm:min-h-[540px] sm:px-7 sm:pb-12 sm:pt-24 lg:px-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-[11px] font-semibold text-violet-100"><Sparkles className="h-3.5 w-3.5" />{Math.round(scoreCandidate(hero, taste) * 100)}% pour toi</div>
              <h1 className="mt-4 text-4xl font-bold tracking-[-.06em] sm:text-7xl">{hero.title}</h1>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/55"><span>{hero.year}</span><span>{hero.genreIds.includes(99) ? "Documentaire" : hero.mediaType === "movie" ? "Film" : "Série"}</span>{hero.rating ? <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-current text-amber-300" />{hero.rating.toFixed(1)}</span> : null}<span>{hero.genreLabel}</span></div>
              <p className="mt-5 line-clamp-3 max-w-xl text-sm leading-6 text-white/70 sm:line-clamp-4 sm:text-base sm:leading-7">{hero.pitch}</p>
              <div className="mt-6 flex flex-wrap gap-2 sm:mt-7"><button type="button" onClick={() => setSelected(hero)} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black"><Info className="h-4 w-4" />Fiche</button>{movixPath(hero) ? <button type="button" onClick={() => play(hero)} className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm font-semibold text-red-100"><Play className="h-4 w-4 fill-current" />Regarder</button> : null}</div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mx-auto max-w-[1500px] px-3 pb-12 pt-5 sm:px-7 sm:pb-16 sm:pt-7 lg:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["all", "movie", "tv", "documentary"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setMediaType(value)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold ${mediaType === value ? "border-white bg-white text-black" : "border-white/10 bg-white/[.035] text-white/55"}`}>
                {value === "movie" ? <Film className="h-3.5 w-3.5" /> : value === "tv" ? <Tv className="h-3.5 w-3.5" /> : value === "documentary" ? <BookOpen className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                {value === "all" ? "Tout" : value === "movie" ? "Films" : value === "tv" ? "Séries" : "Documentaires"}
              </button>
            ))}
            <button type="button" onClick={() => void Promise.all([refetch(), refetchHealth()])} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[11px] text-white/45"><RefreshCw className={`h-3.5 w-3.5 ${isFetching || checkingHealth ? "animate-spin" : ""}`} />Actualiser</button>
          </div>
          <div className="flex min-w-0 flex-wrap gap-2 text-[10px] sm:text-[11px]"><span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-white/55"><UserRound className="h-3.5 w-3.5 shrink-0" /><span className="max-w-[180px] truncate">{profileLabel}</span></span><span className="inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-400/[.07] px-3 py-2 text-violet-100/70"><Brain className="h-3.5 w-3.5" />{signals.length} avis · <Gauge className="h-3.5 w-3.5" />{confidence.percent}%</span></div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-white/35 sm:gap-3 sm:text-[11px]">
          <span className={`h-2 w-2 rounded-full ${health?.status === "ok" && !usingLocalFallback ? "bg-emerald-400" : "bg-amber-400"}`} />
          <span>{health?.status === "ok" && !usingLocalFallback ? "TMDB connecté" : "Catalogue local de secours"}</span>
          <span>•</span><span>{cloudState === "synced" ? "Profil personnel synchronisé" : cloudState === "syncing" ? "Personnalisation…" : cloudState === "offline" ? "Profil local actif" : "Profil personnel"}</span>
          {tasteSeeds.length ? <><span>•</span><span>{tasteSeeds.length} source{tasteSeeds.length > 1 ? "s" : ""} de goûts active{tasteSeeds.length > 1 ? "s" : ""}</span></> : null}
          {(isLoading || isFetching) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        </div>

        <section className="mt-6 rounded-2xl border border-violet-400/15 bg-violet-400/[.055] p-3.5 sm:mt-8 sm:p-4"><div className="flex gap-3"><Brain className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" /><div><h2 className="text-sm font-semibold sm:text-base">Recommandations personnalisées en direct</h2><p className="mt-1 text-xs leading-5 text-white/45">Chaque compte garde son propre profil. Un like, dislike, contenu vu ou préférence modifie immédiatement le score ; les derniers titres aimés alimentent aussi les recommandations et contenus similaires de TMDB.</p></div></div></section>

        {!query && picks.length > 1 ? <MediaGrid title="Recommandés pour toi" items={picks.slice(1, 16)} signals={signals} taste={taste} onSelect={setSelected} onSignal={updateSignal} onPlay={play} /> : null}
        <MediaGrid title={query ? `Résultats pour « ${query} »` : mediaType === "documentary" ? "Documentaires" : "Catalogue"} items={catalog} signals={signals} taste={taste} onSelect={setSelected} onSignal={updateSignal} onPlay={play} />

        <MovixInfoBanner />
        <MovixLauncherPanel targetPath={movixTarget ? `${movixTarget.path}?angel=${movixTarget.nonce}` : null} targetLabel={movixTarget?.label} />
      </div>

      {selected ? <FilmDetailsModal item={selected} signals={signals} profileKey={userId} onSignalsChange={(next) => { setSignals(next); const changed = next.find((signal) => signal.candidateId === selected.id); if (changed) void saveCloudTasteSignal(userId, changed).catch(() => setCloudState("offline")); }} onPlay={play} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}

function MovixInfoBanner() {
  return (
    <details className="group relative z-20 mt-10 overflow-hidden rounded-2xl border border-red-400/20 bg-[#0b090b] sm:mt-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_35%,rgba(239,68,68,.20),transparent_32%),radial-gradient(circle_at_82%_70%,rgba(139,92,246,.12),transparent_34%)] animate-[bannerGlow_5s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/[.06] to-transparent animate-[bannerSweep_4.5s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/70 to-transparent animate-pulse" />

      <summary className="relative flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-left marker:content-none sm:min-h-16 sm:px-6 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-red-200/75 sm:text-xs">Infos Movix</p>
          <p className="mt-1 text-xs text-white/55 sm:text-sm">À savoir avant de lancer un film</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[10px] font-semibold text-white/60 transition group-open:bg-red-500/15 group-open:text-red-100 sm:text-xs">Dérouler</span>
      </summary>

      <div className="relative border-t border-white/10 px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[.26em] text-red-200/75 sm:text-xs">À savoir avant de lancer un film</span>
              <span className="h-px min-w-10 flex-1 overflow-hidden bg-white/10"><span className="block h-full w-1/3 bg-gradient-to-r from-transparent via-red-400 to-transparent animate-[bannerLine_2.2s_ease-in-out_infinite]" /></span>
            </div>

            <div className="mt-3 grid gap-2.5 text-[12px] leading-5 text-white/75 sm:text-sm sm:leading-6 lg:grid-cols-2 lg:gap-x-8">
              <p className="animate-[bannerTextIn_700ms_ease-out_both]">Sans publicité ni pop-up. Pour regarder un titre, cliquez simplement sur <strong className="font-semibold text-white">Lire dans Movix</strong> : la vidéo apparaît automatiquement.</p>
              <p className="animate-[bannerTextIn_700ms_ease-out_120ms_both]">Un petit bandeau du navigateur peut apparaître au lancement. C’est normal : attendez quelques instants, il disparaîtra.</p>
              <p className="animate-[bannerTextIn_700ms_ease-out_240ms_both]">Dans le lecteur, évitez le bouton Retour du navigateur. Pour quitter proprement, utilisez la croix <strong className="font-semibold text-white">✕</strong>.</p>
              <p className="animate-[bannerTextIn_700ms_ease-out_360ms_both]">Des erreurs ou bugs d’affichage peuvent encore arriver : cette interface est principalement optimisée pour une utilisation sur <strong className="font-semibold text-white">TV ou ordinateur</strong>.</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 self-start rounded-full border border-red-400/20 bg-red-500/[.08] px-4 py-2.5 shadow-[0_0_30px_rgba(239,68,68,.08)] lg:self-center">
            <span className="text-[11px] font-medium text-white/65 sm:text-xs">On recherche le bon domaine 👀</span>
            <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_10px_rgba(239,68,68,.85)] animate-bounce [animation-delay:0ms]" />
            <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_10px_rgba(239,68,68,.85)] animate-bounce [animation-delay:120ms]" />
            <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_10px_rgba(239,68,68,.85)] animate-bounce [animation-delay:240ms]" />
          </div>
        </div>
      </div>

      <style>{`@keyframes bannerGlow{0%,100%{opacity:.72;transform:scale(1)}50%{opacity:1;transform:scale(1.035)}}@keyframes bannerSweep{0%{transform:translateX(-120%) skewX(-12deg);opacity:0}15%{opacity:1}55%{opacity:.6}100%{transform:translateX(340%) skewX(-12deg);opacity:0}}@keyframes bannerLine{0%,100%{transform:translateX(-80%);opacity:.35}50%{transform:translateX(240%);opacity:1}}@keyframes bannerTextIn{0%{opacity:0;transform:translateY(7px)}100%{opacity:1;transform:translateY(0)}}`}</style>
    </details>
  );
}

function MediaGrid({ title, items, signals, taste, onSelect, onSignal, onPlay }: { title: string; items: RecommendationCandidate[]; signals: ViewingSignal[]; taste: ReturnType<typeof buildTasteProfile>; onSelect: (item: RecommendationCandidate) => void; onSignal: (item: RecommendationCandidate, patch: Partial<ViewingSignal>) => void; onPlay: (item: RecommendationCandidate) => void }) {
  return <section className="mt-8 sm:mt-10"><div className="flex items-end justify-between gap-4"><h2 className="text-xl font-semibold tracking-[-.04em] sm:text-3xl">{title}</h2><span className="shrink-0 text-[10px] text-white/30 sm:text-xs">{items.length} titre{items.length > 1 ? "s" : ""}</span></div><div className="mt-4 grid grid-cols-2 gap-x-2.5 gap-y-6 sm:mt-5 sm:grid-cols-3 sm:gap-x-3 sm:gap-y-7 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{items.map((item) => <MediaCard key={`${title}-${item.id}`} item={item} signal={signals.find((signal) => signal.candidateId === item.id)} score={scoreCandidate(item, taste)} onSelect={onSelect} onSignal={onSignal} onPlay={onPlay} />)}</div>{!items.length ? <div className="mt-8 rounded-2xl border border-white/10 p-8 text-center text-sm text-white/40">Aucun résultat.</div> : null}</section>;
}

function MediaCard({ item, signal, score, onSelect, onSignal, onPlay }: { item: RecommendationCandidate; signal?: ViewingSignal; score: number; onSelect: (item: RecommendationCandidate) => void; onSignal: (item: RecommendationCandidate, patch: Partial<ViewingSignal>) => void; onPlay: (item: RecommendationCandidate) => void }) {
  const canPlay = Boolean(movixPath(item));
  return <article className="group min-w-0"><button type="button" onClick={() => onSelect(item)} className="block w-full text-left"><div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/[.08] bg-[#121216] sm:rounded-2xl">{item.posterUrl ? <img src={item.posterUrl} alt={`Affiche de ${item.title}`} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center p-4 text-center text-white/35">{item.title}</div>}<span className="absolute right-1.5 top-1.5 rounded-lg bg-violet-500/90 px-1.5 py-1 text-[9px] font-bold sm:right-2 sm:top-2 sm:px-2 sm:text-[10px]">{Math.round(score * 100)}%</span></div><h3 className="mt-2 line-clamp-1 text-xs font-semibold sm:text-sm">{item.title}</h3><p className="mt-1 line-clamp-1 text-[10px] text-white/35 sm:text-[11px]">{item.year} · {item.genreLabel}</p></button><div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4"><Action active={signal?.seen === true} label="Vu" onClick={() => onSignal(item, { seen: true, completion: 1 })}><CheckCircle2 className="h-3.5 w-3.5" /></Action><Action active={signal?.liked === true} label="J’aime" onClick={() => onSignal(item, { liked: true, rejected: false })}><Heart className="h-3.5 w-3.5" /></Action><Action active={signal?.liked === false || signal?.rejected === true} label="J’aime pas" onClick={() => onSignal(item, { liked: false, rejected: true })}><ThumbsDown className="h-3.5 w-3.5" /></Action><Action active={signal?.styleFit === "yes"} label="Style" onClick={() => onSignal(item, { styleFit: signal?.styleFit === "yes" ? "mixed" : "yes" })}><Sparkles className="h-3.5 w-3.5" /></Action></div>{canPlay ? <button type="button" onClick={() => onPlay(item)} className="mt-1.5 flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 text-[10px] font-semibold text-red-100 sm:text-[11px]"><Play className="h-3.5 w-3.5 fill-current" />Regarder</button> : null}</article>;
}

function Action({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`flex min-h-9 min-w-0 items-center justify-center gap-1 rounded-lg border px-1 text-[10px] font-semibold ${active ? "border-violet-300 bg-violet-300 text-black" : "border-white/10 bg-white/[.035] text-white/45"}`}>{children}<span className="truncate">{label}</span></button>;
}