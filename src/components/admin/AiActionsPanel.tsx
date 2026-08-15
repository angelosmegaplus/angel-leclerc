import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AdminCard } from "./AdminShell";
import { AdminStatus, type AdminStatusTone } from "./AdminStatus";

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

async function approveAction(action: AiAction): Promise<{ message: string; status: string }> {
  const payload = (action.payload ?? {}) as Record<string, unknown>;
  if (action.target_type === "article" && action.target_id) {
    const patch = payload.article_patch;
    if (patch && typeof patch === "object") {
      const { error } = await supabase.from("articles").update(patch as never).eq("id", action.target_id);
      if (error) throw error;
      return { message: "Article mis à jour.", status: "completed" };
    }
  }
  return {
    message: "Action validée et mise en file.",
    status: "awaiting_operator",
  };
}

function historyStatus(status: string): { label: string; tone: AdminStatusTone } {
  if (["completed", "approved", "ready", "published"].includes(status)) return { label: "Terminé", tone: "success" };
  if (["failed", "error"].includes(status)) return { label: "Erreur", tone: "error" };
  if (["rejected", "refused"].includes(status)) return { label: "Refusé", tone: "error" };
  return { label: "En attente", tone: "pending" };
}

export function AiActionsPanel() {
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState<string | null>(null);

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["ai-actions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_actions").select("*").order("created_at", { ascending: false }).limit(50);
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
      const { error } = await supabase.from("ai_actions").update({ status: finalStatus, resolved_at: resolvedAt, updated_at: new Date().toISOString() }).eq("id", action.id);
      if (error) throw error;
      return message;
    },
    onSuccess: (message) => {
      toast.success(message);
      void qc.invalidateQueries({ queryKey: ["ai-actions"] });
      void qc.invalidateQueries({ queryKey: ["admin-articles"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Échec"),
  });

  const pending = actions.filter((action) => action.status === "pending");
  const queued = actions.filter((action) => action.status === "awaiting_operator");
  const history = actions.filter((action) => !["pending", "awaiting_operator"].includes(action.status));

  return (
    <div className="space-y-4">
      <AdminCard title="Décisions IA" description="Angel OS IA propose ; tu valides ou refuses. Les actions sensibles demandent une confirmation supplémentaire.">
        {isLoading ? <p className="flex items-center gap-2 text-sm text-white/45"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p> : null}
        {!isLoading && pending.length === 0 ? <p className="text-sm text-white/45">Aucune décision en attente.</p> : null}
        <ul className="space-y-2">
          {pending.map((action) => (
            <li key={action.id} className="rounded-xl border border-white/10 bg-white/[.025] p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white sm:text-base">{action.title}</p>
                    <AdminStatus tone="pending" compact>En attente</AdminStatus>
                    {action.sensitive ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[.1em] text-red-300"><ShieldAlert className="h-3.5 w-3.5" /> sensible</span> : null}
                  </div>
                  {action.description ? <p className="mt-1 text-sm leading-relaxed text-white/50">{action.description}</p> : null}
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[.12em] text-white/30">{action.kind}</p>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  {action.sensitive && confirming !== action.id ? (
                    <Button size="sm" variant="outline" className="min-h-11 flex-1 sm:flex-none" onClick={() => setConfirming(action.id)}>Confirmer</Button>
                  ) : (
                    <Button size="sm" className="min-h-11 flex-1 sm:flex-none" disabled={resolve.isPending} onClick={() => resolve.mutate({ action, status: "approved" })}><Check className="mr-1.5 h-4 w-4" /> Valider</Button>
                  )}
                  <Button size="sm" variant="outline" className="min-h-11 flex-1 sm:flex-none" disabled={resolve.isPending} onClick={() => resolve.mutate({ action, status: "rejected" })}><X className="mr-1.5 h-4 w-4" /> Refuser</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </AdminCard>

      {queued.length > 0 ? (
        <AdminCard title="File IA" description="Actions validées qui attendent leur exécution.">
          <ul className="space-y-2">
            {queued.map((action) => <li key={action.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.025] px-3 py-3"><p className="min-w-0 truncate text-sm font-medium text-white">{action.title}</p><AdminStatus tone="pending" compact>En pause</AdminStatus></li>)}
          </ul>
        </AdminCard>
      ) : null}

      {history.length > 0 ? (
        <AdminCard title="Historique">
          <ul className="divide-y divide-white/10">
            {history.map((action) => {
              const status = historyStatus(action.status);
              return <li key={action.id} className="flex items-center justify-between gap-3 py-3"><span className="min-w-0 truncate text-sm text-white/75">{action.title}</span><AdminStatus tone={status.tone} compact>{status.label}</AdminStatus></li>;
            })}
          </ul>
        </AdminCard>
      ) : null}
    </div>
  );
}
