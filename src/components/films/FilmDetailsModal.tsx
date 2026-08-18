import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Brain, CheckCircle2, ExternalLink, Heart, Loader2, Play, Star, ThumbsDown, X } from "lucide-react";
import { getFilmDetails } from "@/lib/film-details.functions";
import { signalForCandidate, upsertTasteSignal } from "@/lib/film-taste.client";
import type { RecommendationCandidate, ViewingSignal } from "@/lib/film-recommendations";

export function FilmDetailsModal({
  item,
  signals,
  profileKey,
  onSignalsChange,
  onPlay,
  onClose,
}: {
  item: RecommendationCandidate;
  signals: ViewingSignal[];
  profileKey?: string | null;
  onSignalsChange: (signals: ViewingSignal[]) => void;
  onPlay?: (item: RecommendationCandidate) => void;
  onClose: () => void;
}) {
  const loadDetails = useServerFn(getFilmDetails);
  const previous = useMemo(() => signals.find((signal) => signal.candidateId === item.id), [signals, item.id]);
  const { data: details, isLoading } = useQuery({
    queryKey: ["film-details-v2", item.id],
    queryFn: () => loadDetails({ data: { candidateId: item.id, fallbackTitle: item.title } }),
    enabled: item.id.startsWith("tmdb-"),
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  function update(patch: Partial<ViewingSignal>) {
    const base = signalForCandidate(item, previous);
    const next: ViewingSignal = { ...base, ...patch, updatedAt: Date.now() };
    onSignalsChange(upsertTasteSignal(signals, next, profileKey));
  }

  const title = details?.title || item.title;
  const overview = details?.overview || item.pitch;
  const backdrop = details?.backdropUrl || item.backdropUrl || item.posterUrl;
  const genres = details?.genres?.join(" · ") || item.genreLabel;
  const cast = details?.cast?.length ? details.cast : item.people;
  const rating = details?.rating ?? item.rating;
  const runtime = details?.runtime || item.runtime;
  const director = details?.director || item.director;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/80 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <article className="relative max-h-[94dvh] w-full max-w-5xl overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#101014] shadow-2xl sm:rounded-[2rem]">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/65 text-white backdrop-blur hover:bg-black/85"><X className="h-5 w-5" /></button>

        <div className="relative min-h-[290px] overflow-hidden rounded-t-[2rem] sm:min-h-[360px]">
          {backdrop ? <img src={backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#101014] via-[#101014]/35 to-black/10" />
          <div className="relative flex min-h-[290px] items-end p-6 sm:min-h-[360px] sm:p-9">
            <div className="max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-red-300">{item.mediaType === "movie" ? "Film" : "Série"}</p>
              <h2 className="mt-1 text-4xl font-bold tracking-[-.055em] sm:text-6xl">{title}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/55">
                <span>{details?.year || item.year}</span>
                {runtime ? <><span>•</span><span>{runtime}</span></> : null}
                {rating ? <><span>•</span><span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-current text-amber-300" />{rating.toFixed(1)}</span></> : null}
              </div>
              {onPlay && item.id.startsWith("tmdb-") ? <button type="button" onClick={() => { onPlay(item); onClose(); }} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black"><Play className="h-4 w-4 fill-current" />Lecture dans Movix</button> : null}
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-6 pt-3 lg:grid-cols-[1fr_300px] lg:p-9 lg:pt-4">
          <div>
            <section>
              <h3 className="text-sm font-semibold text-white/90">Synopsis</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/70 sm:text-base sm:leading-8">{overview}</p>
              {details?.originalTitle && details.originalTitle !== title ? <p className="mt-4 text-xs text-white/35">Titre original : {details.originalTitle}</p> : null}
            </section>

            <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.035] p-5">
              <div className="flex items-center gap-2"><Brain className="h-4 w-4 text-violet-300" /><h3 className="font-semibold">Apprendre mes goûts</h3></div>
              <p className="mt-1 text-xs leading-5 text-white/40">Ces réponses sont enregistrées uniquement dans le profil cinéma actuellement actif.</p>
              <div className="mt-5 grid gap-4">
                <div><p className="text-xs font-semibold text-white/60">Tu l’as vu ?</p><div className="mt-2 flex flex-wrap gap-2"><Choice active={previous?.seen === true} onClick={() => update({ seen: true, completion: 1 })} icon={<CheckCircle2 className="h-4 w-4" />} label="Oui, vu" /><Choice active={previous?.seen === false} onClick={() => update({ seen: false, completion: 0 })} label="Pas encore" /></div></div>
                <div><p className="text-xs font-semibold text-white/60">Tu as aimé ?</p><div className="mt-2 flex flex-wrap gap-2"><Choice active={previous?.liked === true} onClick={() => update({ liked: true, rejected: false })} icon={<Heart className="h-4 w-4" />} label="J’ai aimé" /><Choice active={previous?.liked === false} onClick={() => update({ liked: false, rejected: true })} icon={<ThumbsDown className="h-4 w-4" />} label="Pas aimé" /></div></div>
                <div><p className="text-xs font-semibold text-white/60">C’est ton style ?</p><div className="mt-2 flex flex-wrap gap-2"><Choice active={previous?.styleFit === "yes"} onClick={() => update({ styleFit: "yes" })} label="Carrément" /><Choice active={previous?.styleFit === "mixed"} onClick={() => update({ styleFit: "mixed" })} label="Moyen" /><Choice active={previous?.styleFit === "no"} onClick={() => update({ styleFit: "no" })} label="Pas mon style" /></div></div>
                <div><p className="text-xs font-semibold text-white/60">Ta note</p><div className="mt-2 flex gap-1.5">{[1,2,3,4,5].map((value) => <button key={value} type="button" onClick={() => update({ rating: value })} className={`grid h-9 w-9 place-items-center rounded-lg border transition ${previous?.rating === value ? "border-amber-300 bg-amber-300 text-black" : "border-white/10 bg-white/[.03] text-white/45 hover:text-amber-300"}`} aria-label={`${value} sur 5`}><Star className="h-4 w-4 fill-current" /></button>)}</div></div>
              </div>
            </section>

            <section className="mt-8">
              <h3 className="text-sm font-semibold text-white/90">Où regarder</h3>
              {isLoading ? <div className="mt-3 inline-flex items-center gap-2 text-xs text-white/40"><Loader2 className="h-4 w-4 animate-spin" />Recherche des plateformes…</div> : null}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(details?.watchLinks ?? []).filter((link) => link.provider !== "tmdb" && link.provider !== "movix").map((link) => <a key={link.provider} href={link.url} target="_blank" rel="noreferrer" className={`flex min-h-12 items-center justify-between rounded-xl border px-4 text-sm font-semibold transition ${link.available ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/[.025] text-white/40"}`}><span className="inline-flex items-center gap-2"><ExternalLink className="h-4 w-4" />{link.label}</span><span className="text-[10px] uppercase tracking-wider">{link.available ? "Disponible" : "Rechercher"}</span></a>)}
              </div>
              {details?.providers?.length ? <p className="mt-3 text-[11px] leading-5 text-white/30">Disponibilités détectées en France via TMDB : {details.providers.join(", ")}.</p> : null}
            </section>
          </div>

          <aside className="space-y-5 text-xs"><InfoLine label="Genres" value={genres} />{director ? <InfoLine label="Réalisation" value={director} /> : null}{cast.length ? <InfoLine label="Avec" value={cast.slice(0, 8).join(", ")} /> : null}{details?.providers?.length ? <InfoLine label="Plateformes FR" value={details.providers.slice(0, 10).join(", ")} /> : null}</aside>
        </div>
      </article>
    </div>
  );
}

function Choice({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition ${active ? "border-white bg-white text-black" : "border-white/10 bg-white/[.03] text-white/55 hover:bg-white/[.07] hover:text-white"}`}>{icon}{label}</button>;
}
function InfoLine({ label, value }: { label: string; value: string }) { return <div><p className="font-semibold text-white/70">{label}</p><p className="mt-1 leading-5 text-white/40">{value}</p></div>; }
