import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Captcha, type CaptchaValue } from "@/components/Captcha";
import { verifyCaptchaAnswer } from "@/lib/captcha.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Espace personnel | Angel Leclerc Communication" },
      {
        name: "description",
        content:
          "Connexion à l'espace personnel d'Angel Leclerc Communication pour rédiger et publier les actualités du site.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Espace personnel | Angel Leclerc Communication" },
      {
        property: "og:description",
        content: "Accès réservé à la rédaction et à la publication des actualités du site.",
      },
      { name: "twitter:title", content: "Espace personnel | Angel Leclerc Communication" },
      {
        name: "twitter:description",
        content: "Accès réservé à la rédaction et à la publication des actualités du site.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<CaptchaValue>({ token: "", answer: "" });
  const [captchaKey, setCaptchaKey] = useState(0);
  const verifyCaptcha = useServerFn(verifyCaptchaAnswer);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/admin" });
  }, [loading, session, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await verifyCaptcha({ data: { token: captcha.token, answer: captcha.answer } });
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (err) throw err;
        setInfo("Compte créé. Vous pouvez maintenant vous connecter.");
        setMode("signin");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        navigate({ to: "/admin" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      setError(
        message.includes("Invalid login credentials") ? "Identifiants incorrects." : message,
      );
      setCaptchaKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto w-full max-w-md px-5 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Accès réservé
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Espace personnel
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Connectez-vous pour rédiger, publier et gérer les actualités du site.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6"
        >
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Captcha key={captchaKey} value={captcha} onChange={setCaptcha} />

          {info && <p className="text-sm text-primary">{info}</p>}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            {mode === "signup" ? "Créer mon compte" : "Me connecter"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setInfo(null);
            }}
            className="w-full text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {mode === "signin" ? "Première connexion ? Créer mon compte" : "J'ai déjà un compte"}
          </button>
        </form>
      </div>
    </section>
  );
}
