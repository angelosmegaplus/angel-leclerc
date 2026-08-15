import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, UserRound } from "lucide-react";
import { answer as localAnswer } from "@/lib/assistant-engine";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "alc-contact-ai-thread-v1";
const SUGGESTIONS = [
  "Que propose Angel exactement ?",
  "Combien coûte une affiche ?",
  "Comment se déroule une mission ?",
  "Quel est son parcours ?",
];

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type AssistantApiResponse = {
  text?: string | null;
  source?: "openai" | "fallback";
  reason?: string;
  requestId?: string;
};

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function ContactAssistantThread() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Message[];
        if (Array.isArray(saved)) setMessages(saved.slice(-24));
      }
    } catch {
      // Le fil reste utilisable même si le stockage navigateur est indisponible.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-24))); } catch { /* no-op */ }
  }, [hydrated, messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, thinking]);

  async function send(raw: string) {
    const question = raw.trim();
    if (question.length < 2 || thinking) return;

    const userMessage: Message = { id: uid(), role: "user", text: question };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    setThinking(true);

    const history = next.slice(-10).map((message) => ({
      role: message.role,
      content: message.text.slice(0, 2200),
    }));

    let answerText: string | null = null;
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          question: question.slice(0, 1000),
          mode: "contact",
          history: history.slice(0, -1),
        }),
      });
      const result = (await response.json()) as AssistantApiResponse;
      answerText = typeof result.text === "string" && result.text.trim() ? result.text : null;
    } catch {
      answerText = null;
    }

    if (!answerText) answerText = localAnswer(question).text;

    setThinking(false);
    setMessages((current) => [
      ...current,
      { id: uid(), role: "assistant", text: answerText || "Je n’ai pas pu répondre à cette question pour le moment." },
    ]);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  return (
    <section aria-labelledby="contact-assistant-title" className="mx-auto max-w-3xl rounded-[2rem] border border-border bg-card p-4 shadow-[0_18px_60px_-30px_rgba(0,0,0,.28)] sm:p-6">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Questions</p>
          <h2 id="contact-assistant-title" className="mt-1 font-display text-2xl font-bold text-foreground">Une question ? Écrivez ici.</h2>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => void send(suggestion)} className="rounded-full border border-border bg-background px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground">
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6 max-h-[28rem] space-y-4 overflow-y-auto rounded-2xl border border-border/70 bg-muted/25 p-3 sm:p-4" aria-live="polite">
        {messages.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Le fil apparaîtra ici dès votre première question.</p> : null}
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "assistant" ? <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Bot className="h-4 w-4" /></span> : null}
            <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"}`}>
              <p className="whitespace-pre-wrap">{message.text}</p>
            </div>
            {message.role === "user" ? <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><UserRound className="h-4 w-4" /></span> : null}
          </div>
        ))}
        {thinking ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Préparation de la réponse…</div>
        ) : null}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(input); } }} rows={2} maxLength={1000} placeholder="Posez votre question…" className="min-h-12 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary" />
        <Button type="submit" disabled={thinking || input.trim().length < 2} className="h-auto min-h-12 rounded-2xl bg-primary px-4 text-primary-foreground hover:bg-primary/90" aria-label="Envoyer la question">
          {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </section>
  );
}
