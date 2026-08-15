import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, ExternalLink, Loader2, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { coverFor, getFilmById } from "@/lib/film-catalog";
import type { RecommendationCandidate, ViewingSignal } from "@/lib/film-recommendations";

export const Route = createFileRoute("/admin-movix/$id")({
  head: () => ({ meta: [{ title: "Fiche film | Angel OS" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: FilmDetailPage,
});

const SIGNALS_KEY = "angel-os-film-series-signals-v2";

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
    const nextSignal: ViewingSignal = {
      candidateId: item.id,
      mediaType: item.mediaType,
      genreIds: item.genreIds,
      keywords: item.keywords,
      people: item.people,
      director: item.director,
      year: item.year,
      completion: existing?.completion ?? 0,
      liked: existing?.liked,
      rejected: existing?.rejected,
      ...patch,
    };
    const next = [nextSignal, ...signals.filter((signal) => signal.candidateId !== item.id)];
    setSignals(next);
    try { localStorage.setItem(SIGNALS_KEY, JSON.stringify(next)); } catch { /* optional */ }
    if (replaceAfter) window.location.href = "/admin-movix";
  };

  if (loading || !session || !isAdmin) return <main className="grid min-h-screen place-items-center bg-[#050607] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  if (!candidate) return <main className="grid min-h-screen place-items-center bg-[#050607] p-6 text-white"><div className="text-center"><h1 className="text-2xl font-semibold">Titre introuvable</h1><a href="/admin-movix" className="mt-4 inline-block text-sm text-white/60">Retour à la sélection</a></div></main>;

  return (
    <main className="min-h-screen bg-[#050607] text-white">
      <section className="relative min-h-[58vh] overflow-hidden border-b border-white/10">
        <img src={candidate.backdropUrl || coverFor(candidate)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050607] via-[#050607]/85 to-[#050607]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050607] via-transparent to-black/30" />

        <div className="relative mx-auto flex min-h-[58vh] max-w-[1280px] items-end px-4 py-8 sm:px-8 lg:px-10">
          <div className="w-full">
            <a href="/admin-movix" className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm text-white/80 backdrop-blur"><ArrowLeft className="h-4 w-4" /> Retour</a>
            <div className="grid gap-7 md:grid-cols-[220px_1fr] md:items-end">
              <img src={coverFor(candidate)} alt={`Affiche de ${candidate.title}`} className="hidden aspect-[2/3] w-full rounded-2xl border border-white/10 object-cover shadow-2xl md:block" />
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/55"><span>{candidate.year}</span><span>•</span><span>{candidate.runtime || (candidate.mediaType === "movie" ? "Film" : "Série")}</span><span>•</span><span>{candidate.genreLabel}</span>{candidate.certification && <><span>•</span><span>{candidate.certification}</span></>}</div>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-.055em] sm:text-6xl">{candidate.title}</h1>
                {candidate.originalTitle && candidate.originalTitle !== candidate.title && <p className="mt-2 text-sm text-white/40">Titre original : {candidate.originalTitle}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-3">{candidate.rating && <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm"><Star className="h-4 w-4 fill-current" /> {candidate.rating.toFixed(1)}</span>}<span className="rounded-full bg-red-500/15 px-3 py-1.5 text-sm text-red-200">Recommandé pour ton profil</span></div>
                <p className="mt-5 max-w-3xl text-base leading-7 text-white/75 sm:text-lg">{candidate.pitch}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-7 lg:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold">À propos</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><p className="text-xs uppercase tracking-wider text-white/35">Réalisation</p><p className="mt-2 text-sm text-white/80">{candidate.director || "—"}</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><p className="text-xs uppercase tracking-wider text-white/35">Distribution principale</p><p className="mt-2 text-sm leading-6 text-white/80">{candidate.people.join(" · ")}</p></div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Pourquoi Angel OS te le recommande</h2>
              <div className="mt-4 flex flex-wrap gap-2">{candidate.keywords.map((keyword) => <span key={keyword} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs text-white/60">{keyword.replaceAll("_", " ")}</span>)}</div>
            </section>
          </div>

          <aside className="h-fit rounded-[1.6rem] border border-white/10 bg-white/[.035] p-4">
            <h2 className="text-base font-semibold">Tu l’as déjà vu ?</h2>
            <p className="mt-1 text-xs text-white/40">Tes réponses servent directement aux prochaines recommandations.</p>
            <div className="mt-4 space-y-2">
              <button type="button" onClick={() => registerSignal(candidate, { completion: 0.5, liked: true, rejected: false })} className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-3 text-left text-sm"><span className="grid h-5 w-5 place-items-center rounded-md border border-white/20"><Check className="h-3 w-3" /></span>J’ai aimé</button>
              <button type="button" onClick={() => registerSignal(candidate, { completion: 0.5, liked: false, rejected: true }, true)} className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-3 text-left text-sm"><span className="grid h-5 w-5 place-items-center rounded-md border border-white/20"><Check className="h-3 w-3" /></span>Je n’ai pas aimé</button>
              <button type="button" onClick={() => registerSignal(candidate, { completion: 1, rejected: false }, true)} className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-3 text-left text-sm"><span className="grid h-5 w-5 place-items-center rounded-md border border-white/20"><Check className="h-3 w-3" /></span>Je l’ai déjà vu</button>
            </div>
            <a href={`https://www.justwatch.com/fr/recherche?q=${encodeURIComponent(candidate.title)}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-black">Où le regarder ? <ExternalLink className="h-4 w-4" /></a>
          </aside>
        </div>
      </div>
    </main>
  );
}
