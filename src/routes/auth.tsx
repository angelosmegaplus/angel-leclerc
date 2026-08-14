import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Loader2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Captcha, type CaptchaValue } from "@/components/Captcha";
import { verifyCaptchaAnswer } from "@/lib/captcha.functions";
import { verifyAdminPinCode } from "@/lib/admin-pin.functions";

const PIN_SESSION_KEY = "angel-os-admin-pin-ok";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion Angel OS | Angel Leclerc Communication" },
      {
        name: "description",
        content: "Accès réservé à l'espace administrateur Angel OS.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Connexion Angel OS" },
      { property: "og:description", content: "Accès réservé à l'espace administrateur Angel OS." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const verifyPin = useServerFn(verifyAdminPinCode);
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
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
    if (typeof window !== "undefined") {
      setPinUnlocked(sessionStorage.getItem(PIN_SESSION_KEY) === "1");
    }
  }, []);

  useEffect(() => {
    if (!loading && session && pinUnlocked) navigate({ to: "/admin" });
  }, [loading, session, pinUnlocked, navigate]);

  async function onPinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPinBusy(true);
    setPinError(null);
    try {
      await verifyPin({ data: { pin } });
      sessionStorage.setItem(PIN_SESSION_KEY, "1");
      setPinUnlocked(true);
      if (session) navigate({ to: "/admin" });
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Code PIN incorrect.");
      setPin("");
    } finally {
      setPinBusy(false);
    }
  }

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
      setError(message.includes("Invalid login credentials") ? "Identifiants incorrects." : message);
      setCaptchaKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  }

  if (!pinUnlocked) {
    return (
      <section className="min-h-[70vh] bg-background py-16 md:py-24">
        <div className="mx-auto w-full max-w-sm px-5 sm:px-6">
          <div className="mb-6 flex items-center gap-3">
            <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-12 w-12 rounded-xl object-contain" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Angel OS</p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Accès administrateur</h1>
            </div>
          </div>
          <form onSubmit={onPinSubmit} className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-foreground">Merci de rentrer le code PIN</p>
              <p className="mt-1 text-xs text-muted-foreground">Accès réservé à l'espace administrateur.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-pin">Code PIN</Label>
              <Input
                id="admin-pin"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                required
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="h-14 text-center text-2xl tracking-[0.45em]"
              />
            </div>
            {pinError && <p className="text-sm text-destructive">{pinError}</p>}
            <Button type="submit" disabled={pinBusy || pin.length !== 4} className="h-12 w-full rounded-full">
              {pinBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Continuer
            </Button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto w-full max-w-md px-5 sm:px-6">
        <div className="flex items-center gap-3">
          <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-11 w-11 rounded-xl object-contain" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Accès réservé</p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Connexion Angel OS</h1>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Le code PIN est validé. Connectez maintenant votre compte administrateur.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Captcha key={captchaKey} value={captcha} onChange={setCaptcha} />
          {info && <p className="text-sm text-primary">{info}</p>}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
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
