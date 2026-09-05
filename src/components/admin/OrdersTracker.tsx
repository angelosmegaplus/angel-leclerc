import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeEuro, CalendarDays, CheckCircle2, ListTodo, User } from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "./AdminShell";
import { Button } from "@/components/ui/button";
import { listRows, upsertRow, str, fmtDate, type Row } from "@/lib/angelos";

const PAYMENT_LABELS: Record<string, string> = {
  "": "Aucun devis envoyé",
  devis: "Devis envoyé",
  acompte: "Acompte reçu",
  solde: "Soldé",
};

const NEXT_STATUS: Record<string, { value: string; label: string }> = {
  a_faire: { value: "en_cours", label: "Démarrer" },
  idee: { value: "a_faire", label: "Valider la commande" },
  en_attente: { value: "en_cours", label: "Reprendre" },
  en_cours: { value: "termine", label: "Marquer terminé" },
};

function euros(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

/**
 * Suivi des commandes clients : ce qui a été demandé, pour quel budget,
 * ce qu'il reste à faire et où en est chaque mission.
 */
export function OrdersTracker() {
  const queryClient = useQueryClient();
  const [showDone, setShowDone] = useState(false);

  const projectsQuery = useQuery({ queryKey: ["flamme-os", "projects", "orders"], queryFn: () => listRows("projects") });
  const tasksQuery = useQuery({ queryKey: ["flamme-os", "project-tasks", "orders"], queryFn: () => listRows("project_tasks") });

  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => upsertRow("projects", { status }, id),
    onSuccess: () => {
      toast.success("Commande mise à jour.");
      void queryClient.invalidateQueries({ queryKey: ["flamme-os"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Mise à jour impossible"),
  });

  const orders = useMemo(() => {
    const projects = projectsQuery.data ?? [];
    const tasks = tasksQuery.data ?? [];
    return projects
      .filter((row) => Boolean(str(row, "client_name")))
      .filter((row) => (showDone ? true : str(row, "status") !== "termine" && str(row, "status") !== "archive"))
      .map((row) => {
        const id = str(row, "id");
        const linked = tasks.filter((task) => str(task, "project_id") === id);
        const done = linked.filter((task) => str(task, "status") === "termine").length;
        const next = linked.find((task) => str(task, "status") !== "termine");
        return { row, linked, done, next };
      });
  }, [projectsQuery.data, tasksQuery.data, showDone]);

  const totalCents = orders.reduce((sum, item) => sum + Number(item.row["amount_cents"] ?? 0), 0);
  const awaiting = orders.filter((item) => str(item.row, "payment_status") !== "solde").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {([
          ["Commandes suivies", String(orders.length), ListTodo],
          ["Budget engagé", euros(totalCents), BadgeEuro],
          ["Restent à encaisser", String(awaiting), CheckCircle2],
        ] as const).map(([label, value, Icon]) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
            <p className="mt-3 font-display text-xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <AdminCard
        title="Suivi des commandes"
        description="Ce qu’on vous a demandé, le budget prévu, ce qu’il reste à faire et l’état d’avancement. Créez une commande depuis l’onglet Projets en renseignant un client."
      >
        <div className="mb-3 flex justify-end">
          <Button size="sm" variant="outline" className="min-h-10 rounded-full" onClick={() => setShowDone((v) => !v)}>
            {showDone ? "Masquer les commandes terminées" : "Afficher les commandes terminées"}
          </Button>
        </div>

        <div className="space-y-3">
          {orders.map(({ row, linked, done, next }) => {
            const id = str(row, "id");
            const status = str(row, "status") || "a_faire";
            const cents = Number(row["amount_cents"] ?? 0);
            const progress = linked.length > 0 ? Math.round((done / linked.length) * 100) : status === "termine" ? 100 : 0;
            const step = NEXT_STATUS[status];
            return (
              <article key={id} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{str(row, "title") || "Commande"}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5" />{str(row, "client_name")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{cents ? euros(cents) : "Budget non renseigné"}</p>
                    <p className="text-[11px] text-muted-foreground">{PAYMENT_LABELS[str(row, "payment_status")] ?? ""}</p>
                  </div>
                </div>

                {str(row, "description") ? (
                  <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{str(row, "description")}</p>
                ) : null}

                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {linked.length > 0 ? `${done}/${linked.length} tâches terminées` : "Aucune tâche reliée à cette commande"}
                    {str(row, "due_date") ? ` · échéance ${fmtDate(row["due_date"])}` : ""}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                    {status === "en_cours" ? "En cours" : status === "termine" ? "Terminé" : status === "en_attente" ? "En attente" : "À faire"}
                  </span>
                  {next ? (
                    <span className="flex items-center gap-1.5 text-xs text-foreground">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      Prochaine action : {str(next, "title")}
                    </span>
                  ) : null}
                  {step && id ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-auto min-h-10 rounded-full"
                      disabled={advance.isPending}
                      onClick={() => advance.mutate({ id, status: step.value })}
                    >
                      {step.label}
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}

          {orders.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Aucune commande client pour l’instant. Ajoutez un projet avec un nom de client, un montant et une échéance
              depuis l’onglet Projets : il apparaîtra ici avec son avancement.
            </p>
          ) : null}
        </div>
      </AdminCard>
    </div>
  );
}
