import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  GraduationCap,
  MapPin,
  PiggyBank,
  Plus,
  Route,
  School,
  Target,
  Trash2,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { AdminCard } from "./AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "angel-os-studies-work-v3";

type Tab = "home" | "schedule" | "tasks" | "progress" | "work";
type ScheduleView = "day" | "week";
type StudyDay = "Vendredi" | "Samedi";
type Task = {
  id: string;
  title: string;
  subject: string;
  due: string;
  done: boolean;
};
type StoredState = { tasks: Task[]; weeklyHours: number };
type NavItem = { key: Tab; label: string; icon: LucideIcon };

const initialState: StoredState = {
  tasks: [],
  weeklyHours: 14,
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

const studyBlocks = [
  { start: "08:30", end: "10:00", subject: "Cultures de la communication", detail: "Cours", tone: "bg-emerald-300/85 dark:bg-emerald-700/75" },
  { start: "10:15", end: "12:30", subject: "Stratégie / projet / cas pratique", detail: "Enseignement professionnel", tone: "bg-cyan-300/85 dark:bg-cyan-700/75" },
  { start: "13:30", end: "15:00", subject: "CEJM / anglais", detail: "Cours", tone: "bg-violet-300/85 dark:bg-violet-700/75" },
  { start: "15:15", end: "16:30", subject: "Création de contenu / PAO / projet", detail: "Atelier", tone: "bg-fuchsia-300/80 dark:bg-fuchsia-700/70" },
  { start: "16:30", end: "17:30", subject: "Devoirs / exercices / révisions", detail: "Travail personnel", tone: "bg-amber-300/85 dark:bg-amber-700/75" },
] as const;

const subjects = [
  "Cultures de la communication",
  "Stratégie de communication",
  "Solutions médias et digitales",
  "CEJM",
  "Anglais",
  "Projets / ateliers",
  "Organisation",
];

const navigation: NavItem[] = [
  { key: "home", label: "Accueil", icon: School },
  { key: "schedule", label: "Emploi du temps", icon: CalendarDays },
  { key: "tasks", label: "Travail à faire", icon: CheckCircle2 },
  { key: "progress", label: "Progression", icon: GraduationCap },
  { key: "work", label: "Emploi & mobilité", icon: Briefcase },
];

function dayTone(kind: (typeof week)[number][2]) {
  if (kind === "work") return "border-sky-200 bg-sky-50 dark:border-sky-900/70 dark:bg-sky-950/25";
  if (kind === "study") return "border-violet-200 bg-violet-50 dark:border-violet-900/70 dark:bg-violet-950/25";
  if (kind === "rest") return "border-emerald-200 bg-emerald-50 dark:border-emerald-900/70 dark:bg-emerald-950/25";
  return "border-amber-200 bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/25";
}

function readStoredState(): StoredState {
  if (typeof window === "undefined") return initialState;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null") as Partial<StoredState> | null;
    if (!parsed) return initialState;
    return {
      weeklyHours: typeof parsed.weeklyHours === "number" ? parsed.weeklyHours : initialState.weeklyHours,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    };
  } catch {
    return initialState;
  }
}

function minutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

const GRID_START = 8 * 60;
const GRID_END = 18 * 60;
const PX_PER_MINUTE = 1.05;

function TimetableDay({ day }: { day: StudyDay }) {
  const height = (GRID_END - GRID_START) * PX_PER_MINUTE;
  const hours = Array.from({ length: 11 }, (_, index) => 8 + index);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="border-b border-[#d9e3ed] bg-[#eef4f9] px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-semibold">{day}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">BTS Communication · CNED</p>
      </div>
      <div className="grid grid-cols-[52px_1fr]">
        <div className="relative border-r border-[#d9e3ed] bg-[#f8fafc] dark:border-slate-700 dark:bg-slate-900" style={{ height }}>
          {hours.map((hour) => (
            <div key={hour} className="absolute left-0 right-0 text-center text-[11px] text-slate-500 dark:text-slate-400" style={{ top: (hour * 60 - GRID_START) * PX_PER_MINUTE - 7 }}>
              {String(hour).padStart(2, "0")} h
            </div>
          ))}
        </div>
        <div className="relative" style={{ height }}>
          {hours.map((hour) => (
            <div key={hour} className="absolute left-0 right-0 border-t border-[#e5ebf1] dark:border-slate-800" style={{ top: (hour * 60 - GRID_START) * PX_PER_MINUTE }} />
          ))}
          {studyBlocks.map((block) => {
            const top = (minutes(block.start) - GRID_START) * PX_PER_MINUTE;
            const blockHeight = Math.max(44, (minutes(block.end) - minutes(block.start)) * PX_PER_MINUTE);
            return (
              <div
                key={`${day}-${block.start}-${block.subject}`}
                className={`absolute left-2 right-2 overflow-hidden rounded-md border border-black/10 px-2 py-1.5 shadow-sm ${block.tone}`}
                style={{ top, height: blockHeight }}
              >
                <div className="flex items-start justify-between gap-2 text-[11px] font-bold">
                  <span>{block.start} - {block.end}</span>
                  <span className="text-right opacity-70">CNED</span>
                </div>
                <p className="mt-1 text-center text-xs font-bold uppercase leading-tight">{block.subject}</p>
                <p className="mt-0.5 text-center text-[10px] opacity-75">{block.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function StudiesWorkPanel() {
  const [tab, setTab] = useState<Tab>("home");
  const [state, setState] = useState<StoredState>(initialState);
  const [ready, setReady] = useState(false);
  const [scheduleView, setScheduleView] = useState<ScheduleView>("day");
  const [selectedDay, setSelectedDay] = useState<StudyDay>("Vendredi");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubject, setTaskSubject] = useState(subjects[0]);
  const [taskDue, setTaskDue] = useState("Vendredi");

  useEffect(() => {
    setState(readStoredState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const completed = state.tasks.filter((task) => task.done).length;
  const progress = state.tasks.length ? Math.round((completed / state.tasks.length) * 100) : 0;
  const pending = useMemo(() => state.tasks.filter((task) => !task.done), [state.tasks]);

  const addTask = () => {
    const title = taskTitle.trim();
    if (!title) return;
    setState((current) => ({
      ...current,
      tasks: [
        ...current.tasks,
        { id: crypto.randomUUID(), title, subject: taskSubject, due: taskDue, done: false },
      ],
    }));
    setTaskTitle("");
  };

  const toggleTask = (id: string) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    }));
  };

  const removeTask = (id: string) => {
    setState((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }));
  };

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-sm">
      <header className="border-b border-border bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-5 text-white sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Mon espace</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">BTS Communication · Travail</h2>
            <p className="mt-1 text-sm text-white/65">CNED · emploi · organisation · mobilité</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <GraduationCap className="h-6 w-6 text-violet-300" />
            <div><p className="text-xs text-white/55">Progression des tâches</p><p className="font-semibold tabular-nums">{progress}%</p></div>
          </div>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background px-2 py-2 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navigation.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium transition ${tab === key ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </nav>

      <div className="space-y-4 bg-muted/20 p-3 sm:p-5">
        {tab === "home" && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button type="button" onClick={() => setTab("schedule")} className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm"><CalendarDays className="h-5 w-5" /><p className="mt-3 text-xs text-muted-foreground">Emploi du temps</p><p className="mt-1 text-sm font-semibold">Vendredi & samedi</p></button>
              <button type="button" onClick={() => setTab("tasks")} className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm"><CheckCircle2 className="h-5 w-5" /><p className="mt-3 text-xs text-muted-foreground">Travail à faire</p><p className="mt-1 text-sm font-semibold">{pending.length} tâche(s) en attente</p></button>
              <button type="button" onClick={() => setTab("progress")} className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm"><GraduationCap className="h-5 w-5" /><p className="mt-3 text-xs text-muted-foreground">Progression</p><p className="mt-1 text-sm font-semibold">{completed}/{state.tasks.length || 0} tâche(s) terminée(s)</p></button>
              <button type="button" onClick={() => setTab("work")} className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm"><Briefcase className="h-5 w-5" /><p className="mt-3 text-xs text-muted-foreground">Emploi</p><p className="mt-1 text-sm font-semibold">3 jours consécutifs</p></button>
            </div>

            <AdminCard title="Ma semaine" description="Cadre fixe de référence.">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
                {week.map(([day, label, kind]) => <div key={day} className={`rounded-xl border p-3 ${dayTone(kind)}`}><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{day.slice(0, 3)}</p><p className="mt-2 text-xs font-semibold text-foreground">{label}</p></div>)}
              </div>
            </AdminCard>

            <AdminCard title="À faire prochainement" description="Cette liste vient uniquement de ce que tu ajoutes toi-même.">
              {pending.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-5 text-center"><p className="text-sm text-muted-foreground">Aucune tâche ajoutée.</p><Button className="mt-3" size="sm" onClick={() => setTab("tasks")}><Plus className="mr-2 h-4 w-4" /> Ajouter une tâche</Button></div>
              ) : (
                <div className="space-y-2">{pending.slice(0, 4).map((task) => <button key={task.id} type="button" onClick={() => toggleTask(task.id)} className="flex w-full items-start gap-3 rounded-xl border border-border bg-background p-3 text-left"><Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span><span className="block text-sm font-medium">{task.title}</span><span className="mt-1 block text-xs text-muted-foreground">{task.subject} · {task.due}</span></span></button>)}</div>
              )}
            </AdminCard>
          </>
        )}

        {tab === "schedule" && (
          <div className="space-y-4">
            <AdminCard title="Emploi du temps" description="Affichage inspiré d'un ENT scolaire : heures à gauche, cours placés selon leur durée.">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex w-fit rounded-lg bg-[#e9eef3] p-1 dark:bg-slate-800">
                  <button type="button" onClick={() => setScheduleView("day")} className={`rounded-md px-4 py-1.5 text-sm font-medium ${scheduleView === "day" ? "bg-white text-[#1d5f8c] shadow-sm dark:bg-slate-950 dark:text-sky-300" : "text-slate-500 dark:text-slate-400"}`}>Jour</button>
                  <button type="button" onClick={() => setScheduleView("week")} className={`rounded-md px-4 py-1.5 text-sm font-medium ${scheduleView === "week" ? "bg-white text-[#1d5f8c] shadow-sm dark:bg-slate-950 dark:text-sky-300" : "text-slate-500 dark:text-slate-400"}`}>Semaine</button>
                </div>
                {scheduleView === "day" ? (
                  <div className="flex items-center gap-2"><button type="button" className="rounded-lg border border-border p-2" onClick={() => setSelectedDay(selectedDay === "Vendredi" ? "Samedi" : "Vendredi")}><ChevronLeft className="h-4 w-4" /></button><span className="min-w-28 text-center text-sm font-semibold">{selectedDay}</span><button type="button" className="rounded-lg border border-border p-2" onClick={() => setSelectedDay(selectedDay === "Vendredi" ? "Samedi" : "Vendredi")}><ChevronRight className="h-4 w-4" /></button></div>
                ) : null}
              </div>
              {scheduleView === "day" ? <TimetableDay day={selectedDay} /> : <div className="grid gap-3 lg:grid-cols-2"><TimetableDay day="Vendredi" /><TimetableDay day="Samedi" /></div>}
            </AdminCard>

            <div className="grid gap-4 lg:grid-cols-2">
              <AdminCard title="Lieu conseillé"><div className="flex gap-3 rounded-xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-900/70 dark:bg-violet-950/25"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" /><div><p className="text-sm font-semibold">Médiathèque fortement recommandée</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Le planning reste fixe même si la médiathèque est fermée : commencer ou terminer à domicile si nécessaire.</p></div></div></AdminCard>
              <AdminCard title="Volume prévu"><div className="flex items-center gap-3"><Clock3 className="h-6 w-6 text-primary" /><div><p className="text-3xl font-bold tabular-nums">{state.weeklyHours} h</p><p className="text-xs text-muted-foreground">de CNED par semaine</p></div></div></AdminCard>
            </div>
          </div>
        )}

        {tab === "tasks" && (
          <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
            <AdminCard title="Ajouter un travail" description="Aucune tâche n'est créée automatiquement : tu renseignes toi-même ton cahier de textes.">
              <div className="space-y-3">
                <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Travail à faire</label><Input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Ex. terminer le devoir de CEJM" onKeyDown={(event) => { if (event.key === "Enter") addTask(); }} /></div>
                <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Matière</label><select value={taskSubject} onChange={(event) => setTaskSubject(event.target.value)} className="min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select></div>
                <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Échéance</label><Input value={taskDue} onChange={(event) => setTaskDue(event.target.value)} placeholder="Vendredi, 12 septembre…" /></div>
                <Button onClick={addTask} disabled={!taskTitle.trim()}><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>
              </div>
            </AdminCard>

            <AdminCard title="Travail à faire" description={`${completed} terminé(s) · ${pending.length} restant(s)`}>
              {state.tasks.length === 0 ? <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Ton cahier de textes est vide.</div> : <div className="space-y-2">{state.tasks.map((task) => <div key={task.id} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3"><button type="button" onClick={() => toggleTask(task.id)}>{task.done ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /> : <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />}</button><div className="min-w-0 flex-1"><p className={`text-sm font-semibold ${task.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{task.subject} · {task.due}</p></div><button type="button" aria-label="Supprimer la tâche" onClick={() => removeTask(task.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>)}</div>}
            </AdminCard>
          </div>
        )}

        {tab === "progress" && (
          <div className="grid gap-4 lg:grid-cols-[.7fr_1.3fr]">
            <AdminCard title="Progression automatique" description="Calculée uniquement à partir des tâches que tu ajoutes puis termines.">
              <div className="text-center"><p className="text-5xl font-bold tabular-nums">{progress}%</p><div className="mx-auto mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-3 text-xs text-muted-foreground">{state.tasks.length === 0 ? "Ajoute des tâches pour commencer le suivi." : `${completed} tâche(s) terminée(s) sur ${state.tasks.length}.`}</p></div>
            </AdminCard>
            <AdminCard title="Progression par matière" description="Basée sur les tâches renseignées dans chaque matière.">
              <div className="space-y-3">{subjects.slice(0, 6).map((subject) => { const all = state.tasks.filter((task) => task.subject === subject); const done = all.filter((task) => task.done).length; const percent = all.length ? Math.round((done / all.length) * 100) : 0; return <div key={subject}><div className="mb-1 flex items-center justify-between gap-3 text-sm"><span className="font-medium">{subject}</span><span className="text-xs tabular-nums text-muted-foreground">{all.length ? `${done}/${all.length}` : "—"}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-violet-500" style={{ width: `${percent}%` }} /></div></div>; })}</div>
            </AdminCard>
          </div>
        )}

        {tab === "work" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminCard title="Emploi" description="Objectif : gagner sa vie sans sacrifier les deux journées CNED."><div className="space-y-3"><InfoRow icon={Briefcase} title="Disponibilité cible" text="Lundi, mardi, mercredi — 3 jours consécutifs." /><InfoRow icon={WalletCards} title="Priorité revenu" text="Intérim au démarrage, puis CDD/CDI à temps partiel si une meilleure stabilité se présente." /><InfoRow icon={Target} title="Règle" text="Ne pas accepter un rythme qui supprime systématiquement vendredi et samedi consacrés au CNED." /></div></AdminCard>
            <AdminCard title="Mobilité & stabilité"><div className="space-y-3"><InfoRow icon={Route} title="Mobilité" text="Scooter via la Mission Locale si disponible ; vélo en solution de repli." /><InfoRow icon={PiggyBank} title="Épargne" text="Construire une réserve de sécurité pendant la période de faibles charges." /><InfoRow icon={CalendarDays} title="Agenda" text="Ajouter missions, stages, rendez-vous et échéances CNED dès qu'ils sont connus." /></div></AdminCard>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return <div className="flex gap-3 rounded-xl border border-border bg-background p-3"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold text-foreground">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></div></div>;
}
