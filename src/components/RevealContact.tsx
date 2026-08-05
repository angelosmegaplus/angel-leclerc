import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState } from "@tanstack/react-router";
import { AlertCircle, Check, ChevronDown, Copy, Loader2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Captcha, type CaptchaValue } from "@/components/Captcha";
import { revealDirectContact } from "@/lib/contact-reveal.functions";

type Step = "hidden" | "warning" | "check" | "open";

/** Durée d'affichage des coordonnées avant masquage automatique. */
const VISIBLE_MS = 3 * 60 * 1000;

type Revealed = { email: string; phone: string; phoneHref: string };

export function RevealContact({ compact = false }: { compact?: boolean }) {
  const reveal = useServerFn(revealDirectContact);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [step, setStep] = useState<Step>("hidden");
  const [captcha, setCaptcha] = useState<CaptchaValue>({ token: "", answer: "" });
  const [honey, setHoney] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [data, setData] = useState<Revealed | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const close = useCallback(() => {
    setStep("hidden");
    setData(null);
    setCaptcha({ token: "", answer: "" });
    setError(null);
  }, []);

  // Masquage au changement de page.
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Masquage automatique après quelques minutes.
  useEffect(() => {
    if (step !== "open") return;
    const t = setTimeout(close, VISIBLE_MS);
    return () => clearTimeout(t);
  }, [step, close]);

  async function submit() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await reveal({
        data: {
          captchaToken: captcha.token,
          captchaAnswer: captcha.answer,
          confirmed: true as const,
          website: honey,
        },
      });
      setData(result);
      setStep("open");
    } catch {
      setError(
        "La vérification n'a pas abouti. Réessayez dans un instant, ou poursuivez simplement via la page Contact.",
      );
      setCaptcha({ token: "", answer: "" });
    } finally {
      setPending(false);
    }
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-dashed border-border/70 p-3"
          : "mx-auto max-w-2xl rounded-xl border border-dashed border-border/70 p-3"
      }
    >
      <div aria-live="polite" className="sr-only">
        {error ? error : step === "open" ? "Coordonnées directes affichées temporairement." : ""}
      </div>

      {step === "hidden" && (
        <button
          type="button"
          onClick={() => setStep("warning")}
          className="mx-auto flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <AlertCircle size={12} aria-hidden />
          Afficher les coordonnées directes
          <ChevronDown size={12} aria-hidden />
        </button>
      )}

      {step === "warning" && (
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium text-foreground">
            Ces coordonnées sont réservées aux demandes importantes
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Pour une demande courante, le parcours de contact de cette page prépare un
            récapitulatif complet, qui reste le moyen le plus efficace. Les coordonnées
            directes sont destinées aux sujets urgents ou nécessitant un échange direct.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="outline" size="sm" onClick={close}>
              Non, je passe par le parcours
            </Button>
            <Button size="sm" onClick={() => setStep("check")}>
              Ma demande justifie un contact direct
            </Button>
          </div>
        </div>
      )}

      {step === "check" && (
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Dernière étape : une courte vérification anti-robot. Les délais de réponse
            restent identiques à ceux du parcours de contact.
          </p>
          <Captcha value={captcha} onChange={setCaptcha} {...(error ? { error } : {})} />
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={honey}
            onChange={(e) => setHoney(e.target.value)}
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" size="sm" onClick={close}>
              Annuler
            </Button>
            <Button size="sm" onClick={() => void submit()} disabled={pending || !captcha.answer}>
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Vérification…
                </>
              ) : (
                "Afficher"
              )}
            </Button>
          </div>
        </div>
      )}

      {step === "open" && data && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Coordonnées directes — affichage temporaire
            </p>
            <button
              type="button"
              onClick={close}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Masquer
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail size={14} className="text-primary" aria-hidden /> E-mail
              </p>
              <p className="mt-1 break-all text-sm text-foreground">{data.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => void copy(data.email, "email")}>
                  {copied === "email" ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                  Copier
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <a href={`mailto:${data.email}`}>Écrire</a>
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone size={14} className="text-primary" aria-hidden /> Téléphone
              </p>
              <p className="mt-1 text-sm text-foreground">{data.phone}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => void copy(data.phone, "phone")}>
                  {copied === "phone" ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                  Copier
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <a href={data.phoneHref}>Appeler</a>
                </Button>
              </div>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Ces coordonnées seront masquées automatiquement au bout de quelques minutes
            ou au changement de page. Les réponses ne sont pas immédiates.
          </p>
        </div>
      )}
    </div>
  );
}
