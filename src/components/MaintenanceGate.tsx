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
    <main className="min-h-screen bg-background px-5 py-10 text-foreground">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-3xl items-center justify-center">
        <section className="w-full rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Maintenance en cours
          </div>

          <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
            Angel-leclerc.fr évolue en ce moment.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Une modification importante est en cours. Le site principal est temporairement placé en maintenance afin d’éviter de vous afficher une version incomplète ou instable.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-muted/50 p-5">
            <h2 className="text-base font-semibold">Site temporaire disponible</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Vous pouvez continuer sur l’ancienne version hébergée sur Lovable pendant la maintenance. Cette version sert uniquement de solution de secours : certaines informations peuvent être anciennes et des erreurs ou bugs peuvent encore apparaître.
            </p>
            <a
              href={TEMPORARY_SITE_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Ouvrir le site temporaire
            </a>
          </div>

          <p className="mt-6 text-xs leading-5 text-muted-foreground">
            L’espace d’administration reste accessible pendant la maintenance afin de permettre les contrôles et corrections nécessaires.
          </p>
        </section>
      </div>
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
