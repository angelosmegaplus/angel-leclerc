import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, Loader2, LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
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
      { title: "Accès sécurisé | Flamme OS" },
      { name: "description", content: "Accès privé à l’espace administrateur Flamme OS, protégé par Angel Guard." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

const BOOT_LINES = [
  "Microsoft Windows [version 10.0.26100.4946]",
  "(c) Microsoft Corporation. Tous droits réservés.",
  "",
  "C:\\FlammeOS\\guard> angel_guard.exe --secure-entry",
  "[INIT] mounting isolated authentication environment... OK",
  "[INIT] loading encrypted owner profile... OK",
  "[WAF ] activating perimeter ruleset.................. 184 RULES",
  "[ACL ] owner-only policy............................. ENFORCED",
  "[BOT ] behavioral fingerprint engine................. ARMED",
  "[NET ] inspecting active route /auth................. CLEAN",
  "[TLS ] encrypted tunnel............................... LOCKED",
  "[MEM ] scanning volatile session memory............... CLEAN",
  "[PROC] unknown process injection....................... NONE",
  "[IP  ] reputation lookup.............................. ACCEPTABLE",
  "[WARN] unauthorized access attempts are recorded.",
  "[WARN] privilege escalation triggers containment mode.",
  "[WARN] session duplication triggers immediate revocation.",
  "[GUARD] monitoring keyboard/session activity.......... ACTIVE",
  "[GUARD] recovery subsystem............................ STANDBY",
  "[GUARD] owner identity required....................... PENDING",
  "",
  "C:\\FlammeOS\\guard> verify --owner-gate",
  "Analyzing session integrity...",
  "No trusted identity loaded.",
  "Opening restricted credential gateway...",
  "ACCESS GATE READY.",
];

function cleanError(error: unknown, fallback: string) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (!raw || /<!doctype|<html|this page didn't load/i.test(raw)) return fallback;
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 280) || fallback;
}

function BootScreen({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (count >= BOOT_LINES.length) {
      const done = window.setTimeout(onDone, 650);
      return () => window.clearTimeout(done);
    }
    const delay = BOOT_LINES[count]?.startsWith("[WARN]") ? 170 : count > 19 ? 120 : 80;
    const timer = window.setTimeout(() => setCount((value) => value + 1), delay);
    return () => window.clearTimeout(timer);
  }, [count, onDone]);

  return (
    <div className="guard-boot" role="presentation">
      <div className="guard-terminal-window">
        {BOOT_LINES.slice(0, count).map((line, index) => (
          <div
            key={`${index}-${line}`}
            className={`guard-terminal-line${line.startsWith("[WARN]") ? " warn" : ""}${line.includes("ACCESS GATE READY") ? " ready" : ""}`}
          >
            {line || "\u00a0"}
          </div>
        ))}
        <div className="guard-terminal-cursor">_</div>
      </div>
      <div className="guard-boot-label">ANGEL GUARD // SECURE BOOT</div>
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [bootDone, setBootDone] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emergencyCode, setEmergencyCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session && isAdmin) void navigate({ to: "/admin" });
  }, [loading, session, isAdmin, navigate]);

  function resetMessages() {
    setError(null);
    setNotice(null);
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
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) throw err;
      setPassword("");
    } catch (err) {
      const message = cleanError(err, "Connexion impossible.");
      setError(message.includes("Invalid login credentials") ? "Authentification rejetée." : message);
    } finally {
      setBusy(false);
    }
  }

  async function resetPasswordWithCode(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    const normalizedEmail = email.trim().toLowerCase();
    if (password.length < 8) return setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirmPassword) return setError("Les deux mots de passe ne correspondent pas.");
    if (emergencyCode.trim().length < 4) return setError("Entrez le code de récupération.");

    setBusy(true);
    try {
      const result = await resetOwnerPasswordWithEmergencyCode({
        data: { email: normalizedEmail, code: emergencyCode.trim(), password },
      });
      if (!result.ok) return setError(result.error);

      const { error: signInError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (signInError) {
        setNotice("Accès restauré. Revenez à la connexion avec votre nouveau mot de passe.");
        setMode("login");
        return;
      }
      setNotice("Identité propriétaire validée. Ouverture de l’administration…");
    } catch (err) {
      setError(cleanError(err, "Impossible de restaurer l’accès."));
    } finally {
      setBusy(false);
    }
  }

  if (!bootDone) {
    return (
      <>
        <BootScreen onDone={() => setBootDone(true)} />
        <AuthStyles />
      </>
    );
  }

  return (
    <section className="auth-shell-simple">
      <a href="/" className="auth-back-simple"><ArrowLeft className="h-4 w-4" /> Retour</a>

      <main className="auth-card-simple">
        <div className="auth-guard-simple">
          <div className="auth-shield"><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <span>ANGEL GUARD</span>
            <p>PROTECTION ACTIVE</p>
          </div>
          <i />
        </div>

        <div className="auth-title-simple">
          <span>ESPACE ADMIN</span>
          <h1>{mode === "forgot" ? "Récupération" : "Connexion"}</h1>
          <p>{mode === "forgot" ? "Procédure réservée au propriétaire autorisé." : "Accès privé à Flamme OS."}</p>
        </div>

        {mode === "login" ? (
          <form onSubmit={login} className="auth-form-simple">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error ? <p className="auth-error-simple">{error}</p> : null}
            {notice ? <p className="auth-notice-simple">{notice}</p> : null}
            <Button type="submit" disabled={busy} className="auth-button-simple">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {busy ? "Vérification…" : "Entrer"}
            </Button>
            <button type="button" onClick={() => switchMode("forgot")} className="auth-recovery-simple">
              <KeyRound className="h-3.5 w-3.5" /> Récupération de compte
            </button>
          </form>
        ) : (
          <form onSubmit={resetPasswordWithCode} className="auth-form-simple">
            <div className="auth-recovery-warning"><LockKeyhole className="h-4 w-4" /> Canal propriétaire uniquement.</div>
            <div>
              <Label htmlFor="email-recovery">E-mail</Label>
              <Input id="email-recovery" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="emergency-code">Code de récupération</Label>
              <Input id="emergency-code" inputMode="numeric" autoComplete="one-time-code" value={emergencyCode} onChange={(e) => setEmergencyCode(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            {error ? <p className="auth-error-simple">{error}</p> : null}
            {notice ? <p className="auth-notice-simple">{notice}</p> : null}
            <Button type="submit" disabled={busy} className="auth-button-simple">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Restaurer l’accès
            </Button>
            <button type="button" onClick={() => switchMode("login")} className="auth-recovery-simple">Retour à la connexion</button>
          </form>
        )}

        <div className="auth-footer-simple">ANGEL GUARD SECURITY LAYER · OWNER ACCESS ONLY</div>
      </main>
      <AuthStyles />
    </section>
  );
}

function AuthStyles() {
  return (
    <style>{`
      .guard-boot{position:fixed;inset:0;z-index:9999;background:#050505;color:#d8d8d8;font-family:Consolas,"Cascadia Mono","Courier New",monospace;overflow:hidden;padding:22px 26px;animation:guardBootExit .45s ease both;animation-delay:3.9s}
      .guard-terminal-window{height:calc(100vh - 70px);overflow:hidden;font-size:clamp(12px,1.05vw,16px);line-height:1.48;text-shadow:0 0 8px rgba(255,255,255,.06)}
      .guard-terminal-line{white-space:pre-wrap;animation:terminalAppear .08s linear both}
      .guard-terminal-line.warn{color:#e07056;text-shadow:0 0 12px rgba(206,101,75,.3)}
      .guard-terminal-line.ready{color:#fff;font-weight:700;letter-spacing:.04em}
      .guard-terminal-cursor{display:inline-block;color:#fff;animation:cursorBlink .65s steps(1) infinite}
      .guard-boot-label{position:fixed;right:24px;bottom:18px;color:#6d6d6d;font-size:10px;letter-spacing:.22em}
      @keyframes terminalAppear{from{opacity:0;transform:translateY(2px)}to{opacity:1;transform:none}}
      @keyframes cursorBlink{50%{opacity:0}}
      @keyframes guardBootExit{0%,92%{opacity:1}100%{opacity:0;visibility:hidden}}

      .auth-shell-simple{min-height:100vh;background:#F6F1E8;color:#172638;display:grid;place-items:center;padding:96px 24px 48px;position:relative}
      .auth-back-simple{position:absolute;top:28px;left:28px;display:flex;align-items:center;gap:8px;color:#6d6a66;font-size:13px;text-decoration:none}
      .auth-card-simple{width:min(100%,420px);background:#FFFDF9;border:1px solid #E6DED2;border-radius:24px;padding:24px;box-shadow:0 24px 70px rgba(23,38,56,.12)}
      .auth-guard-simple{display:flex;align-items:center;gap:12px;padding-bottom:20px;border-bottom:1px solid #E6DED2}
      .auth-shield{width:42px;height:42px;border-radius:12px;background:#172638;color:#fff;display:grid;place-items:center}
      .auth-guard-simple span{font-size:11px;font-weight:800;letter-spacing:.16em;color:#CE654B}
      .auth-guard-simple p{margin:3px 0 0;font-size:10px;font-weight:700;letter-spacing:.08em;color:#66717c}
      .auth-guard-simple i{margin-left:auto;width:9px;height:9px;border-radius:50%;background:#43a36e;box-shadow:0 0 0 5px rgba(67,163,110,.11)}
      .auth-title-simple{padding:28px 0 18px}
      .auth-title-simple>span{font-size:10px;font-weight:800;letter-spacing:.17em;color:#CE654B}
      .auth-title-simple h1{font-family:Manrope,Inter,sans-serif;font-size:38px;line-height:1;margin:9px 0 10px;letter-spacing:-.04em}
      .auth-title-simple p{margin:0;color:#756e67;font-size:13px}
      .auth-form-simple{display:grid;gap:15px}
      .auth-form-simple>div:not(.auth-recovery-warning){display:grid;gap:7px}
      .auth-form-simple label{font-size:12px;font-weight:700;color:#172638}
      .auth-form-simple input{height:44px;border-radius:12px;border-color:#d9d0c4;background:#F8F4EC}
      .auth-form-simple input:focus{border-color:#CE654B;box-shadow:0 0 0 3px rgba(206,101,75,.12)}
      .auth-button-simple{height:46px;border-radius:12px;background:#172638!important;color:#fff!important;display:flex;gap:8px;margin-top:2px}
      .auth-recovery-simple{border:0;background:none;color:#7a746f;font-size:12px;display:flex;justify-content:center;align-items:center;gap:7px;cursor:pointer;padding:4px}
      .auth-error-simple{margin:0;color:#b33d2f;font-size:12px;font-weight:700}
      .auth-notice-simple{margin:0;color:#2f7952;font-size:12px;font-weight:700}
      .auth-recovery-warning{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;background:#F6F1E8;color:#756e67;font-size:12px}
      .auth-footer-simple{margin-top:22px;padding-top:16px;border-top:1px solid #E6DED2;color:#9b948d;text-align:center;font-size:9px;letter-spacing:.1em}
      @media (prefers-reduced-motion:reduce){.guard-boot{animation:none}.guard-terminal-line,.guard-terminal-cursor{animation:none}}
    `}</style>
  );
}
