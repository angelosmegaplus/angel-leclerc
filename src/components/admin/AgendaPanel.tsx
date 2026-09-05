import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard } from "./AdminShell";
import { getGoogleWorkspaceHealth, listGoogleCalendarEvents } from "@/lib/google-workspace.functions";
import { Button } from "@/components/ui/button";
import { AddressLookupCard } from "./AddressLookupCard";

type Entry = {
  id: string;
  start: string;
  end?: string | null;
  label: string;
  detail: string;
  kind: "Google" | "Projet" | "Tâche" | "Publication" | "Studio";
  location?: string | null;
  href?: string | null;
  allDay?: boolean;
  calendarName?: string | null;
};

type AgendaData = {
  entries: Entry[];
  warnings: string[];
};

type ViewMode = "day" | "week" | "month";

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

function startOfMonthGrid(input: Date) {
  const first = new Date(input.getFullYear(), input.getMonth(), 1);
  return startOfWeek(first);
}

function addDays(input: Date, amount: number) {
  const next = new Date(input);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatTime(value?: string | null, allDay?: boolean) {
  if (allDay) return "Toute la journée";
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
  Google: "border-blue-500/25 bg-blue-500/10",
  Projet: "border-primary/25 bg-primary/10",
  Tâche: "border-amber-500/25 bg-amber-500/10",
  Publication: "border-violet-500/25 bg-violet-500/10",
  Studio: "border-emerald-500/25 bg-emerald-500/10",
};

export function AgendaPanel() {
  const [view, setView] = useState<ViewMode>("week");
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const loadGoogleCalendar = useServerFn(listGoogleCalendarEvents);
  const loadGoogleHealth = useServerFn(getGoogleWorkspaceHealth);

  const healthQuery = useQuery({
    queryKey: ["flamme-os", "google-health", "agenda"],
    queryFn: () => loadGoogleHealth(),
    staleTime: 60_000,
    retry: false,
  });

  const agendaQuery = useQuery({
    queryKey: ["flamme-os", "agenda", "google-all-calendars-v4"],
    queryFn: async (): Promise<AgendaData> => {
      const local = await loadLocalAgenda();
      let googleEntries: Entry[] = [];
      try {
        const google = await loadGoogleCalendar();
        googleEntries = google.map((event) => ({
          id: `google-${event.id}`,
          start: event.start,
          end: event.end ?? null,
          label: event.title,
          detail: event.calendarName || "Google Agenda",
          kind: "Google" as const,
          location: event.location ?? null,
          href: event.htmlLink ?? null,
          allDay: event.allDay,
          calendarName: event.calendarName,
        }));
      } catch {
        // L'état détaillé du connecteur est affiché séparément via healthQuery.
      }
      return {
        entries: [...local.entries, ...googleEntries].sort((a, b) => a.start.localeCompare(b.start)),
        warnings: local.warnings,
      };
    },
    staleTime: 45_000,
    retry: false,
    refetchOnWindowFocus: true,
  });

  const entries = agendaQuery.data?.entries ?? [];
  const warnings = agendaQuery.data?.warnings ?? [];
  const googleConnected = healthQuery.data?.calendar === true;
  const googleDetail = healthQuery.data?.calendarDetail ?? "Vérification de Google Agenda…";
  const weekStart = startOfWeek(cursorDate);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const monthStart = startOfMonthGrid(cursorDate);
  const monthDays = Array.from({ length: 42 }, (_, index) => addDays(monthStart, index));
  const selectedKey = dateKey(cursorDate);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entries) {
      const key = dateKey(new Date(entry.start));
      const list = map.get(key) ?? [];
      list.push(entry);
      list.sort((a, b) => a.start.localeCompare(b.start));
      map.set(key, list);
    }
    return map;
  }, [entries]);

  const selectedEntries = entriesByDay.get(selectedKey) ?? [];
  const upcoming = entries.filter((entry) => new Date(entry.start).getTime() >= Date.now()).slice(0, 10);
  const googleCount = entries.filter((entry) => entry.kind === "Google").length;

  const move = (direction: -1 | 1) => {
    setCursorDate((current) => {
      if (view === "month") return new Date(current.getFullYear(), current.getMonth() + direction, 1);
      return addDays(current, direction * (view === "week" ? 7 : 1));
    });
  };

  const refreshAll = async () => {
    await Promise.all([agendaQuery.refetch(), healthQuery.refetch()]);
  };

  const EventCard = ({ entry, compact = false }: { entry: Entry; compact?: boolean }) => (
    <article className={`group rounded-xl border p-3 ${kindClass[entry.kind]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={`${compact ? "text-xs" : "text-sm"} truncate font-semibold text-foreground`}>{entry.label}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{formatTime(entry.start, entry.allDay)}{entry.end && !entry.allDay ? ` – ${formatTime(entry.end)}` : ""}</span>
            {entry.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{entry.location}</span> : null}
            {entry.calendarName ? <span>{entry.calendarName}</span> : null}
          </div>
        </div>
        {entry.href ? <a href={entry.href} target="_blank" rel="noreferrer" aria-label="Ouvrir dans Google Agenda" className="rounded-lg p-1.5 text-muted-foreground opacity-60 transition hover:bg-background hover:text-foreground group-hover:opacity-100"><ExternalLink className="h-3.5 w-3.5" /></a> : null}
      </div>
    </article>
  );

  return (
    <div className="space-y-5">
      <AddressLookupCard />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">Google Agenda</p>
          <div className="mt-2 flex items-center gap-2">
            {healthQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : googleConnected ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
            <p className="font-semibold">{healthQuery.isLoading ? "Vérification…" : googleConnected ? "Synchronisé" : "Non relié"}</p>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{googleDetail}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">Événements Google chargés</p><p className="mt-2 font-display text-2xl font-bold">{googleCount}</p><p className="mt-1 text-xs text-muted-foreground">Tous les calendriers sélectionnés.</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">Prochaines entrées</p><p className="mt-2 font-display text-2xl font-bold">{upcoming.length}</p><p className="mt-1 text-xs text-muted-foreground">Google + échéances Flamme OS.</p></div>
      </div>

      <AdminCard className="overflow-hidden p-0">
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">Planning central</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-[-.04em] text-foreground">Agenda</h2>
              <p className="mt-1 text-sm text-muted-foreground">Google Calendar, projets, tâches, publications et studio dans une seule vue.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-border bg-muted/50 p-1">
                {(["day", "week", "month"] as const).map((mode) => <button key={mode} onClick={() => setView(mode)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${view === mode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{mode === "day" ? "Jour" : mode === "week" ? "Semaine" : "Mois"}</button>)}
              </div>
              <Button variant="outline" size="sm" onClick={refreshAll}><RefreshCw className={`mr-2 h-4 w-4 ${agendaQuery.isFetching || healthQuery.isFetching ? "animate-spin" : ""}`} />Actualiser</Button>
              <Button asChild size="sm"><a href="https://calendar.google.com/calendar/u/0/r/eventedit" target="_blank" rel="noreferrer"><Plus className="mr-2 h-4 w-4" />Nouvel événement</a></Button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => move(-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCursorDate(new Date())}>Aujourd’hui</Button>
              <Button variant="outline" size="icon" onClick={() => move(1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <p className="text-right text-sm font-semibold capitalize text-foreground">
              {view === "day" ? formatLongDate(cursorDate) : view === "week" ? `${weekDays[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}` : cursorDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {warnings.length > 0 ? <div className="mx-4 mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm"><div className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-semibold">Données internes partiellement chargées</p>{warnings.map((warning) => <p key={warning} className="mt-1 text-muted-foreground">{warning}</p>)}</div></div></div> : null}

        {agendaQuery.isLoading ? <div className="flex min-h-72 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Chargement du planning…</div> : view === "day" ? (
          <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_22rem] sm:p-5">
            <div>
              <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-bold capitalize">{formatLongDate(cursorDate)}</h3><span className="text-xs text-muted-foreground">{selectedEntries.length} élément{selectedEntries.length > 1 ? "s" : ""}</span></div>
              <div className="rounded-2xl border border-border bg-background p-3">
                <div className="space-y-2">{selectedEntries.length ? selectedEntries.map((entry) => <EventCard key={entry.id} entry={entry} />) : <div className="grid min-h-64 place-items-center text-sm text-muted-foreground">Journée libre.</div>}</div>
              </div>
            </div>
            <div><h3 className="mb-3 font-display text-base font-bold">À venir</h3><div className="space-y-2">{upcoming.length ? upcoming.map((entry) => <EventCard key={entry.id} entry={entry} compact />) : <p className="text-sm text-muted-foreground">Aucune échéance prochaine.</p>}</div></div>
          </div>
        ) : view === "week" ? (
          <div className="overflow-x-auto p-4 sm:p-5">
            <div className="grid min-w-[920px] grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const key = dateKey(day);
                const dayEntries = entriesByDay.get(key) ?? [];
                const isToday = key === dateKey(new Date());
                return <section key={key} className={`min-h-[32rem] rounded-2xl border p-2.5 ${isToday ? "border-primary/40 bg-primary/5" : "border-border bg-background"}`}>
                  <button onClick={() => { setCursorDate(day); setView("day"); }} className="mb-3 w-full rounded-xl px-2 py-2 text-left hover:bg-muted"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">{day.toLocaleDateString("fr-FR", { weekday: "short" })}</p><p className={`mt-1 font-display text-xl font-bold ${isToday ? "text-primary" : "text-foreground"}`}>{day.getDate()}</p></button>
                  <div className="space-y-2">{dayEntries.map((entry) => <EventCard key={entry.id} entry={entry} compact />)}</div>
                </section>;
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto p-4 sm:p-5">
            <div className="grid min-w-[900px] grid-cols-7 border-l border-t border-border">
              {monthDays.map((day) => {
                const key = dateKey(day);
                const dayEntries = entriesByDay.get(key) ?? [];
                const inMonth = day.getMonth() === cursorDate.getMonth();
                const isToday = key === dateKey(new Date());
                return <button key={key} onClick={() => { setCursorDate(day); setView("day"); }} className={`min-h-36 border-b border-r border-border p-2 text-left transition hover:bg-muted/60 ${inMonth ? "bg-background" : "bg-muted/25 text-muted-foreground"}`}>
                  <span className={`inline-grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${isToday ? "bg-primary text-primary-foreground" : ""}`}>{day.getDate()}</span>
                  <div className="mt-2 space-y-1">{dayEntries.slice(0, 3).map((entry) => <div key={entry.id} className={`truncate rounded-md border px-1.5 py-1 text-[10px] ${kindClass[entry.kind]}`}>{entry.allDay ? "" : `${formatTime(entry.start)} `}{entry.label}</div>)}{dayEntries.length > 3 ? <p className="px-1 text-[10px] font-semibold text-muted-foreground">+ {dayEntries.length - 3} autre{dayEntries.length - 3 > 1 ? "s" : ""}</p> : null}</div>
                </button>;
              })}
            </div>
          </div>
        )}
      </AdminCard>

      {!healthQuery.isLoading && !googleConnected ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><p className="font-semibold text-foreground">Google Agenda n’est pas synchronisé</p><p className="mt-1 text-sm text-muted-foreground">{googleDetail}</p><Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.href = "/admin?tab=connexions"}>Ouvrir Connexions</Button></div></div>
        </div>
      ) : null}
    </div>
  );
}
