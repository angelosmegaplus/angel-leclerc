import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";

export type CaptchaValue = { token: string; answer: string };

type Props = {
  value: CaptchaValue;
  onChange: (value: CaptchaValue) => void;
  error?: string | undefined;
};

/** Vérification anti-robot 100 % locale : petit calcul simple, sans clé ni service externe. */
export function Captcha({ value, onChange, error }: Props) {
  const [question, setQuestion] = useState("—");

  const refresh = useCallback(() => {
    const a = 1 + Math.floor(Math.random() * 9);
    const b = 1 + Math.floor(Math.random() * 9);
    const plus = Math.random() > 0.35 || b > a;
    const expected = plus ? a + b : a - b;
    const nextQuestion = plus ? `${a} + ${b}` : `${a} - ${b}`;

    setQuestion(nextQuestion);
    onChange({ token: String(expected), answer: "" });
  }, [onChange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" /> Vérification anti-robot
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex h-10 min-w-[92px] items-center justify-center rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground">
          {question} = ?
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
          onClick={refresh}
          className="inline-flex h-10 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Autre calcul
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
