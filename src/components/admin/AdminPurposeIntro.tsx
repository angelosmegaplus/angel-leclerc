import { CalendarDays, Cpu, LockKeyhole } from "lucide-react";

export function AdminPurposeIntro() {
  return (
    <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <img src="/flamme-os/logo.svg" alt="Flamme OS" className="h-10 w-auto max-w-[12rem] shrink-0 object-contain" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Espace administrateur</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">Centre de contrôle Flamme OS</h1>
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-muted-foreground">
        Flamme OS centralise les outils utiles à l’administration : agenda et planning, projets, communications, contenus, fichiers, connexions, automatisations et supervision dans une interface unique.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background/60 p-3"><CalendarDays className="h-4 w-4 text-primary" /><p className="mt-2 text-xs font-semibold text-foreground">Organiser</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Agenda, rendez-vous, échéances et planning.</p></div>
        <div className="rounded-2xl border border-border bg-background/60 p-3"><Cpu className="h-4 w-4 text-primary" /><p className="mt-2 text-xs font-semibold text-foreground">Automatiser</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Tâches, maintenance et synchronisations.</p></div>
        <div className="rounded-2xl border border-border bg-background/60 p-3"><LockKeyhole className="h-4 w-4 text-primary" /><p className="mt-2 text-xs font-semibold text-foreground">Administrer</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Site, données, intégrations et services privés.</p></div>
      </div>

      <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
        Cet espace est privé et réservé aux utilisateurs autorisés.
      </p>
    </div>
  );
}
