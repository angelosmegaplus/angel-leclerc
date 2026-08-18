import { useEffect, useState } from "react";

export function SystemBootExperience({
  done,
  label = "Démarrage d'Angel OS",
}: {
  done: () => void;
  label?: string;
}) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const timer = window.setTimeout(done, 500);
      return () => window.clearTimeout(timer);
    }

    const exitTimer = window.setTimeout(() => setExiting(true), 3000);
    const doneTimer = window.setTimeout(done, 3300);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [done]);

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden bg-black text-white transition-opacity duration-300 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
      aria-label={label}
      role="status"
    >
      <div className="flex h-[100dvh] flex-col items-center justify-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
        <div className="-mt-8 flex items-center gap-4 sm:gap-5">
          <img
            src="/angel-os/logo.png"
            alt="Logo Angel OS"
            className="h-[66px] w-[66px] object-contain sm:h-[78px] sm:w-[78px]"
          />
          <div className="leading-none">
            <div className="flex items-end gap-1.5">
              <span className="text-[38px] font-semibold tracking-[-0.055em] text-white sm:text-[52px]">Angel</span>
              <span className="pb-1 text-[26px] font-light italic tracking-[-0.04em] text-[#f58220] sm:text-[34px]">OS</span>
            </div>
            <p className="mt-1 text-[10px] font-normal tracking-[0.02em] text-white/75 sm:text-[11px]">
              Personal operating system
            </p>
          </div>
        </div>

        <div className="mt-10 w-[162px] sm:mt-12 sm:w-[190px]">
          <div className="relative h-[13px] overflow-hidden rounded-[2px] border border-[#4a4a4a] bg-[#111] p-[2px] shadow-[inset_0_0_0_1px_#080808]">
            <div className="absolute inset-y-[2px] flex w-[78px] animate-[angelXpLoad_1.05s_linear_infinite] gap-[2px]">
              <span className="h-full w-6 shrink-0 rounded-[1px] bg-gradient-to-r from-[#1b4fb8] via-[#5b9bff] to-[#1f5dd5]" />
              <span className="h-full w-6 shrink-0 rounded-[1px] bg-gradient-to-r from-[#1b4fb8] via-[#5b9bff] to-[#1f5dd5]" />
              <span className="h-full w-6 shrink-0 rounded-[1px] bg-gradient-to-r from-[#1b4fb8] via-[#5b9bff] to-[#1f5dd5]" />
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-7 flex items-end justify-between px-7 text-[9px] text-white/60 sm:px-10 sm:text-[10px]">
          <span>Copyright © 2026 Angel OS</span>
          <span className="text-right">Angel Leclerc</span>
        </div>
      </div>

      <style>{`
        @keyframes angelXpLoad {
          0% { transform: translateX(-82px); }
          100% { transform: translateX(194px); }
        }
      `}</style>
    </div>
  );
}
