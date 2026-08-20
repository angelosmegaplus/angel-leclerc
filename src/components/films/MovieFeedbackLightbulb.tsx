import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Lightbulb, Loader2, Send, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { submitMovieFeedback } from "@/lib/movie-feedback.functions";

const BUBBLE_KEY = "angel-movies-feedback-bubble-seen-v1";

export function MovieFeedbackLightbulb() {
  const { user } = useAuth();
  const submitFeedback = useServerFn(submitMovieFeedback);
  const [open, setOpen] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      if (localStorage.getItem(BUBBLE_KEY)) return;
      setBubbleVisible(true);
      const timer = window.setTimeout(() => {
        setBubbleVisible(false);
        localStorage.setItem(BUBBLE_KEY, "1");
      }, 7000);
      return () => window.clearTimeout(timer);
    } catch {
      setBubbleVisible(true);
      const timer = window.setTimeout(() => setBubbleVisible(false), 7000);
      return () => window.clearTimeout(timer);
    }
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = message.trim();
    if (!value || sending) return;
    setSending(true);
    setSent(false);
    setError("");
    try {
      await submitFeedback({ data: { message: value, userId: user?.id ?? null, userEmail: user?.email ?? null } });
      setMessage("");
      setSent(true);
      window.setTimeout(() => {
        setOpen(false);
        setSent(false);
      }, 1400);
    } catch (reason) {
      setSent(false);
      setError(reason instanceof Error ? reason.message : "La suggestion n’a pas pu être envoyée.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="fixed right-3 top-16 z-[80] flex items-start gap-2 sm:right-5 sm:top-20">
        {bubbleVisible && !open ? (
          <button
            type="button"
            onClick={() => { setOpen(true); setBubbleVisible(false); }}
            className="relative max-w-[185px] rounded-2xl border border-white/10 bg-black/80 px-3 py-2 text-left text-[10px] leading-4 text-white/65 shadow-xl backdrop-blur-xl"
          >
            Des idées de mises à jour ? Écris-moi.
            <span className="absolute -right-1 top-3 h-2 w-2 rotate-45 border-r border-t border-white/10 bg-black/80" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => { setOpen(true); setBubbleVisible(false); try { localStorage.setItem(BUBBLE_KEY, "1"); } catch {} }}
          aria-label="Proposer une idée"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/55 text-amber-200/75 shadow-lg backdrop-blur-xl transition hover:bg-black/75 hover:text-amber-100"
        >
          <Lightbulb className="h-4 w-4" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/65 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}>
          <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-[#101012] p-5 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-amber-200/70">Une idée ?</p>
                <h2 className="mt-1 text-xl font-semibold">Proposer une amélioration</h2>
                <p className="mt-1 text-xs leading-5 text-white/40">Ton message arrivera directement dans l’espace administrateur, avec un envoi mail de secours si nécessaire.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/45"><X className="h-4 w-4" /></button>
            </div>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 1200))}
              placeholder="Explique ton idée, le bug ou la mise à jour que tu aimerais voir…"
              rows={6}
              autoFocus
              className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-3 text-sm leading-6 text-white outline-none placeholder:text-white/20 focus:border-white/20"
            />
            {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[10px] text-white/25">{message.length}/1200</span>
              <button type="submit" disabled={!message.trim() || sending || sent} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-black disabled:opacity-40">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sent ? "Envoyé" : sending ? "Envoi…" : "Envoyer"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
