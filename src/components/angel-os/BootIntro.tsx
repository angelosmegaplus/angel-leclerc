import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";

export function BootIntro({ done }: { done: () => void }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [blocked, setBlocked] = useState(false);

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
    const timer = window.setTimeout(done, 9000);
    return () => window.clearTimeout(timer);
  }, [done]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
      <video ref={ref} src="/angel-os/intro.mp4" autoPlay playsInline preload="auto" onEnded={done} className="h-full w-full object-contain" />
      {blocked && (
        <button type="button" onClick={() => {
          if (ref.current) {
            ref.current.muted = false;
            ref.current.volume = 1;
            void ref.current.play();
          }
          setBlocked(false);
        }} className="absolute bottom-8 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/75 px-5 py-3 text-sm font-semibold text-white">
          <Volume2 size={17} /> Activer le son
        </button>
      )}
      <motion.div aria-hidden className="pointer-events-none absolute inset-x-0 h-px bg-red-500/60" animate={{ top: ["15%", "85%", "15%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
    </div>
  );
}
