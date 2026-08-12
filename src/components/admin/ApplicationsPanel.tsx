import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, CheckCircle2, Clock3, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { syncGoogleApplications } from "@/lib/applications.functions";
import { applicationFields, listRows, str } from "@/lib/angelos";
import { Button } from "@/components/ui/button";
import { AdminCard } from "./AdminShell";
import { CrudModule } from "./CrudModule";

export function ApplicationsPanel() {
  const sync = useServerFn(syncGoogleApplications);
  const queryClient = useQueryClient();
  const autoStarted = useRef(false);
  const { data: rows = [] } = useQuery({
    queryKey: ["angel", "applications"],
    queryFn: () => listRows("applications"),
  });

  const mutation = useMutation({
    mutationFn: () => sync(),
    onSuccess: (result) => {
      if (result.status === "completed") toast.success(result.message);
      else if (result.status === "partial") toast.warning(result.message);
      void queryClient.invalidateQueries({ queryKey: ["angel", "applications"] });
      void queryClient.invalidateQueries({ queryKey: ["integration-readiness"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    mutation.mutate();
  }, [mutation]);

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
              <p className="font-display font-bold text-foreground">Suivi assisté par Angel AI</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              À l'ouverture, Angel OS vérifie Gmail via la connexion Google officielle, importe les
              envois sans doublon et détecte les réponses explicites. Aucun email n'est envoyé.
            </p>
            {mutation.data && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                {mutation.data.status === "completed" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Clock3 className="h-3.5 w-3.5 text-amber-600" />
                )}
                {mutation.data.message}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            className="min-h-11 shrink-0"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Vérifier Gmail
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
