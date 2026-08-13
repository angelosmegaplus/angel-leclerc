import { useState } from "react";
import { CrudModule } from "./CrudModule";
import { alcProjectFields, taskFields, str, type Row } from "@/lib/angelos";

const VIEWS = [
  { key: "projects", label: "Missions" },
  { key: "tasks", label: "Tâches" },
] as const;

export function ProjectsPanel() {
  const [view, setView] = useState<"projects" | "tasks">("projects");

  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="tablist" aria-label="Vue des projets">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={view === v.key}
            onClick={() => setView(v.key)}
            className={`min-h-11 flex-1 rounded-lg border px-4 text-sm font-medium sm:flex-none ${
              view === v.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input text-muted-foreground"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "projects" ? (
        <CrudModule
          table="projects"
          entityLabel="Projet"
          title="Missions et projets"
          description="Suivi des missions clients, du devis au solde."
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
            if (!cents) return null;
            return (
              <p className="mt-2 text-sm font-medium text-foreground">
                {(cents / 100).toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })}
              </p>
            );
          }}
        />
      ) : (
        <CrudModule
          table="project_tasks"
          entityLabel="Tâche"
          title="Tâches"
          description="Petites actions à cocher, reliées ou non à une mission."
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
