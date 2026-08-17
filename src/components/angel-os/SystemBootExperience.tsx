import { useEffect, useMemo, useState } from "react";
import { Cpu, Radio, ShieldCheck, Sparkles, Wifi } from "lucide-react";

const BOOT_STEPS = [
  "Synchronisation du noyau",
  "Connexion des services",
  "Initialisation Angel OS IA",
  "Interface prête",
];

export function SystemBootExperience({
  done,
  label = "Démarrage d'Angel OS",
}: {
  done: () => void;
  label?: string;
}) {
  const [progress, setProgress] = useState(4);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setProgress(100);
      const timer = window.setTimeout(done, 500);
      return () => window.clearTimeout(timer);
    }

    const startedAt = performance.now();
    const duration = 3200;
    const tick = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const linear = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - linear, 2.35);
      setProgress(Math.max(4, Math.round(eased * 100)));
      if (linear >= 0.88) setExiting(true);
      if (linear >= 1) {
        window.clearInterval(tick);
        window.setTimeout(done, 380);
      }
    }, 45);

    return () => window.clearInterval(tick);
  }, [done]);

  const stepIndex = useMemo(() => {
    if (progress < 30) return 0;
    if (progress < 58) return 1;
    if (progress < 84) return 2;
    return 3;
  }, [progress]);

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden bg-[#030507] text-white transition-all duration-500 ${
        exiting ? "scale-[1.035] opacity-0 blur-md" : "scale-100 opacity-100 blur-0"
      }`}
      aria-label={label}
      role="status"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(239,68,68,.19), transparent 20%), radial-gradient(circle at 20% 15%, rgba(56,189,248,.10), transparent 24%), radial-gradient(circle at 84% 78%, rgba(168,85,247,.09), transparent 26%), linear-gradient(180deg,#07090d 0%,#030507 72%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[.13]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage: "radial-gradient(circle at center, black 20%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(circle at center, black 20%, transparent 78%)",
        }}
      />

      <div aria-hidden className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] max-h-[90vw] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-400/10 animate-[spin_18s_linear_infinite]" />
      <div aria-hidden className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] max-h-[68vw] max-w-[68vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/10 animate-[spin_12s_linear_infinite_reverse]" />
      <div aria-hidden className="absolute left-1/2 top-1/2 h-[21rem] w-[21rem] max-h-[52vw] max-w-[52vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-400/20 shadow-[0_0_90px_rgba(239,68,68,.08)]" />

      <div className="relative z-10 flex h-[100dvh] flex-col items-center justify-center px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
        <div className="mb-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.19em] text-white/45 backdrop-blur-xl sm:text-[10px]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Secure boot · online
        </div>

        <div className="relative grid h-32 w-32 place-items-center sm:h-40 sm:w-40">
          <div className="absolute inset-0 rounded-[2.2rem] border border-red-400/15 bg-red-500/[.035] shadow-[0_0_80px_rgba(239,68,68,.13)] backdrop-blur-sm sm:rounded-[2.7rem]" />
          <div className="absolute inset-3 rounded-[1.8rem] border border-white/10 sm:rounded-[2.25rem]" />
          <img src="/angel-os/logo.png" alt="Logo Angel OS" className="relative h-20 w-20 rounded-[1.35rem] object-cover shadow-[0_18px_60px_rgba(0,0,0,.55)] sm:h-24 sm:w-24 sm:rounded-[1.6rem]" />
          <span className="absolute -right-2 top-8 h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,.9)]" />
          <span className="absolute -left-2 bottom-9 h-2 w-2 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,.9)]" />
        </div>

        <p className="mt-7 font-mono text-[10px] font-semibold uppercase tracking-[.34em] text-red-300 sm:text-xs">Angel OS</p>
        <h1 className="mt-2 text-center text-2xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">Système intelligent</h1>
        <p className="mt-2 min-h-5 text-center font-mono text-[10px] uppercase tracking-[.16em] text-white/40 sm:text-[11px]">{BOOT_STEPS[stepIndex]}</p>

        <div className="mt-8 w-full max-w-sm sm:max-w-md">
          <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[.13em] text-white/35">
            <span>Initialisation</span>
            <span className="text-white/60">{progress}%</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 via-red-300 to-white shadow-[0_0_18px_rgba(239,68,68,.55)] transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-7 grid grid-cols-4 gap-2 text-white/35">
          {[Cpu, Wifi, ShieldCheck, Radio].map((Icon, index) => {
            const active = progress >= 18 + index * 20;
            return (
              <span
                key={index}
                className={`grid h-10 w-10 place-items-center rounded-xl border transition-all duration-500 ${
                  active ? "border-red-400/25 bg-red-500/10 text-red-200 shadow-[0_0_24px_rgba(239,68,68,.07)]" : "border-white/8 bg-white/[.025]"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
            );
          })}
        </div>

        <div className={`absolute inset-x-0 bottom-7 flex justify-center transition-opacity duration-500 ${progress > 82 ? "opacity-100" : "opacity-0"}`}>
          <span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.18em] text-white/30">
            <Sparkles className="h-3.5 w-3.5 text-red-300" /> Interface prête
          </span>
        </div>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-300/60 to-transparent animate-pulse" />
    </div>
  );
}
