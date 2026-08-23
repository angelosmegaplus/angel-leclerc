import { useRef, useState, type FormEvent } from "react";
import { Loader2, RotateCcw, Send } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_LENGTH = 2500;
const MISTRAL_URL = "https://chat.mistral.ai/chat";

const ERRORS: Record<string, string> = {
  not_configured: "Mistral n’est pas encore activé dans Flamme.",
  rate_limit: "Trop de messages d’un coup. Réessayez dans quelques minutes.",
  invalid_message: "Message vide ou trop long (2 500 caractères maximum).",
  timeout: "Mistral met trop de temps à répondre. Réessayez.",
  upstream_error: "Mistral est momentanément indisponible.",
  empty_answer: "Mistral n’a pas renvoyé de réponse.",
  server_error: "Une erreur est survenue. Réessayez.",
};

export function FlammeMistralChat({ darkMode }: { darkMode: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [disabled, setDisabled] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const muted = darkMode ? "text-[#bdc1c6]" : "text-[#5f6368]";
  const border = darkMode ? "border-[#5f6368]" : "border-[#dfe1e5]";

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      const node = listRef.current;
      if (node) node.scrollTop = node.scrollHeight;
    });
  };

  const reset = () => {
    setMessages([]);
    setInput("");
    setError("");
    setLoading(false);
  };

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading || disabled) return;
    if (question.length > MAX_LENGTH) {
      setError(ERRORS.invalid_message);
      return;
    }

    const history = [...messages].slice(-8);
    setMessages([...messages, { role: "user", content: question }]);
    setInput("");
    setError("");
    setLoading(true);
    scrollToEnd();

    try {
      const response = await fetch("/api/flamme-mistral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history }),
      });
      const data = (await response.json().catch(() => ({}))) as { text?: string | null; reason?: string | null };
      if (data.text) {
        setMessages((current) => [...current, { role: "assistant", content: data.text as string }]);
      } else {
        const reason = data.reason || "server_error";
        if (reason === "not_configured") setDisabled(true);
        setError(ERRORS[reason] || ERRORS.server_error);
      }
    } catch {
      setError(ERRORS.server_error);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  };

  return (
    <div className="space-y-3">
      <p className={`text-[13px] leading-5 ${muted}`}>Mistral, IA française intégrée à Flamme.</p>

      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        className={`max-h-[46vh] min-h-[140px] space-y-2 overflow-y-auto rounded-2xl border p-3 ${border} ${darkMode ? "bg-[#26282b]" : "bg-[#fafafa]"}`}
      >
        {messages.length === 0 && !loading && (
          <p className={`text-[13px] leading-5 ${muted}`}>Posez votre question, la réponse s’affiche ici.</p>
        )}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[92%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-[14px] leading-5 ${
              message.role === "user"
                ? `ml-auto ${darkMode ? "bg-[#1a73e8]/25" : "bg-[#1a73e8]/10"}`
                : darkMode
                  ? "bg-[#303134]"
                  : "bg-white border border-[#e8eaed]"
            }`}
          >
            {message.content}
          </div>
        ))}
        {loading && (
          <p className={`flex items-center gap-2 text-[13px] ${muted}`}>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Mistral rédige une réponse…
          </p>
        )}
      </div>

      {error && <p className="text-[12px] leading-4 text-[#d93025]">{error}</p>}

      <form onSubmit={send} className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(event as unknown as FormEvent);
            }
          }}
          rows={2}
          disabled={disabled}
          aria-label="Votre message pour Mistral"
          placeholder={disabled ? "Mistral n’est pas encore activé" : "Écrire à Mistral…"}
          className={`min-h-[46px] w-full flex-1 resize-none rounded-2xl border px-3 py-2 text-[14px] outline-none ${border} ${darkMode ? "bg-[#202124]" : "bg-white"}`}
        />
        <button
          type="submit"
          disabled={loading || disabled || !input.trim()}
          aria-label="Envoyer"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-white disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={reset}
          className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-[13px] ${border} ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}
        >
          <RotateCcw className="h-4 w-4" /> Nouvelle conversation
        </button>
        <a href={MISTRAL_URL} target="_blank" rel="noreferrer" className={`text-[12px] underline ${muted}`}>
          Ouvrir Mistral
        </a>
      </div>

      <p className={`text-center text-[11px] leading-4 ${muted}`}>
        Conversation gardée uniquement dans cet onglet, jamais enregistrée par Flamme.
      </p>
    </div>
  );
}

export default FlammeMistralChat;
