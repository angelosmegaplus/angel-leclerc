import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, CheckCircle2, Loader2, Send, ShieldAlert, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { runPrivateAngelOsIaChat } from "@/lib/angel-os-ia/private-chat.functions";
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

const EXAMPLES = [
  "Analyse mes candidatures et dis-moi quoi prioriser",
  "Continue ton analyse et sois plus précis",
  "Qu’est-ce qui mérite mon attention aujourd’hui ?",
];

function SourceBadge({ message }: { message: Message }) {
  const failed = message.status === "failed";
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
      {failed ? <ShieldAlert className="h-3.5 w-3.5 text-destructive" /> : <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
      <span>{failed ? "Angel OS IA indisponible" : "OpenAI · Angel OS IA"}</span>
      <span>·</span>
      <time>{new Date(message.created_at).toLocaleString("fr-FR")}</time>
    </span>
  );
}

function Conversation({ messages, compact }: { messages: Message[]; compact: boolean }) {
  const ordered = useMemo(() => [...messages].reverse(), [messages]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!compact || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [compact, ordered.length]);

  if (ordered.length === 0) return null;
  return (
    <div
      ref={scrollRef}
      className={compact ? "min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-black/25 p-3" : "mb-5 max-h-[42rem] space-y-4 overflow-y-auto rounded-2xl border border-border bg-background/60 p-3 sm:p-4"}
    >
      {ordered.map((message) => (
        <div key={message.id} className="space-y-2">
          <div className="flex justify-end gap-2">
            <div className={compact ? "max-w-[88%] rounded-2xl rounded-br-md bg-red-500 px-3 py-2 text-sm text-white" : "max-w-[86%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground"}>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            {!compact ? <UserRound className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" /> : null}
          </div>

          <div className="flex items-start gap-2">
            <span className={compact ? "mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-red-300" : "mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"}>
              <Bot className="h-4 w-4" />
            </span>
            <div className="max-w-[88%]">
              <div className={compact ? "rounded-2xl rounded-bl-md border border-white/10 bg-white/[.05] px-3 py-2 text-sm leading-relaxed text-white/80" : "rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground"}>
                {message.response ? (
                  <p className="whitespace-pre-wrap">{message.response}</p>
                ) : message.status === "running" ? (
                  <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Angel OS IA réfléchit…</span>
                ) : message.status === "failed" ? (
                  <p className="text-destructive">Angel OS IA n’a pas reçu de réponse OpenAI. Aucun moteur local ne répond à sa place.</p>
                ) : (
                  <p className="text-muted-foreground">Réponse indisponible.</p>
                )}
              </div>
              {!compact ? <SourceBadge message={message} /> : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AngelCommandCenter({ compact = false }: { compact?: boolean }) {
  const executePrivateAi = useServerFn(runPrivateAngelOsIaChat);
  const queryClient = useQueryClient();
  const [command, setCommand] = useState("");

  const { data: messages = [] } = useQuery({
    queryKey: ["angel-ai-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_messages")
        .select("id, content, response, status, context, created_at")
        .order("created_at", { ascending: false })
        .limit(compact ? 8 : 40);
      if (error) throw error;
      return (data ?? []) as unknown as Message[];
    },
    refetchInterval: 10_000,
  });

  const mutation = useMutation({
    mutationFn: (value: string) => executePrivateAi({ data: { command: value } }),
    onSuccess: () => {
      setCommand("");
      toast.success("Réponse d’Angel OS IA reçue via OpenAI.");
      void queryClient.invalidateQueries({ queryKey: ["angel-ai-messages"] });
      void queryClient.invalidateQueries({ queryKey: ["angel"] });
    },
    onError: (error: Error) => {
      toast.error("Angel OS IA indisponible", {
        description: error.message,
        duration: 12000,
      });
      void queryClient.invalidateQueries({ queryKey: ["angel-ai-messages"] });
    },
  });

  const submit = () => {
    const value = command.trim();
    if (value.length < 2 || mutation.isPending) return;
    mutation.mutate(value);
  };

  const composer = (
    <div className={compact ? "shrink-0 border-t border-white/10 bg-[#090b0d] pt-3" : "space-y-2"}>
      <div className="relative">
        <Textarea
          autoFocus={compact}
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => {
            if (compact && event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
              return;
            }
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submit();
          }}
          rows={compact ? 1 : 3}
          maxLength={2_000}
          placeholder={compact ? "Demander à Angel OS IA…" : "Écris naturellement à Angel OS IA…"}
          className={compact ? "min-h-12 max-h-28 resize-none rounded-2xl border-white/10 bg-black/30 py-3 pl-4 pr-14 text-sm text-white placeholder:text-white/35" : "min-h-20 resize-y rounded-2xl bg-background pr-14"}
        />
        <Button type="button" size="icon" onClick={submit} disabled={mutation.isPending || command.trim().length < 2} aria-label="Envoyer à Angel OS IA" className={compact ? "absolute bottom-1.5 right-1.5 h-9 w-9 rounded-xl bg-red-500 text-white hover:bg-red-500/90" : "absolute bottom-2 right-2 h-10 w-10 rounded-xl"}>
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      {messages.length === 0 ? (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EXAMPLES.map((example) => (
            <button key={example} type="button" onClick={() => setCommand(example)} className={compact ? "shrink-0 rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-[11px] text-white/45 hover:text-white/75" : "min-h-9 shrink-0 rounded-full border border-border bg-background px-3 text-xs text-muted-foreground hover:text-foreground"}>
              {example}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (compact) {
    return (
      <section className="flex max-h-[min(68dvh,42rem)] min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#090b0d] px-3 py-3 shadow-[0_18px_60px_rgba(0,0,0,.28)] sm:px-4 sm:py-4">
        <div className="mb-2 flex shrink-0 items-center gap-2 px-1">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300"><Bot className="h-4 w-4" /></span>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">Angel OS IA</p>
          <span className="text-[10px] uppercase tracking-[.12em] text-white/35">OpenAI uniquement</span>
        </div>
        <Conversation messages={messages} compact />
        {composer}
      </section>
    );
  }

  return (
    <AdminCard
      className="border-primary/30 bg-gradient-to-br from-primary/8 via-card to-card"
      title="Angel OS IA"
      description="Conversation privée via OpenAI uniquement. Aucun moteur conversationnel local ne répond dans l’espace privé."
    >
      <Conversation messages={messages} compact={false} />
      {composer}
    </AdminCard>
  );
}
