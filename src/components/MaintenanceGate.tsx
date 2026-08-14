import { useEffect, useState, type ReactNode } from "react";
import { Wrench } from "lucide-react";

type SiteStatus = {
  maintenance?: boolean;
  reason?: string;
};

export function MaintenanceGate({ children, bypass = false }: { children: ReactNode; bypass?: boolean }) {
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    if (bypass) {
      setMaintenance(false);
      return;
    }

    let cancelled = false;

    const checkStatus = async () => {
      try {
        const response = await fetch("/system-status", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) return;

        const status = (await response.json()) as SiteStatus;
        if (!cancelled) setMaintenance(Boolean(status.maintenance));
      } catch {
        // Fail open: losing the status endpoint must never make the site inaccessible.
      }
    };

    void checkStatus();
    const interval = window.setInterval(checkStatus, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [bypass]);

  if (!maintenance || bypass) return <>{children}</>;

  return (
    <main className="fixed inset-0 z-[99999] flex min-h-screen items-center justify-center overflow-hidden bg-[#080808] px-6 text-white">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.16),transparent_45%)]" />
      <section className="relative mx-auto w-full max-w-xl text-center">
        <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/5 shadow-2xl backdrop-blur">
          <Wrench className="h-7 w-7 animate-[spin_5s_linear_infinite]" aria-hidden="true" />
        </div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/45">Angel OS · maintenance automatique</p>
        <h1 className="font-[Manrope] text-3xl font-extrabold tracking-tight sm:text-5xl">Mise à jour en cours</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-white/60 sm:text-base">
          Une nouvelle version de angel-leclerc.fr est en cours de déploiement. Le site reviendra automatiquement dès que la mise à jour sera terminée.
        </p>
        <div className="mx-auto mt-8 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-[maintenance-progress_1.4s_ease-in-out_infinite] rounded-full bg-white/80" />
        </div>
        <p className="mt-5 text-xs text-white/35">Aucune action n’est nécessaire.</p>
      </section>
      <style>{`
        @keyframes maintenance-progress {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
      `}</style>
    </main>
  );
}
