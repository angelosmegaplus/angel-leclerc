import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pause, Play, Radio, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchRadioPlaylist,
  formatDuration,
  kindLabel,
  type AudioItem,
} from "@/lib/audio";

/**
 * SKINGOMZ — lecteur de playlist audio (fichiers autorisés enregistrés dans le projet).
 * Ce n'est pas un flux en direct : les contenus s'enchaînent comme une petite playlist.
 */
export function RadioSkingomz() {
  const { data: playlist = [], isLoading } = useQuery({
    queryKey: ["radio-playlist"],
    queryFn: fetchRadioPlaylist,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  const track: AudioItem | undefined = playlist[index];

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
    setCurrent(0);
  }, [playlist.length]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.volume = muted ? 0 : volume;
  }, [volume, muted, track?.id]);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el || !track) return;
    if (el.paused) {
      try {
        await el.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const next = () => {
    if (playlist.length < 2) return;
    setCurrent(0);
    setIndex((i) => (i + 1) % playlist.length);
  };

  // Lorsque la piste change pendant une écoute, on enchaîne automatiquement.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !playing) return;
    el.play().catch(() => setPlaying(false));
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = useMemo(
    () => (duration > 0 ? (current / duration) * 100 : 0),
    [current, duration],
  );

  const offAir = !isLoading && playlist.length === 0;

  return (
    <section
      aria-labelledby="skingomz-title"
      className="mt-14 rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Radio className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2
            id="skingomz-title"
            className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            SKINGOMZ — La radio expérimentale
          </h2>
          <p className="text-xs text-muted-foreground">Playlist à la demande</p>
        </div>
        <span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          Projet expérimental
        </span>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Une expérience de webradio mêlant musique autorisée, créations audio, podcasts
        et formats éditoriaux.
      </p>

      {isLoading && (
        <p className="mt-5 text-sm text-muted-foreground">Chargement de la playlist…</p>
      )}

      {offAir && (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-background p-5 text-center">
          <p className="font-display text-sm font-bold text-foreground">Hors antenne</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aucun contenu n'est programmé pour le moment. Revenez bientôt.
          </p>
        </div>
      )}

      {track && (
        <div className="mt-5 rounded-xl border border-border bg-background p-4">
          <div className="flex items-start gap-4">
            {track.image_url ? (
              <img
                src={track.image_url}
                alt=""
                loading="lazy"
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                {kindLabel(track.kind)}
              </p>
              <p className="mt-1 truncate font-display text-base font-bold text-foreground">
                {track.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {[track.author, track.source_label].filter(Boolean).join(" · ") ||
                  "Source non précisée"}
              </p>
            </div>
          </div>

          <audio
            ref={audioRef}
            src={track.audio_url}
            preload="metadata"
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onEnded={() => {
              if (playlist.length > 1) next();
              else setPlaying(false);
            }}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
            className="sr-only"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="icon"
              onClick={toggle}
              aria-label={playing ? "Mettre en pause" : "Lire"}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={next}
              disabled={playlist.length < 2}
              aria-label="Contenu suivant"
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <div className="flex min-w-[180px] flex-1 items-center gap-2">
              <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                {formatDuration(current)}
              </span>
              <input
                type="range"
                min={0}
                max={Math.max(duration, 0.1)}
                step={0.1}
                value={Math.min(current, duration || 0)}
                aria-label="Progression de la lecture"
                onChange={(e) => {
                  const el = audioRef.current;
                  const v = Number(e.target.value);
                  if (el) el.currentTime = v;
                  setCurrent(v);
                }}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                style={{ backgroundSize: `${progress}% 100%` }}
              />
              <span className="w-11 shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {formatDuration(duration || track.duration_seconds)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Réactiver le son" : "Couper le son"}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                aria-label="Volume"
                onChange={(e) => {
                  setMuted(false);
                  setVolume(Number(e.target.value));
                }}
                className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              />
            </div>
          </div>

          {playlist.length > 1 && (
            <ol className="mt-4 space-y-1 border-t border-border pt-3">
              {playlist.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrent(0);
                      setIndex(i);
                    }}
                    aria-current={i === index ? "true" : undefined}
                    className={`w-full truncate rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                      i === index
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {i + 1}. {item.title}
                    {item.author ? ` — ${item.author}` : ""}
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
