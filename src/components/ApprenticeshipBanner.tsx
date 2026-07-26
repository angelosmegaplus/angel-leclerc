import { GraduationCap } from "lucide-react";

export function ApprenticeshipBanner() {
  return (
    <a
      href="/parcours#bts"
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
        <span aria-hidden="true">→</span>
      </div>
    </a>
  );
}
