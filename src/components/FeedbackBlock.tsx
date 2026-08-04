import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Heart, Loader2, Star } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFeedbackContext, submitFeedback, startSupport } from "@/lib/feedback.functions";
import {
  DEFAULT_QUESTIONS,
  RATING_LABELS,
  thanksMessage,
  type FeedbackContentType,
} from "@/lib/feedback";

type Step = "rate" | "sent" | "support" | "custom";

export function FeedbackBlock({
  contentType,
  contentKey,
  contentTitle,
  className = "",
}: {
  contentType: FeedbackContentType;
  contentKey: string;
  contentTitle?: string;
  className?: string;
}) {
  const fetchContext = useServerFn(getFeedbackContext);
  const send = useServerFn(submitFeedback);
  const support = useServerFn(startSupport);

  const { data } = useQuery({
    queryKey: ["feedback-context", contentKey],
    queryFn: () => fetchContext({ data: { contentKey } }),
    staleTime: 60_000,
  });

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [step, setStep] = useState<Step>("rate");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const settings = data?.settings;
  const question =
    settings?.questions?.[contentType] ?? DEFAULT_QUESTIONS[contentType];

  useEffect(() => {
    if (open && step === "rate") {
      const t = setTimeout(() => commentRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open, step]);

  if (!data || !data.visible || !settings) return null;

  const minRating = settings.minRatingForSupport;
  const showSupport = settings.supportEnabled && rating >= minRating;
  const discreetSupport = settings.supportEnabled && rating < minRating;

  function pick(value: number) {
    setRating(value);
    setError(null);
    setStep("rate");
    setOpen(true);
  }

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      const res = await send({
        data: {
          contentType,
          contentKey,
          contentTitle: contentTitle ?? "",
          rating,
          comment: settings!.commentEnabled ? comment : "",
          email,
          website: honeypot,
        },
      });
      setFeedbackId(res.id);
      setStep("sent");
      setTimeout(() => setStep("support"), 1400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  }

  async function goToPayment() {
    if (!feedbackId) return;
    setRedirecting(true);
    setError(null);
    try {
      const { url } = await support({ data: { feedbackId, amountCents: null } });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Paiement indisponible.");
      setRedirecting(false);
    }
  }

  function close() {
    setOpen(false);
    setTimeout(() => {
      setStep("rate");
    }, 250);
  }

  const publicNote =
    settings.publicDisplay !== "none" && data.average !== null ? (
      <span className="text-xs text-muted-foreground">
        {data.average.toLocaleString("fr-FR", { minimumFractionDigits: 1 })}/5
        {settings.publicDisplay === "average_count" && ` · ${data.count} avis`}
      </span>
    ) : null;

  return (
    <>
      <div
        className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border/70 bg-card/60 px-4 py-3 ${className}`}
      >
        <p className="text-sm text-muted-foreground">{question}</p>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((value) => {
            const active = (hover || rating) >= value;
            return (
              <button
                key={value}
                type="button"
                aria-label={`${value} étoile${value > 1 ? "s" : ""} — ${RATING_LABELS[value]}`}
                onMouseEnter={() => setHover(value)}
                onFocus={() => setHover(value)}
                onBlur={() => setHover(0)}
                onClick={() => pick(value)}
                className="rounded-md p-0.5 outline-none transition-transform duration-150 hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Star
                  size={18}
                  className={
                    active
                      ? "fill-primary text-primary transition-colors"
                      : "text-muted-foreground/50 transition-colors"
                  }
                />
              </button>
            );
          })}
        </div>
        {hover > 0 && (
          <span className="text-xs font-medium text-primary">{RATING_LABELS[hover]}</span>
        )}
        {hover === 0 && publicNote}
      </div>

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent className="max-w-md rounded-2xl">
          {step === "rate" && (
            <div className="animate-fade-in">
              <DialogTitle className="font-display text-lg">{thanksMessage(rating)}</DialogTitle>
              <DialogDescription className="sr-only">
                Formulaire d'avis facultatif
              </DialogDescription>

              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <Star
                    key={v}
                    size={20}
                    className={
                      v <= rating ? "fill-primary text-primary" : "text-muted-foreground/40"
                    }
                  />
                ))}
                <span className="ml-2 text-xs font-medium text-muted-foreground">
                  {RATING_LABELS[rating]}
                </span>
              </div>

              {settings.commentEnabled && (
                <div className="mt-5">
                  <Label htmlFor="fb-comment" className="text-sm">
                    Ajouter un commentaire
                  </Label>
                  <Textarea
                    id="fb-comment"
                    ref={commentRef}
                    value={comment}
                    maxLength={1000}
                    rows={4}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Vous pouvez préciser ce que vous avez apprécié ou ce qui pourrait être amélioré."
                    className="mt-2 resize-none"
                  />
                  <p className="mt-1 text-right text-[11px] text-muted-foreground">
                    {comment.length}/1000
                  </p>
                </div>
              )}

              <div className="mt-3">
                <Label htmlFor="fb-email" className="text-sm">
                  E-mail (facultatif, si vous souhaitez une réponse)
                </Label>
                <Input
                  id="fb-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2"
                  autoComplete="email"
                />
              </div>

              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />

              {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

              <Button className="mt-5 w-full" onClick={handleSend} disabled={sending}>
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer mon avis
              </Button>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Votre avis peut être enregistré afin d'améliorer le site. La contribution
                financière est entièrement facultative et ne donne droit à aucun avantage fiscal.
              </p>
            </div>
          )}

          {step === "sent" && (
            <div className="animate-scale-in py-6 text-center">
              <DialogTitle className="sr-only">Avis enregistré</DialogTitle>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-7 w-7" />
              </div>
              <p className="mt-4 font-display text-lg font-bold text-foreground">
                Merci pour votre avis !
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Votre retour m'aide à améliorer mes articles, mes services et ce site.
              </p>
            </div>
          )}

          {(step === "support" || step === "custom") && (
            <div className="animate-fade-in">
              <DialogTitle className="sr-only">Soutenir mon travail</DialogTitle>
              <DialogDescription className="sr-only">
                Contribution volontaire, entièrement facultative
              </DialogDescription>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-base font-bold text-foreground">
                    Merci pour votre avis !
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {rating < minRating
                      ? "Merci pour votre retour. Je vais en tenir compte pour améliorer ce contenu."
                      : "Votre retour m'aide à améliorer mes articles, mes services et ce site."}
                  </p>
                </div>
              </div>

              {showSupport || (discreetSupport && step === "custom") ? (
                <div className="mt-6 border-t border-border pt-5">
                  <p className="font-display text-base font-bold text-foreground">
                    Vous souhaitez aller un peu plus loin ?
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Mes contenus restent accessibles gratuitement. Vous pouvez, si vous le
                    souhaitez, soutenir mon travail d'écriture, mes recherches et le développement
                    du site.
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Cette contribution est totalement facultative.
                  </p>

                  {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
                  <div className="mt-4 flex flex-col gap-2">
                    <Button className="w-full" disabled={redirecting} onClick={goToPayment}>
                      {redirecting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Heart className="mr-2 h-4 w-4" />
                      )}
                      Faire un don
                    </Button>
                    <Button variant="outline" className="w-full" onClick={close}>
                      Non merci
                    </Button>
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                    Vous choisissez librement le montant sur la page de paiement sécurisée Revolut.
                    Aucune coordonnée bancaire n'est demandée ni conservée sur ce site.
                  </p>
                </div>
              ) : (
                <div className="mt-6 flex flex-col gap-3">
                  <Button variant="outline" className="w-full" onClick={close}>
                    Fermer
                  </Button>
                  {discreetSupport && (
                    <button
                      type="button"
                      onClick={() => setStep("custom")}
                      className="text-center text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      Soutenir malgré tout
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}