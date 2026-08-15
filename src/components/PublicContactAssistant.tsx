import { FormEvent, useMemo, useState } from "react";
import { Loader2, RotateCcw, Send, Sparkles } from "lucide-react";
import { answer as localAnswer } from "@/lib/assistant-engine";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type AssistantApiResponse = {
  text?: string | null;
  source?: "openai" | "fallback";
  reason?: string;
  requestId?: string;
};

const SUGGESTIONS = [
  "Que propose Angel ?",
  "Combien coûte une affiche ?",
  "Quel est son parcours ?",
];

export function PublicContactAssistant() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);

  const history = useMemo(
    () =>
      messages.slice(-8).map((message) => ({
        role: message.role,
        content: message.text.slice(0, 1500),
      })),
    [messages],
  );

  function resetConversation() {
    setQuestion("");
    setMessages([]);
    setThinking(false);
  }

  async function send(raw: string) {
    const value = raw.trim();
    if (value.length < 2 || thinking) return;

    setQuestion("");
    setMessages((current) => [...current, { role: "user", text: value }]);
    setThinking(true);

    let text: string | null = null;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          question: value.slice(0, 500),
          mode: "contact",
          history,
        }),
      });
      if (response.ok) {
        const result = (await response.json()) as AssistantApiResponse;
        text = typeof result.text === "string" && result.text.trim() ? result.text : null;
      }
    } catch {
      text = null;
    } finally {
      window.clearTimeout(timeout);
    }

    if (!text) text = localAnswer(value).text;

    setMessages((current) => [...current, { role: "assistant", text }]);
    setThinking(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(question);
  }

  return (
    <section className="rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-6" aria-label="Assistant IA">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
          <Sparkles size={18} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-foreground">Une question ?</h2>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={resetConversation}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Réinitialiser la discussion"
          >
            <RotateCcw size={14} aria-hidden />
            Nouveau chat
          </button>
        )}
      </div>

      {messages.length > 0 && (
        <div className="mt-5 max-h-[26rem] space-y-3 overflow-y-auto rounded-2xl border border-border bg-background/60 p-4" aria-live="polite">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {message.text}
            </div>
          ))}
          {thinking && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={14} className="animate-spin" aria-hidden />
              Réponse en cours…
            </div>
          )}
        </div>
      )}

      {messages.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void send(suggestion)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="mt-4 flex items-center gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Posez votre question…"
          aria-label="Posez votre question"
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
        />
        <button
          type="submit"
          disabled={thinking || question.trim().length < 2}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Envoyer"
        >
          {thinking ? <Loader2 size={17} className="animate-spin" aria-hidden /> : <Send size={17} aria-hidden />}
        </button>
      </form>
    </section>
  );
}
