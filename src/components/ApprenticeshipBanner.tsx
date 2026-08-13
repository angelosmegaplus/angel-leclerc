import { GraduationCap, Moon } from "lucide-react";

export function ApprenticeshipBanner() {
  return (
    <a
      href="/parcours"
      className="block w-full bg-muted/60 text-foreground hover:bg-muted transition-colors"
    >
      <div className="container-tight flex items-center justify-center gap-2 py-1.5 text-xs">
        <GraduationCap size={14} className="shrink-0 text-primary" aria-hidden="true" />
        <span className="font-medium">
          BTS Communication en alternance — je recherche une entreprise
        </span>
        <span className="hidden sm:inline text-muted-foreground">
          · communication majoritaire (ex. 60 % com / 40 % vente)
        </span>
        <span className="hidden dark:inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground" aria-label="Mode sombre activé">
          <Moon size={10} aria-hidden="true" />
          Mode sombre
        </span>
        <span aria-hidden="true">→</span>
      </div>
    </a>
  );
}
