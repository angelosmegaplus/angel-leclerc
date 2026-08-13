import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, RefreshCw } from "lucide-react";
import { applicationFields, listRows, str } from "@/lib/angelos";
import { Button } from "@/components/ui/button";
import { AdminCard } from "./AdminShell";
import { CrudModule } from "./CrudModule";

export function ApplicationsPanel() {
  const queryClient = useQueryClient();
  const { data: rows = [], isFetching } = useQuery({
    queryKey: ["angel", "applications"],
    queryFn: () => listRows("applications"),
  });

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: rows.length,
      waiting: rows.filter((row) => ["envoyee", "relance"].includes(str(row, "status"))).length,
      replies: rows.filter((row) => Boolean(str(row, "response"))).length,
      due: rows.filter((row) => {
        const followUp = str(row, "follow_up_at");
        return (
          followUp && followUp <= today && !["refusee", "acceptee"].includes(str(row, "status"))
        );
      }).length,
    };
  }, [rows]);

  return (
    <div className="space-y-4">
      <AdminCard className="border-primary/25 bg-primary/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <p className="font-display font-bold text-foreground">Suivi des candidatures</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              ChatGPT surveille les nouveaux e-mails chaque heure, consigne le bilan dans Angel OS
              et met à jour les réponses explicites liées aux candidatures. Aucun e-mail n'est
              envoyé automatiquement : vous gardez la décision finale.
            </p>
          </div>
          <Button
            variant="outline"
            className="min-h-11 shrink-0"
            disabled={isFetching}
            onClick={() => void queryClient.invalidateQueries({ queryKey: ["angel", "applications"] })}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Actualiser la liste
          </Button>
        </div>
      </AdminCard>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Total", stats.total],
          ["En attente", stats.waiting],
          ["Réponses", stats.replies],
          ["Relances dues", stats.due],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card px-3 py-2.5">
            <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
            <dd className="font-display text-xl font-bold tabular-nums text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      <CrudModule
        table="applications"
        entityLabel="Candidature"
        title="Candidatures BTS Communication"
        description="Entreprises contactées, relances, réponses et documents."
        fields={applicationFields}
        titleField="company"
        subtitleFields={["position", "city"]}
        statusField="status"
        duplicateKeys={["company", "email"]}
        filters={[
          { label: "À envoyer", test: (row) => str(row, "status") === "a_envoyer" },
          {
            label: "En attente",
            test: (row) => ["envoyee", "relance"].includes(str(row, "status")),
          },
          { label: "Entretien", test: (row) => str(row, "status") === "entretien" },
          { label: "Refusées", test: (row) => str(row, "status") === "refusee" },
        ]}
      />
    </div>
  );
}
