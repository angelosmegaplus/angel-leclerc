import { useRef, useState, type FormEvent } from "react";
import { Loader2, RotateCcw, Send, ShieldCheck, Sparkles } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_LENGTH = 2500;
const MISTRAL_URL = "https://chat.mistral.ai/chat";
const MISTRAL_PRIVACY_URL = "https://legal.mistral.ai/terms/privacy-policy?language=fr-FR";

const SUGGESTIONS = [
  "Résume-moi les actualités du jour",
  "Quels sites français consulter pour suivre l’actualité ?",
  "Donne-moi des liens vers des magazines français de culture",
  "Explique-moi simplement un sujet compliqué",
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
    <div className="space-y-3">
      <div>
        <p className="flex items-center gap-2 text-[14px] font-medium">
          <Sparkles className="h-4 w-4 text-[#1a73e8]" /> Mistral 🇫🇷 — IA française intégrée à Flamme
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] ${border} ${muted}`}>
            <ShieldCheck className="h-3.5 w-3.5" /> Sans compte Flamme
          </span>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] ${border} ${muted}`}>
            Non enregistré par Flamme
          </span>
        </div>
        <p className={`mt-2 text-[12px] leading-5 ${muted}`}>
          Vos messages sont transmis à l’API Mistral uniquement pour produire la réponse. Flamme ne crée aucun compte et ne conserve pas cette conversation sur son serveur. Mistral indique que les données envoyées via son API ne sont pas utilisées pour entraîner ses modèles ; leur traitement reste soumis aux règles de Mistral.
        </p>
      </div>

      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        className={`max-h-[46vh] min-h-[150px] space-y-2 overflow-y-auto rounded-2xl border p-3 ${border} ${darkMode ? "bg-[#26282b]" : "bg-[#fafafa]"}`}
      >
        {messages.length === 0 && !loading && (
          <div>
            <p className={`text-[13px] leading-5 ${muted}`}>Posez votre question ou choisissez une idée :</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void ask(suggestion)}
                  disabled={disabled}
                  className={`rounded-full border px-3 py-2 text-left text-[12px] leading-4 transition ${border} ${darkMode ? "hover:bg-white/10" : "bg-white hover:bg-[#f1f3f4]"}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={reset}
          className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-[13px] ${border} ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}
        >
          <RotateCcw className="h-4 w-4" /> Nouvelle conversation
        </button>
        <div className="flex items-center gap-3">
          <a href={MISTRAL_PRIVACY_URL} target="_blank" rel="noreferrer" className={`text-[12px] underline ${muted}`}>
            Confidentialité
          </a>
          <a href={MISTRAL_URL} target="_blank" rel="noreferrer" className={`text-[12px] underline ${muted}`}>
            Ouvrir Mistral
          </a>
        </div>
      </div>

      <p className={`text-center text-[11px] leading-4 ${muted}`}>
        La conversation reste seulement dans cet onglet côté Flamme et disparaît en le rechargeant ou en cliquant sur « Nouvelle conversation ».
      </p>
    </div>
  );
}

export default FlammeMistralChat;
