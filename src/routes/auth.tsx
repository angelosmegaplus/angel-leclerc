import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, LogIn, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Captcha, type CaptchaValue } from "@/components/Captcha";
import { verifyCaptchaAnswer } from "@/lib/captcha.functions";

const HUMAN_SESSION_KEY = "angel-os-admin-human-ok";
const ADMIN_BOOT_PENDING_KEY = "angel-os:admin-boot-pending";
const HUMAN_ATTEMPTS_KEY = "angel-os-admin-human-attempts";
const HUMAN_LOCK_UNTIL_KEY = "angel-os-admin-human-lock-until";
const MAX_HUMAN_ATTEMPTS = 5;
const HUMAN_LOCK_MS = 15 * 60 * 1000;
const MIN_CHALLENGE_MS = 900;

type ChallengeItem = { id: string; icon: string; label: string; food: boolean };

const CHALLENGE_POOL: ChallengeItem[] = [
  { id: "pizza", icon: "🍕", label: "Pizza", food: true },
  { id: "apple", icon: "🍎", label: "Pomme", food: true },
  { id: "bread", icon: "🥖", label: "Pain", food: true },
  { id: "cheese", icon: "🧀", label: "Fromage", food: true },
  { id: "burger", icon: "🍔", label: "Burger", food: true },
  { id: "carrot", icon: "🥕", label: "Carotte", food: true },
  { id: "cake", icon: "🍰", label: "Gâteau", food: true },
  { id: "car", icon: "🚗", label: "Voiture", food: false },
  { id: "phone", icon: "📱", label: "Téléphone", food: false },
  { id: "key", icon: "🔑", label: "Clé", food: false },
  { id: "tree", icon: "🌳", label: "Arbre", food: false },
  { id: "camera", icon: "📷", label: "Appareil photo", food: false },
  { id: "ball", icon: "⚽", label: "Ballon", food: false },
  { id: "book", icon: "📚", label: "Livres", food: false },
];

function makeChallenge() {
  const foods = CHALLENGE_POOL.filter((item) => item.food).sort(() => Math.random() - 0.5).slice(0, 4);
  const others = CHALLENGE_POOL.filter((item) => !item.food).sort(() => Math.random() - 0.5).slice(0, 5);
  return [...foods, ...others].sort(() => Math.random() - 0.5);
}

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
  const [humanUnlocked, setHumanUnlocked] = useState(false);
  const [authPassed, setAuthPassed] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeItem[]>(() => makeChallenge());
  const [selected, setSelected] = useState<string[]>([]);
  const [challengeStartedAt, setChallengeStartedAt] = useState(() => Date.now());
  const [humanError, setHumanError] = useState<string | null>(null);
  const [humanAttempts, setHumanAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<CaptchaValue>({ token: "", answer: "" });
  const [captchaKey, setCaptchaKey] = useState(0);
  const verifyCaptcha = useServerFn(verifyCaptchaAnswer);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHumanUnlocked(sessionStorage.getItem(HUMAN_SESSION_KEY) === "1");
    setHumanAttempts(Number(localStorage.getItem(HUMAN_ATTEMPTS_KEY) ?? "0") || 0);
    setLockUntil(Number(localStorage.getItem(HUMAN_LOCK_UNTIL_KEY) ?? "0") || 0);
  }, []);

  useEffect(() => {
    if (!loading && session) setAuthPassed(true);
  }, [loading, session]);

  useEffect(() => {
    if (!loading && session && humanUnlocked) navigate({ to: "/admin" });
  }, [loading, session, humanUnlocked, navigate]);

  useEffect(() => {
    if (lockUntil <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [lockUntil]);

  const remainingLockSeconds = useMemo(() => Math.max(0, Math.ceil((lockUntil - now) / 1000)), [lockUntil, now]);
  const humanLocked = remainingLockSeconds > 0;

  function refreshChallenge() {
    setChallenge(makeChallenge());
    setSelected([]);
    setHumanError(null);
    setChallengeStartedAt(Date.now());
  }

  function toggleItem(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function onHumanSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (humanLocked) return;

    const expected = challenge.filter((item) => item.food).map((item) => item.id).sort();
    const answer = [...selected].sort();
    const correct = expected.length === answer.length && expected.every((id, index) => id === answer[index]);
    const plausibleTiming = Date.now() - challengeStartedAt >= MIN_CHALLENGE_MS;

    if (correct && plausibleTiming) {
      localStorage.removeItem(HUMAN_ATTEMPTS_KEY);
      localStorage.removeItem(HUMAN_LOCK_UNTIL_KEY);
      sessionStorage.setItem(HUMAN_SESSION_KEY, "1");
      sessionStorage.setItem(ADMIN_BOOT_PENDING_KEY, "1");
      setHumanAttempts(0);
      setHumanUnlocked(true);
      navigate({ to: "/admin" });
      return;
    }

    const nextAttempts = humanAttempts + 1;
    if (nextAttempts >= MAX_HUMAN_ATTEMPTS) {
      const nextLockUntil = Date.now() + HUMAN_LOCK_MS;
      localStorage.setItem(HUMAN_ATTEMPTS_KEY, "0");
      localStorage.setItem(HUMAN_LOCK_UNTIL_KEY, String(nextLockUntil));
      setHumanAttempts(0);
      setLockUntil(nextLockUntil);
      setNow(Date.now());
      setHumanError("Trop de vérifications incorrectes. Accès temporairement bloqué pendant 15 minutes.");
    } else {
      localStorage.setItem(HUMAN_ATTEMPTS_KEY, String(nextAttempts));
      setHumanAttempts(nextAttempts);
      setHumanError(`Sélection incorrecte. ${MAX_HUMAN_ATTEMPTS - nextAttempts} tentative${MAX_HUMAN_ATTEMPTS - nextAttempts > 1 ? "s" : ""} restante${MAX_HUMAN_ATTEMPTS - nextAttempts > 1 ? "s" : ""}.`);
    }
    refreshChallenge();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verifyCaptcha({ data: { token: captcha.token, answer: captcha.answer } });
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) throw err;
      setAuthPassed(true);
      setPassword("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      setError(message.includes("Invalid login credentials") ? "Identifiants incorrects." : message);
      setCaptchaKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <section className="flex min-h-[70vh] items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></section>;

  if (!authPassed) {
    return (
      <section className="bg-background py-16 md:py-24">
        <div className="mx-auto w-full max-w-md px-5 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-11 w-11 rounded-xl object-contain" />
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Accès réservé</p><h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Connexion Angel OS</h1></div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Connectez-vous avec le compte administrateur autorisé.</p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
            <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="password">Mot de passe</Label><Input id="password" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Captcha key={captchaKey} value={captcha} onChange={setCaptcha} />
            <Button type="submit" disabled={busy} className="w-full">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}Me connecter</Button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[70vh] bg-background py-16 md:py-24">
      <div className="mx-auto w-full max-w-md px-5 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-12 w-12 rounded-xl object-contain" />
          <div><p className="text-xs font-semibold text-muted-foreground">Angel OS</p><h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Vérification anti-robot</h1></div>
        </div>
        <form onSubmit={onHumanSubmit} className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
          {humanLocked ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"><div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" /><div><p className="font-semibold text-foreground">Accès temporairement bloqué</p><p className="mt-1 text-muted-foreground">Nouvelle tentative possible dans {Math.ceil(remainingLockSeconds / 60)} min.</p></div></div></div>
          ) : (
            <>
              <div><p className="flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Sélectionnez toutes les icônes liées à la nourriture</p><p className="mt-1 text-xs text-muted-foreground">La grille change après chaque erreur ou actualisation.</p></div>
              <div className="grid grid-cols-3 gap-3">
                {challenge.map((item) => {
                  const active = selected.includes(item.id);
                  return <button key={item.id} type="button" aria-pressed={active} aria-label={item.label} onClick={() => toggleItem(item.id)} className={`flex aspect-square items-center justify-center rounded-2xl border text-4xl transition-all ${active ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "border-border bg-background hover:border-primary/50 hover:bg-muted/40"}`}>{item.icon}</button>;
                })}
              </div>
              <Button type="button" variant="ghost" size="sm" className="w-full" onClick={refreshChallenge}><RefreshCw className="mr-2 h-4 w-4" />Changer la grille</Button>
            </>
          )}
          {humanError && <p className="text-sm text-destructive">{humanError}</p>}
          {!humanLocked && <Button type="submit" disabled={selected.length === 0} className="h-12 w-full rounded-full"><ShieldCheck className="mr-2 h-4 w-4" />Valider et accéder à l’espace administrateur</Button>}
        </form>
      </div>
    </section>
  );
}
