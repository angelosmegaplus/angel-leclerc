import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Check, CheckCircle2, Clock3, Loader2, Mail, Send, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { runAngelCommand } from "@/lib/angel-command.functions";
import { isArticleCommand, runArticleCommand } from "@/lib/article-command.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AdminCard } from "./AdminShell";

type Message = {
  id: string;
  content: string;
  response: string | null;
  status: string;
  context: Record<string, unknown> | null;
  created_at: string;
};

type HourlyMailReport = {
  id: number;
  generated_at: string;
  summary: string;
  items: Array<{ subject?: string; from?: string; category?: string; summary?: string }> | null;
  recommendations: Array<{ title?: string; detail?: string; action?: string }> | null;
};

type AiAction = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  status: string;
  sensitive: boolean;
  payload: Record<string, unknown> | null;
  created_at: string;
};

const EXAMPLES = [
  "Analyse mes candidatures",
  "Crée une tâche : relancer les candidatures arrivées à échéance",
  "Prépare un brouillon sur l'actualité locale",
];

export function AngelCommandCenter({ compact = false }: { compact?: boolean }) {
  const execute = useServerFn(runAngelCommand);
  const executeArticle = useServerFn(runArticleCommand);
  const queryClient = useQueryClient();
  const [command, setCommand] = useState("");

  const { data: reports = [] } = useQuery({
    queryKey: ["hourly-mail-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hourly_mail_reports")
        .select("id, generated_at, summary, items, recommendations")
        .order("generated_at", { ascending: false })
        .limit(compact ? 1 : 6);
      if (error) throw error;
      return (data ?? []) as unknown as HourlyMailReport[];
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: actions = [] } = useQuery({
    queryKey: ["ai-actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_actions")
        .select("id, kind, title, description, status, sensitive, payload, created_at")
        .in("status", ["pending", "awaiting_operator"])
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as unknown as AiAction[];
    },
    refetchInterval: 60_000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["angel-ai-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_messages")
        .select("id, content, response, status, context, created_at")
        .order("created_at", { ascending: false })
        .limit(compact ? 3 : 20);
      if (error) throw error;
      return (data ?? []) as unknown as Message[];
    },
  });

  const actionDecision = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "awaiting_operator" | "rejected" }) => {
      const { error } = await supabase
        .from("ai_actions")
        .update({
          status,
          resolved_at: status === "rejected" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("status", "pending");
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === "awaiting_operator"
          ? "Validé : ajouté à la file Angel AI."
          : "Proposition refusée.",
      );
      void queryClient.invalidateQueries({ queryKey: ["ai-actions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const mutation = useMutation({
    mutationFn: (value: string) =>
      isArticleCommand(value)
        ? executeArticle({ data: { command: value } })
        : execute({ data: { command: value } }),
    onSuccess: (result) => {
      setCommand("");
      if (result.status === "completed") toast.success("Commande exécutée et tracée.");
      else if (result.status === "partial") toast.warning("Commande mise en attente ou partiellement exécutée.");
      else toast.info("Commande enregistrée et tracée.");
      void queryClient.invalidateQueries({ queryKey: ["angel-ai-messages"] });
      void queryClient.invalidateQueries({ queryKey: ["ai-actions"] });
      void queryClient.invalidateQueries({ queryKey: ["angel"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submit = () => {
    const value = command.trim();
    if (value.length < 2 || mutation.isPending) return;
    mutation.mutate(value);
  };

  if (compact) {
    return (
      <section className="rounded-[1.75rem] border border-white/10 bg-[#090b0d] px-3 py-3 shadow-[0_18px_60px_rgba(0,0,0,.28)] sm:px-4 sm:py-4">
        <div className="flex items-center gap-2 px-1 pb-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300">
            <Bot className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Angel AI</p>
            <p className="truncate text-[11px] text-white/40">Demander, continuer une discussion ou lancer une action</p>
          </div>
        </div>

        <div className="relative">
          <Textarea
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submit();
            }}
            rows={1}
            maxLength={2_000}
            placeholder="Demander quelque chose à Angel AI…"
            className="min-h-12 resize-none rounded-full border-white/10 bg-black/30 py-3 pl-4 pr-14 text-sm text-white placeholder:text-white/30"
          />
          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={mutation.isPending || command.trim().length < 2}
            aria-label="Envoyer à Angel AI"
            className="absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-red-500 text-white hover:bg-red-500/90"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        {messages.length > 0 ? (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {messages.slice(0, 3).map((message) => (
              <button
                type="button"
                key={message.id}
                onClick={() => setCommand(message.content)}
                className="min-w-[13rem] max-w-[19rem] shrink-0 rounded-2xl border border-white/10 bg-white/[.03] px-3 py-2 text-left transition hover:border-red-500/20 hover:bg-red-500/[.04]"
              >
                <p className="truncate text-xs font-medium text-white/80">{message.content}</p>
                {message.response ? <p className="mt-1 line-clamp-1 text-[11px] text-white/35">{message.response}</p> : null}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {EXAMPLES.map((example) => (
              <button key={example} type="button" onClick={() => setCommand(example)} className="shrink-0 rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-[11px] text-white/45 hover:text-white/75">
                {example}
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  const latestReport = reports[0];
  const pendingActions = actions.filter((action) => action.status === "pending");
  const queuedActions = actions.filter((action) => action.status === "awaiting_operator");

  return (
    <AdminCard
      className="border-primary/30 bg-gradient-to-br from-primary/8 via-card to-card"
      title="Demander à Angel AI"
      description="Votre cockpit : bilan automatique, propositions à valider et commandes. Une proposition validée rejoint la file IA puis est exécutée au passage horaire suivant."
    >
      {latestReport && (
        <div className="mb-5 rounded-2xl border border-primary/25 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 font-display font-bold text-foreground">
              <Mail className="h-4 w-4 text-primary" /> Rapport mail horaire
            </p>
            <time className="text-[11px] text-muted-foreground">
              {new Date(latestReport.generated_at).toLocaleString("fr-FR")}
            </time>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{latestReport.summary}</p>

          {latestReport.items && latestReport.items.length > 0 && (
            <ul className="mt-3 space-y-2">
              {latestReport.items.slice(0, 8).map((item, index) => (
                <li key={`${item.subject ?? "mail"}-${index}`} className="rounded-xl border border-border/70 bg-background p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{item.subject || "Sans objet"}</span>
                    {item.category && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        {item.category}
                      </span>
                    )}
                  </div>
                  {item.from && <p className="mt-1 text-xs text-muted-foreground">De : {item.from}</p>}
                  {item.summary && <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>}
                </li>
              ))}
            </ul>
          )}

          {latestReport.recommendations && latestReport.recommendations.length > 0 && (
            <div className="mt-3 border-t border-border/70 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Conseils</p>
              <ul className="mt-2 space-y-1.5">
                {latestReport.recommendations.slice(0, 5).map((item, index) => (
                  <li key={`${item.title ?? "conseil"}-${index}`} className="text-sm text-foreground">
                    <span className="font-medium">{item.title || "À faire"}</span>
                    {item.detail ? ` — ${item.detail}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {(pendingActions.length > 0 || queuedActions.length > 0) && (
        <div className="mb-5 space-y-3">
          {pendingActions.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Propositions à valider</p>
              <ul className="mt-2 space-y-2">
                {pendingActions.slice(0, 8).map((action) => (
                  <li key={action.id} className="rounded-xl border border-border bg-background p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{action.title}</p>
                        {action.description && <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>}
                        {action.sensitive && <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-destructive">Action externe — votre clic vaut validation explicite</p>}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" className="min-h-9" disabled={actionDecision.isPending} onClick={() => actionDecision.mutate({ id: action.id, status: "awaiting_operator" })}>
                          <Check className="mr-1.5 h-4 w-4" /> Valider
                        </Button>
                        <Button size="sm" variant="outline" className="min-h-9" disabled={actionDecision.isPending} onClick={() => actionDecision.mutate({ id: action.id, status: "rejected" })}>
                          <X className="mr-1.5 h-4 w-4" /> Refuser
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {queuedActions.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Clock3 className="h-4 w-4 text-amber-600" /> File Angel AI
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {queuedActions.slice(0, 5).map((action) => (
                  <li key={action.id}>• {action.title} — validé, en attente du prochain passage.</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="relative">
          <Textarea
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submit();
            }}
            rows={4}
            maxLength={2_000}
            placeholder="Ex. Analyse mes réponses de candidatures et conseille-moi sur les prochaines étapes."
            className="min-h-24 resize-y bg-background pr-12"
          />
          <Button type="button" size="icon" onClick={submit} disabled={mutation.isPending || command.trim().length < 2} aria-label="Exécuter la commande" className="absolute bottom-2 right-2 h-10 w-10">
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EXAMPLES.map((example) => (
            <button key={example} type="button" onClick={() => setCommand(example)} className="min-h-9 shrink-0 rounded-full border border-border bg-background px-3 text-xs text-muted-foreground hover:text-foreground">
              {example}
            </button>
          ))}
        </div>
      </div>

      {messages.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Historique IA</p>
          <ul className="space-y-2">
            {messages.map((message) => {
              const waiting = message.status === "awaiting_approval";
              const partial = message.status === "partial";
              const notConnected = message.status === "not_connected";
              const failed = message.status === "failed";
              const queued = message.context?.queued === true;
              return (
                <li key={message.id} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-start gap-2">
                    <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{message.content}</p>
                      {message.response && <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{message.response}</p>}
                      <p className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                        {failed ? <ShieldAlert className="h-3.5 w-3.5 text-destructive" /> : waiting || partial || notConnected ? <Clock3 className="h-3.5 w-3.5 text-amber-600" /> : <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                        {failed ? "échec" : queued ? "en attente IA" : waiting ? "validation nécessaire" : partial ? "partiel" : notConnected ? "connexion requise" : "terminé"}
                        <span>·</span>
                        <span>{message.context?.source === "openai" ? "OpenAI" : "moteur local"}</span>
                        <span>·</span>
                        <time>{new Date(message.created_at).toLocaleString("fr-FR")}</time>
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </AdminCard>
  );
}
