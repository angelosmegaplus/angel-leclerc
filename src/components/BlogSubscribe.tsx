import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeToBlog } from "@/lib/subscribers.functions";
import { Captcha, type CaptchaValue } from "@/components/Captcha";

export function BlogSubscribe() {
  const subscribe = useServerFn(subscribeToBlog);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [website, setWebsite] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaValue>({ token: "", answer: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  if (status === "done") {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm text-foreground">
        <p className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 text-primary" /> Vérifiez votre boîte mail
        </p>
        <p className="mt-2 text-muted-foreground">
          Un e-mail vient de vous être envoyé : cliquez sur le lien de confirmation pour
          recevoir la lettre hebdomadaire, chaque dimanche soir.
        </p>
      </div>
    );
  }

  return (
    <form
      className="rounded-xl border border-border bg-card p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setStatus("loading");
        try {
          await subscribe({
            data: {
              email,
              firstName,
              website,
              captchaToken: captcha.token,
              captchaAnswer: captcha.answer,
            },
          });
          setStatus("done");
        } catch (err) {
          setStatus("idle");
          setError(
            err instanceof Error ? err.message : "Inscription impossible pour le moment.",
          );
        }
      }}
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Mail className="h-4 w-4 text-primary" /> Recevoir les nouveaux articles
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Une lettre par semaine, le dimanche soir, avec les articles publiés. Désinscription en un clic.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          type="text"
          maxLength={80}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Prénom (facultatif)"
          aria-label="Prénom"
          className="sm:max-w-[40%]"
        />
        <Input
          type="email"
          required
          maxLength={255}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.fr"
          aria-label="Adresse e-mail"
        />
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          S'abonner
        </Button>
      </div>
      <div className="mt-4">
        <Captcha value={captcha} onChange={setCaptcha} />
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </form>
  );
}
