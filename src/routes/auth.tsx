import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogIn,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resetOwnerPasswordWithEmergencyCode } from "@/lib/admin-password-reset.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "forgot";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion Angel OS | Espace privé" },
      {
        name: "description",
        content: "Accès privé à l’espace administrateur Angel OS.",
      },
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
  const [emergencyCode, setEmergencyCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [guardAlert, setGuardAlert] = useState(false);

  useEffect(() => {
    if (!loading && session && isAdmin) {
      void navigate({ to: "/admin" });
    }
  }, [loading, session, isAdmin, navigate]);

  function resetMessages() {
    setError(null);
    setNotice(null);
    setGuardAlert(false);
  }

  function switchMode(next: AuthMode) {
    resetMessages();
    setMode(next);
    setPassword("");
    setConfirmPassword("");
    setEmergencyCode("");
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    resetMessages();
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) throw err;
      setPassword("");
    } catch (err) {
      const message = cleanError(err, "Connexion impossible.");
      const invalidCredentials = message.includes("Invalid login credentials");
      setGuardAlert(invalidCredentials);
      setError(invalidCredentials ? "Authentification rejetée." : message);
    } finally {
      setBusy(false);
    }
  }

  async function resetPasswordWithCode(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    const normalizedEmail = email.trim().toLowerCase();
    if (password.length < 8)
      return setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirmPassword)
      return setError("Les deux mots de passe ne correspondent pas.");
    if (emergencyCode.trim().length < 4)
      return setError("Entrez le code de récupération.");

    setBusy(true);
    try {
      const result = await resetOwnerPasswordWithEmergencyCode({
        data: {
          email: normalizedEmail,
          code: emergencyCode.trim(),
          password,
        },
      });
      if (!result.ok) return setError(result.error);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        setNotice("Accès restauré. Revenez à la connexion avec votre nouveau mot de passe.");
        setMode("login");
        return;
      }

      setNotice(
        result.adminRestored
          ? "Identité propriétaire validée. Ouverture de l’administration…"
          : "Mot de passe restauré. Vérification des droits administrateur…",
      );
    } catch (err) {
      setError(cleanError(err, "Impossible de restaurer l’accès."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="auth-shell auth-loading">
        <div className="auth-loader">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Initialisation d’Angel Guard…</span>
        </div>
        <AuthStyles />
      </section>
    );
  }

  return (
    <section className={`auth-shell${guardAlert ? " guard-alert" : ""}`}>
      <div className="auth-grid" aria-hidden />
      <div className="auth-scan" aria-hidden />

      <a href="/" className="auth-back-link">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </a>

      <main className="auth-card">
        <div className="auth-guard-head">
          <div className="guard-icon-wrap">
            {guardAlert ? <ShieldAlert className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <div>
            <span className="guard-label">ANGEL GUARD</span>
            <p>{guardAlert ? "ÉTAT : ACCÈS REFUSÉ" : "PROTECTION ACTIVE"}</p>
          </div>
          <span className={`guard-dot${guardAlert ? " alert" : ""}`} />
        </div>

        {guardAlert ? (
          <div className="guard-warning" role="alert">
            <div className="guard-warning-title">
              <AlertTriangle className="h-5 w-5" />
              <strong>TENTATIVE D’ACCÈS NON VALIDÉE</strong>
            </div>
            <p>
              Cet espace est strictement privé. L’authentification a été rejetée par Angel Guard.
              Les événements de sécurité peuvent être journalisés par l’infrastructure du service.
            </p>
            <div className="guard-terminal" aria-label="État des contrôles de sécurité">
              <div><span>&gt;</span> integrity.check <b>OK</b></div>
              <div><span>&gt;</span> auth.owner <b className="deny">DENIED</b></div>
              <div><span>&gt;</span> session.access <b className="deny">BLOCKED</b></div>
              <div className="terminal-cursor"><span>&gt;</span> angel_guard.monitoring<span className="cursor">_</span></div>
            </div>
          </div>
        ) : null}

        <div className="auth-heading">
          <span className="auth-kicker">ESPACE ADMIN</span>
          <h1>{mode === "forgot" ? "Récupération de compte" : "Connexion"}</h1>
          {mode === "forgot" ? (
            <p>Réservé au propriétaire. Le code de récupération permet de restaurer directement l’accès.</p>
          ) : null}
        </div>

        {mode === "login" ? (
          <form onSubmit={login} className="auth-form">
            <FieldEmail value={email} onChange={setEmail} />
            <FieldPassword
              label="Mot de passe"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />

            <Messages error={error} notice={notice} />

            <Button type="submit" disabled={busy} className="auth-main-button">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Entrer
            </Button>

            <button type="button" onClick={() => switchMode("forgot")} className="auth-recovery-link">
              <KeyRound className="h-3.5 w-3.5" />
              Récupération de compte
            </button>
          </form>
        ) : (
          <form onSubmit={resetPasswordWithCode} className="auth-form">
            <div className="recovery-warning">
              <LockKeyhole className="h-4 w-4" />
              <span>Aucune inscription publique n’est disponible.</span>
            </div>

            <FieldEmail value={email} onChange={setEmail} />

            <div className="auth-field">
              <Label htmlFor="emergency-code">Code de récupération</Label>
              <Input
                id="emergency-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={emergencyCode}
                onChange={(e) => setEmergencyCode(e.target.value)}
                placeholder="••••"
                required
              />
            </div>

            <FieldPassword
              label="Nouveau mot de passe"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
            <FieldPassword
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />

            <Messages error={error} notice={notice} />

            <Button type="submit" disabled={busy} className="auth-main-button">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Restaurer l’accès
            </Button>

            <button type="button" className="auth-secondary-button" onClick={() => switchMode("login")}>
              Retour à la connexion
            </button>
          </form>
        )}

        <div className="auth-footer-status">
          <Terminal className="h-3.5 w-3.5" />
          <span>Angel Guard Security Layer</span>
          <i />
          <span>Owner access only</span>
        </div>
      </main>

      <AuthStyles />
    </section>
  );
}

function FieldEmail({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="auth-field">
      <Label htmlFor="auth-email">E-mail</Label>
      <Input
        id="auth-email"
        type="email"
        autoComplete="email"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FieldPassword({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <div className="auth-field">
      <Label>{label}</Label>
      <Input
        type="password"
        autoComplete={autoComplete}
        required
        minLength={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Messages({ error, notice }: { error: string | null; notice: string | null }) {
  return (
    <>
      {error ? <p className="auth-message-error">{error}</p> : null}
      {notice ? <p className="auth-message-ok">{notice}</p> : null}
    </>
  );
}

function AuthStyles() {
  return (
    <style>{`
      .auth-shell{--cream:#f6f1e8;--paper:#fffdf9;--night:#172638;--ink:#181716;--terra:#ce654b;--terra-dark:#a84d38;min-height:100dvh;background:var(--cream);color:var(--night);display:grid;place-items:center;padding:32px 20px;position:relative;overflow:hidden;font-family:Inter,system-ui,sans-serif}.auth-grid{position:absolute;inset:0;pointer-events:none;opacity:.36;background-image:linear-gradient(rgba(23,38,56,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(23,38,56,.035) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(to bottom,black,transparent 85%)}.auth-scan{position:absolute;left:0;right:0;top:-30%;height:24%;background:linear-gradient(to bottom,transparent,rgba(206,101,75,.055),transparent);animation:guardScan 8s linear infinite;pointer-events:none}.auth-back-link{position:absolute;left:28px;top:26px;display:flex;align-items:center;gap:8px;color:rgba(23,38,56,.6);font-size:13px;font-weight:700;text-decoration:none;z-index:5;transition:.2s}.auth-back-link:hover{color:var(--terra)}.auth-card{position:relative;z-index:2;width:min(480px,100%);background:rgba(255,253,249,.92);border:1px solid rgba(23,38,56,.12);border-radius:28px;padding:28px;box-shadow:0 28px 80px rgba(23,38,56,.12);backdrop-filter:blur(18px)}.auth-guard-head{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding-bottom:20px;border-bottom:1px solid rgba(23,38,56,.1)}.guard-icon-wrap{width:44px;height:44px;border-radius:14px;background:var(--night);color:var(--paper);display:grid;place-items:center}.guard-label{font:800 11px/1 Manrope,Inter,sans-serif;letter-spacing:.18em;color:var(--terra)}.auth-guard-head p{margin-top:5px;font:800 11px/1 Manrope,Inter,sans-serif;letter-spacing:.08em;color:rgba(23,38,56,.7)}.guard-dot{width:9px;height:9px;border-radius:999px;background:#4e9a67;box-shadow:0 0 0 5px rgba(78,154,103,.12)}.guard-dot.alert{background:#bd3c32;box-shadow:0 0 0 5px rgba(189,60,50,.12);animation:guardPulse 1.2s infinite}.auth-heading{padding:26px 0 20px}.auth-kicker{font:800 10px/1 Manrope,Inter,sans-serif;letter-spacing:.2em;color:var(--terra)}.auth-heading h1{margin:8px 0 0;font:800 clamp(32px,7vw,44px)/1 Manrope,Inter,sans-serif;letter-spacing:-.045em;color:var(--night)}.auth-heading p{margin-top:12px;color:rgba(23,38,56,.64);font-size:13px;line-height:1.65}.auth-form{display:grid;gap:16px}.auth-field{display:grid;gap:8px}.auth-field label{font-size:12px;font-weight:800;color:var(--night)}.auth-field input{height:50px!important;border-radius:14px!important;border:1px solid rgba(23,38,56,.14)!important;background:#fff!important;color:var(--night)!important;padding:0 15px!important;box-shadow:none!important;transition:.2s}.auth-field input:focus{border-color:var(--terra)!important;box-shadow:0 0 0 4px rgba(206,101,75,.11)!important}.auth-main-button{height:52px!important;border-radius:15px!important;background:var(--night)!important;color:#fff!important;font:800 13px Manrope,Inter,sans-serif!important;display:flex!important;gap:9px!important;box-shadow:0 12px 28px rgba(23,38,56,.2)!important;transition:.2s!important}.auth-main-button:hover{background:#20364f!important;transform:translateY(-1px)}.auth-recovery-link,.auth-secondary-button{border:0;background:transparent;color:rgba(23,38,56,.62);font-size:12px;font-weight:750;display:flex;justify-content:center;align-items:center;gap:7px;padding:4px;cursor:pointer}.auth-recovery-link:hover,.auth-secondary-button:hover{color:var(--terra)}.recovery-warning{display:flex;align-items:center;gap:9px;padding:12px 13px;border-radius:13px;background:rgba(23,38,56,.055);color:rgba(23,38,56,.7);font-size:12px;font-weight:700}.auth-message-error,.auth-message-ok{padding:12px 13px;border-radius:12px;font-size:12px;font-weight:700;line-height:1.45}.auth-message-error{background:#fff0ed;color:#9f3025;border:1px solid #f1c7c0}.auth-message-ok{background:#eff8f1;color:#326c43;border:1px solid #c9e1d0}.auth-footer-status{margin-top:24px;padding-top:18px;border-top:1px solid rgba(23,38,56,.08);display:flex;align-items:center;justify-content:center;gap:7px;color:rgba(23,38,56,.42);font:700 9px Manrope,Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase}.auth-footer-status i{width:3px;height:3px;border-radius:50%;background:rgba(23,38,56,.25)}.guard-warning{margin-top:20px;padding:16px;border-radius:16px;background:#161b22;color:#d7dde4;border:1px solid rgba(206,101,75,.45);box-shadow:inset 0 0 0 1px rgba(255,255,255,.02)}.guard-warning-title{display:flex;align-items:center;gap:8px;color:#ff795f;font:800 11px Manrope,Inter,sans-serif;letter-spacing:.08em}.guard-warning>p{margin:10px 0 14px;color:#aeb7c2;font-size:11px;line-height:1.6}.guard-terminal{background:#0b0f14;border:1px solid #2c3540;border-radius:11px;padding:12px;font:600 10px/1.75 ui-monospace,SFMono-Regular,Menlo,monospace;color:#798897}.guard-terminal div{display:flex;gap:7px}.guard-terminal span{color:#ce654b}.guard-terminal b{margin-left:auto;color:#72c48a}.guard-terminal .deny{color:#ff6657}.guard-terminal .cursor{margin-left:2px;animation:blink .8s steps(2) infinite}.guard-alert{background:#efe8dd}.guard-alert .auth-card{box-shadow:0 28px 80px rgba(87,31,25,.16)}.guard-alert .guard-icon-wrap{background:#7d2820}.auth-loading{background:var(--cream)}.auth-loader{display:flex;align-items:center;gap:10px;color:var(--night);font-size:13px;font-weight:700}@keyframes guardScan{0%{transform:translateY(-20vh)}100%{transform:translateY(150vh)}}@keyframes guardPulse{0%,100%{opacity:1}50%{opacity:.35}}@keyframes blink{50%{opacity:0}}@media(max-width:600px){.auth-shell{padding:76px 14px 20px}.auth-back-link{left:18px;top:20px}.auth-card{padding:22px;border-radius:22px}.auth-heading{padding:22px 0 18px}.auth-footer-status{flex-wrap:wrap}}@media(prefers-reduced-motion:reduce){.auth-scan,.guard-dot.alert,.guard-terminal .cursor{animation:none!important}.auth-main-button:hover{transform:none}}
    `}</style>
  );
}
