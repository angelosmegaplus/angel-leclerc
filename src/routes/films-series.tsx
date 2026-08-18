import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Brain, CheckCircle2, Film, Flame, Gauge, Heart, Info, Loader2, RefreshCw, Search, ShieldCheck, Sparkles, Star, ThumbsDown, Tv, X } from "lucide-react";
import { Captcha, type CaptchaValue } from "@/components/Captcha";
import { MovixLauncherPanel } from "@/components/admin/MovixLauncherPanel";
import { FilmDetailsModal } from "@/components/films/FilmDetailsModal";
import { verifyCaptchaAnswer } from "@/lib/captcha.functions";
import { FILM_CATALOG } from "@/lib/film-catalog";
import { getFilmProviderHealth } from "@/lib/film-health.functions";
import { getLiveFilmCatalog } from "@/lib/film-live.functions";
import { loadTasteSignals, signalForCandidate, upsertTasteSignal } from "@/lib/film-taste.client";
import { buildTasteProfile, confidenceFor, scoreCandidate, selectDailyRecommendations, type RecommendationCandidate, type ViewingSignal } from "@/lib/film-recommendations";

export const Route = createFileRoute("/films-series")({
  head: () => ({
    meta: [
      { title: "Films & séries | Angel" },
      { name: "description", content: "Recommandations personnelles de films et séries, alimentées par TMDB." },
      { name: "robots", content: "noindex, nofollow, noarchive, nosnippet" },
    ],
  }),
  component: FilmSeriesPage,
});

const ACCESS_KEY = "angel-os-films-series-access-v2";
const ACCESS_MS = 12 * 60 * 60 * 1000;
type Filter = "all" | "movie" | "tv";

function localFallback(mediaType: Filter, query: string) {
  const q = query.trim().toLocaleLowerCase("fr");
  return FILM_CATALOG
    .filter((item) => mediaType === "all" || item.mediaType === mediaType)
    .filter((item) => {
      if (q.length < 2) return true;
      return `${item.title} ${item.genreLabel} ${item.pitch} ${item.people.join(" ")}`.toLocaleLowerCase("fr").includes(q);
    });
}

function FilmSeriesPage() {
  const verify = useServerFn(verifyCaptchaAnswer);
  const loadCatalog = useServerFn(getLiveFilmCatalog);
  const loadProviderHealth = useServerFn(getFilmProviderHealth);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaValue>({ token: "", answer: "" });
  const [captchaError, setCaptchaError] = useState<string | undefined>();
  const [unlocking, setUnlocking] = useState(false);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<Filter>("all");
  const [selected, setSelected] = useState<RecommendationCandidate | null>(null);
  const [signals, setSignals] = useState<ViewingSignal[]>([]);

  useEffect(() => {
    try {
      const grantedAt = Number(sessionStorage.getItem(ACCESS_KEY));
      setUnlocked(Number.isFinite(grantedAt) && Date.now() - grantedAt < ACCESS_MS);
      setSignals(loadTasteSignals());
    } catch {
      setUnlocked(false);
    } finally {
      setCheckingAccess(false);
    }
  }, []);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["films-series-live-tmdb-v4", query, mediaType],
    queryFn: () => loadCatalog({ data: { query, mediaType } }),
    enabled: unlocked,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });

  const { data: providerHealth, refetch: refetchProviderHealth, isFetching: checkingProvider } = useQuery({
    queryKey: ["films-series-provider-health-v4"],
    queryFn: () => loadProviderHealth(),
    enabled: unlocked,
    staleTime: 60 * 1000,
    retry: false,
  });

  const fallback = useMemo(() => localFallback(mediaType, query), [mediaType, query]);
  const usingLocalFallback = !data || data.source === "unavailable";
  const catalog = useMemo<RecommendationCandidate[]>(() => usingLocalFallback ? fallback : data.items, [data, fallback, usingLocalFallback]);
  const profile = useMemo(() => buildTasteProfile(signals), [signals]);
  const ranked = useMemo(() => selectDailyRecommendations(catalog, signals, 18), [catalog, signals]);
  const picks = useMemo(() => ranked.map((entry) => entry.candidate), [ranked]);
  const hero = !query ? picks[0] : null;
  const confidence = useMemo(() => confidenceFor(signals), [signals]);

  function updateSignal(item: RecommendationCandidate, patch: Partial<ViewingSignal>) {
    const previous = signals.find((signal) => signal.candidateId === item.id);
    const base = signalForCandidate(item, previous);
    const next = { ...base, ...patch, updatedAt: Date.now() };
    setSignals(upsertTasteSignal(signals, next));
  }

  async function unlock() {
    if (unlocking || !captcha.token || !captcha.answer.trim()) return;
    setUnlocking(true);
    setCaptchaError(undefined);
    try {
      await verify({ data: captcha });
      try { sessionStorage.setItem(ACCESS_KEY, String(Date.now())); } catch {}
      setUnlocked(true);
      setSignals(loadTasteSignals());
    } catch (error) {
      setCaptchaError(error instanceof Error ? error.message : "Vérification incorrecte.");
    } finally {
      setUnlocking(false);
    }
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setQuery(draftQuery.trim());
  }

  function clearSearch() {
    setDraftQuery("");
    setQuery("");
  }

  async function retryTmdb() {
    await Promise.all([refetchProviderHealth(), refetch()]);
  }

  if (checkingAccess) return <main className="grid min-h-[100dvh] place-items-center bg-[#070708] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;

  if (!unlocked) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#070708] px-4 text-white">
        <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[.035] p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300"><ShieldCheck className="h-5 w-5" /></span>
            <div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-red-300">Accès privé</p><h1 className="text-2xl font-semibold tracking-[-.04em]">Films & séries</h1></div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/55">Une vérification anti-robot protège cette page non référencée.</p>
          <div className="mt-5 [&_.bg-muted\/30]:bg-white/[.03] [&_.bg-background]:bg-black/30 [&_.border-border]:border-white/10 [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-white/50"><Captcha value={captcha} onChange={setCaptcha} error={captchaError} /></div>
          <button type="button" onClick={() => void unlock()} disabled={unlocking || !captcha.answer.trim()} className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-white px-4 font-semibold text-black transition hover:bg-white/90 disabled:opacity-40">{unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrer"}</button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#070708] text-white">
      <div className="sticky top-0 z-30 border-b border-white/[.07] bg-[#070708]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3 sm:px-7 lg:px-10">
          <div className="flex shrink-0 items-center gap-2 font-semibold tracking-[-.03em]"><Film className="h-5 w-5 text-red-400" />Films & séries</div>
          <form onSubmit={submitSearch} className="ml-auto flex w-full max-w-xl items-center gap-2 rounded-full border border-white/10 bg-white/[.055] px-4">
            <Search className="h-4 w-4 shrink-0 text-white/35" />
            <input value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} placeholder="Rechercher un titre…" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-white/25" />
            {draftQuery ? <button type="button" onClick={clearSearch} className="text-white/35 hover:text-white"><X className="h-4 w-4" /></button> : null}
          </form>
        </div>
      </div>

      {hero ? (
        <section className="relative min-h-[480px] overflow-hidden border-b border-white/[.06] sm:min-h-[560px]">
          {hero.backdropUrl || hero.posterUrl ? <img src={hero.backdropUrl || hero.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" /> : null}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070708] via-[#070708]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070708] via-transparent to-[#070708]/20" />
          <div className="relative mx-auto flex min-h-[480px] max-w-[1500px] items-end px-4 pb-12 pt-24 sm:min-h-[560px] sm:px-7 sm:pb-16 lg:px-10">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.12em] text-white/70 backdrop-blur"><Sparkles className="h-3.5 w-3.5 text-red-300" />Recommandé pour toi · {Math.round(scoreCandidate(hero, profile) * 100)}%</div>
              <h1 className="text-5xl font-bold tracking-[-.065em] sm:text-7xl">{hero.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/60"><span>{hero.year}</span><span>{hero.mediaType === "movie" ? "Film" : "Série"}</span>{hero.rating ? <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-current text-amber-300" />{hero.rating.toFixed(1)}</span> : null}<span>{hero.genreLabel}</span></div>
              <p className="mt-5 line-clamp-4 max-w-xl text-base leading-7 text-white/70 sm:text-lg">{hero.pitch}</p>
              <button type="button" onClick={() => setSelected(hero)} className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"><Info className="h-4 w-4" />Voir la fiche</button>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mx-auto max-w-[1500px] px-4 pb-16 pt-7 sm:px-7 lg:px-10">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "movie", "tv"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setMediaType(value)} className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${mediaType === value ? "border-white bg-white text-black" : "border-white/10 bg-white/[.035] text-white/55 hover:bg-white/[.07] hover:text-white"}`}>{value === "movie" ? <Film className="h-3.5 w-3.5" /> : value === "tv" ? <Tv className="h-3.5 w-3.5" /> : <Flame className="h-3.5 w-3.5" />}{value === "all" ? "Tout" : value === "movie" ? "Films" : "Séries"}</button>
            ))}
            <button type="button" onClick={() => void retryTmdb()} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[11px] text-white/40 transition hover:text-white/75"><RefreshCw className={`h-3.5 w-3.5 ${checkingProvider || isFetching ? "animate-spin" : ""}`} />TMDB</button>
          </div>
          <div className="inline-flex w-fit items-center gap-3 rounded-full border border-violet-400/15 bg-violet-400/[.07] px-3.5 py-2 text-[11px] text-violet-100/70"><Brain className="h-3.5 w-3.5" /><span>{signals.length} avis enregistrés</span><span className="text-white/25">•</span><Gauge className="h-3.5 w-3.5" /><span>précision {confidence.percent}%</span></div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-white/35"><span className={`h-2 w-2 rounded-full ${providerHealth?.status === "ok" && !usingLocalFallback ? "bg-emerald-400" : "bg-amber-400"}`} />{providerHealth?.status === "ok" && !usingLocalFallback ? "Catalogue en direct via TMDB" : "Mode résilient : catalogue local actif"}{(isLoading || isFetching) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}</div>

        <section className="mt-8 rounded-2xl border border-violet-400/15 bg-violet-400/[.055] p-4 sm:p-5">
          <div className="flex items-start gap-3"><Brain className="mt-0.5 h-5 w-5 text-violet-300" /><div><h2 className="font-semibold">Algorithme personnel actif</h2><p className="mt-1 text-xs leading-5 text-white/45">Chaque bouton sous les affiches modifie immédiatement ton profil. Les scores « pour toi » et l’ordre des recommandations sont recalculés à chaque avis.</p></div></div>
        </section>

        {!query && picks.length > 1 ? <MediaRail title="Recommandés pour toi" subtitle={`Classement personnalisé · confiance ${confidence.level}.`} items={picks.slice(1)} signals={signals} profile={profile} onSelect={setSelected} onSignal={updateSignal} /> : null}

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-red-300/80">Catalogue</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.04em] sm:text-3xl">{query ? `Résultats pour « ${query} »` : mediaType === "movie" ? "Films" : mediaType === "tv" ? "Séries" : "À découvrir"}</h2></div><span className="text-xs text-white/30">{catalog.length} titre{catalog.length > 1 ? "s" : ""}</span></div>
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{catalog.map((item) => <MediaCard key={item.id} item={item} signal={signals.find((signal) => signal.candidateId === item.id)} score={scoreCandidate(item, profile)} onSelect={setSelected} onSignal={updateSignal} />)}</div>
          {!catalog.length && !isLoading ? <div className="mt-10 rounded-2xl border border-white/10 bg-white/[.03] p-8 text-center text-sm text-white/45">Aucun résultat. Essaie un autre titre.</div> : null}
        </section>

        <MovixLauncherPanel />

        <footer className="mt-14 border-t border-white/[.07] py-7 text-[11px] leading-5 text-white/25">Données et visuels enrichis par TMDB. Le profil de goûts reste enregistré localement sur cet appareil.</footer>
      </div>

      {selected ? <FilmDetailsModal item={selected} signals={signals} onSignalsChange={setSignals} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}

function MediaRail({ title, subtitle, items, signals, profile, onSelect, onSignal }: { title: string; subtitle: string; items: RecommendationCandidate[]; signals: ViewingSignal[]; profile: ReturnType<typeof buildTasteProfile>; onSelect: (item: RecommendationCandidate) => void; onSignal: (item: RecommendationCandidate, patch: Partial<ViewingSignal>) => void }) {
  return <section className="mt-10"><h2 className="text-2xl font-semibold tracking-[-.04em]">{title}</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-white/35">{subtitle}</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{items.map((item) => <MediaCard key={`rail-${item.id}`} item={item} signal={signals.find((signal) => signal.candidateId === item.id)} score={scoreCandidate(item, profile)} onSelect={onSelect} onSignal={onSignal} />)}</div></section>;
}

function MediaCard({ item, signal, score, onSelect, onSignal }: { item: RecommendationCandidate; signal?: ViewingSignal; score: number; onSelect: (item: RecommendationCandidate) => void; onSignal: (item: RecommendationCandidate, patch: Partial<ViewingSignal>) => void }) {
  return (
    <article className="group min-w-0">
      <button type="button" onClick={() => onSelect(item)} className="block w-full text-left">
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/[.08] bg-[#121216] shadow-lg transition duration-300 group-hover:-translate-y-1 group-hover:border-white/20">
          {item.posterUrl ? <img src={item.posterUrl} alt={`Affiche de ${item.title}`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : <div className="grid h-full place-items-center bg-gradient-to-br from-[#19191e] to-[#0d0d10] px-4 text-center text-sm font-semibold text-white/35">{item.title}</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/75 backdrop-blur">{item.mediaType === "movie" ? "Film" : "Série"}</span>
          <span className="absolute right-2 top-2 rounded-md bg-violet-500/85 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">{Math.round(score * 100)}% pour toi</span>
        </div>
        <h3 className="mt-2.5 line-clamp-1 text-sm font-semibold tracking-[-.02em] text-white/90">{item.title}</h3>
        <p className="mt-1 line-clamp-1 text-[11px] text-white/35">{item.year} · {item.genreLabel}</p>
      </button>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        <QuickAction active={signal?.seen === true} label="Vu" title="Déjà vu" onClick={() => onSignal(item, { seen: true, completion: 1 })}><CheckCircle2 className="h-3.5 w-3.5" /></QuickAction>
        <QuickAction active={signal?.liked === true} label="Oui" title="J’aime" onClick={() => onSignal(item, { liked: true, rejected: false })}><Heart className="h-3.5 w-3.5" /></QuickAction>
        <QuickAction active={signal?.liked === false || signal?.rejected === true} label="Non" title="Je n’aime pas" onClick={() => onSignal(item, { liked: false, rejected: true })}><ThumbsDown className="h-3.5 w-3.5" /></QuickAction>
        <QuickAction active={signal?.styleFit === "yes"} label="Style" title="C’est mon style" onClick={() => onSignal(item, { styleFit: signal?.styleFit === "yes" ? "mixed" : "yes" })}><Sparkles className="h-3.5 w-3.5" /></QuickAction>
      </div>
    </article>
  );
}

function QuickAction({ active, label, title, onClick, children }: { active: boolean; label: string; title: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" title={title} aria-label={title} onClick={onClick} className={`flex min-h-9 min-w-0 items-center justify-center gap-1 rounded-lg border px-1 text-[10px] font-semibold transition ${active ? "border-violet-300 bg-violet-300 text-black" : "border-white/10 bg-white/[.035] text-white/45 hover:bg-white/[.08] hover:text-white"}`}>{children}<span className="truncate">{label}</span></button>;
}
