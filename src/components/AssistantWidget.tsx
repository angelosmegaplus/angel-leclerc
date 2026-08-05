import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  answer,
  WELCOME,
  DEFAULT_SUGGESTIONS,
  type AssistantLink,
  type AssistantReply,
} from "@/lib/assistant-engine";

type Msg = { id: string; role: "user" | "assistant"; reply: AssistantReply };

let counter = 0;
const nextId = () => `m${++counter}`;

function LinkChip({ link, onDone }: { link: AssistantLink; onDone: () => void }) {
  const cls =
    "inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20";
  if (link.external || link.to.startsWith("http") || link.to.startsWith("tel:")) {
    return (
      <a
        href={link.to}
        target={link.to.startsWith("tel:") ? undefined : "_blank"}
        rel="noopener noreferrer"
        className={cls}
      >
        {link.label}
      </a>
    );
  }
  const [pathname, hash] = link.to.split("#");
  return (
    <Link to={pathname} hash={hash} className={cls} onClick={onDone}>
      {link.label}
    </Link>
  );
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [teaserDone, setTeaserDone] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { id: nextId(), role: "assistant", reply: WELCOME },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const show = window.setTimeout(() => setTeaser(true), 900);
    const hide = window.setTimeout(() => {
      setTeaser(false);
      setTeaserDone(true);
    }, 6000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, []);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ block: "end" });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  const last = messages[messages.length - 1];
  const suggestions =
    last?.role === "assistant" ? (last.reply.suggestions ?? DEFAULT_SUGGESTIONS) : [];

  function send(value: string) {
    const question = value.trim();
    if (!question) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", reply: { text: question } },
      { id: nextId(), role: "assistant", reply: answer(question) },
    ]);
  }

  return (
    <>
      {!open && (
        <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2 sm:bottom-24 sm:right-6">
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setTeaser(false);
              setTeaserDone(true);
            }}
            aria-hidden={!teaser}
            tabIndex={teaser ? 0 : -1}
            className={`rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm transition-all duration-500 ease-out hover:text-foreground ${
              teaser
                ? "pointer-events-auto translate-x-0 opacity-100"
                : "pointer-events-none translate-x-1 opacity-0"
            } ${teaserDone && !teaser ? "hidden" : ""}`}
          >
            Une question&nbsp;?
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setTeaser(false);
              setTeaserDone(true);
            }}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Ouvrir l'assistant ALC"
          >
            <MessageCircle size={18} aria-hidden />
          </button>
        </div>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Assistant ALC"
          className="fixed inset-x-3 bottom-20 z-50 flex max-h-[calc(100dvh-6.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[560px] sm:max-h-[calc(100dvh-8rem)] sm:w-[380px]"
        >
          <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
            <div>
              <p className="font-display text-sm font-bold text-foreground">Assistant ALC</p>
              <p className="text-[11px] text-muted-foreground">Angel Leclerc Communication</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Fermer l'assistant"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                    {m.reply.text}
                  </p>
                </div>
              ) : (
                <div key={m.id} className="max-w-[95%] space-y-2">
                  <p className="text-sm leading-relaxed text-foreground">{m.reply.text}</p>
                  {m.reply.links && m.reply.links.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {m.reply.links.map((l) => (
                        <LinkChip key={l.to + l.label} link={l} onDone={() => setOpen(false)} />
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
            <div ref={bottomRef} />
          </div>

          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-background px-3 py-3"
          >
            <label htmlFor="assistant-input" className="sr-only">
              Votre question
            </label>
            <input
              id="assistant-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question…"
              className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              aria-label="Envoyer la question"
            >
              <Send size={16} aria-hidden />
            </button>
          </form>

          <p className="border-t border-border bg-background px-4 py-2 text-[10px] leading-snug text-muted-foreground">
            Réponses automatiques fondées uniquement sur les informations publiques de ce site.
          </p>
        </div>
      )}
    </>
  );
}
