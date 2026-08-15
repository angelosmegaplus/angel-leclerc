import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Loader2, LogIn, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Captcha, type CaptchaValue } from "@/components/Captcha";
import { verifyCaptchaAnswer } from "@/lib/captcha.functions";
import { verifyAdminPinCode } from "@/lib/admin-pin.functions";

const PIN_SESSION_KEY = "angel-os-admin-pin-ok";
const ADMIN_BOOT_PENDING_KEY = "angel-os:admin-boot-pending";
const PIN_ATTEMPTS_KEY = "angel-os-admin-pin-attempts";
const PIN_LOCK_UNTIL_KEY = "angel-os-admin-pin-lock-until";
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCK_MS = 15 * 60 * 1000;

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion Angel OS | Angel Leclerc Communication" },
      { name: "description", content: "Accès réservé à l'espace administrateur Angel OS." },
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
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [authPassed, setAuthPassed] = useState(false);
  const [pin, setPin] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [showPinHelp, setShowPinHelp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<CaptchaValue>({ token: "", answer: "" });
  const [captchaKey, setCaptchaKey] = useState(0);
  const verifyCaptcha = useServerFn(verifyCaptchaAnswer);
  const verifyAdminPin = useServerFn(verifyAdminPinCode);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPinUnlocked(sessionStorage.getItem(PIN_SESSION_KEY) === "1");
    setPinAttempts(Number(localStorage.getItem(PIN_ATTEMPTS_KEY) ?? "0") || 0);
    setLockUntil(Number(localStorage.getItem(PIN_LOCK_UNTIL_KEY) ?? "0") || 0);
  }, []);

  useEffect(() => {
    if (!loading && session) setAuthPassed(true);
  }, [loading, session]);

  useEffect(() => {
    if (!loading && session && pinUnlocked) navigate({ to: "/admin" });
  }, [loading, session, pinUnlocked, navigate]);

  useEffect(() => {
    if (lockUntil <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [lockUntil]);

  const remainingLockSeconds = useMemo(
    () => Math.max(0, Math.ceil((lockUntil - now) / 1000)),
    [lockUntil, now],
  );
  const pinLocked = remainingLockSeconds > 0;
  const remainingAttempts = Math.max(0, MAX_PIN_ATTEMPTS - pinAttempts);

  async function onPinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pinLocked) return;
    setPinBusy(true);
    setPinError(null);
    setShowPinHelp(false);

    try {
      await verifyAdminPin({ data: { pin } });
      localStorage.removeItem(PIN_ATTEMPTS_KEY);
      localStorage.removeItem(PIN_LOCK_UNTIL_KEY);
      sessionStorage.setItem(PIN_SESSION_KEY, "1");
      sessionStorage.setItem(ADMIN_BOOT_PENDING_KEY, "1");
      setPinAttempts(0);
      setLockUntil(0);
      setPinUnlocked(true);
      navigate({ to: "/admin" });
    } catch {
      const nextAttempts = pinAttempts + 1;
      setPin("");

      if (nextAttempts >= MAX_PIN_ATTEMPTS) {
        const nextLockUntil = Date.now() + PIN_LOCK_MS;
        localStorage.setItem(PIN_ATTEMPTS_KEY, "0");
        localStorage.setItem(PIN_LOCK_UNTIL_KEY, String(nextLockUntil));
        setPinAttempts(0);
        setLockUntil(nextLockUntil);
        setNow(Date.now());
        setPinError("Trop de codes incorrects. Accès temporairement bloqué pendant 15 minutes.");
      } else {
        localStorage.setItem(PIN_ATTEMPTS_KEY, String(nextAttempts));
        setPinAttempts(nextAttempts);
        setPinError(`Code PIN incorrect. ${MAX_PIN_ATTEMPTS - nextAttempts} tentative${MAX_PIN_ATTEMPTS - nextAttempts > 1 ? "s" : ""} restante${MAX_PIN_ATTEMPTS - nextAttempts > 1 ? "s" : ""}.`);
      }
    } finally {
      setPinBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verifyCaptcha({ data: { token: captcha.token, answer: captcha.answer } });
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) throw err;
      setAuthPassed(true);
      setPassword("");
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      setError(message.includes("Invalid login credentials") ? "Identifiants incorrects." : message);
      setCaptchaKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </section>
    );
  }

  if (!authPassed) {
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
          <p className="mt-3 text-sm text-muted-foreground">Connectez-vous d'abord avec le compte administrateur autorisé. Le code PIN sera demandé ensuite.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Captcha key={captchaKey} value={captcha} onChange={setCaptcha} />

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Me connecter
            </Button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[70vh] bg-background py-16 md:py-24">
      <div className="mx-auto w-full max-w-sm px-5 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-12 w-12 rounded-xl object-contain" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Angel OS</p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Vérification PIN</h1>
          </div>
        </div>

        <form onSubmit={onPinSubmit} className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-foreground">Connexion validée</p>
            <p className="mt-1 text-xs text-muted-foreground">Saisissez maintenant le code PIN administrateur.</p>
          </div>

          {pinLocked ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="font-semibold text-foreground">Accès temporairement bloqué</p>
                  <p className="mt-1 text-muted-foreground">Nouvelle tentative possible dans {Math.ceil(remainingLockSeconds / 60)} min.</p>
                </div>
              </div>
            </div>
          ) : (
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
              {pinAttempts > 0 && <p className="text-xs text-muted-foreground">{remainingAttempts} tentative{remainingAttempts > 1 ? "s" : ""} avant blocage temporaire.</p>}
            </div>
          )}

          {pinError && <p className="text-sm text-destructive">{pinError}</p>}

          {!pinLocked && (
            <Button type="submit" disabled={pinBusy || pin.length !== 4} className="h-12 w-full rounded-full">
              {pinBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Accéder à l'espace administrateur
            </Button>
          )}

          <Button type="button" variant="ghost" className="w-full" onClick={() => setShowPinHelp((value) => !value)}>
            Code oublié ?
          </Button>

          {showPinHelp && (
            <div className="rounded-2xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Récupération du code</p>
              <p className="mt-1">Le PIN ne peut pas être affiché directement depuis la page. La récupération doit passer par le compte administrateur afin d'éviter qu'un visiteur puisse contourner cette seconde vérification.</p>
              <p className="mt-2">Si le code est réellement perdu, il faut le réinitialiser côté serveur plutôt que le révéler dans le navigateur.</p>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
