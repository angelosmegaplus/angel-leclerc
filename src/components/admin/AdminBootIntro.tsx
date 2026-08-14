import { useEffect, useRef, useState } from "react";
import { Loader2, Volume2 } from "lucide-react";
import { isStandalone } from "@/lib/pwa";

const BOOT_KEY = "angel-os:boot-played-this-session";

function hasPlayedThisSession() {
  try {
    return window.sessionStorage.getItem(BOOT_KEY) === "1";
  } catch {
    return false;
  }
}

function markPlayedThisSession() {
  try {
    window.sessionStorage.setItem(BOOT_KEY, "1");
  } catch {
    /* stockage indisponible */
  }
}

export function AdminBootIntro() {
  const [visible, setVisible] = useState(true);
  const [shouldPlay, setShouldPlay] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isStandalone() || hasPlayedThisSession()) {
      setShouldPlay(false);
      setVisible(false);
      return;
    }

    markPlayedThisSession();
    setShouldPlay(true);
  }, []);

  useEffect(() => {
    if (!visible || !shouldPlay) return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    const start = async () => {
      if (cancelled) return;
      video.currentTime = 0;
      video.volume = 1;
      video.muted = false;

      try {
        await video.play();
        if (!cancelled) setSoundBlocked(false);
      } catch {
        video.muted = true;
        try {
          await video.play();
          if (!cancelled) setSoundBlocked(true);
        } catch {
          if (!cancelled) finish();
        }
      }
    };

    void start();
    return () => {
      cancelled = true;
    };
  }, [visible, shouldPlay]);

  const finish = () => {
    setLeaving(true);
    window.setTimeout(() => setVisible(false), 420);
  };

  const unlockSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    void video.play().then(() => setSoundBlocked(false)).catch(() => undefined);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      aria-label="Démarrage d'Angel OS"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(34,211,238,.10), transparent 45%),linear-gradient(rgba(34,211,238,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.06) 1px,transparent 1px)",
          backgroundSize: "100% 100%,32px 32px,32px 32px",
          maskImage: "radial-gradient(circle at center, black, transparent 84%)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(transparent_0%,rgba(34,211,238,.025)_50%,transparent_100%)] bg-[length:100%_7px] opacity-50" />

      {shouldPlay && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          preload="auto"
          muted={false}
          poster="/angel-os/logo.png"
          onLoadedData={() => setVideoReady(true)}
          onCanPlay={() => setVideoReady(true)}
          onPlaying={() => setVideoReady(true)}
          onEnded={finish}
          onError={finish}
          className={`relative z-10 h-full w-full object-contain transition-all duration-700 ${
            videoReady ? "scale-100 opacity-100 blur-0" : "scale-[1.015] opacity-0 blur-sm"
          }`}
        >
          <source src="/angel-os/intro.mp4" type="video/mp4" />
        </video>
      )}

      {shouldPlay && !videoReady && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full border border-cyan-300/10" />
            <div className="absolute inset-2 rounded-full border border-cyan-300/15 shadow-[0_0_45px_rgba(34,211,238,.12)]" />
            <Loader2 className="h-5 w-5 animate-spin text-cyan-200/90" />
          </div>
          <div className="mt-5 font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-cyan-100/70">
            Angel OS
          </div>
          <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
            Initialisation du système
          </div>
          <div className="mt-5 h-px w-28 overflow-hidden bg-white/10">
            <div className="h-full w-1/2 animate-[pulse_1s_ease-in-out_infinite] bg-cyan-200/60" />
          </div>
        </div>
      )}

      {soundBlocked && videoReady && (
        <button
          type="button"
          onClick={unlockSound}
          className="absolute bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-2 text-white/70 backdrop-blur-md transition hover:bg-black/75 hover:text-white"
          aria-label="Activer le son du générique"
        >
          <Volume2 className="h-4 w-4 text-cyan-200" />
          <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Activer le son</span>
        </button>
      )}
    </div>
  );
}
