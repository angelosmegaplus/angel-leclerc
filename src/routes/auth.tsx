import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2, LogIn, Mail, RefreshCw, ShieldAlert, ShieldCheck, Terminal, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPurposeIntro } from "@/components/admin/AdminPurposeIntro";

const INTRO_SESSION_KEY = "angel-os-admin-purpose-approved";
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
type AuthMode = "login" | "forgot" | "recovery";

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

function shuffle<T>(items: T[]) { return [...items].sort(() => Math.random() - 0.5); }
function makeChallenge(): ActiveChallenge {
  const definition = CHALLENGE_DEFINITIONS[Math.floor(Math.random() * CHALLENGE_DEFINITIONS.length)] ?? CHALLENGE_DEFINITIONS[0];
  const targets = shuffle(CHALLENGE_POOL.filter((item) => item.tags.includes(definition.targetTag))).slice(0, 4);
  const decoys = shuffle(CHALLENGE_POOL.filter((item) => !item.tags.includes(definition.targetTag))).slice(0, 5);
  const items = shuffle([...targets, ...decoys]);
  const uniqueIds = new Set(items.map((item) => item.id));
  const validTargets = items.filter((item) => item.tags.includes(definition.targetTag)).length;
  if (items.length !== 9 || uniqueIds.size !== 9 || validTargets !== 4) return makeChallenge();
  return { ...definition, items };
}

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion Angel OS | Angel Leclerc Communication" },
      { name: "description", content: "Connexion et récupération sécurisées de l’espace administrateur Angel OS." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [introApproved, setIntroApproved] = useState(false);
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIntroApproved(sessionStorage.getItem(INTRO_SESSION_KEY) === "1");
    setHumanUnlocked(sessionStorage.getItem(HUMAN_SESSION_KEY) === "1");
    setHumanAttempts(Number(localStorage.getItem(HUMAN_ATTEMPTS_KEY) ?? "0") || 0);
    setLockUntil(Number(localStorage.getItem(HUMAN_LOCK_UNTIL_KEY) ?? "0") || 0);
    const query = new URLSearchParams(window.location.search);
    if (query.get("mode") === "recovery") setMode("recovery");

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("recovery");
        setIntroApproved(true);
        setHumanUnlocked(true);
        sessionStorage.setItem(INTRO_SESSION_KEY, "1");
        sessionStorage.setItem(HUMAN_SESSION_KEY, "1");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (mode === "recovery") return;
    if (!loading && session && introApproved && humanUnlocked && !securityScreen) {
      sessionStorage.setItem(ADMIN_BOOT_PENDING_KEY, "1");
      navigate({ to: "/admin" });
    }
  }, [loading, session, introApproved, humanUnlocked, securityScreen, mode, navigate]);

  useEffect(() => {
    if (lockUntil <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [lockUntil]);

  const remainingLockSeconds = useMemo(() => Math.max(0, Math.ceil((lockUntil - now) / 1000)), [lockUntil, now]);
  const humanLocked = remainingLockSeconds > 0;

  function approveIntro() {
    sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    setIntroApproved(true);
    refreshChallenge();
  }
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
      setHumanError(`Sélection incorrecte. ${MAX_HUMAN_ATTEMPTS - nextAttempts} tentative(s) restante(s).`);
    }
    refreshChallenge();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) throw err;
      setPassword("");
      sessionStorage.setItem(ADMIN_BOOT_PENDING_KEY, "1");
      navigate({ to: "/admin" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      setError(message.includes("Invalid login credentials") ? "Identifiants incorrects. Si ce mot de passe fonctionnait auparavant, utilisez « Mot de passe oublié » : le compte actif peut avoir changé de projet d’authentification." : message);
    } finally { setBusy(false); }
  }

  async function sendRecovery(e: React.FormEvent) {
    e.preventDefault();
    const target = email.trim();
    if (!target) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const redirectTo = `${window.location.origin}/auth?mode=recovery`;
      const { error: err } = await supabase.auth.resetPasswordForEmail(target, { redirectTo });
      if (err) throw err;
      setNotice("Si ce compte existe dans le projet d’authentification actuel, un e-mail de récupération vient d’être envoyé. Ouvrez le lien reçu sur cet appareil.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d’envoyer le lien de récupération.");
    } finally { setBusy(false); }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setNotice(null);
    if (password.length < 8) { setError("Le nouveau mot de passe doit contenir au moins 8 caractères."); return; }
    if (password !== confirmPassword) { setError("Les deux mots de passe ne correspondent pas."); return; }
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setPassword(""); setConfirmPassword("");
      setNotice("Mot de passe mis à jour. Vous allez pouvoir accéder à l’espace administrateur avec cette session.");
      sessionStorage.setItem(INTRO_SESSION_KEY, "1");
      sessionStorage.setItem(HUMAN_SESSION_KEY, "1");
      sessionStorage.setItem(ADMIN_BOOT_PENDING_KEY, "1");
      window.history.replaceState({}, "", "/auth");
      window.setTimeout(() => navigate({ to: "/admin" }), 500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de modifier le mot de passe.";
      setError(/session|jwt|auth/i.test(message) ? "Le lien de récupération est invalide ou expiré. Demandez un nouveau lien." : message);
    } finally { setBusy(false); }
  }

  if (loading && mode !== "recovery") return <section className="flex min-h-[70vh] items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></section>;

  if (mode === "recovery") {
    return <section className="min-h-screen bg-background py-16 md:py-24"><div className="mx-auto w-full max-w-md px-5 sm:px-6">
      <div className="flex items-center gap-3"><img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-11 w-11 rounded-xl object-contain" /><div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Récupération sécurisée</p><h1 className="mt-1 font-display text-2xl font-bold text-foreground">Nouveau mot de passe</h1></div></div>
      <p className="mt-3 text-sm text-muted-foreground">Définissez un nouveau mot de passe pour le compte ouvert par le lien de récupération.</p>
      <form onSubmit={updatePassword} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2"><Label htmlFor="new-password">Nouveau mot de passe</Label><Input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="confirm-password">Confirmer</Label><Input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
        {error && <p className="text-sm text-destructive">{error}</p>}{notice && <p className="text-sm text-primary">{notice}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}Enregistrer le nouveau mot de passe</Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => { setMode("forgot"); setError(null); setNotice(null); }}>Demander un nouveau lien</Button>
      </form>
    </div></section>;
  }

  if (!introApproved) return <section className="min-h-screen bg-background py-12 md:py-20"><div className="mx-auto w-full max-w-3xl px-5 sm:px-6"><AdminPurposeIntro /><Button type="button" onClick={approveIntro} className="h-12 w-full rounded-full text-base font-semibold">J’ai compris · Continuer</Button><p className="mt-3 text-center text-xs text-muted-foreground">Étape suivante : vérification anti-robot, puis connexion à l’espace administrateur.</p></div></section>;

  if (securityScreen) return <section className="relative flex min-h-screen overflow-hidden bg-black px-6 py-12 font-mono text-green-400"><div className="relative mx-auto flex w-full max-w-4xl flex-col justify-center"><div className="mb-6 flex items-center gap-3 text-red-500"><TriangleAlert className="h-7 w-7 animate-pulse" /><p className="text-sm font-bold uppercase tracking-[0.28em]">Zone sécurisée — accès surveillé</p></div><div className="space-y-2 text-xs leading-6 sm:text-sm"><p>&gt; ANGEL_OS SECURITY GATEWAY v4.8</p><p>&gt; HUMAN_CHALLENGE ............ <span className="text-white">VERIFIED</span></p><p>&gt; AUTHENTICATION_CHANNEL .... <span className="animate-pulse text-white">OPENING</span></p></div><div className="mt-8 border-l-2 border-red-500 pl-4 text-red-400"><p className="flex items-center gap-2 text-sm font-bold"><Terminal className="h-4 w-4" /> AVERTISSEMENT DE SÉCURITÉ</p><p className="mt-2 text-xs">Espace privé. Toute tentative d’accès non autorisée peut être journalisée.</p></div></div></section>;

  if (!humanUnlocked) return <section className="min-h-[70vh] bg-background py-16 md:py-24"><div className="mx-auto w-full max-w-md px-5 sm:px-6"><div className="mb-6 flex items-center gap-3"><img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-12 w-12 rounded-xl object-contain" /><div><p className="text-xs font-semibold text-muted-foreground">Angel OS · étape 2/3</p><h1 className="font-display text-2xl font-bold text-foreground">Vérification anti-robot</h1></div></div><form onSubmit={onHumanSubmit} className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm">{humanLocked ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"><ShieldAlert className="mb-2 h-5 w-5 text-destructive" /><p>Accès temporairement bloqué. Nouvelle tentative dans {Math.ceil(remainingLockSeconds / 60)} min.</p></div> : <><p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" />{challenge.prompt}</p><div className="grid grid-cols-3 gap-3">{challenge.items.map((item) => { const active = selected.includes(item.id); return <button key={item.id} type="button" aria-pressed={active} aria-label={item.label} onClick={() => toggleItem(item.id)} className={`flex aspect-square items-center justify-center rounded-2xl border text-4xl ${active ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "border-border bg-background"}`}>{item.icon}</button>; })}</div><Button type="button" variant="ghost" size="sm" className="w-full" onClick={refreshChallenge}><RefreshCw className="mr-2 h-4 w-4" />Nouveau défi</Button></>}{humanError && <p className="text-sm text-destructive">{humanError}</p>}{!humanLocked && <Button type="submit" disabled={selected.length === 0} className="h-12 w-full rounded-full"><ShieldCheck className="mr-2 h-4 w-4" />Valider la vérification</Button>}</form></div></section>;

  if (session && mode === "login") return <section className="flex min-h-[70vh] items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></section>;

  return <section className="bg-background py-16 md:py-24"><div className="mx-auto w-full max-w-md px-5 sm:px-6"><div className="flex items-center gap-3"><img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-11 w-11 rounded-xl object-contain" /><div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Étape 3/3 · Accès réservé</p><h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">{mode === "forgot" ? "Récupérer l’accès" : "Connexion Angel OS"}</h1></div></div>
    {mode === "forgot" ? <><p className="mt-3 text-sm text-muted-foreground">Entrez l’adresse e-mail du compte administrateur. Le lien reçu permettra de choisir un nouveau mot de passe.</p><form onSubmit={sendRecovery} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6"><div className="space-y-2"><Label htmlFor="recovery-email">E-mail</Label><Input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>{error && <p className="text-sm text-destructive">{error}</p>}{notice && <p className="text-sm text-primary">{notice}</p>}<Button type="submit" disabled={busy} className="w-full">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}Envoyer le lien de récupération</Button><Button type="button" variant="ghost" className="w-full" onClick={() => { setMode("login"); setError(null); setNotice(null); }}>Retour à la connexion</Button></form></> : <><p className="mt-3 text-sm text-muted-foreground">Connectez-vous avec le compte administrateur autorisé.</p><form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6"><div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div><div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Mot de passe</Label><button type="button" onClick={() => { setMode("forgot"); setError(null); setNotice(null); }} className="text-xs font-medium text-primary hover:underline">Mot de passe oublié ?</button></div><Input id="password" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>{error && <p className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={busy} className="w-full">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}Me connecter</Button></form></>}
  </div></section>;
}
