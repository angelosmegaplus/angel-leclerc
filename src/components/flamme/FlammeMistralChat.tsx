import { useRef, useState, type FormEvent } from "react";
import { Loader2, RotateCcw, Send, Sparkles } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

type Suggestion = { label: string; prompt: string };

const MAX_LENGTH = 2500;
const MISTRAL_URL = "https://chat.mistral.ai/chat";
const MISTRAL_PRIVACY_URL = "https://legal.mistral.ai/terms/privacy-policy?language=fr-FR";

const SUGGESTIONS: Suggestion[] = [
  { label: "Actus du jour", prompt: "Résume-moi les actualités du jour" },
  { label: "Sites d’actualité", prompt: "Quels sites français consulter pour suivre l’actualité ?" },
  { label: "Magazines culture", prompt: "Donne-moi des liens vers des magazines français de culture" },
  { label: "Explique simplement", prompt: "Explique-moi simplement un sujet compliqué" },
];

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

  const ask = async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question || loading || disabled) return;
    if (question.length > MAX_LENGTH) {
      setError(ERRORS.invalid_message);
      return;
    }

    const history = [...messages].slice(-8);
    setMessages((current) => [...current, { role: "user", content: question }]);
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

  const send = (event: FormEvent) => {
    event.preventDefault();
    void ask(input);
  };

  return (
    <div className="space-y-2.5">
      <div>
        <p className="flex items-center gap-2 text-[14px] font-medium">
          <Sparkles className="h-4 w-4 text-[#1a73e8]" /> Mistral 🇫🇷
        </p>
        <p className={`mt-1 text-[11px] leading-4 ${muted}`}>
          Sans compte Flamme : la conversation n’est pas enregistrée par Flamme et vos messages sont envoyés à Mistral uniquement pour obtenir la réponse.
        </p>
      </div>

      {messages.length === 0 && !loading && (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => void ask(suggestion.prompt)}
              disabled={disabled}
              className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] leading-none transition ${border} ${darkMode ? "hover:bg-white/10" : "bg-white hover:bg-[#f1f3f4]"}`}
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      )}

      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        className={`max-h-[46vh] min-h-[130px] space-y-2 overflow-y-auto rounded-2xl border p-3 ${border} ${darkMode ? "bg-[#26282b]" : "bg-[#fafafa]"}`}
      >
        {messages.length === 0 && !loading && (
          <p className={`text-[13px] leading-5 ${muted}`}>Écris ta question à Mistral.</p>
        )}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[92%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-[14px] leading-5 ${
              message.role === "user"
                ? `ml-auto ${darkMode ? "bg-[#1a73e8]/25" : "bg-[#1a73e8]/10"}`
                : darkMode
                  ? "bg-[#303134]"
                  : "border border-[#e8eaed] bg-white"
            }`}
          >
            {message.content}
          </div>
        ))}
        {loading && (
          <p className={`flex items-center gap-2 text-[13px] ${muted}`}>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Mistral rédige…
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
              void ask(input);
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

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={reset}
          className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-[11px] ${border} ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Nouveau
        </button>
        <div className="flex items-center gap-3">
          <a href={MISTRAL_PRIVACY_URL} target="_blank" rel="noreferrer" className={`text-[11px] underline ${muted}`}>
            Confidentialité
          </a>
          <a href={MISTRAL_URL} target="_blank" rel="noreferrer" className={`text-[11px] underline ${muted}`}>
            Mistral
          </a>
        </div>
      </div>
    </div>
  );
}

export default FlammeMistralChat;
