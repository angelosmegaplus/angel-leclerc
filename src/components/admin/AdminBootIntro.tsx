import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, X } from "lucide-react";

/** Dernière présence dans Angel OS (ms). L'intro rejoue après 20 min d'absence. */
const LAST_SEEN_KEY = "angel-os-last-seen";
/** Préférence explicite de coupure du son ("1" = muet). */
const MUTE_PREF_KEY = "angel-os-intro-muted";
const IDLE_MS = 20 * 60 * 1000;

function markPresence() {
  try {
    window.localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
  } catch {
    /* stockage indisponible */
  }
}

export function AdminBootIntro() {
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Décide de jouer l'intro, puis entretient l'horodatage de présence.
  useEffect(() => {
    let last = 0;
    let prefMuted = false;
    try {
      last = Number(window.localStorage.getItem(LAST_SEEN_KEY) ?? 0);
      prefMuted = window.localStorage.getItem(MUTE_PREF_KEY) === "1";
    } catch {
      /* stockage indisponible */
    }
    setMuted(prefMuted);
    markPresence();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldPlay = !reduced && Date.now() - last > IDLE_MS;
    if (shouldPlay) setVisible(true);

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

  // Son actif par défaut : si le navigateur bloque, on réactive à la première interaction.
  useEffect(() => {
    if (!visible) return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    const tryLoud = async () => {
      if (cancelled || muted) return;
      video.muted = false;
      video.volume = 1;
      try {
        await video.play();
      } catch {
        // Autoplay sonore refusé : on démarre en silence et on rétablit au 1er geste.
        video.muted = true;
        try {
          await video.play();
        } catch {
          /* lecture impossible */
        }
      }
    };
    void tryLoud();

    const unlock = () => {
      if (cancelled || muted) return;
      video.muted = false;
      video.volume = 1;
      void video.play().catch(() => {});
    };
    const opts = { once: true, capture: true } as const;
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    window.addEventListener("touchstart", unlock, opts);
    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      window.removeEventListener("touchstart", unlock, true);
    };
  }, [visible, muted]);

  useEffect(() => {
    if (!visible) return;
    const timeout = window.setTimeout(() => setVisible(false), 12_000);
    return () => window.clearTimeout(timeout);
  }, [visible]);

  const close = () => {
    markPresence();
    setVisible(false);
  };

  const toggleMute = () => {
    setMuted((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(MUTE_PREF_KEY, next ? "1" : "0");
      } catch {
        /* stockage indisponible */
      }
      const video = videoRef.current;
      if (video) {
        video.muted = next;
        if (!next) video.volume = 1;
      }
      return next;
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex animate-in fade-in items-center justify-center bg-black duration-500">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        poster="/angel-os/logo.png"
        onEnded={close}
        onError={close}
        className="h-full w-full object-contain"
      >
        <source src="/angel-os/intro.mp4" type="video/mp4" />
      </video>
      <div
        className="absolute right-4 flex gap-2"
        style={{ top: "calc(1rem + env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Activer le son" : "Couper le son"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={close}
          aria-label="Passer l'introduction"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 text-sm font-medium text-white backdrop-blur"
        >
          <X className="h-4 w-4" /> Passer
        </button>
      </div>
    </div>
  );
}
