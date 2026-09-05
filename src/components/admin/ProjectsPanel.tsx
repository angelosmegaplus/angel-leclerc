import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, CheckCircle2, CircleDot, FolderKanban, ListTodo } from "lucide-react";
import { CrudModule } from "./CrudModule";
import { AdminCard } from "./AdminShell";
import { OrdersTracker } from "./OrdersTracker";
import {
  alcProjectFields,
  taskFields,
  listRows,
  str,
  type Row,
} from "@/lib/angelos";

const VIEWS = [
  { key: "overview", label: "Tableau" },
  { key: "projects", label: "Projets" },
  { key: "tasks", label: "Tâches" },
  { key: "orders", label: "Commandes" },
] as const;

type View = typeof VIEWS[number]["key"];

function shortDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function ProjectOverview() {
  const projectsQuery = useQuery({ queryKey: ["flamme-os", "projects", "overview"], queryFn: () => listRows("projects") });
  const tasksQuery = useQuery({ queryKey: ["flamme-os", "project-tasks", "overview"], queryFn: () => listRows("project_tasks") });
  const projects = projectsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const activeProjects = projects.filter((row) => str(row, "status") !== "termine");
  const openTasks = tasks.filter((row) => str(row, "status") !== "termine");
  const overdueTasks = openTasks.filter((row) => {
    const due = str(row, "due_date");
    return Boolean(due) && new Date(due).getTime() < Date.now();
  });

  const columns = useMemo(() => [
    { key: "a_faire", label: "À faire", icon: CircleDot, rows: tasks.filter((row) => !str(row, "status") || str(row, "status") === "a_faire") },
    { key: "en_cours", label: "En cours", icon: ListTodo, rows: tasks.filter((row) => str(row, "status") === "en_cours") },
    { key: "termine", label: "Terminé", icon: CheckCircle2, rows: tasks.filter((row) => str(row, "status") === "termine") },
  ], [tasks]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            ["Projets actifs", activeProjects.length, FolderKanban],
            ["Tâches ouvertes", openTasks.length, ListTodo],
            ["En retard", overdueTasks.length, CalendarDays],
            ["Terminées", tasks.filter((row) => str(row, "status") === "termine").length, CheckCircle2],
          ] as [string, number, LucideIcon][]
        ).map(([label, value, Icon]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
            <p className="mt-3 font-display text-2xl font-bold tracking-[-.04em] text-foreground">{String(value)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{String(label)}</p>
          </div>
        ))}
      </div>

      <AdminCard title="Projets actifs" description="Les missions et projets personnels qui demandent encore une action.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {activeProjects.slice(0, 9).map((row) => (
            <article key={str(row, "id") || str(row, "title")} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{str(row, "title") || "Projet"}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{str(row, "client_name") || "Projet personnel"}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{str(row, "status") === "en_cours" ? "En cours" : "À faire"}</span>
              </div>
              {str(row, "due_date") ? <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />Échéance {shortDate(str(row, "due_date"))}</p> : null}
            </article>
          ))}
          {activeProjects.length === 0 ? <p className="text-sm text-muted-foreground">Aucun projet actif.</p> : null}
        </div>
      </AdminCard>

      <AdminCard title="Tableau des tâches" description="Vue Kanban compacte pour voir immédiatement où en est le travail.">
        <div className="grid gap-3 lg:grid-cols-3">
          {columns.map(({ key, label, icon: Icon, rows }) => (
            <section key={key} className="rounded-2xl border border-border bg-background p-3">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold text-foreground">{label}</h3></div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{rows.length}</span>
              </div>
              <div className="mt-3 space-y-2">
                {rows.slice(0, 6).map((row) => (
                  <article key={str(row, "id") || str(row, "title")} className="rounded-xl border border-border bg-card p-3">
                    <p className="text-sm font-medium text-foreground">{str(row, "title") || "Tâche"}</p>
                    {str(row, "due_date") ? <p className="mt-1 text-[11px] text-muted-foreground">{shortDate(str(row, "due_date"))}</p> : null}
                  </article>
                ))}
                {rows.length === 0 ? <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">Rien ici.</p> : null}
              </div>
            </section>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}

export function ProjectsPanel() {
  const [view, setView] = useState<View>("overview");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Vue des projets">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={view === v.key}
            onClick={() => setView(v.key)}
            className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${
              view === v.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "orders" ? <OrdersTracker /> : view === "overview" ? <ProjectOverview /> : view === "projects" ? (
        <CrudModule
          table="projects"
          entityLabel="Projet"
          title="Projets"
          description="Créer, modifier et suivre les projets et missions."
          fields={alcProjectFields}
          titleField="title"
          subtitleFields={["client_name", "due_date"]}
          statusField="status"
          duplicateKeys={["title"]}
          filters={[
            { label: "En cours", test: (r) => str(r, "status") === "en_cours" },
            { label: "À faire", test: (r) => str(r, "status") === "a_faire" },
            { label: "Terminés", test: (r) => str(r, "status") === "termine" },
          ]}
          renderExtra={(row: Row) => {
            const cents = Number(row["amount_cents"] ?? 0);
            const payment = str(row, "payment_status");
            const paymentLabel = payment === "devis" ? "Devis envoyé" : payment === "acompte" ? "Acompte reçu" : payment === "solde" ? "Soldé" : "";
            if (!cents && !paymentLabel) return null;
            return (
              <p className="mt-2 text-sm font-medium text-foreground">
                {cents ? (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" }) : "Montant non renseigné"}
                {paymentLabel ? <span className="ml-2 text-xs font-normal text-muted-foreground">· {paymentLabel}</span> : null}
              </p>
            );
          }}
        />
      ) : (
        <CrudModule
          table="project_tasks"
          entityLabel="Tâche"
          title="Tâches"
          description="Créer et modifier les actions reliées aux projets ou indépendantes."
          fields={taskFields}
          titleField="title"
          subtitleFields={["due_date"]}
          statusField="status"
          filters={[
            { label: "À faire", test: (r) => str(r, "status") === "a_faire" },
            { label: "En cours", test: (r) => str(r, "status") === "en_cours" },
            { label: "Terminées", test: (r) => str(r, "status") === "termine" },
          ]}
        />
      )}
    </div>
  );
}
