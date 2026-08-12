import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard } from "./AdminShell";
import { fmtDate } from "@/lib/angelos";

type Entry = {
  id: string;
  date: string;
  label: string;
  detail: string;
  kind: string;
};

const anyDb = supabase as unknown as { from: (t: string) => any };

async function loadAgenda(): Promise<Entry[]> {
  const [articles, projects, tasks, applications, interviews] = await Promise.all([
    supabase
      .from("articles")
      .select("id,title,scheduled_at")
      .not("scheduled_at", "is", null),
    anyDb.from("projects").select("id,title,due_date,client_name").not("due_date", "is", null),
    anyDb.from("project_tasks").select("id,title,due_date").not("due_date", "is", null),
    anyDb
      .from("applications")
      .select("id,company,follow_up_at")
      .not("follow_up_at", "is", null),
    anyDb
      .from("interviews")
      .select("id,title,person,scheduled_at")
      .not("scheduled_at", "is", null),
  ]);

  const out: Entry[] = [];
  for (const a of articles.data ?? [])
    out.push({
      id: `art-${a.id}`,
      date: a.scheduled_at as string,
      label: a.title,
      detail: "Publication programmée",
      kind: "Blog",
    });
  for (const p of (projects.data ?? []) as any[])
    out.push({
      id: `pro-${p.id}`,
      date: p.due_date,
      label: p.title,
      detail: p.client_name ? `Mission · ${p.client_name}` : "Échéance de mission",
      kind: "Projet",
    });
  for (const t of (tasks.data ?? []) as any[])
    out.push({ id: `tsk-${t.id}`, date: t.due_date, label: t.title, detail: "Tâche", kind: "Tâche" });
  for (const c of (applications.data ?? []) as any[])
    out.push({
      id: `can-${c.id}`,
      date: c.follow_up_at,
      label: c.company,
      detail: "Relance de candidature",
      kind: "Alternance",
    });
  for (const i of (interviews.data ?? []) as any[])
    out.push({
      id: `itw-${i.id}`,
      date: i.scheduled_at,
      label: i.title,
      detail: i.person ? `Interview · ${i.person}` : "Interview",
      kind: "Studio",
    });

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function AgendaPanel() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["angel", "agenda"],
    queryFn: loadAgenda,
  });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = data.filter((e) => e.date.slice(0, 10) >= today);
  const past = data.filter((e) => e.date.slice(0, 10) < today).slice(-10).reverse();

  const list = (entries: Entry[]) => (
    <ul className="space-y-2">
      {entries.map((e) => (
        <li
          key={e.id}
          className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
        >
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="font-medium text-foreground">{e.label}</p>
            <p className="text-sm text-muted-foreground">
              {fmtDate(e.date)} · {e.detail}
            </p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/70">
            {e.kind}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-4">
      <AdminCard
        title="Agenda"
        description="Toutes les échéances du site réunies : publications programmées, missions, tâches, relances et interviews."
      >
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune échéance à venir.</p>
        ) : (
          list(upcoming)
        )}
      </AdminCard>

      {past.length > 0 && (
        <AdminCard title="Passé récent" description="Les dix dernières échéances.">
          {list(past)}
        </AdminCard>
      )}
    </div>
  );
}