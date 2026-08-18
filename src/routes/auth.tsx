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
      void navigate({ to: "/admin" });
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
      if (result.adminRestored) setNotice("Mot de passe restauré. Ouverture de l’administration…");
      else setNotice("Mot de passe restauré. Connexion validée ; vérification des droits administrateur…");
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
      setOwnerCode("");
    } catch (err) { setError(cleanError(err, "Impossible de valider le code de secours.")); }
    finally { setBusy(false); }
  }

  async function logout() { await supabase.auth.signOut(); switchMode("login"); }

  if (loading) return <section className="auth-shell"><Loader2 className="h-6 w-6 animate-spin text-[#3f78ff]" /></section>;

  const title = mode === "signup" ? "Créer mon compte" : mode === "forgot" ? "Récupérer mon accès" : mode === "owner" ? "Accès propriétaire" : "Connexion";

  return (
    <section className="auth-shell">
      <div className="auth-noise" aria-hidden />
      <div className="auth-layout">
        <div className="auth-brand">
          <div className="auth-logo-row">
            <img src="/angel-os/logo.png" alt="Logo Angel OS" className="auth-logo" />
            <div><p className="auth-kicker">Angel</p><h1>OS</h1></div>
          </div>
          <p className="auth-tagline">Espace administrateur sécurisé</p>
        </div>

        <div className="auth-panel-wrap">
          <div className="auth-panel">
            <div className="auth-panel-title"><span>{title}</span><span className="auth-status">SECURE</span></div>
            <div className="auth-tabs">
              <button type="button" onClick={() => switchMode("login")} className={mode === "login" ? "active" : ""}>Connexion</button>
              <button type="button" onClick={() => switchMode("signup")} className={mode === "signup" ? "active" : ""}>Créer un compte</button>
              <button type="button" onClick={() => switchMode("owner")} className={mode === "owner" ? "active" : ""}>Secours</button>
            </div>

            <div className="auth-form-area">
              {mode === "login" && <form onSubmit={login} className="space-y-4"><p className="auth-help">Identifiez-vous pour ouvrir Angel OS.</p><FieldEmail value={email} onChange={setEmail} /><FieldPassword label="Mot de passe" value={password} onChange={setPassword} autoComplete="current-password" /><button type="button" onClick={() => switchMode("forgot")} className="auth-link">Mot de passe oublié ?</button><Messages error={error} notice={notice} /><Button type="submit" disabled={busy} className="auth-main-button">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}Me connecter</Button></form>}
              {mode === "signup" && <form onSubmit={signup} className="space-y-4"><p className="auth-help">Créez votre compte. Les droits administrateur restent séparés.</p><FieldEmail value={email} onChange={setEmail} /><FieldPassword label="Mot de passe" value={password} onChange={setPassword} autoComplete="new-password" /><FieldPassword label="Confirmer le mot de passe" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" /><Messages error={error} notice={notice} /><Button type="submit" disabled={busy} className="auth-main-button">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}Créer mon compte</Button></form>}
              {mode === "forgot" && <form onSubmit={resetPasswordWithCode} className="space-y-4"><div className="auth-warning"><KeyRound className="h-5 w-5" /><div><strong>Code d’urgence</strong><p>Récupération directe sans e-mail.</p></div></div><FieldEmail value={email} onChange={setEmail} /><div className="space-y-2"><Label htmlFor="emergency-code">Code d’urgence</Label><Input id="emergency-code" inputMode="numeric" autoComplete="one-time-code" value={emergencyCode} onChange={(e) => setEmergencyCode(e.target.value)} placeholder="••••" required /></div><FieldPassword label="Nouveau mot de passe" value={password} onChange={setPassword} autoComplete="new-password" /><FieldPassword label="Confirmer le nouveau mot de passe" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" /><Messages error={error} notice={notice} /><Button type="submit" disabled={busy} className="auth-main-button">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}Restaurer et ouvrir l’admin</Button><Button type="button" variant="ghost" className="w-full text-white/70" onClick={() => switchMode("login")}>Retour à la connexion</Button></form>}
              {mode === "owner" && <form onSubmit={claimOwner} className="space-y-4"><div className="auth-warning"><ShieldCheck className="h-5 w-5" /><div><strong>Preuve propriétaire</strong><p>Validation séparée des droits administrateur.</p></div></div>{!session ? <p className="auth-help">Connectez-vous ou créez votre compte avant cette vérification.</p> : <p className="auth-help">Compte connecté : <span className="text-white">{session.user.email}</span></p>}<div className="space-y-2"><Label htmlFor="owner-code">Code propriétaire</Label><Input id="owner-code" inputMode="numeric" autoComplete="one-time-code" value={ownerCode} onChange={(e) => setOwnerCode(e.target.value)} placeholder="••••" required /></div><Messages error={error} notice={notice} /><Button type="submit" disabled={busy || !session || ownerCode.length < 4} className="auth-main-button">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}Prouver que je suis Angel</Button>{session && <Button type="button" variant="ghost" onClick={logout} className="w-full text-white/70">Changer de compte</Button>}</form>}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .auth-shell{min-height:100dvh;background:#000;color:#fff;display:grid;place-items:center;padding:24px;overflow:hidden;position:relative;font-family:Tahoma,Arial,sans-serif}.auth-noise{position:absolute;inset:0;opacity:.055;pointer-events:none;background-image:repeating-linear-gradient(0deg,transparent 0 2px,rgba(255,255,255,.16) 3px);mix-blend-mode:screen}.auth-layout{position:relative;z-index:1;width:min(960px,100%);display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center}.auth-brand{padding:20px}.auth-logo-row{display:flex;align-items:center;gap:16px}.auth-logo{width:72px;height:72px;object-fit:contain;border-radius:12px}.auth-kicker{font-size:13px;letter-spacing:.12em;color:#f7f7f7}.auth-brand h1{font:300 54px/1 Arial,sans-serif;letter-spacing:-.06em;color:#ff6a00}.auth-tagline{margin-top:14px;color:#b8b8b8;font-size:13px}.auth-panel{background:linear-gradient(#1e1e1e,#111);border:1px solid #444;box-shadow:0 22px 70px rgba(0,0,0,.65),inset 0 1px rgba(255,255,255,.08)}.auth-panel-title{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:linear-gradient(180deg,#245edb 0%,#1941a5 48%,#153487 100%);font-size:14px;font-weight:700;text-shadow:1px 1px #11245a}.auth-status{font:700 9px monospace;color:#b7ffbd}.auth-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#333;border-bottom:1px solid #333}.auth-tabs button{background:#151515;color:#9d9d9d;padding:10px 7px;font-size:11px}.auth-tabs button.active{background:#262626;color:#fff;box-shadow:inset 0 -2px #3f78ff}.auth-form-area{padding:20px}.auth-help{color:#aaa;font-size:12px;line-height:1.5}.auth-form-area label{color:#ddd;font-size:12px}.auth-form-area input{background:#080808!important;color:#fff!important;border:1px solid #4b4b4b!important;border-radius:2px!important;height:42px}.auth-form-area input:focus{border-color:#4f7dff!important;box-shadow:0 0 0 1px #4f7dff!important}.auth-main-button{width:100%;height:44px;border-radius:3px!important;background:linear-gradient(#3979e8,#2257c8)!important;border:1px solid #5c8ef1!important;color:white!important;font-weight:700}.auth-link{font-size:11px;color:#7da8ff;text-decoration:underline}.auth-warning{display:flex;gap:10px;border:1px solid #725d1f;background:#181507;color:#f1d66a;padding:11px;font-size:12px}.auth-warning p{margin-top:2px;color:#b9ab77;font-size:11px}.auth-message-error{border:1px solid #792d2d;background:#1d0808;color:#ff8a8a;padding:10px;font-size:11px}.auth-message-ok{border:1px solid #265c34;background:#07170c;color:#84e99c;padding:10px;font-size:11px}@media(max-width:760px){.auth-shell{padding:12px}.auth-layout{grid-template-columns:1fr;gap:10px}.auth-brand{padding:6px 8px}.auth-logo{width:52px;height:52px}.auth-brand h1{font-size:40px}.auth-tagline{margin-top:6px}.auth-panel-wrap{width:100%}.auth-form-area{padding:16px}}
      `}</style>
    </section>
  );
}

function FieldEmail({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <div className="space-y-2"><Label htmlFor="auth-email">E-mail</Label><Input id="auth-email" type="email" autoComplete="email" required value={value} onChange={(e) => onChange(e.target.value)} /></div>; }
function FieldPassword({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string }) { return <div className="space-y-2"><Label>{label}</Label><Input type="password" autoComplete={autoComplete} required minLength={8} value={value} onChange={(e) => onChange(e.target.value)} /></div>; }
function Messages({ error, notice }: { error: string | null; notice: string | null }) { return <>{error ? <p className="auth-message-error">{error}</p> : null}{notice ? <p className="auth-message-ok">{notice}</p> : null}</>; }
