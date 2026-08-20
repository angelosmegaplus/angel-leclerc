import {
  BookOpen,
  Briefcase,
  CalendarDays,
  GraduationCap,
  PiggyBank,
  Route,
  type LucideIcon,
} from "lucide-react";
import { AdminCard } from "./AdminShell";

const weekSummary: Array<{ icon: LucideIcon; label: string; value: string }> = [
  { icon: Briefcase, label: "Lun–Mer", value: "Travail / intérim" },
  { icon: CalendarDays, label: "Jeudi", value: "Repos" },
  { icon: GraduationCap, label: "Ven–Sam", value: "CNED 8h30–17h30" },
  { icon: BookOpen, label: "Dimanche", value: "Libre" },
];

export function StudiesWorkDashboard() {
  return (
    <AdminCard
      className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card"
      title="Cap actuel — Études & Travail"
      description="BTS Communication au CNED + travail à côté : priorité à la stabilité, au revenu et à la progression."
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {weekSummary.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-border/70 bg-background px-3 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Icon className="h-4 w-4" /> {label}
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground">
          <Route className="h-4 w-4 text-primary" /> Mobilité : scooter Mission Locale / vélo
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground">
          <PiggyBank className="h-4 w-4 text-primary" /> Construire une épargne de sécurité
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground">
          <BookOpen className="h-4 w-4 text-primary" /> Médiathèque fortement recommandée
        </div>
      </div>
    </AdminCard>
  );
}
