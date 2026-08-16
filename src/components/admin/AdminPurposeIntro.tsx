import { Cpu, LockKeyhole, Sparkles } from "lucide-react";

export function AdminPurposeIntro() {
  return (
    <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-12 w-12 shrink-0 rounded-xl object-contain" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Angel OS · espace administrateur</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">Centre de contrôle personnel et intelligent</h1>
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-muted-foreground">
        Angel OS est une application privée conçue pour centraliser, organiser et automatiser les outils numériques utiles à son administrateur. Elle réunit notamment l’assistance par intelligence artificielle, le suivi des candidatures et communications, la gestion du site et de ses contenus, les connecteurs et API, les tâches automatisées ainsi que les outils personnels de productivité dans une interface unique.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background/60 p-3"><Sparkles className="h-4 w-4 text-primary" /><p className="mt-2 text-xs font-semibold text-foreground">Assister</p><p className="mt-1 text-xs leading-5 text-muted-foreground">IA, informations et aide contextuelle.</p></div>
        <div className="rounded-2xl border border-border bg-background/60 p-3"><Cpu className="h-4 w-4 text-primary" /><p className="mt-2 text-xs font-semibold text-foreground">Automatiser</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Tâches, maintenance et synchronisations.</p></div>
        <div className="rounded-2xl border border-border bg-background/60 p-3"><LockKeyhole className="h-4 w-4 text-primary" /><p className="mt-2 text-xs font-semibold text-foreground">Administrer</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Site, données, intégrations et services privés.</p></div>
      </div>

      <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
        Cet espace n’est pas un service public : son accès est réservé aux utilisateurs autorisés. Une vérification anti-robot est demandée avant l’ouverture du canal d’authentification.
      </p>
    </div>
  );
}
