import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { claimOwnerAdminAccess } from "@/lib/admin-owner-recovery.functions";
import { resetOwnerPasswordWithEmergencyCode } from "@/lib/admin-password-reset.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ADMIN_BOOT_PENDING_KEY = "angel-os:admin-boot-pending";
type AuthMode = "login" | "signup" | "forgot" | "owner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion Angel OS | Angel Leclerc Communication" },
      { name: "description", content: "Connexion, création de compte et récupération sécurisée de l’espace administrateur Angel OS." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function cleanError(error: unknown, fallback: string) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (!raw || /<!doctype|<html|this page didn't load/i.test(raw)) return fallback;
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 280) || fallback;
}

function AuthPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ownerCode, setOwnerCode] = useState("");
  const [emergencyCode, setEmergencyCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session && isAdmin) {
      sessionStorage.setItem(ADMIN_BOOT_PENDING_KEY, "1");
      navigate({ to: "/admin" });
    }
  }, [loading, session, isAdmin, navigate]);

  function resetMessages() { setError(null); setNotice(null); }
  function switchMode(next: AuthMode) {
    resetMessages(); setMode(next); setPassword(""); setConfirmPassword(""); setOwnerCode(""); setEmergencyCode("");
  }

  async function login(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); resetMessages();
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) throw err;
      setPassword("");
    } catch (err) {
      const message = cleanError(err, "Connexion impossible.");
      setError(message.includes("Invalid login credentials") ? "E-mail ou mot de passe incorrect." : message);
    } finally { setBusy(false); }
  }

  async function signup(e: React.FormEvent) {
    e.preventDefault(); resetMessages();
    if (password.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirmPassword) return setError("Les deux mots de passe ne correspondent pas.");
    setBusy(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
      if (err) throw err;
      setPassword(""); setConfirmPassword("");
      if (data.session) { setNotice("Compte créé. Utilisez maintenant « Secours » pour prouver l’identité propriétaire."); setMode("owner"); }
      else setNotice("Compte créé. Vous pouvez maintenant utiliser la récupération par code si nécessaire.");
    } catch (err) { setError(cleanError(err, "Impossible de créer le compte.")); }
    finally { setBusy(false); }
  }

  async function resetPasswordWithCode(e: React.FormEvent) {
    e.preventDefault(); resetMessages();
    const normalizedEmail = email.trim().toLowerCase();
    if (password.length < 8) return setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirmPassword) return setError("Les deux mots de passe ne correspondent pas.");
    if (emergencyCode.trim().length < 4) return setError("Entrez le code d’urgence.");
    setBusy(true);
    try {
      const result = await resetOwnerPasswordWithEmergencyCode({ data: { email: normalizedEmail, code: emergencyCode.trim(), password } });
      if (!result.ok) return setError(result.error);

      const { error: signInError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (signInError) {
        setNotice("Mot de passe remplacé. Revenez à Connexion avec ce nouveau mot de passe.");
        setMode("login");
        return;
      }

      sessionStorage.setItem(ADMIN_BOOT_PENDING_KEY, "1");
      setNotice(result.adminRestored ? "Accès restauré. Ouverture de l’administration…" : "Mot de passe restauré. Connexion en cours…");
      window.setTimeout(() => window.location.assign("/admin"), 250);
    } catch (err) {
      setError(cleanError(err, "La récupération a rencontré une erreur serveur. Aucun code HTML n’est affiché : réessayez directement."));
    } finally { setBusy(false); }
  }

  async function claimOwner(e: React.FormEvent) {
    e.preventDefault(); resetMessages();
    if (!session) return setError("Connectez-vous d’abord avec votre compte Angel.");
    setBusy(true);
    try {
      await claimOwnerAdminAccess({ data: { code: ownerCode.trim() } });
      setNotice("Identité propriétaire validée. Accès administrateur activé.");
      setOwnerCode(""); sessionStorage.setItem(ADMIN_BOOT_PENDING_KEY, "1");
      window.setTimeout(() => window.location.assign("/admin"), 250);
    } catch (err) { setError(cleanError(err, "Impossible de valider le code de secours.")); }
    finally { setBusy(false); }
  }

  async function logout() { await supabase.auth.signOut(); switchMode("login"); }
  if (loading) return <section className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></section>;

  const title = mode === "signup" ? "Créer mon compte" : mode === "forgot" ? "Récupérer mon accès" : mode === "owner" ? "Accès propriétaire" : "Connexion";

  return <section className="min-h-screen bg-background px-4 py-10 sm:py-16"><div className="mx-auto w-full max-w-md">
    <div className="mb-6 flex items-center gap-3"><img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-12 w-12 rounded-2xl object-contain" /><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Angel OS · espace privé</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">{title}</h1></div></div>
    <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-2">
      <button type="button" onClick={() => switchMode("login")} className={`rounded-xl px-3 py-2 text-sm font-medium ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>Connexion</button>
      <button type="button" onClick={() => switchMode("signup")} className={`rounded-xl px-3 py-2 text-sm font-medium ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>Créer un compte</button>
      <button type="button" onClick={() => switchMode("owner")} className={`rounded-xl px-3 py-2 text-sm font-medium ${mode === "owner" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>Secours</button>
    </div>
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      {mode === "login" && <form onSubmit={login} className="space-y-4"><p className="text-sm text-muted-foreground">Connexion directe au compte Angel OS.</p><FieldEmail value={email} onChange={setEmail} /><FieldPassword label="Mot de passe" value={password} onChange={setPassword} autoComplete="current-password" /><button type="button" onClick={() => switchMode("forgot")} className="text-sm font-medium text-primary hover:underline">Mot de passe oublié ?</button><Messages error={error} notice={notice} /><Button type="submit" disabled={busy} className="h-12 w-full rounded-xl">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}Me connecter</Button></form>}
      {mode === "signup" && <form onSubmit={signup} className="space-y-4"><p className="text-sm text-muted-foreground">Créez votre compte. Les droits administrateur restent séparés de la création du compte.</p><FieldEmail value={email} onChange={setEmail} /><FieldPassword label="Mot de passe" value={password} onChange={setPassword} autoComplete="new-password" /><FieldPassword label="Confirmer le mot de passe" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" /><Messages error={error} notice={notice} /><Button type="submit" disabled={busy} className="h-12 w-full rounded-xl">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}Créer mon compte</Button></form>}
      {mode === "forgot" && <form onSubmit={resetPasswordWithCode} className="space-y-4"><div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4"><div className="flex items-center gap-2 font-semibold"><KeyRound className="h-5 w-5 text-orange-500" />Code d’urgence</div><p className="mt-2 text-sm text-muted-foreground">Aucun e-mail. Entrez le compte propriétaire, votre code d’urgence et le nouveau mot de passe. Si tout est valide, Angel OS ouvre directement l’administration.</p></div><FieldEmail value={email} onChange={setEmail} /><div className="space-y-2"><Label htmlFor="emergency-code">Code d’urgence</Label><Input id="emergency-code" inputMode="numeric" autoComplete="one-time-code" value={emergencyCode} onChange={(e) => setEmergencyCode(e.target.value)} placeholder="••••" required /></div><FieldPassword label="Nouveau mot de passe" value={password} onChange={setPassword} autoComplete="new-password" /><FieldPassword label="Confirmer le nouveau mot de passe" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" /><Messages error={error} notice={notice} /><Button type="submit" disabled={busy} className="h-12 w-full rounded-xl">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}Restaurer et ouvrir l’admin</Button><Button type="button" variant="ghost" className="w-full" onClick={() => switchMode("login")}>Retour à la connexion</Button></form>}
      {mode === "owner" && <form onSubmit={claimOwner} className="space-y-4"><div className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-primary" />Preuve propriétaire</div><p className="mt-2 text-sm text-muted-foreground">Ce code sert uniquement à obtenir les droits propriétaire sur un compte déjà connecté.</p></div>{!session ? <p className="text-sm text-muted-foreground">Connectez-vous ou créez votre compte avant d’utiliser cette vérification.</p> : <p className="text-sm text-muted-foreground">Compte connecté : <span className="font-medium text-foreground">{session.user.email}</span></p>}<div className="space-y-2"><Label htmlFor="owner-code">Code propriétaire</Label><Input id="owner-code" inputMode="numeric" autoComplete="one-time-code" value={ownerCode} onChange={(e) => setOwnerCode(e.target.value)} placeholder="••••" required /></div><Messages error={error} notice={notice} /><Button type="submit" disabled={busy || !session || ownerCode.length < 4} className="h-12 w-full rounded-xl">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}Prouver que je suis Angel</Button>{session && <Button type="button" variant="ghost" onClick={logout} className="w-full">Changer de compte</Button>}</form>}
    </div>
  </div></section>;
}

function FieldEmail({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <div className="space-y-2"><Label htmlFor="auth-email">E-mail</Label><Input id="auth-email" type="email" autoComplete="email" required value={value} onChange={(e) => onChange(e.target.value)} /></div>; }
function FieldPassword({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string }) { return <div className="space-y-2"><Label>{label}</Label><Input type="password" autoComplete={autoComplete} required minLength={8} value={value} onChange={(e) => onChange(e.target.value)} /></div>; }
function Messages({ error, notice }: { error: string | null; notice: string | null }) { return <>{error ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}{notice ? <p className="rounded-xl bg-primary/10 p-3 text-sm text-foreground">{notice}</p> : null}</>; }
