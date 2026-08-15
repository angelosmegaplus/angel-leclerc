import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, ExternalLink, Loader2, Star } from "lucide-react";
import { motion, MotionConfig } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { FILM_CATALOG, coverFor, getFilmById } from "@/lib/film-catalog";
import type { RecommendationCandidate, ViewingSignal } from "@/lib/film-recommendations";

export const Route = createFileRoute("/admin-movix/$id")({
  head: () => ({ meta: [{ title: "Fiche film | Angel OS" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: FilmDetailPage,
});

const SIGNALS_KEY = "angel-os-film-series-signals-v2";
const POSTER_FALLBACK = `data:image/svg+xml,${encodeURIComponent('<svg width="500" height="750" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111318"/><circle cx="250" cy="320" r="56" fill="#20242c"/><path d="M235 290h30l25 45-25 45h-30l25-45z" fill="#424957"/><text x="50%" y="470" fill="#717784" font-size="28" font-family="sans-serif" text-anchor="middle">FILMS &amp; SERIES</text></svg>')}`;

function FilmDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const candidate = useMemo(() => getFilmById(id), [id]);
  const [signals, setSignals] = useState<ViewingSignal[]>([]);

  useEffect(() => { if (!loading && (!session || !isAdmin)) void navigate({ to: "/auth" }); }, [isAdmin, loading, navigate, session]);
  useEffect(() => { try { setSignals(JSON.parse(localStorage.getItem(SIGNALS_KEY) ?? "[]")); } catch { /* optional */ } }, []);

  const registerSignal = (item: RecommendationCandidate, patch: Partial<ViewingSignal>, replaceAfter = false) => {
    const existing = signals.find((signal) => signal.candidateId === item.id);
    const nextSignal: ViewingSignal = { candidateId: item.id, mediaType: item.mediaType, genreIds: item.genreIds, keywords: item.keywords, people: item.people, director: item.director, year: item.year, completion: existing?.completion ?? 0, liked: existing?.liked, rejected: existing?.rejected, ...patch };
    const next = [nextSignal, ...signals.filter((signal) => signal.candidateId !== item.id)];
    setSignals(next);
    try { localStorage.setItem(SIGNALS_KEY, JSON.stringify(next)); } catch { /* optional */ }
    if (replaceAfter) window.location.href = "/admin-movix";
  };

  const related = useMemo(() => {
    if (!candidate) return [];
    return FILM_CATALOG
      .filter((item) => item.id !== candidate.id)
      .map((item) => ({ item, overlap: item.genreIds.filter((genre) => candidate.genreIds.includes(genre)).length + item.keywords.filter((keyword) => candidate.keywords.includes(keyword)).length }))
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 4)
      .map(({ item }) => item);
  }, [candidate]);

  if (loading || !session || !isAdmin) return <main className="grid min-h-screen place-items-center bg-[#050607] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  if (!candidate) return <main className="grid min-h-screen place-items-center bg-[#050607] p-6 text-white"><div className="text-center"><h1 className="text-2xl font-semibold">Titre introuvable</h1><a href="/admin-movix" className="mt-4 inline-block text-sm text-white/60">Retour à la sélection</a></div></main>;

  return <MotionConfig reducedMotion="user">
    <main className="min-h-screen bg-[#050607] text-white">
      <section className="relative min-h-[68vh] overflow-hidden border-b border-white/10">
        <img src={candidate.backdropUrl || coverFor(candidate)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = POSTER_FALLBACK; }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050607] via-[#050607]/88 to-[#050607]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050607] via-transparent to-black/45" />

        <div className="relative mx-auto flex min-h-[68vh] max-w-[1280px] items-end px-4 py-8 sm:px-8 lg:px-10">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full">
            <a href="/admin-movix" className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/80 backdrop-blur"><ArrowLeft className="h-4 w-4" /> Retour</a>
            <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-end">
              <img src={coverFor(candidate)} alt={`Affiche de ${candidate.title}`} className="hidden aspect-[2/3] w-full rounded-xl border border-white/10 object-cover shadow-2xl md:block" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = POSTER_FALLBACK; }} />
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/55"><span>{candidate.mediaType === "movie" ? "Film" : "Série"}</span><span>•</span><span>{candidate.year}</span><span>•</span><span>{candidate.runtime || "Durée non renseignée"}</span><span>•</span><span>{candidate.genreLabel}</span></div>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-.055em] sm:text-6xl">{candidate.title}</h1>
                {candidate.originalTitle && candidate.originalTitle !== candidate.title ? <p className="mt-2 text-sm text-white/40">Titre original : {candidate.originalTitle}</p> : null}
                <div className="mt-4 flex flex-wrap items-center gap-3">{candidate.rating ? <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm"><Star className="h-4 w-4 text-yellow-400" fill="currentColor" /> {candidate.rating.toFixed(1)}</span> : null}<span className="rounded-full bg-red-500/15 px-3 py-1.5 text-sm text-red-200">Recommandé pour ton profil</span></div>
                <p className="mt-5 max-w-3xl text-base leading-7 text-white/75 sm:text-lg">{candidate.pitch}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-9">
            <section><h2 className="text-xl font-semibold">À propos</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-white/[.035] p-4"><p className="text-xs uppercase tracking-wider text-white/35">Réalisation</p><p className="mt-2 text-sm text-white/80">{candidate.director || "—"}</p></div><div className="rounded-xl border border-white/10 bg-white/[.035] p-4"><p className="text-xs uppercase tracking-wider text-white/35">Distribution principale</p><p className="mt-2 text-sm leading-6 text-white/80">{candidate.people.join(" · ")}</p></div></div></section>

            <section><h2 className="text-xl font-semibold">Pourquoi cette recommandation</h2><div className="mt-4 flex flex-wrap gap-2">{candidate.keywords.map((keyword) => <span key={keyword} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs text-white/60">{keyword.replaceAll("_", " ")}</span>)}</div></section>

            {related.length ? <section><h2 className="text-xl font-semibold">Titres proches</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{related.map((item, index) => <motion.a key={item.id} href={`/admin-movix/${item.id}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="group overflow-hidden rounded-xl border border-white/10 bg-white/[.03] hover:border-white/20"><div className="relative aspect-[2/3]"><img src={coverFor(item)} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = POSTER_FALLBACK; }} /><div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" /><div className="absolute inset-x-0 bottom-0 p-3"><p className="line-clamp-2 text-sm font-semibold">{item.title}</p><p className="mt-1 text-[11px] text-white/55">{item.year}</p></div></div></motion.a>)}</div></section> : null}
          </div>

          <aside className="h-fit rounded-2xl border border-white/10 bg-white/[.035] p-4 lg:sticky lg:top-5">
            <h2 className="text-base font-semibold">Ton avis</h2><p className="mt-1 text-xs text-white/40">Comme dans Movix, ces signaux servent au prochain classement. « Déjà vu » remplace immédiatement le titre dans la sélection.</p>
            <div className="mt-4 space-y-2">
              <button type="button" onClick={() => registerSignal(candidate, { completion: 0.5, liked: true, rejected: false })} className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-3 text-left text-sm hover:bg-white/[.08]"><span className="grid h-5 w-5 place-items-center rounded-md border border-white/20"><Check className="h-3 w-3" /></span>J’ai aimé</button>
              <button type="button" onClick={() => registerSignal(candidate, { completion: 0.5, liked: false, rejected: true }, true)} className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-3 text-left text-sm hover:bg-white/[.08]"><span className="grid h-5 w-5 place-items-center rounded-md border border-white/20"><Check className="h-3 w-3" /></span>Je n’ai pas aimé</button>
              <button type="button" onClick={() => registerSignal(candidate, { completion: 1, rejected: false }, true)} className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-3 text-left text-sm hover:bg-white/[.08]"><span className="grid h-5 w-5 place-items-center rounded-md border border-white/20"><Check className="h-3 w-3" /></span>Je l’ai déjà vu</button>
            </div>
            <a href={`https://www.justwatch.com/fr/recherche?q=${encodeURIComponent(candidate.title)}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-black">Où le regarder légalement ? <ExternalLink className="h-4 w-4" /></a>
          </aside>
        </div>
        <footer className="mt-10 border-t border-white/10 py-5 text-[11px] leading-relaxed text-white/30">Interface et patterns adaptés de MovixOpenSource (movixcorp), sous licence CC BY-NC 4.0. Les fonctions de lecture/proxy du projet source ne sont pas intégrées.</footer>
      </div>
    </main>
  </MotionConfig>;
}
