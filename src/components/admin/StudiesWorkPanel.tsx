import { BookOpen, Briefcase, CalendarDays, GraduationCap, PiggyBank, Route, WalletCards } from "lucide-react";
import { AdminCard } from "./AdminShell";

const week = [
  ["Lundi", "Travail / intérim", "work"],
  ["Mardi", "Travail / intérim", "work"],
  ["Mercredi", "Travail / intérim", "work"],
  ["Jeudi", "Repos", "rest"],
  ["Vendredi", "BTS Communication — CNED", "study"],
  ["Samedi", "BTS Communication — CNED", "study"],
  ["Dimanche", "Libre", "free"],
] as const;

const studyDay = [
  ["08h30–10h00", "Cultures de la communication"],
  ["10h00–10h15", "Pause"],
  ["10h15–12h30", "Enseignement professionnel — stratégie / projet / cas pratique"],
  ["12h30–13h30", "Déjeuner"],
  ["13h30–15h00", "CEJM / anglais"],
  ["15h00–15h15", "Pause"],
  ["15h15–16h30", "Atelier pratique — création de contenu / PAO / projet"],
  ["16h30–17h30", "Devoirs CNED / exercices / révisions"],
] as const;

function tone(kind: (typeof week)[number][2]) {
  if (kind === "work") return "border-sky-200/70 bg-sky-50/60 dark:border-sky-900/60 dark:bg-sky-950/20";
  if (kind === "study") return "border-violet-200/70 bg-violet-50/60 dark:border-violet-900/60 dark:bg-violet-950/20";
  if (kind === "rest") return "border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20";
  return "border-amber-200/70 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20";
}

export function StudiesWorkPanel() {
  return (
    <div className="space-y-4">
      <AdminCard
        title="Études & Travail"
        description="Piloter le BTS Communication au CNED, le travail, la mobilité et la stabilité financière depuis un seul endroit."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Études", "BTS Communication — CNED", GraduationCap],
            ["Travail", "Intérim / CDD — 3 jours consécutifs", Briefcase],
            ["Mobilité", "Scooter Mission Locale ou vélo", Route],
            ["Priorité", "Revenu + progression + épargne", PiggyBank],
          ].map(([label, value, Icon]) => (
            <div key={String(label)} className="rounded-xl border border-border/70 bg-background p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <Icon className="h-4 w-4" /> {label}
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard title="Semaine type" description="Cadre fixe à conserver autant que possible.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {week.map(([day, label, kind]) => (
            <div key={day} className={`rounded-xl border p-3 ${tone(kind)}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{day}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{label}</p>
            </div>
          ))}
        </div>
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Journée CNED type" description="Vendredi et samedi — rythme inspiré d'une journée de BTS Communication.">
          <div className="space-y-2">
            {studyDay.map(([time, subject]) => (
              <div key={`${time}-${subject}`} className="grid grid-cols-[96px_1fr] gap-3 rounded-lg border border-border/60 bg-background px-3 py-2">
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">{time}</span>
                <span className="text-sm text-foreground">{subject}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Médiathèque fortement recommandée lorsqu'elle est ouverte ; sinon, poursuivre la journée à domicile sans changer les horaires.
          </p>
        </AdminCard>

        <AdminCard title="Priorités opérationnelles" description="Ce qui doit être sécurisé en premier.">
          <div className="space-y-3">
            {[
              [WalletCards, "Revenu", "Trouver des missions d'intérim puis, si possible, un poste stable compatible avec 3 jours de travail consécutifs."],
              [BookOpen, "CNED", "Tenir les deux journées de cours et suivre devoirs, progression, stages et échéances."],
              [Route, "Mobilité", "Voir la Mission Locale pour un scooter ; vélo en solution de repli."],
              [PiggyBank, "Épargne", "Profiter des charges faibles actuelles pour construire une réserve avant le prochain logement."],
              [CalendarDays, "Organisation", "Inscrire missions, stages, cours et rendez-vous dans l'agenda dès qu'ils sont connus."],
            ].map(([Icon, title, detail]) => (
              <div key={String(title)} className="flex gap-3 rounded-xl border border-border/70 bg-background p-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
