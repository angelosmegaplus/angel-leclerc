import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { getCaptchaChallenge } from "@/lib/captcha.functions";

export type CaptchaValue = { token: string; answer: string };

type Props = {
  value: CaptchaValue;
  onChange: (value: CaptchaValue) => void;
  error?: string | undefined;
};

/** Vérification anti-robot légère : un petit calcul validé côté serveur. */
export function Captcha({ value, onChange, error }: Props) {
  const load = useServerFn(getCaptchaChallenge);
  const [question, setQuestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const challenge = await load({});
      setQuestion(challenge.question);
      onChange({ token: challenge.token, answer: "" });
    } catch {
      setQuestion(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" /> Vérification anti-robot
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex h-10 min-w-[92px] items-center justify-center rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : question ? `${question} = ?` : "—"}
        </span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label="Résultat du calcul anti-robot"
          value={value.answer}
          onChange={(e) => onChange({ ...value, answer: e.target.value })}
          className="h-10 w-24 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex h-10 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Autre calcul
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
