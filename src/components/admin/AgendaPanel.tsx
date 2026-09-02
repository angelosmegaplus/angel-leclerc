import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink, Loader2, MapPin, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard } from "./AdminShell";
import { listGoogleCalendarEvents } from "@/lib/google-workspace.functions";
import { ConnectionEmptyState } from "./ConnectionEmptyState";
import { Button } from "@/components/ui/button";

type Entry = {
  id: string;
  start: string;
  end?: string | null;
  label: string;
  detail: string;
  kind: "Google" | "Projet" | "Tâche" | "Publication" | "Studio";
  location?: string | null;
};

type AgendaData = {
  entries: Entry[];
  warnings: string[];
  googleConnected: boolean;
};

type ViewMode = "day" | "week";

const anyDb = supabase as unknown as { from: (t: string) => any };

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(input: Date) {
  const date = new Date(input);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(input: Date, amount: number) {
  const next = new Date(input);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

async function loadLocalAgenda(): Promise<Pick<AgendaData, "entries" | "warnings">> {
  const queries = await Promise.allSettled([
    supabase.from("articles").select("id,title,scheduled_at").not("scheduled_at", "is", null),
    anyDb.from("projects").select("id,title,due_date,client_name").not("due_date", "is", null),
    anyDb.from("project_tasks").select("id,title,due_date").not("due_date", "is", null),
    anyDb.from("interviews").select("id,title,person,scheduled_at").not("scheduled_at", "is", null),
  ]);

  const labels = ["publications", "projets", "tâches", "interviews"];
  const warnings: string[] = [];
  const rows = queries.map((result, index) => {
    if (result.status === "rejected") {
      warnings.push(`Impossible de charger les ${labels[index]}.`);
      return [] as any[];
    }
    const response = result.value as { data?: any[] | null; error?: { message?: string } | null };
    if (response.error) {
      warnings.push(`Impossible de charger les ${labels[index]}.`);
      return [] as any[];
    }
    return response.data ?? [];
  });

  const [articles, projects, tasks, interviews] = rows;
  const entries: Entry[] = [];
  for (const article of articles) if (article.scheduled_at) entries.push({ id: `art-${article.id}`, start: article.scheduled_at, label: article.title, detail: "Publication programmée", kind: "Publication" });
  for (const project of projects) if (project.due_date) entries.push({ id: `pro-${project.id}`, start: project.due_date, label: project.title, detail: project.client_name ? `Projet · ${project.client_name}` : "Échéance de projet", kind: "Projet" });
  for (const task of tasks) if (task.due_date) entries.push({ id: `tsk-${task.id}`, start: task.due_date, label: task.title, detail: "Tâche à terminer", kind: "Tâche" });
  for (const interview of interviews) if (interview.scheduled_at) entries.push({ id: `itw-${interview.id}`, start: interview.scheduled_at, label: interview.title, detail: interview.person ? `Interview · ${interview.person}` : "Interview", kind: "Studio" });
  return { entries, warnings };
}

const kindClass: Record<Entry["kind"], string> = {
  Google: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  Projet: "border-primary/25 bg-primary/10 text-primary",
  Tâche: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Publication: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  Studio: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

export function AgendaPanel() {
  const [view, setView] = useState<ViewMode>("week");
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const loadGoogleCalendar = useServerFn(listGoogleCalendarEvents);

  const agendaQuery = useQuery({
    queryKey: ["flamme-os", "agenda", "google-v3"],
    queryFn: async (): Promise<AgendaData> => {
      const local = await loadLocalAgenda();
      let googleEntries: Entry[] = [];
      let googleConnected = true;
      try {
        const google = await loadGoogleCalendar();
        googleEntries = google.map((event) => ({
          id: `google-${event.id}`,
          start: event.start,
          end: event.end ?? null,
          label: event.title,
          detail: "Google Agenda",
          kind: "Google" as const,
          location: event.location ?? null,
        }));
      } catch {
        googleConnected = false;
      }
      return {
        entries: [...local.entries, ...googleEntries].sort((a, b) => a.start.localeCompare(b.start)),
        warnings: local.warnings,
        googleConnected,
      };
    },
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const entries = agendaQuery.data?.entries ?? [];
  const warnings = agendaQuery.data?.warnings ?? [];
  const googleConnected = agendaQuery.data?.googleConnected ?? true;
  const weekStart = startOfWeek(cursorDate);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const selectedKey = dateKey(cursorDate);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entries) {
      const key = entry.start.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return map;
  }, [entries]);

  const selectedEntries = entriesByDay.get(selectedKey) ?? [];
  const upcoming = entries.filter((entry) => new Date(entry.start).getTime() >= Date.now()).slice(0, 8);

  const move = (direction: -1 | 1) => {
    setCursorDate((current) => addDays(current, direction * (view === "week" ? 7 : 1)));
  };

  const EventCard = ({ entry, compact = false }: { entry: Entry; compact?: boolean }) => (
    <article className={`rounded-xl border p-3 ${kindClass[entry.kind]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`${compact ? "text-xs" : "text-sm"} truncate font-semibold text-foreground`}>{entry.label}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{formatTime(entry.start)}{entry.end ? ` – ${formatTime(entry.end)}` : ""}</span>
            {entry.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{entry.location}</span> : null}
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-current/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.08em]">{entry.kind}</span>
      </div>
    </article>
  );

  return (
    <div className="space-y-5">
      <AdminCard className="overflow-hidden p-0">
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">Planning</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-[-.04em] text-foreground">Agenda</h2>
              <p className="mt-1 text-sm text-muted-foreground">Google Calendar, projets, tâches, publications et studio dans une seule vue.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-border bg-muted/50 p-1">
                {(["day", "week"] as const).map((mode) => <button key={mode} onClick={() => setView(mode)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${view === mode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{mode === "day" ? "Jour" : "Semaine"}</button>)}
              </div>
              <Button variant="outline" size="sm" onClick={() => agendaQuery.refetch()}><RefreshCw className={`mr-2 h-4 w-4 ${agendaQuery.isFetching ? "animate-spin" : ""}`} />Actualiser</Button>
              {googleConnected ? <Button asChild variant="outline" size="sm"><a href="https://calendar.google.com" target="_blank" rel="noreferrer">Google Agenda <ExternalLink className="ml-2 h-3.5 w-3.5" /></a></Button> : null}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => move(-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCursorDate(new Date())}>Aujourd’hui</Button>
              <Button variant="outline" size="icon" onClick={() => move(1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <p className="text-right text-sm font-semibold capitalize text-foreground">{view === "day" ? formatLongDate(cursorDate) : `${weekDays[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`}</p>
          </div>
        </div>

        {warnings.length > 0 ? <div className="mx-4 mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm"><div className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-semibold">Synchronisation partielle</p>{warnings.map((warning) => <p key={warning} className="mt-1 text-muted-foreground">{warning}</p>)}</div></div></div> : null}

        {agendaQuery.isLoading ? <div className="flex min-h-72 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Chargement de l’agenda…</div> : view === "day" ? (
          <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_20rem] sm:p-5">
            <div>
              <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-bold capitalize">{formatLongDate(cursorDate)}</h3><span className="text-xs text-muted-foreground">{selectedEntries.length} élément{selectedEntries.length > 1 ? "s" : ""}</span></div>
              <div className="relative rounded-2xl border border-border bg-background p-3">
                <div className="space-y-2">{selectedEntries.length ? selectedEntries.map((entry) => <EventCard key={entry.id} entry={entry} />) : <div className="grid min-h-48 place-items-center text-sm text-muted-foreground">Aucun rendez-vous ni échéance ce jour.</div>}</div>
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-display text-base font-bold">À venir</h3>
              <div className="space-y-2">{upcoming.map((entry) => <EventCard key={entry.id} entry={entry} compact />)}</div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto p-4 sm:p-5">
            <div className="grid min-w-[850px] grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const key = dateKey(day);
                const dayEntries = entriesByDay.get(key) ?? [];
                const isToday = key === dateKey(new Date());
                return <section key={key} className={`min-h-[26rem] rounded-2xl border p-2.5 ${isToday ? "border-primary/35 bg-primary/5" : "border-border bg-background"}`}>
                  <button onClick={() => { setCursorDate(day); setView("day"); }} className="mb-3 w-full rounded-xl px-2 py-2 text-left hover:bg-muted">
                    <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">{day.toLocaleDateString("fr-FR", { weekday: "short" })}</p>
                    <p className={`mt-1 font-display text-xl font-bold ${isToday ? "text-primary" : "text-foreground"}`}>{day.getDate()}</p>
                  </button>
                  <div className="space-y-2">{dayEntries.map((entry) => <EventCard key={entry.id} entry={entry} compact />)}</div>
                </section>;
              })}
            </div>
          </div>
        )}
      </AdminCard>

      {!agendaQuery.isLoading && !googleConnected ? <ConnectionEmptyState title="Google Agenda non connecté" description="Les échéances internes restent disponibles. Connecte Google Calendar depuis Connexions pour réunir tes rendez-vous et ton planning dans Flamme OS." /> : null}
    </div>
  );
}
