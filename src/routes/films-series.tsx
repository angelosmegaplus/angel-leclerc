import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { ChevronDown, Film, Loader2, LockKeyhole, Search, ShieldAlert, Sparkles, Star } from "lucide-react";
import { MovixLauncherPanel } from "@/components/admin/MovixLauncherPanel";
import { FILM_CATALOG } from "@/lib/film-catalog";
import { verifyFilmAccessPin } from "@/lib/film-access.functions";
import { getLiveFilmCatalog } from "@/lib/film-live.functions";
import { selectDailyRecommendations, type RecommendationCandidate } from "@/lib/film-recommendations";

export const Route = createFileRoute("/films-series")({
  head: () => ({
    meta: [
      { title: "Films et séries | Angel OS" },
      { name: "robots", content: "noindex, nofollow, noarchive, nosnippet" },
    ],
  }),
  component: FilmSeriesPage,
});

const ACCESS_KEY = "angel-os-cinema-access-v2";
const ACCESS_MS = 12 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;
type Filter = "all" | "movie" | "tv";
type GateStage = "pin" | "scan" | "intro" | "open";

function localFallback(mediaType: Filter, query: string) {
  const q = query.trim().toLocaleLowerCase("fr");
  return FILM_CATALOG.filter((item) => mediaType === "all" || item.mediaType === mediaType).filter((item) => {
    if (q.length < 2) return true;
    return `${item.title} ${item.genreLabel} ${item.pitch}`.toLocaleLowerCase("fr").includes(q);
  });
}

function FilmSeriesPage() {
  const verifyPin = useServerFn(verifyFilmAccessPin);
  const loadCatalog = useServerFn(getLiveFilmCatalog);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [stage, setStage] = useState<GateStage>("pin");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [unlocking, setUnlocking] = useState(false);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<Filter>("all");
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    try {
      const grantedAt = Number(sessionStorage.getItem(ACCESS_KEY));
      if (Number.isFinite(grantedAt) && Date.now() - grantedAt < ACCESS_MS) setStage("open");
    } catch {
      setStage("pin");
    } finally {
      setCheckingAccess(false);
    }
  }, []);

  useEffect(() => {
    if (stage !== "scan") return;
    const timer = window.setTimeout(() => setStage("intro"), 2300);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "intro") return;
    const timer = window.setTimeout(() => setStage("open"), 3600);
    return () => window.clearTimeout(timer);
  }, [stage]);

  const unlocked = stage === "open";
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["films-series-live-tmdb", query, mediaType],
    queryFn: () => loadCatalog({ data: { query, mediaType } }),
    enabled: unlocked,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });

  const fallback = useMemo(() => localFallback(mediaType, query), [mediaType, query]);
  const catalog = useMemo<RecommendationCandidate[]>(() => data?.items?.length ? data.items : fallback, [data?.items, fallback]);
  const picks = useMemo(() => selectDailyRecommendations(catalog, []).slice(0, 5), [catalog]);
  const locked = lockedUntil > Date.now();

  async function unlock(event?: React.FormEvent) {
    event?.preventDefault();
    if (unlocking || locked || pin.length !== 4) return;
    setUnlocking(true);
    setPinError(null);
    try {
      await verifyPin({ data: { pin } });
      try { sessionStorage.setItem(ACCESS_KEY, String(Date.now())); } catch { /* optional */ }
      setAttempts(0);
      setStage("scan");
    } catch {
      const next = attempts + 1;
      setAttempts(next);
      setPin("");
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + 30_000);
        setAttempts(0);
        setPinError("SESSION VERROUILLÉE · nouvelle tentative dans 30 secondes");
      } else {
        setPinError(`CODE REFUSÉ · ${MAX_ATTEMPTS - next} tentative${MAX_ATTEMPTS - next > 1 ? "s" : ""} avant verrouillage`);
      }
    } finally {
      setUnlocking(false);
    }
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setQuery(draftQuery.trim());
  }

  if (checkingAccess) {
    return <main className="grid min-h-[100dvh] place-items-center bg-[#030405] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  }

  if (stage === "pin") {
    return (
      <main className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-[#030405] px-4 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(220,38,38,.16),transparent_34%),linear-gradient(to_bottom,transparent,rgba(0,0,0,.65))]" />
        <div className="pointer-events-none absolute inset-0 opacity-[.08] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:44px_44px]" />
        <section className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-red-500/20 bg-[#08090b]/95 p-6 shadow-[0_40px_120px_rgba(0,0,0,.7)] sm:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-300"><ShieldAlert className="h-5 w-5" /></span><div><p className="font-mono text-[10px] uppercase tracking-[.25em] text-red-300">Angel OS · Secure Cinema</p><h1 className="mt-1 text-2xl font-semibold tracking-[-.045em]">Zone privée</h1></div></div>
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_22px_rgba(239,68,68,.9)]" />
          </div>
          <div className="mt-7 rounded-2xl border border-white/8 bg-black/35 p-4 font-mono text-[11px] leading-6 text-white/45">
            <p><span className="text-red-300">SECURITY_GATE</span> / actif</p>
            <p>Indexation publique / désactivée</p>
            <p>Session / compartimentée</p>
            <p>Échecs répétés / verrouillage automatique</p>
          </div>
          <form onSubmit={unlock} className="mt-6">
            <label className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/35">Code PIN</label>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-4 focus-within:border-red-400/40">
              <LockKeyhole className="h-4 w-4 text-white/30" />
              <input inputMode="numeric" autoComplete="one-time-code" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="••••" aria-label="Code PIN" className="min-h-14 min-w-0 flex-1 bg-transparent text-center font-mono text-2xl tracking-[.55em] text-white outline-none placeholder:tracking-[.35em] placeholder:text-white/15" />
            </div>
            {pinError ? <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/[.07] px-3 py-2 font-mono text-[10px] leading-5 text-red-200">{pinError}</p> : null}
            <button type="submit" disabled={unlocking || pin.length !== 4 || locked} className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-35">{unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Autoriser cette session"}</button>
          </form>
          <p className="mt-5 text-center text-[10px] leading-5 text-white/25">Accès volontairement discret. Aucun mot de passe de compte n’est demandé sur cette page.</p>
        </section>
      </main>
    );
  }

  if (stage === "scan") {
    return <SecuritySequence />;
  }

  if (stage === "intro") {
    return <CinemaIntro onSkip={() => setStage("open")} />;
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-[100dvh] overflow-x-hidden bg-[#030405] text-white">
        <div className="relative border-b border-white/10 bg-[radial-gradient(circle_at_22%_0%,rgba(220,38,38,.18),transparent_30%),radial-gradient(circle_at_78%_0%,rgba(255,255,255,.07),transparent_25%)] px-4 pb-9 pt-7 sm:px-7 lg:px-10">
          <div className="mx-auto max-w-[1600px]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300"><Film className="h-5 w-5" /></span><div><p className="font-mono text-[10px] uppercase tracking-[.22em] text-red-300">Angel OS Cinema</p><h1 className="text-3xl font-semibold tracking-[-.055em] sm:text-4xl">Films et séries</h1></div></div>
              <div className="rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.14em] text-emerald-200/70">session autorisée</div>
            </div>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-white/45">Un espace cinéma privé centré sur le grand bac à sable. Les suggestions et la recherche restent disponibles, mais ne prennent plus toute la place.</p>
          </div>
        </div>

        <div className="mx-auto max-w-[1600px] px-4 pb-12 sm:px-7 lg:px-10">
          <MovixLauncherPanel />

          <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
            <button type="button" onClick={() => setDiscoverOpen((value) => !value)} className="flex min-h-16 w-full items-center justify-between gap-4 px-5 text-left sm:px-6">
              <div className="flex items-center gap-3"><Sparkles className="h-4 w-4 text-red-300" /><div><h2 className="text-base font-semibold">Suggestions du jour</h2><p className="mt-0.5 text-xs text-white/35">5 propositions, rangées tant que tu n’en as pas besoin</p></div></div>
              <ChevronDown className={`h-4 w-4 text-white/35 transition ${discoverOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>{discoverOpen ? <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="border-t border-white/10 p-5 sm:p-6"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{picks.map(({ candidate }) => <MediaCard key={`pick-${candidate.id}`} item={candidate} />)}</div></div></motion.div> : null}</AnimatePresence>
          </section>

          <section className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
            <button type="button" onClick={() => setSearchOpen((value) => !value)} className="flex min-h-16 w-full items-center justify-between gap-4 px-5 text-left sm:px-6">
              <div className="flex items-center gap-3"><Search className="h-4 w-4 text-red-300" /><div><h2 className="text-base font-semibold">Recherche & catalogue</h2><p className="mt-0.5 text-xs text-white/35">Recherche TMDB et catalogue personnel</p></div></div>
              <ChevronDown className={`h-4 w-4 text-white/35 transition ${searchOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>{searchOpen ? <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="border-t border-white/10 p-5 sm:p-6">
              <form onSubmit={submitSearch} className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2 sm:max-w-xl"><Search className="ml-2 h-4 w-4 shrink-0 text-white/35" /><input value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} placeholder="Titre, film ou série…" className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-white/25" /><button type="submit" className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold">Rechercher</button></form>
              <div className="mt-4 flex flex-wrap items-center gap-2">{(["all", "movie", "tv"] as const).map((value) => <button key={value} type="button" onClick={() => setMediaType(value)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${mediaType === value ? "border-red-500/35 bg-red-500/15 text-red-200" : "border-white/10 bg-white/[.03] text-white/55"}`}>{value === "all" ? "Tout" : value === "movie" ? "Films" : "Séries"}</button>)}{(isLoading || isFetching) ? <span className="inline-flex items-center gap-1.5 text-xs text-white/35"><Loader2 className="h-3.5 w-3.5 animate-spin" />Actualisation</span> : null}<button type="button" onClick={() => void refetch()} className="ml-auto text-xs text-white/35 hover:text-white/70">Actualiser</button></div>
              {data?.source === "unavailable" ? <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[.06] px-4 py-3 text-xs leading-5 text-amber-100/75">La source distante est momentanément indisponible. Le catalogue local prend le relais.</div> : null}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{catalog.map((item) => <MediaCard key={item.id} item={item} />)}</div>
              {!catalog.length && !isLoading ? <p className="mt-8 text-sm text-white/45">Aucun résultat.</p> : null}
            </div></motion.div> : null}</AnimatePresence>
          </section>

          <footer className="mt-10 border-t border-white/10 py-6 text-[11px] leading-5 text-white/25">Métadonnées et visuels du catalogue fournis par TMDB. Cette page est exclue de l’indexation publique.</footer>
        </div>
      </main>
    </MotionConfig>
  );
}

function SecuritySequence() {
  return (
    <main className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-black px-4 text-white">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,.18),transparent_42%)]" />
      <motion.div initial={{ y: "-100%" }} animate={{ y: "100vh" }} transition={{ duration: 1.25, repeat: 1, ease: "linear" }} className="absolute inset-x-0 top-0 h-px bg-red-400 shadow-[0_0_30px_rgba(248,113,113,.9)]" />
      <div className="relative w-full max-w-xl font-mono">
        <div className="flex items-center justify-between border-b border-red-500/30 pb-3 text-[10px] uppercase tracking-[.22em] text-red-300"><span>Angel Security Protocol</span><span className="animate-pulse">LIVE</span></div>
        <div className="mt-7 space-y-3 text-xs text-white/45">
          {["Vérification du code cryptographique", "Isolation de la session navigateur", "Blocage indexation externe", "Initialisation du mode cinéma privé"].map((label, index) => <motion.div key={label} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.34 }} className="flex items-center gap-3"><span className="text-red-300">0{index + 1}</span><span>{label}</span><motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.34 + 0.25 }} className="ml-auto text-emerald-300">OK</motion.span></motion.div>)}
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.65 }} className="mt-8 border border-red-500/20 bg-red-500/[.06] px-4 py-3 text-center text-[10px] uppercase tracking-[.2em] text-red-200">Accès non autorisé : session interrompue automatiquement</motion.p>
      </div>
    </main>
  );
}

function CinemaIntro({ onSkip }: { onSkip: () => void }) {
  return (
    <main className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-black text-white">
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.4, ease: "easeInOut" }} className="absolute inset-x-[12%] top-1/2 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />
      <div className="relative text-center">
        <motion.div initial={{ opacity: 0, scale: .86, filter: "blur(12px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ duration: 1.25 }}><p className="font-mono text-[10px] uppercase tracking-[.5em] text-red-300">Angel OS presents</p><h1 className="mt-5 text-5xl font-semibold tracking-[-.07em] sm:text-7xl">CINEMA</h1></motion.div>
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: .42, y: 0 }} transition={{ delay: 1.25, duration: .7 }} className="mt-6 text-xs uppercase tracking-[.35em]">Private screening environment</motion.p>
      </div>
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: .45 }} transition={{ delay: 1.5 }} type="button" onClick={onSkip} className="absolute bottom-7 right-7 font-mono text-[10px] uppercase tracking-[.18em] hover:opacity-100">Passer</motion.button>
    </main>
  );
}

function MediaCard({ item }: { item: RecommendationCandidate }) {
  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-white/[.035]">
      <div className="relative aspect-[2/3] bg-[#111318]">
        {item.posterUrl ? <img src={item.posterUrl} alt={`Affiche de ${item.title}`} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center px-4 text-center text-xs text-white/25">Affiche indisponible</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <span className="absolute left-2 top-2 rounded-md bg-black/75 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/75">{item.mediaType === "movie" ? "Film" : "Série"}</span>
        <div className="absolute inset-x-0 bottom-0 p-3"><h3 className="line-clamp-2 text-sm font-semibold">{item.title}</h3><div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/55"><span>{item.year}</span>{item.rating ? <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" />{item.rating.toFixed(1)}</span> : null}</div></div>
      </div>
      <div className="p-3"><p className="line-clamp-1 text-[10px] font-medium text-red-200/70">{item.genreLabel}</p><p className="mt-1.5 line-clamp-3 text-xs leading-5 text-white/45">{item.pitch}</p></div>
    </article>
  );
}
