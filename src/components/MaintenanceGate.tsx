import type { ReactNode } from "react";

const TEMPORARY_SITE_URL = "https://angel-leclerc.lovable.app";

function isMaintenanceEnabled() {
  const envEnabled = import.meta.env.VITE_MAINTENANCE_MODE === "true";

  if (typeof window === "undefined") {
    return envEnabled;
  }

  const params = new URLSearchParams(window.location.search);
  const previewEnabled = params.get("maintenance") === "1";

  return envEnabled || previewEnabled;
}

function MaintenancePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-5 text-foreground">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl motion-safe:animate-pulse" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-xl items-center justify-center">
        <section className="w-full text-center motion-safe:animate-[fadeIn_.55s_ease-out]">
          <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <div className="h-7 w-7 rounded-full border-[3px] border-primary/20 border-t-primary motion-safe:animate-spin" />
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Maintenance en cours
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            On améliore le site.
          </h1>

          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-muted-foreground">
            Angel-leclerc.fr revient bientôt.
          </p>

          <a
            href={TEMPORARY_SITE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
          >
            Voir le site temporaire →
          </a>

          <p className="mt-4 text-xs text-muted-foreground">
            Version de secours · elle peut contenir des bugs.
          </p>
        </section>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}

export function MaintenanceGate({
  children,
  bypass = false,
}: {
  children: ReactNode;
  bypass?: boolean;
}) {
  if (bypass || !isMaintenanceEnabled()) {
    return <>{children}</>;
  }

  return <MaintenancePage />;
}
