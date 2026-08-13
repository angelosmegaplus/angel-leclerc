import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";

export function BootIntro({ done }: { done: () => void }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    void video.play().catch(() => {
      video.muted = true;
      setBlocked(true);
      void video.play().catch(() => undefined);
    });

    const startExit = window.setTimeout(() => setExiting(true), 8200);
    const finish = window.setTimeout(done, 8900);
    return () => {
      window.clearTimeout(startExit);
      window.clearTimeout(finish);
    };
  }, [done]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black">
      <div
        className={`absolute inset-0 flex items-center justify-center bg-black transition-[transform,filter,opacity,border-radius] duration-700 ease-[cubic-bezier(.72,0,.9,.35)] ${
          exiting
            ? "scale-x-[0.015] scale-y-[0.06] rounded-[50%] opacity-0 blur-md"
            : "scale-100 rounded-none opacity-100 blur-0"
        }`}
        style={{ transformOrigin: "50% 50%" }}
      >
        <video
          ref={ref}
          src="/angel-os/intro.mp4"
          autoPlay
          playsInline
          preload="metadata"
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            if (Number.isFinite(video.duration) && video.duration - video.currentTime <= 0.7) {
              setExiting(true);
            }
          }}
          onEnded={() => {
            setExiting(true);
            window.setTimeout(done, 450);
          }}
          className="h-full w-full object-contain"
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-all duration-500 ${
            exiting ? "scale-[22] opacity-70 blur-sm" : "scale-0 opacity-0"
          }`}
        />
      </div>

      {blocked && !exiting && (
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
          className="absolute bottom-8 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/75 px-5 py-3 text-sm font-semibold text-white"
        >
          <Volume2 size={17} /> Activer le son
        </button>
      )}
    </div>
  );
}
