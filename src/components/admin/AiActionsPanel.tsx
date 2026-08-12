import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, Loader2, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AdminCard } from "./AdminShell";

type AiAction = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  payload: Record<string, unknown> | null;
  status: string;
  target_type: string | null;
  target_id: string | null;
  sensitive: boolean;
  created_at: string;
};

/** Applique localement une action sûre : mise à jour de champs d'un article brouillon. */
async function applyAction(action: AiAction): Promise<{ message: string; status: string }> {
  const payload = (action.payload ?? {}) as Record<string, unknown>;
  if (action.target_type === "article" && action.target_id) {
    const patch = payload.article_patch;
    if (patch && typeof patch === "object") {
      const { error } = await supabase
        .from("articles")
        .update(patch as never)
        .eq("id", action.target_id);
      if (error) throw error;
      return { message: "Article mis à jour.", status: "approved" };
    }
  }
  return {
    message:
      "Validation enregistrée. La demande attend maintenant sa prise en charge par l'opérateur IA.",
    status: "awaiting_operator",
  };
}

export function AiActionsPanel() {
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState<string | null>(null);

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["ai-actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as AiAction[];
    },
  });

  const resolve = useMutation({
    mutationFn: async ({
      action,
      status,
    }: {
      action: AiAction;
      status: "approved" | "rejected";
    }) => {
      let message = "Proposition refusée.";
      let finalStatus: string = status;
      if (status === "approved") {
        const outcome = await applyAction(action);
        message = outcome.message;
        finalStatus = outcome.status;
      }
      const { error } = await supabase
        .from("ai_actions")
        .update({ status: finalStatus, resolved_at: new Date().toISOString() })
        .eq("id", action.id);
      if (error) throw error;
      return message;
    },
    onSuccess: (message) => {
      toast.success(message);
      qc.invalidateQueries({ queryKey: ["ai-actions"] });
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Échec"),
  });

  const pending = actions.filter((a) => a.status === "pending");
  const history = actions.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-5">
      <AdminCard
        title="Angel AI — file d'actions"
        description="Les opérations locales sûres peuvent être exécutées immédiatement par le centre de commande. Cette file conserve les demandes qui nécessitent une validation ou un opérateur externe."
      >
        {isLoading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </p>
        )}
        {!isLoading && pending.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucune proposition en attente. La file est prête : les suggestions déposées ici (par
            vous ou par un assistant externe) apparaîtront automatiquement.
          </p>
        )}
        <ul className="space-y-3">
          {pending.map((a) => (
            <li key={a.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{a.title}</p>
                  {a.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                  )}
                  <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {a.kind}
                    {a.sensitive && (
                      <span className="ml-2 inline-flex items-center gap-1 text-destructive">
                        <ShieldAlert className="h-3 w-3" /> sensible
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  {a.sensitive && confirming !== a.id ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-10 flex-1 sm:flex-none"
                      onClick={() => setConfirming(a.id)}
                    >
                      Confirmer l'action sensible
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="min-h-10 flex-1 sm:flex-none"
                      disabled={resolve.isPending}
                      onClick={() => resolve.mutate({ action: a, status: "approved" })}
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      {a.sensitive ? "Oui, appliquer" : "Valider"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-10 flex-1 sm:flex-none"
                    disabled={resolve.isPending}
                    onClick={() => resolve.mutate({ action: a, status: "rejected" })}
                  >
                    <X className="mr-1.5 h-4 w-4" /> Refuser
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </AdminCard>

      {history.length > 0 && (
        <AdminCard title="Historique">
          <ul className="space-y-2">
            {history.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">{a.title}</span>
                <span className="flex items-center gap-2">
                  {a.status === "awaiting_operator" && (
                    <Clock3 className="h-3.5 w-3.5 text-amber-600" />
                  )}
                  <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {a.status === "approved"
                      ? "exécutée"
                      : a.status === "awaiting_operator"
                        ? "opérateur requis"
                        : "refusée"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}
    </div>
  );
}
