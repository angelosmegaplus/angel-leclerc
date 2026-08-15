import { useEffect, useRef, useState } from "react";
import { Loader2, Volume2 } from "lucide-react";

export const ADMIN_BOOT_PENDING_KEY = "angel-os:admin-boot-pending";

function hasPendingBoot() {
  try {
    return window.sessionStorage.getItem(ADMIN_BOOT_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

function consumePendingBoot() {
  try {
    window.sessionStorage.removeItem(ADMIN_BOOT_PENDING_KEY);
  } catch {
    /* stockage indisponible */
  }
}

export function AdminBootIntro() {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [visible, setVisible] = useState(true);
  const [shouldPlay, setShouldPlay] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!hasPendingBoot()) {
      setShouldPlay(false);
      setVisible(false);
      return;
    }
    consumePendingBoot();
    setShouldPlay(true);
  }, []);

  useEffect(() => {
    if (!visible || !shouldPlay) return;
    const video = ref.current;
    if (!video) return;

    video.currentTime = 0;
    video.muted = false;
    video.volume = 1;
    void video.play().catch(() => {
      video.muted = true;
      setBlocked(true);
      void video.play().catch(() => finish());
    });

    const startExit = window.setTimeout(() => setExiting(true), 8200);
    const finishTimer = window.setTimeout(() => setVisible(false), 8900);
    return () => {
      window.clearTimeout(startExit);
      window.clearTimeout(finishTimer);
    };
  }, [visible, shouldPlay]);

  const finish = () => {
    setExiting(true);
    window.setTimeout(() => setVisible(false), 450);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black" aria-label="Démarrage d'Angel OS">
      <div
        className={`absolute inset-0 flex items-center justify-center bg-black transition-[transform,filter,opacity,border-radius] duration-700 ease-[cubic-bezier(.72,0,.9,.35)] ${
          exiting
            ? "scale-x-[0.015] scale-y-[0.06] rounded-[50%] opacity-0 blur-md"
            : "scale-100 rounded-none opacity-100 blur-0"
        }`}
        style={{ transformOrigin: "50% 50%" }}
      >
        {shouldPlay ? (
          <video
            ref={ref}
            src="/angel-os/intro.mp4"
            autoPlay
            playsInline
            preload="auto"
            poster="/angel-os/logo.png"
            onLoadedData={() => setReady(true)}
            onCanPlay={() => setReady(true)}
            onPlaying={() => setReady(true)}
            onTimeUpdate={(event) => {
              const video = event.currentTarget;
              if (Number.isFinite(video.duration) && video.duration - video.currentTime <= 0.7) setExiting(true);
            }}
            onEnded={finish}
            onError={finish}
            className={`h-full w-full object-contain transition-all duration-500 ${ready ? "opacity-100 blur-0" : "opacity-0 blur-sm"}`}
          />
        ) : null}

        {!ready && shouldPlay ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
            <div className="relative grid h-24 w-24 place-items-center">
              <div className="absolute inset-0 animate-ping rounded-full border border-red-500/10" />
              <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-16 w-16 rounded-2xl object-cover shadow-[0_0_55px_rgba(239,68,68,.16)]" />
              <Loader2 className="absolute -bottom-7 h-4 w-4 animate-spin text-red-300" />
            </div>
            <p className="mt-11 font-mono text-[10px] font-semibold uppercase tracking-[.22em] text-red-300">Angel OS</p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[.18em] text-white/30">Initialisation du système</p>
          </div>
        ) : null}

        <div
          aria-hidden
          className={`pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-all duration-500 ${
            exiting ? "scale-[22] opacity-70 blur-sm" : "scale-0 opacity-0"
          }`}
        />
      </div>

      {blocked && !exiting ? (
        <button
          type="button"
          onClick={() => {
            if (ref.current) {
              ref.current.muted = false;
              ref.current.volume = 1;
              void ref.current.play();
            }
            setBlocked(false);
          }}
          className="absolute bottom-8 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/75 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md"
        >
          <Volume2 size={17} /> Activer le son
        </button>
      ) : null}
    </div>
  );
}
