import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { askAssistant } from "@/lib/assistant.functions";
import { sendAssistantRelay } from "@/lib/assistant-relay.functions";
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
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { id: nextId(), role: "assistant", reply: WELCOME },
  ]);
  const [relay, setRelay] = useState(false);
  const [relaySent, setRelaySent] = useState(false);
  const [relayError, setRelayError] = useState<string | null>(null);
  const [relaySending, setRelaySending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    consent: false,
    website: "",
  });
  const ask = useServerFn(askAssistant);
  const relayFn = useServerFn(sendAssistantRelay);
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
  const needsHuman = messages.slice(-2).some((m) =>
    /parler à angel|contacter angel|un humain|une vraie personne|devis|rappel|rappeler|je ne peux pas|je n'ai pas cette information|contactez angel/i.test(
      m.reply.text,
    ),
  );
  const suggestions =
    last?.role === "assistant" ? (last.reply.suggestions ?? DEFAULT_SUGGESTIONS) : [];

  async function send(value: string) {
    const question = value.trim();
    if (!question || pending) return;
    setInput("");
    const history = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.reply.text.slice(0, 2000),
    }));
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", reply: { text: question } },
    ]);
    setPending(true);

    const local = answer(question);
    let reply: AssistantReply = local;
    try {
      const result = await ask({ data: { question: question.slice(0, 500), history } });
      if (result?.text) {
        reply = { text: result.text, links: local.links, suggestions: local.suggestions };
      }
    } catch {
      /* repli silencieux sur le moteur local */
    }
    setMessages((prev) => [...prev, { id: nextId(), role: "assistant", reply }]);
    setPending(false);
  }

  function openRelay() {
    setRelayError(null);
    setRelaySent(false);
    const context = messages
      .filter((m) => m.role === "user")
      .slice(-3)
      .map((m) => m.reply.text)
      .join(" ");
    setForm((f) => ({
      ...f,
      message:
        f.message ||
        (context
          ? `Bonjour Angel,\n\nJ'ai échangé avec l'assistant du site au sujet de : ${context}\n\nPourriez-vous me recontacter ?`
          : "Bonjour Angel,\n\n"),
    }));
    setRelay(true);
  }

  async function submitRelay(e: React.FormEvent) {
    e.preventDefault();
    if (relaySending || relaySent) return;
    setRelayError(null);
    if (!form.name.trim()) return setRelayError("Merci d'indiquer votre nom.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()))
      return setRelayError("Merci d'indiquer une adresse e-mail valide.");
    if (form.message.trim().length < 10)
      return setRelayError("Merci d'écrire un message un peu plus détaillé.");
    if (!form.consent) return setRelayError("Merci d'accepter d'être recontacté par e-mail.");

    setRelaySending(true);
    try {
      await relayFn({
        data: {
          name: form.name.trim().slice(0, 120),
          email: form.email.trim().slice(0, 255),
          phone: form.phone.trim().slice(0, 40),
          message: form.message.trim().slice(0, 3000),
          consent: true as const,
          website: form.website,
          transcript: messages
            .slice(-6)
            .map((m) => ({ role: m.role, content: m.reply.text.slice(0, 600) })),
        },
      });
      setRelaySent(true);
    } catch {
      setRelayError(
        "L'envoi n'a pas abouti. Votre texte est conservé : réessayez, écrivez à contact@angel-leclerc.fr ou passez par la page Contact.",
      );
    } finally {
      setRelaySending(false);
    }
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

          {relay ? (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {relaySent ? (
                <div className="space-y-3 text-sm">
                  <p className="flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 size={16} className="text-primary" aria-hidden />
                    Votre message a bien été transmis à Angel.
                  </p>
                  <p className="text-muted-foreground">
                    Il vous répondra par e-mail. Il ne s'agit pas d'une discussion en direct.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRelay(false)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Revenir à l'assistant
                  </button>
                </div>
              ) : (
                <form onSubmit={submitRelay} className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Angel n'est pas en ligne : votre message lui est envoyé par e-mail et il vous
                    répondra ultérieurement.
                  </p>
                  <div className="hidden" aria-hidden>
                    <label htmlFor="alc-website">Ne pas remplir</label>
                    <input
                      id="alc-website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="alc-name" className="text-xs font-medium text-foreground">
                      Prénom ou nom
                    </label>
                    <input
                      id="alc-name"
                      value={form.name}
                      maxLength={120}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="alc-email" className="text-xs font-medium text-foreground">
                      E-mail *
                    </label>
                    <input
                      id="alc-email"
                      type="email"
                      value={form.email}
                      maxLength={255}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="alc-phone" className="text-xs font-medium text-foreground">
                      Téléphone (facultatif)
                    </label>
                    <input
                      id="alc-phone"
                      type="tel"
                      value={form.phone}
                      maxLength={40}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="alc-message" className="text-xs font-medium text-foreground">
                      Message *
                    </label>
                    <textarea
                      id="alc-message"
                      rows={5}
                      value={form.message}
                      maxLength={3000}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <p className="mt-1 text-right text-[10px] text-muted-foreground">
                      {form.message.length}/3000
                    </p>
                  </div>
                  <label className="flex items-start gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                      className="mt-0.5"
                    />
                    <span>
                      J'accepte qu'Angel me recontacte par e-mail au sujet de ce message.
                    </span>
                  </label>
                  {relayError && (
                    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {relayError}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={relaySending}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {relaySending && <Loader2 size={13} className="animate-spin" aria-hidden />}
                      {relaySending ? "Envoi…" : "Envoyer à Angel"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRelay(false)}
                      className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
          <>
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
            {pending && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" aria-hidden />
                L'assistant rédige une réponse…
              </p>
            )}
          </div>

          {suggestions.length > 0 && !pending && (
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
              maxLength={500}
              className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              type="submit"
              disabled={!input.trim() || pending}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              aria-label="Envoyer la question"
            >
              <Send size={16} aria-hidden />
            </button>
          </form>

          <button
            type="button"
            onClick={openRelay}
            className={`flex w-full items-center justify-center gap-2 border-t border-border px-4 py-2 text-xs transition-colors hover:bg-muted ${
              needsHuman ? "bg-primary/10 text-primary" : "bg-background text-muted-foreground"
            }`}
          >
            <Mail size={13} aria-hidden />
            Écrire directement à Angel
          </button>
          </>
          )}

          <p className="border-t border-border bg-background px-4 py-2 text-[10px] leading-snug text-muted-foreground">
            Réponses générées automatiquement à partir des informations publiques de ce site.
            Elles peuvent contenir des imprécisions&nbsp;: en cas de doute, contactez Angel.
          </p>
        </div>
      )}
    </>
  );
}
