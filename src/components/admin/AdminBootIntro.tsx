import { useEffect, useState } from "react";
import { Volume2, VolumeX, X } from "lucide-react";

const SEEN_KEY = "angel-os-intro-seen";

export function AdminBootIntro() {
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (window.sessionStorage.getItem(SEEN_KEY)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.sessionStorage.setItem(SEEN_KEY, "1");
      return;
    }
    setVisible(true);
    const timeout = window.setTimeout(() => {
      window.sessionStorage.setItem(SEEN_KEY, "1");
      setVisible(false);
    }, 8_000);
    return () => window.clearTimeout(timeout);
  }, []);

  const close = () => {
    window.sessionStorage.setItem(SEEN_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      <video
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
      <div className="absolute right-4 top-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMuted((value) => !value)}
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
