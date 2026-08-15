import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn, RefreshCw, ShieldAlert, ShieldCheck, Terminal, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HUMAN_SESSION_KEY = "angel-os-admin-human-ok";
const ADMIN_BOOT_PENDING_KEY = "angel-os:admin-boot-pending";
const HUMAN_ATTEMPTS_KEY = "angel-os-admin-human-attempts";
const HUMAN_LOCK_UNTIL_KEY = "angel-os-admin-human-lock-until";
const MAX_HUMAN_ATTEMPTS = 5;
const HUMAN_LOCK_MS = 15 * 60 * 1000;
const MIN_CHALLENGE_MS = 900;
const SECURITY_SCREEN_MS = 1800;

type ChallengeItem = { id: string; icon: string; label: string; tags: string[] };
type ChallengeDefinition = { id: string; prompt: string; targetTag: string };
type ActiveChallenge = ChallengeDefinition & { items: ChallengeItem[] };

const CHALLENGE_POOL: ChallengeItem[] = [
  { id: "pizza", icon: "🍕", label: "Pizza", tags: ["food"] },
  { id: "apple", icon: "🍎", label: "Pomme", tags: ["food", "nature"] },
  { id: "bread", icon: "🥖", label: "Pain", tags: ["food"] },
  { id: "cheese", icon: "🧀", label: "Fromage", tags: ["food"] },
  { id: "burger", icon: "🍔", label: "Burger", tags: ["food"] },
  { id: "carrot", icon: "🥕", label: "Carotte", tags: ["food", "nature"] },
  { id: "cake", icon: "🍰", label: "Gâteau", tags: ["food"] },
  { id: "car", icon: "🚗", label: "Voiture", tags: ["transport"] },
  { id: "bus", icon: "🚌", label: "Bus", tags: ["transport"] },
  { id: "bike", icon: "🚲", label: "Vélo", tags: ["transport"] },
  { id: "train", icon: "🚆", label: "Train", tags: ["transport"] },
  { id: "phone", icon: "📱", label: "Téléphone", tags: ["tech"] },
  { id: "laptop", icon: "💻", label: "Ordinateur", tags: ["tech"] },
  { id: "camera", icon: "📷", label: "Appareil photo", tags: ["tech"] },
  { id: "keyboard", icon: "⌨️", label: "Clavier", tags: ["tech"] },
  { id: "tree", icon: "🌳", label: "Arbre", tags: ["nature"] },
  { id: "flower", icon: "🌻", label: "Fleur", tags: ["nature"] },
  { id: "leaf", icon: "🍃", label: "Feuille", tags: ["nature"] },
  { id: "mountain", icon: "⛰️", label: "Montagne", tags: ["nature"] },
  { id: "key", icon: "🔑", label: "Clé", tags: ["object"] },
  { id: "ball", icon: "⚽", label: "Ballon", tags: ["object"] },
  { id: "book", icon: "📚", label: "Livres", tags: ["object"] },
  { id: "clock", icon: "⏰", label: "Réveil", tags: ["object"] },
];

const CHALLENGE_DEFINITIONS: ChallengeDefinition[] = [
  { id: "food", prompt: "Sélectionnez toutes les icônes liées à la nourriture", targetTag: "food" },
  { id: "transport", prompt: "Sélectionnez tous les moyens de transport", targetTag: "transport" },
  { id: "tech", prompt: "Sélectionnez toutes les icônes liées à la technologie", targetTag: "tech" },
  { id: "nature", prompt: "Sélectionnez toutes les icônes liées à la nature", targetTag: "nature" },
];

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function makeChallenge(): ActiveChallenge {
  const definition = CHALLENGE_DEFINITIONS[Math.floor(Math.random() * CHALLENGE_DEFINITIONS.length)] ?? CHALLENGE_DEFINITIONS[0];
  const targets = shuffle(CHALLENGE_POOL.filter((item) => item.tags.includes(definition.targetTag))).slice(0, 4);
  const decoys = shuffle(CHALLENGE_POOL.filter((item) => !item.tags.includes(definition.targetTag))).slice(0, 5);
  const items = shuffle([...targets, ...decoys]);

  // Contrôle d'intégrité à chaque génération : 9 cases, 4 bonnes réponses, aucun doublon.
  const uniqueIds = new Set(items.map((item) => item.id));
  const validTargets = items.filter((item) => item.tags.includes(definition.targetTag)).length;
  if (items.length !== 9 || uniqueIds.size !== 9 || validTargets !== 4) {
    return makeChallenge();
  }

  return { ...definition, items };
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
  const [securityScreen, setSecurityScreen] = useState(false);
  const [challenge, setChallenge] = useState<ActiveChallenge>(() => makeChallenge());
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHumanUnlocked(sessionStorage.getItem(HUMAN_SESSION_KEY) === "1");
    setHumanAttempts(Number(localStorage.getItem(HUMAN_ATTEMPTS_KEY) ?? "0") || 0);
    setLockUntil(Number(localStorage.getItem(HUMAN_LOCK_UNTIL_KEY) ?? "0") || 0);
  }, []);

  useEffect(() => {
    if (!loading && session && humanUnlocked && !securityScreen) {
      sessionStorage.setItem(ADMIN_BOOT_PENDING_KEY, "1");
      navigate({ to: "/admin" });
    }
  }, [loading, session, humanUnlocked, securityScreen, navigate]);

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

    const expected = challenge.items.filter((item) => item.tags.includes(challenge.targetTag)).map((item) => item.id).sort();
    const answer = [...selected].sort();
    const correct = expected.length === answer.length && expected.every((id, index) => id === answer[index]);
    const plausibleTiming = Date.now() - challengeStartedAt >= MIN_CHALLENGE_MS;

    if (correct && plausibleTiming) {
      localStorage.removeItem(HUMAN_ATTEMPTS_KEY);
      localStorage.removeItem(HUMAN_LOCK_UNTIL_KEY);
      sessionStorage.setItem(HUMAN_SESSION_KEY, "1");
      setHumanAttempts(0);
      setHumanError(null);
      setSecurityScreen(true);
      setHumanUnlocked(true);
      window.setTimeout(() => setSecurityScreen(false), SECURITY_SCREEN_MS);
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
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) throw err;
      setPassword("");
      sessionStorage.setItem(ADMIN_BOOT_PENDING_KEY, "1");
      navigate({ to: "/admin" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      setError(message.includes("Invalid login credentials") ? "Identifiants incorrects." : message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <section className="flex min-h-[70vh] items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></section>;
  }

  if (securityScreen) {
    return (
      <section className="relative flex min-h-screen overflow-hidden bg-black px-6 py-12 font-mono text-green-400">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(34,197,94,.15) 4px)" }} />
        <div className="relative mx-auto flex w-full max-w-4xl flex-col justify-center">
          <div className="mb-6 flex items-center gap-3 text-red-500">
            <TriangleAlert className="h-7 w-7 animate-pulse" />
            <p className="text-sm font-bold uppercase tracking-[0.28em]">Zone sécurisée — accès surveillé</p>
          </div>
          <div className="space-y-2 text-xs leading-6 sm:text-sm">
            <p>&gt; ANGEL_OS SECURITY GATEWAY v4.8</p>
            <p>&gt; HUMAN_CHALLENGE ............ <span className="text-white">VERIFIED</span></p>
            <p>&gt; SESSION_FINGERPRINT ....... <span className="text-white">CAPTURED</span></p>
            <p>&gt; INTRUSION_MONITOR ......... <span className="text-yellow-300">ACTIVE</span></p>
            <p>&gt; AUTHENTICATION_CHANNEL .... <span className="animate-pulse text-white">OPENING</span></p>
          </div>
          <div className="mt-8 border-l-2 border-red-500 pl-4 text-red-400">
            <p className="flex items-center gap-2 text-sm font-bold"><Terminal className="h-4 w-4" /> AVERTISSEMENT DE SÉCURITÉ</p>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-red-300/90">Espace privé. Toute tentative d’accès non autorisée peut être journalisée et entraîner le blocage automatique de la session.</p>
          </div>
          <p className="mt-8 animate-pulse text-xs text-green-300">Initialisation du canal de connexion sécurisé…</p>
        </div>
      </section>
    );
  }

  if (!humanUnlocked) {
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
                <div><p className="flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" />{challenge.prompt}</p><p className="mt-1 text-xs text-muted-foreground">Le type de défi et la grille changent aléatoirement.</p></div>
                <div className="grid grid-cols-3 gap-3">
                  {challenge.items.map((item) => {
                    const active = selected.includes(item.id);
                    return <button key={item.id} type="button" aria-pressed={active} aria-label={item.label} onClick={() => toggleItem(item.id)} className={`flex aspect-square items-center justify-center rounded-2xl border text-4xl transition-all ${active ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "border-border bg-background hover:border-primary/50 hover:bg-muted/40"}`}>{item.icon}</button>;
                  })}
                </div>
                <Button type="button" variant="ghost" size="sm" className="w-full" onClick={refreshChallenge}><RefreshCw className="mr-2 h-4 w-4" />Nouveau défi</Button>
              </>
            )}
            {humanError && <p className="text-sm text-destructive">{humanError}</p>}
            {!humanLocked && <Button type="submit" disabled={selected.length === 0} className="h-12 w-full rounded-full"><ShieldCheck className="mr-2 h-4 w-4" />Valider la vérification</Button>}
          </form>
        </div>
      </section>
    );
  }

  if (session) {
    return <section className="flex min-h-[70vh] items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></section>;
  }

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto w-full max-w-md px-5 sm:px-6">
        <div className="flex items-center gap-3">
          <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-11 w-11 rounded-xl object-contain" />
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Accès réservé</p><h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Connexion Angel OS</h1></div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Vérification humaine validée. Connectez-vous avec le compte administrateur autorisé.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="password">Mot de passe</Label><Input id="password" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}Me connecter</Button>
        </form>
      </div>
    </section>
  );
}
