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
      const timer = window.setTimeout(done, 450);
      return () => window.clearTimeout(timer);
    }

    const exitTimer = window.setTimeout(() => setExiting(true), 3150);
    const doneTimer = window.setTimeout(done, 3650);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [done]);

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden bg-[#071a4b] text-white transition-all duration-500 ${
        exiting ? "scale-[1.025] opacity-0 blur-sm" : "scale-100 opacity-100 blur-0"
      }`}
      aria-label={label}
      role="status"
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 44%, rgba(63,139,255,.34) 0%, rgba(18,68,157,.22) 26%, transparent 58%), linear-gradient(145deg,#061640 0%,#0a2c75 52%,#06183f 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[.16]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black, transparent 72%)",
        }}
      />
      <div aria-hidden className="absolute left-1/2 top-[43%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/10 blur-[80px] sm:h-96 sm:w-96" />

      <div className="relative z-10 flex h-[100dvh] flex-col items-center justify-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative grid h-[76px] w-[76px] place-items-center sm:h-[92px] sm:w-[92px]">
            <div className="absolute inset-0 rounded-[1.6rem] bg-white/[.07] shadow-[0_0_55px_rgba(91,163,255,.25)] ring-1 ring-white/10 backdrop-blur-sm sm:rounded-[1.9rem]" />
            <img
              src="/angel-os/logo.png"
              alt="Logo Angel OS"
              className="relative h-[62px] w-[62px] rounded-[1.25rem] object-cover shadow-[0_12px_36px_rgba(0,0,0,.35)] sm:h-[74px] sm:w-[74px] sm:rounded-[1.45rem]"
            />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[.34em] text-blue-200/65 sm:text-xs">Angel</p>
            <h1 className="mt-0.5 text-4xl font-light tracking-[-.055em] text-white sm:text-6xl">
              OS
            </h1>
            <p className="mt-1 text-[9px] font-medium uppercase tracking-[.2em] text-white/40 sm:text-[10px]">
              Intelligence system
            </p>
          </div>
        </div>

        <div className="mt-11 w-[172px] sm:mt-14 sm:w-[210px]">
          <div className="relative h-[11px] overflow-hidden rounded-[4px] border border-white/20 bg-[#03102f]/75 p-[2px] shadow-[inset_0_1px_4px_rgba(0,0,0,.55),0_0_20px_rgba(59,130,246,.12)]">
            <div className="absolute inset-y-[2px] flex w-[92px] animate-[angelXpLoad_1.05s_linear_infinite] gap-[3px]">
              <span className="h-full w-7 shrink-0 rounded-[2px] bg-gradient-to-b from-[#7db5ff] via-[#2e7ee8] to-[#1451b6] shadow-[0_0_7px_rgba(96,165,250,.6)]" />
              <span className="h-full w-7 shrink-0 rounded-[2px] bg-gradient-to-b from-[#7db5ff] via-[#2e7ee8] to-[#1451b6] shadow-[0_0_7px_rgba(96,165,250,.6)]" />
              <span className="h-full w-7 shrink-0 rounded-[2px] bg-gradient-to-b from-[#7db5ff] via-[#2e7ee8] to-[#1451b6] shadow-[0_0_7px_rgba(96,165,250,.6)]" />
            </div>
          </div>
          <p className="mt-4 text-center text-[9px] font-medium uppercase tracking-[.22em] text-blue-100/45 sm:text-[10px]">
            Démarrage du système
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-7 text-center text-[8px] uppercase tracking-[.22em] text-white/25 sm:text-[9px]">
          Angel OS · système intelligent
        </div>
      </div>

      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-[#27a34a] via-[#77d45c] to-[#27a34a] opacity-80 shadow-[0_-2px_12px_rgba(74,222,128,.25)]" />
      <style>{`
        @keyframes angelXpLoad {
          0% { transform: translateX(-96px); }
          100% { transform: translateX(214px); }
        }
      `}</style>
    </div>
  );
}
