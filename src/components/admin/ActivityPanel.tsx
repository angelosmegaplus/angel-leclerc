import { useQuery } from "@tanstack/react-query";
import { Activity, Bell, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard } from "./AdminShell";

const anyDb = supabase as unknown as { from: (t: string) => any };

const ACTION_LABELS: Record<string, string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
};

const ENTITY_LABELS: Record<string, string> = {
  projects: "Projet",
  project_tasks: "Tâche",
  applications: "Candidature",
  contacts_sources: "Contact",
  reportages: "Reportage",
  interviews: "Interview",
  investigations: "Enquête",
  press_review: "Revue de presse",
  articles: "Article",
};

function when(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityPanel() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["angel", "activity_log"],
    queryFn: async () => {
      const { data, error } = await anyDb
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["angel", "notifications"],
    queryFn: async () => {
      const { data, error } = await anyDb
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  return (
    <div className="space-y-4">
      {notifications.length > 0 && (
        <AdminCard title="Notifications" description="Alertes internes d'Angel OS.">
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="flex items-start gap-3 rounded-lg border border-border p-3"
              >
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{n.title}</p>
                  {n.content && (
                    <p className="text-sm text-muted-foreground">{n.content}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {when(n.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      <AdminCard
        title="Journal d'activité"
        description="Historique des créations, modifications et suppressions dans Angel OS."
      >
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune activité enregistrée pour l'instant.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex items-start gap-3 rounded-lg border border-border p-3"
              >
                <Activity className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {ACTION_LABELS[e.action] ?? e.action} ·{" "}
                    {ENTITY_LABELS[e.entity_type] ?? e.entity_type}
                  </p>
                  {e.details?.title && (
                    <p className="truncate text-sm text-muted-foreground">
                      {e.details.title}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {when(e.created_at)} · {e.source === "ai" ? "Angel AI" : "Vous"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}