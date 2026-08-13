import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, CheckCircle2, Clock3, Loader2, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { runAngelCommand } from "@/lib/angel-command.functions";
import { isArticleCommand, runArticleCommand } from "@/lib/article-command.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AdminCard } from "./AdminShell";
import { DailyCockpit } from "./DailyCockpit";

type Message = {
  id: string;
  content: string;
  response: string | null;
  status: string;
  context: Record<string, unknown> | null;
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

  const mutation = useMutation({
    mutationFn: (value: string) =>
      isArticleCommand(value)
        ? executeArticle({ data: { command: value } })
        : execute({ data: { command: value } }),
    onSuccess: (result) => {
      setCommand("");
      if (result.status === "completed") toast.success("Commande exécutée et tracée.");
      else if (result.status === "partial")
        toast.warning("Commande mise en attente ou partiellement exécutée.");
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

  const commandCard = (
    <AdminCard
      className="border-primary/30 bg-gradient-to-br from-primary/8 via-card to-card"
      title="Demander à Angel AI"
      description="Une commande, un résultat réel et une trace. Les articles sont générés immédiatement si le moteur IA est disponible ; sinon la demande est mise en attente sans créer de faux contenu."
    >
      <div className="space-y-3">
        <div className="relative">
          <Textarea
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submit();
            }}
            rows={compact ? 3 : 4}
            maxLength={2_000}
            placeholder="Ex. Rédige un article complet sur l'actualité locale avec sources et image créditée."
            className="min-h-24 resize-y bg-background pr-12"
          />
          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={mutation.isPending || command.trim().length < 2}
            aria-label="Exécuter la commande"
            className="absolute bottom-2 right-2 h-10 w-10"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setCommand(example)}
              className="min-h-9 shrink-0 rounded-full border border-border bg-background px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {messages.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Historique IA
          </p>
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
                      {message.response && (
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {message.response}
                        </p>
                      )}
                      <p className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                        {failed ? (
                          <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                        ) : waiting || partial || notConnected ? (
                          <Clock3 className="h-3.5 w-3.5 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        )}
                        {failed
                          ? "échec"
                          : queued
                            ? "en attente IA"
                            : waiting
                              ? "validation nécessaire"
                              : partial
                                ? "partiel"
                                : notConnected
                                  ? "connexion requise"
                                  : "terminé"}
                        <span>·</span>
                        <span>
                          {message.context?.source === "openai" ? "OpenAI" : "moteur local"}
                        </span>
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

  if (!compact) return commandCard;

  return (
    <div className="space-y-5">
      <DailyCockpit />
      {commandCard}
    </div>
  );
}
