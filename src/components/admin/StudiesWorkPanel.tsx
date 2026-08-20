import { useEffect, useMemo, useState, type LucideIcon } from "react";
import {
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  GraduationCap,
  MapPin,
  PiggyBank,
  Route,
  School,
  Target,
  WalletCards,
} from "lucide-react";
import { AdminCard } from "./AdminShell";

const STORAGE_KEY = "angel-os-studies-work-v2";

type Tab = "home" | "schedule" | "tasks" | "progress" | "work";
type Task = { id: string; title: string; subject: string; due: string; done: boolean };
type StoredState = {
  tasks: Task[];
  progress: number;
  weeklyHours: number;
  workGoal: string;
  mobility: string;
  savingsGoal: string;
};

const initialState: StoredState = {
  tasks: [
    { id: "1", title: "Préparer la prochaine séquence CNED", subject: "Organisation", due: "Vendredi", done: false },
    { id: "2", title: "Avancer le cours de Cultures de la communication", subject: "Communication", due: "Vendredi", done: false },
    { id: "3", title: "Faire un exercice de CEJM / anglais", subject: "CEJM / LV", due: "Samedi", done: false },
    { id: "4", title: "Mettre à jour les échéances et stages", subject: "Suivi BTS", due: "Samedi", done: false },
  ],
  progress: 0,
  weeklyHours: 14,
  workGoal: "3 jours consécutifs — lundi, mardi, mercredi",
  mobility: "Scooter Mission Locale / vélo",
  savingsGoal: "Construire une réserve de sécurité",
};

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
  ["08h30–10h00", "Cultures de la communication", "Cours"],
  ["10h00–10h15", "Pause", "Pause"],
  ["10h15–12h30", "Stratégie / projet / cas pratique", "Enseignement professionnel"],
  ["12h30–13h30", "Déjeuner", "Pause"],
  ["13h30–15h00", "CEJM / anglais", "Cours"],
  ["15h00–15h15", "Pause", "Pause"],
  ["15h15–16h30", "Création de contenu / PAO / projet", "Atelier"],
  ["16h30–17h30", "Devoirs / exercices / révisions", "Travail personnel"],
] as const;

const subjects = [
  "Cultures de la communication",
  "Stratégie de communication",
  "Solutions médias et digitales",
  "CEJM",
  "Anglais",
  "Projets / ateliers",
];

const nav: Array<{ key: Tab; label: string; icon: LucideIcon }> = [
  { key: "home", label: "Accueil", icon: School },
  { key: "schedule", label: "Emploi du temps", icon: CalendarDays },
  { key: "tasks", label: "Travail à faire", icon: CheckCircle2 },
  { key: "progress", label: "Progression BTS", icon: GraduationCap },
  { key: "work", label: "Emploi & mobilité", icon: Briefcase },
];

function tone(kind: (typeof week)[number][2]) {
  if (kind === "work") return "border-sky-200 bg-sky-50 dark:border-sky-900/70 dark:bg-sky-950/25";
  if (kind === "study") return "border-violet-200 bg-violet-50 dark:border-violet-900/70 dark:bg-violet-950/25";
  if (kind === "rest") return "border-emerald-200 bg-emerald-50 dark:border-emerald-900/70 dark:bg-emerald-950/25";
  return "border-amber-200 bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/25";
}

function loadState(): StoredState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return { ...initialState, ...parsed, tasks: Array.isArray(parsed.tasks) ? parsed.tasks : initialState.tasks };
  } catch {
    return initialState;
  }
}

export function StudiesWorkPanel() {
  const [tab, setTab] = useState<Tab>("home");
  const [state, setState] = useState<StoredState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const completed = state.tasks.filter((task) => task.done).length;
  const taskPercent = state.tasks.length ? Math.round((completed / state.tasks.length) * 100) : 0;
  const nextTasks = useMemo(() => state.tasks.filter((task) => !task.done).slice(0, 3), [state.tasks]);

  const toggleTask = (id: string) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    }));
  };

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-5 text-white sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Mon espace</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">BTS Communication · Travail</h2>
            <p className="mt-1 text-sm text-white/65">CNED · emploi · organisation · mobilité</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <GraduationCap className="h-6 w-6 text-violet-300" />
            <div>
              <p className="text-xs text-white/55">Progression BTS</p>
              <p className="font-semibold tabular-nums">{state.progress}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-background px-2 py-2 sm:px-4">
        <nav className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {nav.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium transition ${
                  active ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4 bg-muted/20 p-3 sm:p-5">
        {tab === "home" && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [CalendarDays, "Aujourd’hui", "Consulter le planning"],
                [CheckCircle2, "Travail à faire", `${completed}/${state.tasks.length} terminé`],
                [Clock3, "CNED cette semaine", `${state.weeklyHours} h prévues`],
                [Briefcase, "Emploi", "3 jours consécutifs"],
              ].map(([Icon, label, value]) => (
                <button
                  key={String(label)}
                  type="button"
                  onClick={() => {
                    if (label === "Travail à faire") setTab("tasks");
                    else if (label === "Emploi") setTab("work");
                    else setTab("schedule");
                  }}
                  className="group rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-foreground"><Icon className="h-4 w-4" /></span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
                </button>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_.8fr]">
              <AdminCard title="Ma semaine" description="Le cadre principal, visible d'un coup d'œil.">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
                  {week.map(([day, label, kind]) => (
                    <div key={day} className={`rounded-xl border p-3 ${tone(kind)}`}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{day.slice(0, 3)}</p>
                      <p className="mt-2 text-xs font-semibold text-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </AdminCard>

              <AdminCard title="À faire prochainement" description={`${taskPercent}% du travail prévu terminé.`}>
                <div className="space-y-2">
                  {nextTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tout est terminé.</p>
                  ) : nextTasks.map((task) => (
                    <button key={task.id} type="button" onClick={() => toggleTask(task.id)} className="flex w-full items-start gap-3 rounded-xl border border-border bg-background p-3 text-left hover:bg-muted/50">
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">{task.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{task.subject} · {task.due}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </AdminCard>
            </div>
          </>
        )}

        {tab === "schedule" && (
          <div className="grid gap-4 lg:grid-cols-[1.5fr_.7fr]">
            <AdminCard title="Emploi du temps" description="Vendredi et samedi : journée type de BTS Communication.">
              <div className="overflow-hidden rounded-2xl border border-border bg-background">
                {studyDay.map(([time, subject, type], index) => (
                  <div key={`${time}-${subject}`} className={`grid grid-cols-[94px_1fr] gap-3 px-3 py-3 sm:grid-cols-[110px_1fr_150px] ${index ? "border-t border-border" : ""}`}>
                    <span className="text-xs font-bold tabular-nums text-muted-foreground">{time}</span>
                    <span className="text-sm font-medium text-foreground">{subject}</span>
                    <span className="hidden text-right text-xs text-muted-foreground sm:block">{type}</span>
                  </div>
                ))}
              </div>
            </AdminCard>

            <div className="space-y-4">
              <AdminCard title="Lieu de travail" description="Le planning ne dépend pas du bâtiment.">
                <div className="flex gap-3 rounded-xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-900/70 dark:bg-violet-950/25">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Médiathèque recommandée</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Y aller lorsqu'elle est ouverte. Commencer ou terminer à domicile si les horaires ne couvrent pas toute la journée.</p>
                  </div>
                </div>
              </AdminCard>
              <AdminCard title="Rythme hebdomadaire">
                <p className="text-3xl font-bold tabular-nums text-foreground">{state.weeklyHours} h</p>
                <p className="mt-1 text-xs text-muted-foreground">de CNED prévues chaque semaine</p>
              </AdminCard>
            </div>
          </div>
        )}

        {tab === "tasks" && (
          <AdminCard title="Travail à faire" description="Comme un cahier de textes : coche chaque élément une fois terminé.">
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${taskPercent}%` }} />
            </div>
            <div className="space-y-2">
              {state.tasks.map((task) => (
                <button key={task.id} type="button" onClick={() => toggleTask(task.id)} className="flex w-full items-start gap-3 rounded-xl border border-border bg-background p-3 text-left transition hover:bg-muted/40">
                  {task.done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />}
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-semibold ${task.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{task.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{task.subject} · À faire pour {task.due}</span>
                  </span>
                </button>
              ))}
            </div>
          </AdminCard>
        )}

        {tab === "progress" && (
          <div className="grid gap-4 lg:grid-cols-[.75fr_1.25fr]">
            <AdminCard title="Progression générale" description="Indicateur personnel, modifiable au fur et à mesure.">
              <div className="text-center">
                <p className="text-5xl font-bold tabular-nums text-foreground">{state.progress}%</p>
                <input
                  aria-label="Progression BTS"
                  type="range"
                  min="0"
                  max="100"
                  value={state.progress}
                  onChange={(event) => setState((current) => ({ ...current, progress: Number(event.target.value) }))}
                  className="mt-5 w-full accent-violet-600"
                />
                <p className="mt-2 text-xs text-muted-foreground">Ajuste ce curseur selon ton avancement réel dans l'année.</p>
              </div>
            </AdminCard>

            <AdminCard title="Matières du BTS" description="Vue simple des grands blocs à suivre.">
              <div className="grid gap-2 sm:grid-cols-2">
                {subjects.map((subject) => (
                  <div key={subject} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                    <BookOpen className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
                    <span className="text-sm font-medium text-foreground">{subject}</span>
                  </div>
                ))}
              </div>
            </AdminCard>
          </div>
        )}

        {tab === "work" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminCard title="Emploi" description="Le travail finance la vie ; le CNED protège la progression à long terme.">
              <div className="space-y-3">
                <div className="flex gap-3 rounded-xl border border-border bg-background p-3">
                  <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                  <div><p className="text-sm font-semibold text-foreground">Disponibilité cible</p><p className="mt-1 text-xs text-muted-foreground">{state.workGoal}</p></div>
                </div>
                <div className="flex gap-3 rounded-xl border border-border bg-background p-3">
                  <WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div><p className="text-sm font-semibold text-foreground">Priorité revenu</p><p className="mt-1 text-xs text-muted-foreground">Intérim au démarrage, puis CDD/CDI à temps partiel si une meilleure stabilité se présente.</p></div>
                </div>
                <div className="flex gap-3 rounded-xl border border-border bg-background p-3">
                  <Target className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div><p className="text-sm font-semibold text-foreground">Règle</p><p className="mt-1 text-xs text-muted-foreground">Ne pas accepter un rythme qui supprime systématiquement les deux journées CNED.</p></div>
                </div>
              </div>
            </AdminCard>

            <AdminCard title="Mobilité & stabilité" description="Les deux éléments qui élargissent réellement les possibilités de travail.">
              <div className="space-y-3">
                <div className="flex gap-3 rounded-xl border border-border bg-background p-3"><Route className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold text-foreground">Mobilité</p><p className="mt-1 text-xs text-muted-foreground">{state.mobility}</p></div></div>
                <div className="flex gap-3 rounded-xl border border-border bg-background p-3"><PiggyBank className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold text-foreground">Épargne</p><p className="mt-1 text-xs text-muted-foreground">{state.savingsGoal}</p></div></div>
                <div className="flex gap-3 rounded-xl border border-border bg-background p-3"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold text-foreground">Agenda</p><p className="mt-1 text-xs text-muted-foreground">Ajouter dès qu'elles sont connues les missions, stages, rendez-vous et échéances CNED.</p></div></div>
              </div>
            </AdminCard>
          </div>
        )}
      </div>
    </div>
  );
}
