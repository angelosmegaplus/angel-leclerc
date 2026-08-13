import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, Clock3, Loader2, ShieldAlert, X } from "lucide-react";
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

/** Les actions purement locales peuvent être appliquées tout de suite. Les actions externes validées
 * sont placées dans la file IA et exécutées par l'opérateur horaire. */
async function approveAction(action: AiAction): Promise<{ message: string; status: string }> {
  const payload = (action.payload ?? {}) as Record<string, unknown>;
  if (action.target_type === "article" && action.target_id) {
    const patch = payload.article_patch;
    if (patch && typeof patch === "object") {
      const { error } = await supabase
        .from("articles")
        .update(patch as never)
        .eq("id", action.target_id);
      if (error) throw error;
      return { message: "Article mis à jour.", status: "completed" };
    }
  }
  return {
    message: "Validé : l'action est maintenant dans la file Angel AI et sera traitée au prochain passage.",
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
    refetchInterval: 60_000,
  });

  const resolve = useMutation({
    mutationFn: async ({ action, status }: { action: AiAction; status: "approved" | "rejected" }) => {
      let message = "Proposition refusée.";
      let finalStatus: string = status;
      let resolvedAt: string | null = new Date().toISOString();
      if (status === "approved") {
        const outcome = await approveAction(action);
        message = outcome.message;
        finalStatus = outcome.status;
        resolvedAt = finalStatus === "awaiting_operator" ? null : new Date().toISOString();
      }
      const { error } = await supabase
        .from("ai_actions")
        .update({ status: finalStatus, resolved_at: resolvedAt, updated_at: new Date().toISOString() })
        .eq("id", action.id);
      if (error) throw error;
      return message;
    },
    onSuccess: (message) => {
      toast.success(message);
      void qc.invalidateQueries({ queryKey: ["ai-actions"] });
      void qc.invalidateQueries({ queryKey: ["admin-articles"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Échec"),
  });

  const pending = actions.filter((a) => a.status === "pending");
  const queued = actions.filter((a) => a.status === "awaiting_operator");
  const history = actions.filter((a) => !["pending", "awaiting_operator"].includes(a.status));

  return (
    <div className="space-y-5">
      <AdminCard
        title="Angel AI — propositions"
        description="Je propose. Vous validez ou refusez. Une action validée rejoint la file IA et sera exécutée au prochain passage horaire, sans double exécution."
      >
        {isLoading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </p>
        )}
        {!isLoading && pending.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune proposition en attente de votre décision.</p>
        )}
        <ul className="space-y-3">
          {pending.map((a) => (
            <li key={a.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{a.title}</p>
                  {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
                  <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {a.kind}
                    {a.sensitive && (
                      <span className="ml-2 inline-flex items-center gap-1 text-destructive">
                        <ShieldAlert className="h-3 w-3" /> confirmation renforcée
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  {a.sensitive && confirming !== a.id ? (
                    <Button size="sm" variant="outline" className="min-h-10 flex-1 sm:flex-none" onClick={() => setConfirming(a.id)}>
                      Confirmer avant validation
                    </Button>
                  ) : (
                    <Button size="sm" className="min-h-10 flex-1 sm:flex-none" disabled={resolve.isPending} onClick={() => resolve.mutate({ action: a, status: "approved" })}>
                      <Check className="mr-1.5 h-4 w-4" /> {a.sensitive ? "Oui, mettre en file" : "Valider"}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="min-h-10 flex-1 sm:flex-none" disabled={resolve.isPending} onClick={() => resolve.mutate({ action: a, status: "rejected" })}>
                    <X className="mr-1.5 h-4 w-4" /> Refuser
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </AdminCard>

      {queued.length > 0 && (
        <AdminCard title="File IA" description="Actions que vous avez validées et qui attendent le prochain passage automatique.">
          <ul className="space-y-2">
            {queued.map((a) => (
              <li key={a.id} className="flex items-start gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">Validé — en attente d'exécution par Angel AI.</p>
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      {history.length > 0 && (
        <AdminCard title="Historique">
          <ul className="space-y-2">
            {history.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm">
                <span className="min-w-0 truncate">{a.title}</span>
                <span className="flex items-center gap-2">
                  {a.status === "completed" || a.status === "approved" ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : null}
                  <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {a.status === "completed" || a.status === "approved" ? "fait" : a.status === "failed" ? "échec" : "refusée"}
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