import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, CalendarDays, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard } from "./AdminShell";
import { fmtDate } from "@/lib/angelos";
import { listGoogleCalendarEvents } from "@/lib/google-workspace.functions";
import { ConnectionEmptyState } from "./ConnectionEmptyState";

type Entry = {
  id: string;
  date: string;
  label: string;
  detail: string;
  kind: string;
};

type AgendaData = {
  entries: Entry[];
  warnings: string[];
  googleConnected: boolean;
};

const anyDb = supabase as unknown as { from: (t: string) => any };

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function loadLocalAgenda(): Promise<AgendaData> {
  const queries = await Promise.allSettled([
    supabase.from("articles").select("id,title,scheduled_at").not("scheduled_at", "is", null),
    anyDb.from("projects").select("id,title,due_date,client_name").not("due_date", "is", null),
    anyDb.from("project_tasks").select("id,title,due_date").not("due_date", "is", null),
    anyDb.from("applications").select("id,company,follow_up_at").not("follow_up_at", "is", null),
    anyDb.from("interviews").select("id,title,person,scheduled_at").not("scheduled_at", "is", null),
  ]);

  const labels = ["publications", "projets", "tâches", "candidatures", "interviews"];
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

  const [articles, projects, tasks, applications, interviews] = rows;
  const out: Entry[] = [];
  for (const article of articles) if (article.scheduled_at) out.push({ id: `art-${article.id}`, date: article.scheduled_at, label: article.title, detail: "Publication programmée", kind: "Blog" });
  for (const project of projects) if (project.due_date) out.push({ id: `pro-${project.id}`, date: project.due_date, label: project.title, detail: project.client_name ? `Mission · ${project.client_name}` : "Échéance de mission", kind: "Projet" });
  for (const task of tasks) if (task.due_date) out.push({ id: `tsk-${task.id}`, date: task.due_date, label: task.title, detail: "Tâche", kind: "Tâche" });
  for (const application of applications) if (application.follow_up_at) out.push({ id: `can-${application.id}`, date: application.follow_up_at, label: application.company, detail: "Relance de candidature", kind: "Alternance" });
  for (const interview of interviews) if (interview.scheduled_at) out.push({ id: `itw-${interview.id}`, date: interview.scheduled_at, label: interview.title, detail: interview.person ? `Interview · ${interview.person}` : "Interview", kind: "Studio" });
  return { entries: out, warnings, googleConnected: false };
}

export function AgendaPanel() {
  const loadGoogleCalendar = useServerFn(listGoogleCalendarEvents);
  const { data, isLoading } = useQuery({
    queryKey: ["angel", "agenda", "live-google"],
    queryFn: async (): Promise<AgendaData> => {
      const local = await loadLocalAgenda();
      let googleEntries: Entry[] = [];
      const warnings = [...local.warnings];
      let googleConnected = true;

      try {
        const google = await loadGoogleCalendar();
        googleEntries = google.map((event) => ({
          id: `google-${event.id}`,
          date: event.start,
          label: event.title,
          detail: event.location ? `Google Agenda · ${event.location}` : "Google Agenda",
          kind: "Google",
        }));
      } catch {
        googleConnected = false;
      }

      return {
        entries: [...local.entries, ...googleEntries].sort((a, b) => a.date.localeCompare(b.date)),
        warnings,
        googleConnected,
      };
    },
    staleTime: 2 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const entries = data?.entries ?? [];
  const warnings = data?.warnings ?? [];
  const googleConnected = data?.googleConnected ?? true;
  const today = localDateKey();
  const upcoming = entries.filter((entry) => entry.date.slice(0, 10) >= today);
  const past = entries.filter((entry) => entry.date.slice(0, 10) < today).slice(-10).reverse();

  const list = (items: Entry[]) => (
    <ul className="space-y-2">
      {items.map((entry) => (
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
      <AdminCard title="Agenda" description="Publications, missions, tâches, relances et Google Calendar réunis au même endroit.">
        {warnings.length > 0 ? (
          <div className="mb-4 rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-3 text-xs leading-relaxed text-amber-100/75 sm:text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold text-amber-100">Agenda partiellement synchronisé</p>
                {warnings.map((warning) => <p key={warning} className="mt-1">{warning}</p>)}
              </div>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-white/45"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-white/45">{warnings.length > 0 ? "Aucune échéance chargée pour le moment." : "Aucune échéance à venir."}</p>
        ) : list(upcoming)}

        {!isLoading && !googleConnected ? (
          <div className="mt-4">
            <ConnectionEmptyState
              title="Aucun agenda externe connecté"
              description="Seules les échéances internes d’Angel OS sont affichées. Connecte Google Agenda (ou Outlook lorsqu’il sera disponible) pour voir aussi tes rendez-vous."
            />
          </div>
        ) : null}
      </AdminCard>

      {past.length > 0 ? <AdminCard title="Passé récent" description="Les dix dernières échéances.">{list(past)}</AdminCard> : null}
    </div>
  );
}
