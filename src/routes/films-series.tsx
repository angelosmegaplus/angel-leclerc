import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Film, Loader2, Search, ShieldCheck, Star } from "lucide-react";
import { Captcha, type CaptchaValue } from "@/components/Captcha";
import { verifyCaptchaAnswer } from "@/lib/captcha.functions";
import { FILM_CATALOG } from "@/lib/film-catalog";
import { getLiveFilmCatalog } from "@/lib/film-live.functions";
import { selectDailyRecommendations, type RecommendationCandidate } from "@/lib/film-recommendations";

export const Route = createFileRoute("/films-series")({
  head: () => ({
    meta: [
      { title: "Films et séries | Angel OS IA" },
      { name: "robots", content: "noindex, nofollow, noarchive, nosnippet" },
    ],
  }),
  component: FilmSeriesPrivateLinkPage,
});

const ACCESS_KEY = "angel-os-films-series-access-v1";
const ACCESS_MS = 12 * 60 * 60 * 1000;
type Filter = "all" | "movie" | "tv";

function localFallback(mediaType: Filter, query: string) {
  const q = query.trim().toLocaleLowerCase("fr");
  return FILM_CATALOG.filter((item) => mediaType === "all" || item.mediaType === mediaType).filter((item) => {
    if (q.length < 2) return true;
    return `${item.title} ${item.genreLabel} ${item.pitch}`.toLocaleLowerCase("fr").includes(q);
  });
}

function FilmSeriesPrivateLinkPage() {
  const verify = useServerFn(verifyCaptchaAnswer);
  const loadCatalog = useServerFn(getLiveFilmCatalog);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaValue>({ token: "", answer: "" });
  const [captchaError, setCaptchaError] = useState<string | undefined>();
  const [unlocking, setUnlocking] = useState(false);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<Filter>("all");

  useEffect(() => {
    try {
      const grantedAt = Number(sessionStorage.getItem(ACCESS_KEY));
      setUnlocked(Number.isFinite(grantedAt) && Date.now() - grantedAt < ACCESS_MS);
    } catch {
      setUnlocked(false);
    } finally {
      setCheckingAccess(false);
    }
  }, []);

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

  async function unlock() {
    if (unlocking || !captcha.token || !captcha.answer.trim()) return;
    setUnlocking(true);
    setCaptchaError(undefined);
    try {
      await verify({ data: captcha });
      try { sessionStorage.setItem(ACCESS_KEY, String(Date.now())); } catch { /* optional */ }
      setUnlocked(true);
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

  if (checkingAccess) {
    return <main className="grid min-h-[100dvh] place-items-center bg-[#050607] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  }

  if (!unlocked) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#050607] px-4 text-white">
        <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0b0d10] p-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300"><ShieldCheck className="h-5 w-5" /></span>
            <div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-red-300">Accès par lien</p><h1 className="text-2xl font-semibold tracking-[-.04em]">Films et séries</h1></div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/55">Cette page n’est pas référencée dans le site public. Une vérification anti-robot est demandée avant d’ouvrir le catalogue.</p>
          <div className="mt-5 [&_.bg-muted\/30]:bg-white/[.03] [&_.bg-background]:bg-black/30 [&_.border-border]:border-white/10 [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-white/50">
            <Captcha value={captcha} onChange={setCaptcha} error={captchaError} />
          </div>
          <button type="button" onClick={() => void unlock()} disabled={unlocking || !captcha.answer.trim()} className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-red-500 px-4 font-semibold text-white disabled:opacity-40">
            {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ouvrir le catalogue"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#050607] px-4 py-7 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1450px]">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-300"><Film className="h-5 w-5" /><span className="font-mono text-[10px] uppercase tracking-[.18em]">Angel OS IA · catalogue privé par lien</span></div>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.055em] sm:text-5xl">Films et séries</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Catalogue alimenté côté serveur par TMDB. La clé API n’est jamais envoyée au navigateur.</p>
          </div>
          <form onSubmit={submitSearch} className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] p-2">
            <Search className="ml-2 h-4 w-4 shrink-0 text-white/35" />
            <input value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} placeholder="Titre d’un film ou d’une série…" className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-white/25" />
            <button type="submit" className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold">Rechercher</button>
          </form>
        </header>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {(["all", "movie", "tv"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setMediaType(value)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${mediaType === value ? "border-red-500/35 bg-red-500/15 text-red-200" : "border-white/10 bg-white/[.03] text-white/55"}`}>
              {value === "all" ? "Tout" : value === "movie" ? "Films" : "Séries"}
            </button>
          ))}
          {(isLoading || isFetching) ? <span className="ml-1 inline-flex items-center gap-1.5 text-xs text-white/35"><Loader2 className="h-3.5 w-3.5 animate-spin" />Actualisation TMDB</span> : null}
          <button type="button" onClick={() => void refetch()} className="ml-auto text-xs text-white/35 hover:text-white/70">Actualiser</button>
        </div>

        {!query && picks.length > 0 ? (
          <section className="mt-9">
            <h2 className="text-2xl font-semibold tracking-[-.04em]">À regarder aujourd’hui</h2>
            <p className="mt-1 text-xs text-white/35">Cinq propositions calculées à partir du catalogue disponible.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {picks.map(({ candidate }) => <MediaCard key={`pick-${candidate.id}`} item={candidate} />)}
            </div>
          </section>
        ) : null}

        <section className="mt-10 border-t border-white/10 pt-7">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-semibold tracking-[-.04em]">{query ? `Résultats pour « ${query} »` : "Catalogue"}</h2><p className="mt-1 text-xs text-white/35">{catalog.length} titre{catalog.length > 1 ? "s" : ""} affiché{catalog.length > 1 ? "s" : ""}</p></div></div>
          {data?.source === "unavailable" ? <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[.06] px-4 py-3 text-xs leading-5 text-amber-100/75">TMDB n’est pas joignable depuis le serveur pour le moment. Le petit catalogue local est utilisé temporairement.</div> : null}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {catalog.map((item) => <MediaCard key={item.id} item={item} />)}
          </div>
          {!catalog.length && !isLoading ? <p className="mt-8 text-sm text-white/45">Aucun résultat.</p> : null}
        </section>

        <footer className="mt-12 border-t border-white/10 py-6 text-[11px] leading-5 text-white/30">Métadonnées et visuels fournis par TMDB. Cette page est volontairement exclue de l’indexation publique.</footer>
      </div>
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
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold">{item.title}</h3>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/55"><span>{item.year}</span>{item.rating ? <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" />{item.rating.toFixed(1)}</span> : null}</div>
        </div>
      </div>
      <div className="p-3"><p className="line-clamp-1 text-[10px] font-medium text-red-200/70">{item.genreLabel}</p><p className="mt-1.5 line-clamp-3 text-xs leading-5 text-white/45">{item.pitch}</p></div>
    </article>
  );
}
