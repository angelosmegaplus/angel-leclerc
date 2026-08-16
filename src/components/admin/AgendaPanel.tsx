import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard } from "./AdminShell";
import { fmtDate } from "@/lib/angelos";
import { listGoogleCalendarEvents } from "@/lib/google-workspace.functions";

type Entry = {
  id: string;
  date: string;
  label: string;
  detail: string;
  kind: string;
};

const anyDb = supabase as unknown as { from: (t: string) => any };

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function loadLocalAgenda(): Promise<Entry[]> {
  const [articles, projects, tasks, applications, interviews] = await Promise.all([
    supabase.from("articles").select("id,title,scheduled_at").not("scheduled_at", "is", null),
    anyDb.from("projects").select("id,title,due_date,client_name").not("due_date", "is", null),
    anyDb.from("project_tasks").select("id,title,due_date").not("due_date", "is", null),
    anyDb.from("applications").select("id,company,follow_up_at").not("follow_up_at", "is", null),
    anyDb.from("interviews").select("id,title,person,scheduled_at").not("scheduled_at", "is", null),
  ]);

  const out: Entry[] = [];
  for (const article of articles.data ?? []) out.push({ id: `art-${article.id}`, date: article.scheduled_at as string, label: article.title, detail: "Publication programmée", kind: "Blog" });
  for (const project of (projects.data ?? []) as any[]) out.push({ id: `pro-${project.id}`, date: project.due_date, label: project.title, detail: project.client_name ? `Mission · ${project.client_name}` : "Échéance de mission", kind: "Projet" });
  for (const task of (tasks.data ?? []) as any[]) out.push({ id: `tsk-${task.id}`, date: task.due_date, label: task.title, detail: "Tâche", kind: "Tâche" });
  for (const application of (applications.data ?? []) as any[]) out.push({ id: `can-${application.id}`, date: application.follow_up_at, label: application.company, detail: "Relance de candidature", kind: "Alternance" });
  for (const interview of (interviews.data ?? []) as any[]) out.push({ id: `itw-${interview.id}`, date: interview.scheduled_at, label: interview.title, detail: interview.person ? `Interview · ${interview.person}` : "Interview", kind: "Studio" });
  return out;
}

export function AgendaPanel() {
  const loadGoogleCalendar = useServerFn(listGoogleCalendarEvents);
  const { data = [], isLoading } = useQuery({
    queryKey: ["angel", "agenda", "live-google"],
    queryFn: async () => {
      const [local, google] = await Promise.all([
        loadLocalAgenda(),
        loadGoogleCalendar().catch(() => []),
      ]);
      const googleEntries: Entry[] = google.map((event) => ({
        id: `google-${event.id}`,
        date: event.start,
        label: event.title,
        detail: event.location ? `Google Agenda · ${event.location}` : "Google Agenda",
        kind: "Google",
      }));
      return [...local, ...googleEntries].sort((a, b) => a.date.localeCompare(b.date));
    },
    staleTime: 2 * 60 * 1000,
  });

  const today = localDateKey();
  const upcoming = data.filter((entry) => entry.date.slice(0, 10) >= today);
  const past = data.filter((entry) => entry.date.slice(0, 10) < today).slice(-10).reverse();

  const list = (entries: Entry[]) => (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-xl border border-white/10 bg-white/[.025] p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 break-words text-sm font-semibold text-white sm:text-base">{entry.label}</p>
                <span className="shrink-0 rounded-lg border border-white/10 bg-white/[.035] px-2 py-1 text-[10px] font-semibold uppercase tracking-[.08em] text-white/45">{entry.kind}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-white/45 sm:text-sm">{fmtDate(entry.date)} · {entry.detail}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-4">
      <AdminCard title="Agenda" description="Publications, missions, tâches, relances et Google Calendar réunis au même endroit, avec lecture directe lorsque Google Workspace est connecté.">
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-white/45"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-white/45">Aucune échéance à venir.</p>
        ) : list(upcoming)}
      </AdminCard>

      {past.length > 0 ? <AdminCard title="Passé récent" description="Les dix dernières échéances.">{list(past)}</AdminCard> : null}
    </div>
  );
}
