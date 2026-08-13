import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Briefcase,
  Check,
  Clock3,
  Inbox,
  Loader2,
  MailCheck,
  RefreshCw,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { syncGoogleApplications } from "@/lib/applications.functions";
import { listRows, str, type Row } from "@/lib/angelos";
import { Button } from "@/components/ui/button";
import { AdminCard } from "./AdminShell";

type AiAction = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  sensitive: boolean;
  created_at: string;
};

type ContactRequest = {
  id: string;
  full_name: string;
  project_type: string;
  is_read: boolean;
  created_at: string;
};

function sameDay(value: string | undefined, day: string) {
  return Boolean(value && value.slice(0, 10) === day);
}

export function DailyCockpit() {
  const sync = useServerFn(syncGoogleApplications);
  const qc = useQueryClient();
  const autoStarted = useRef(false);
  const today = new Date().toISOString().slice(0, 10);

  const { data: applications = [] } = useQuery({
    queryKey: ["angel", "applications"],
    queryFn: () => listRows("applications"),
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["angel", "activity_log"],
    queryFn: () => listRows("activity_log"),
  });

  const { data: actions = [] } = useQuery({
    queryKey: ["ai-actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_actions")
        .select("id, title, description, status, sensitive, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as AiAction[];
    },
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["admin-contact-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_requests")
        .select("id, full_name, project_type, is_read, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as ContactRequest[];
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => sync(),
    onSuccess: (result) => {
      if (result.status === "completed") toast.success(result.message);
      else if (result.status === "partial") toast.warning(result.message);
      void qc.invalidateQueries({ queryKey: ["angel", "applications"] });
      void qc.invalidateQueries({ queryKey: ["angel", "activity_log"] });
    },
    onError: () => {
      // Le cockpit reste utile même si Gmail n'est pas connecté.
    },
  });

  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    syncMutation.mutate();
  }, [syncMutation]);

  const resolve = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("ai_actions")
        .update({ status, resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.status === "approved" ? "Action validée." : "Action refusée.");
      void qc.invalidateQueries({ queryKey: ["ai-actions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const stats = useMemo(() => {
    const sentToday = applications.filter((row) => sameDay(str(row, "sent_at"), today)).length;
    const replies = applications.filter((row) => Boolean(str(row, "response"))).length;
    const refusals = applications.filter((row) => str(row, "status") === "refusee").length;
    const accepted = applications.filter((row) => str(row, "status") === "acceptee").length;
    const followUps = applications.filter((row) => {
      const due = str(row, "follow_up_at");
      return due && due <= today && !["refusee", "acceptee"].includes(str(row, "status"));
    }).length;
    const unread = contacts.filter((item) => !item.is_read).length;
    const todayActivity = activity.filter((row) => sameDay(str(row, "created_at"), today)).length;
    return { sentToday, replies, refusals, accepted, followUps, unread, todayActivity };
  }, [activity, applications, contacts, today]);

  const recentReplies = applications
    .filter((row) => Boolean(str(row, "response")))
    .slice(0, 4);
  const pending = actions.filter((action) => action.status === "pending").slice(0, 4);

  return (
    <div className="space-y-4">
      <AdminCard className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">Bilan du jour</h2>
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Angel OS rassemble ici ce qui mérite votre attention. Vous arbitrez ; les détails
              techniques restent derrière.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="min-h-10 shrink-0"
            disabled={syncMutation.isPending}
            onClick={() => syncMutation.mutate()}
          >
            {syncMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualiser
          </Button>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {[
            ["Envoyées aujourd'hui", stats.sentToday, MailCheck],
            ["Réponses", stats.replies, Inbox],
            ["Relances dues", stats.followUps, RotateCcw],
            ["Refus", stats.refusals, X],
            ["Acceptées", stats.accepted, Check],
            ["Messages non lus", stats.unread, Inbox],
            ["Actions tracées", stats.todayActivity, Clock3],
          ].map(([label, value, Icon]) => (
            <div key={String(label)} className="rounded-xl border border-border/70 bg-background px-3 py-2.5">
              <dt className="flex items-center gap-1.5 text-[10px] font-medium leading-tight text-muted-foreground">
                <Icon className="h-3.5 w-3.5 shrink-0" /> {label}
              </dt>
              <dd className="mt-1 font-display text-xl font-bold tabular-nums text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard
          title="Candidatures à surveiller"
          description="Réponses détectées et relances qui demandent votre attention."
        >
          {recentReplies.length === 0 && stats.followUps === 0 ? (
            <p className="text-sm text-muted-foreground">Rien d'urgent côté candidatures pour le moment.</p>
          ) : (
            <ul className="space-y-2">
              {recentReplies.map((row: Row) => (
                <li key={row.id} className="rounded-xl border border-border/70 bg-background p-3">
                  <div className="flex items-start gap-2">
                    <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{str(row, "company") || "Entreprise"}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{str(row, "response")}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                        {str(row, "status") || "réponse reçue"}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
              {stats.followUps > 0 && (
                <li className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-foreground">
                  {stats.followUps} relance{stats.followUps > 1 ? "s" : ""} à traiter.
                </li>
              )}
            </ul>
          )}
          <Button asChild variant="outline" size="sm" className="mt-4 min-h-10">
            <a href="/admin?tab=candidatures">Voir les candidatures</a>
          </Button>
        </AdminCard>

        <AdminCard
          title="Décisions à prendre"
          description="Vous validez ou refusez ici ; l'historique reste tracé."
        >
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune décision en attente.</p>
          ) : (
            <ul className="space-y-2">
              {pending.map((action) => (
                <li key={action.id} className="rounded-xl border border-border/70 bg-background p-3">
                  <p className="font-medium text-foreground">{action.title}</p>
                  {action.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="min-h-9"
                      disabled={resolve.isPending || action.sensitive}
                      title={action.sensitive ? "Action sensible : ouvrir la file complète pour confirmer." : undefined}
                      onClick={() => resolve.mutate({ id: action.id, status: "approved" })}
                    >
                      <Check className="mr-1.5 h-4 w-4" /> Valider
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-9"
                      disabled={resolve.isPending}
                      onClick={() => resolve.mutate({ id: action.id, status: "rejected" })}
                    >
                      <X className="mr-1.5 h-4 w-4" /> Refuser
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="outline" size="sm" className="mt-4 min-h-10">
            <a href="/admin?tab=angel-ai">Ouvrir Angel AI</a>
          </Button>
        </AdminCard>
      </div>
    </div>
  );
}
