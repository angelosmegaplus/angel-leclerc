import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";

/** Dernière présence dans Angel OS (ms). L'intro navigateur rejoue après 20 min d'absence. */
const LAST_SEEN_KEY = "angel-os-last-seen";
const IDLE_MS = 20 * 60 * 1000;

function markPresence() {
  try {
    window.localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
  } catch {
    /* stockage indisponible */
  }
}

function isStandaloneApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function AdminBootIntro() {
  const [visible, setVisible] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let last = 0;
    try {
      last = Number(window.localStorage.getItem(LAST_SEEN_KEY) ?? 0);
    } catch {
      /* stockage indisponible */
    }

    const standalone = isStandaloneApp();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // En application installée, le générique est systématique à chaque lancement.
    // Dans le navigateur, on conserve le comportement discret historique.
    const shouldPlay = standalone || (!reduced && Date.now() - last > IDLE_MS);
    if (shouldPlay) setVisible(true);
    markPresence();

    const beat = window.setInterval(markPresence, 60_000);
    const onHide = () => markPresence();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      window.clearInterval(beat);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      markPresence();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    const playWithSound = async () => {
      if (cancelled) return;
      video.muted = false;
      video.volume = 1;
      try {
        await video.play();
        setSoundBlocked(false);
      } catch {
        // Certains moteurs mobiles exigent un geste utilisateur pour autoriser l'audio.
        // On reste sur l'écran d'introduction : aucune possibilité de passer le générique.
        setSoundBlocked(true);
      }
    };

    void playWithSound();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const finish = () => {
    markPresence();
    setVisible(false);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.08) 1px,transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(circle at center, black, transparent 82%)",
        }}
      />

      <video
        ref={videoRef}
        autoPlay
        playsInline
        preload="auto"
        muted={false}
        poster="/angel-os/logo.png"
        onEnded={finish}
        onError={finish}
        className="relative z-10 h-full w-full object-contain"
      >
        <source src="/angel-os/intro.mp4" type="video/mp4" />
      </video>

      {soundBlocked && (
        <button
          type="button"
          onClick={unlockSound}
          className="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center gap-4 bg-black/92 text-white"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_45px_rgba(34,211,238,.18)]">
            <Volume2 className="h-7 w-7 text-cyan-300" />
          </span>
          <span className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">
            Toucher pour démarrer Angel OS avec le son
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
            boot.audio.permission_required
          </span>
        </button>
      )}
    </div>
  );
}
