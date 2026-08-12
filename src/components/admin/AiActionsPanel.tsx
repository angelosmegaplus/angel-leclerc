import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, ShieldAlert, Trash2, X } from "lucide-react";
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
async function applyAction(action: AiAction) {
  const payload = (action.payload ?? {}) as Record<string, unknown>;
  if (action.target_type === "article" && action.target_id) {
    const patch = payload.article_patch;
    if (patch && typeof patch === "object") {
      const { error } = await supabase
        .from("articles")
        .update(patch as never)
        .eq("id", action.target_id);
      if (error) throw error;
      return "Article mis à jour.";
    }
  }
  return "Proposition validée.";
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
      if (status === "approved") message = await applyAction(action);
      const { error } = await supabase
        .from("ai_actions")
        .update({ status, resolved_at: new Date().toISOString() })
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

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_actions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-actions"] }),
  });

  const pending = actions.filter((a) => a.status === "pending");
  const history = actions.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-5">
      <AdminCard
        title="Angel AI — file d'actions"
        description="Propositions en attente de votre validation. Rien n'est appliqué sans un clic explicite ; les actions sensibles demandent une confirmation supplémentaire."
      >
        {isLoading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </p>
        )}
        {!isLoading && pending.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucune proposition en attente. La file est prête : les suggestions
            déposées ici (par vous ou par un assistant externe) apparaîtront
            automatiquement.
          </p>
        )}
        <ul className="space-y-3">
          {pending.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-border bg-background p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{a.title}</p>
                  {a.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {a.description}
                    </p>
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
                  <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {a.status === "approved" ? "validée" : "refusée"}
                  </span>
                  <button
                    type="button"
                    aria-label="Supprimer"
                    onClick={() => remove.mutate(a.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}
    </div>
  );
}