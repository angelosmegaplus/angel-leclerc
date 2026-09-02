import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Binary,
  Braces,
  Cpu,
  Fingerprint,
  Gauge,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogIn,
  Network,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Wifi,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resetOwnerPasswordWithEmergencyCode } from "@/lib/admin-password-reset.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "forgot";

type TelemetryLine = {
  label: string;
  state: string;
  tone?: "ok" | "warn" | "idle";
};

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Accès sécurisé | Flamme OS" },
      {
        name: "description",
        content: "Sas d’accès privé à l’espace administrateur Flamme OS, protégé par Angel Guard.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

const TELEMETRY: TelemetryLine[] = [
  { label: "edge.handshake", state: "ESTABLISHED", tone: "ok" },
  { label: "waf.ruleset", state: "LOADED / 184", tone: "ok" },
  { label: "rate_limit.profile", state: "BALANCED", tone: "ok" },
  { label: "bot.fingerprint", state: "ANALYZING", tone: "idle" },
  { label: "acl.owner_scope", state: "ENFORCED", tone: "ok" },
  { label: "session.integrity", state: "WATCHING", tone: "idle" },
];

const STREAM_LINES = [
  "guard.route('/auth') :: secure-zone",
  "request.headers.normalize() :: ok",
  "waf.signature.scan() :: clean",
  "behavior.window.sample() :: active",
  "session.entropy.measure() :: nominal",
  "acl.owner.resolve() :: restricted",
  "rate_limit.bucket() :: armed",
  "csrf.boundary.verify() :: ready",
  "guard.recover() :: standby",
  "audit.channel.write() :: enabled",
];

function cleanError(error: unknown, fallback: string) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (!raw || /<!doctype|<html|this page didn't load/i.test(raw)) return fallback;
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 280) || fallback;
}

function makeSessionId() {
  if (typeof window === "undefined") return "AG-SESSION-BOOT";
  const seed = `${navigator.userAgent}-${screen.width}x${screen.height}-${Date.now()}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  return `AG-${hash.toString(16).toUpperCase().padStart(8, "0")}`;
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
  const [streamIndex, setStreamIndex] = useState(4);
  const [clock, setClock] = useState(() => new Date());
  const [sessionId] = useState(makeSessionId);

  useEffect(() => {
    if (!loading && session && isAdmin) void navigate({ to: "/admin" });
  }, [loading, session, isAdmin, navigate]);

  useEffect(() => {
    const streamTimer = window.setInterval(() => setStreamIndex((value) => (value + 1) % STREAM_LINES.length), 1450);
    const clockTimer = window.setInterval(() => setClock(new Date()), 1000);
    return () => {
      window.clearInterval(streamTimer);
      window.clearInterval(clockTimer);
    };
  }, []);

  const visibleStream = useMemo(
    () => Array.from({ length: 5 }, (_, offset) => STREAM_LINES[(streamIndex + offset) % STREAM_LINES.length]),
    [streamIndex],
  );

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
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
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
        <div className="boot-panel">
          <div className="boot-radar"><Radar className="h-7 w-7" /></div>
          <p>ANGEL GUARD / SECURE ACCESS GATEWAY</p>
          <div className="boot-line"><span /> Initialisation des contrôles…</div>
          <div className="boot-line"><span /> Chargement des règles de sécurité…</div>
          <div className="boot-line"><span /> Vérification de la session…</div>
        </div>
        <AuthStyles />
      </section>
    );
  }

  return (
    <section className={`auth-shell${guardAlert ? " guard-alert" : ""}`}>
      <div className="auth-grid" aria-hidden />
      <div className="auth-noise" aria-hidden />
      <div className="auth-scan" aria-hidden />
      <div className="auth-beam" aria-hidden />
      <div className="auth-orbit orbit-a" aria-hidden />
      <div className="auth-orbit orbit-b" aria-hidden />

      <a href="/" className="auth-back-link"><ArrowLeft className="h-4 w-4" /> Retour</a>

      <div className="auth-stage">
        <aside className="guard-console guard-console-left" aria-label="Télémétrie Angel Guard">
          <div className="console-head">
            <div>
              <span className="console-eyebrow">ANGEL GUARD</span>
              <strong>THREAT TELEMETRY</strong>
            </div>
            <Activity className="h-5 w-5" />
          </div>

          <div className="threat-score">
            <div className="score-ring"><span>{guardAlert ? "94" : "07"}</span><small>RISK</small></div>
            <div>
              <p>{guardAlert ? "ANOMALY DETECTED" : "PERIMETER STABLE"}</p>
              <span>{guardAlert ? "Authentication signal escalated" : "No critical signal detected"}</span>
            </div>
          </div>

          <div className="telemetry-list">
            {TELEMETRY.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <b className={guardAlert && item.label === "acl.owner_scope" ? "warn" : item.tone}>{guardAlert && item.label === "acl.owner_scope" ? "REJECT" : item.state}</b>
              </div>
            ))}
          </div>

          <div className="signal-bars" aria-hidden>
            {Array.from({ length: 24 }, (_, index) => <i key={index} style={{ height: `${18 + ((index * 17) % 58)}%`, animationDelay: `${index * 50}ms` }} />)}
          </div>
        </aside>

        <main className="auth-card">
          <div className="card-corners" aria-hidden><i /><i /><i /><i /></div>

          <div className="auth-guard-head">
            <div className="guard-icon-wrap">{guardAlert ? <ShieldAlert className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}</div>
            <div>
              <span className="guard-label">ANGEL GUARD / ACCESS NODE 01</span>
              <p>{guardAlert ? "ÉTAT : AUTHENTIFICATION REJETÉE" : "PÉRIMÈTRE SÉCURISÉ"}</p>
            </div>
            <span className={`guard-dot${guardAlert ? " alert" : ""}`} />
          </div>

          <div className="auth-security-strip">
            <span><Fingerprint className="h-3.5 w-3.5" /> {sessionId}</span>
            <span><Wifi className="h-3.5 w-3.5" /> TLS / ACTIVE</span>
            <span><Gauge className="h-3.5 w-3.5" /> PROFILE / BALANCED</span>
          </div>

          {guardAlert ? (
            <div className="guard-warning" role="alert">
              <div className="guard-warning-title"><AlertTriangle className="h-5 w-5" /><strong>SECURITY EVENT / ACCESS DENIED</strong></div>
              <p>L’identité fournie n’a pas franchi la barrière d’authentification. Le sas reste verrouillé et la session n’est pas élevée au niveau propriétaire.</p>
              <div className="guard-terminal">
                <div><span>01</span> credential.verify() <b className="deny">FAILED</b></div>
                <div><span>02</span> owner.scope.resolve() <b className="deny">DENIED</b></div>
                <div><span>03</span> session.privilege() <b className="deny">LOCKED</b></div>
                <div><span>04</span> guard.monitor() <b>ACTIVE</b></div>
              </div>
            </div>
          ) : null}

          <div className="auth-heading">
            <span className="auth-kicker">FLAMME OS / OWNER GATE</span>
            <h1>{mode === "forgot" ? "Récupération" : "Connexion"}</h1>
            <p>{mode === "forgot" ? "Procédure de récupération réservée au propriétaire autorisé." : "Accès privé. La session est validée avant toute ouverture de Flamme OS."}</p>
          </div>

          {mode === "login" ? (
            <form onSubmit={login} className="auth-form">
              <FieldEmail value={email} onChange={setEmail} />
              <FieldPassword label="Mot de passe" value={password} onChange={setPassword} autoComplete="current-password" />
              <Messages error={error} notice={notice} />
              <Button type="submit" disabled={busy} className="auth-main-button">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {busy ? "Vérification…" : "Franchir le sas"}
              </Button>
              <button type="button" onClick={() => switchMode("forgot")} className="auth-recovery-link"><KeyRound className="h-3.5 w-3.5" /> Récupération de compte</button>
            </form>
          ) : (
            <form onSubmit={resetPasswordWithCode} className="auth-form">
              <div className="recovery-warning"><LockKeyhole className="h-4 w-4" /><span>Canal de récupération propriétaire uniquement.</span></div>
              <FieldEmail value={email} onChange={setEmail} />
              <div className="auth-field">
                <Label htmlFor="emergency-code">Code de récupération</Label>
                <Input id="emergency-code" inputMode="numeric" autoComplete="one-time-code" value={emergencyCode} onChange={(e) => setEmergencyCode(e.target.value)} placeholder="••••" required />
              </div>
              <FieldPassword label="Nouveau mot de passe" value={password} onChange={setPassword} autoComplete="new-password" />
              <FieldPassword label="Confirmer le mot de passe" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
              <Messages error={error} notice={notice} />
              <Button type="submit" disabled={busy} className="auth-main-button">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Restaurer l’accès
              </Button>
              <button type="button" className="auth-secondary-button" onClick={() => switchMode("login")}>Retour à la connexion</button>
            </form>
          )}

          <div className="auth-footer-status"><Terminal className="h-3.5 w-3.5" /><span>Angel Guard Security Layer</span><i /><span>Owner access only</span></div>
        </main>

        <aside className="guard-console guard-console-right" aria-label="Flux de contrôle Angel Guard">
          <div className="console-head">
            <div><span className="console-eyebrow">LIVE CONTROL STREAM</span><strong>SECURITY PIPELINE</strong></div>
            <Terminal className="h-5 w-5" />
          </div>

          <div className="stream-window">
            <div className="stream-top"><span className="live-dot" /> LIVE <b>{clock.toLocaleTimeString("fr-FR")}</b></div>
            <div className="stream-lines">
              {visibleStream.map((line, index) => (
                <div key={`${line}-${index}`} className={index === 0 ? "fresh" : ""}><span>{String(index + 1).padStart(2, "0")}</span><code>{line}</code></div>
              ))}
              <div className="terminal-prompt"><span>AG</span><code>monitor --continuous</code><b>_</b></div>
            </div>
          </div>

          <div className="modules-grid">
            {[
              [Network, "WAF", "184 rules"],
              [Radar, "ANTI-BOT", "armed"],
              [Gauge, "RATE LIMIT", "balanced"],
              [Fingerprint, "FINGERPRINT", "sampling"],
              [Binary, "ACL", "owner-only"],
              [Braces, "AUDIT", "enabled"],
            ].map(([Icon, label, detail]) => {
              const Component = Icon as typeof Network;
              return <div key={String(label)}><Component className="h-4 w-4" /><span>{String(label)}</span><small>{String(detail)}</small></div>;
            })}
          </div>

          <div className="kernel-status">
            <Cpu className="h-4 w-4" />
            <div><span>guard.kernel</span><strong>{guardAlert ? "CONTAINMENT MODE" : "MONITORING"}</strong></div>
            <i />
          </div>
        </aside>
      </div>

      <div className="auth-bottom-code" aria-hidden>
        <span>flamme_os.route('/auth')</span><i>// secure</i><span>angel_guard.health()</span><i>// nominal</i><span>policy.owner_only()</span><i>// enforced</i><span>waf.observe()</span><i>// active</i>
      </div>

      <AuthStyles />
    </section>
  );
}

function FieldEmail({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="auth-field"><Label htmlFor="auth-email">E-mail</Label><Input id="auth-email" type="email" autoComplete="email" required value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}

function FieldPassword({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string }) {
  return <div className="auth-field"><Label>{label}</Label><Input type="password" autoComplete={autoComplete} required minLength={8} value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}

function Messages({ error, notice }: { error: string | null; notice: string | null }) {
  return <>{error ? <p className="auth-message-error">{error}</p> : null}{notice ? <p className="auth-message-ok">{notice}</p> : null}</>;
}

function AuthStyles() {
  return (
    <style>{`
      .auth-shell{--cream:#f6f1e8;--paper:#fffdf9;--night:#172638;--night2:#0f1a27;--ink:#181716;--terra:#ce654b;--terra-dark:#a84d38;--green:#4e9a67;min-height:100dvh;background:var(--cream);color:var(--night);display:grid;place-items:center;padding:82px 24px 72px;position:relative;overflow:hidden;font-family:Inter,system-ui,sans-serif}.auth-grid{position:absolute;inset:-10%;pointer-events:none;opacity:.7;background-image:linear-gradient(rgba(23,38,56,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(23,38,56,.055) 1px,transparent 1px);background-size:38px 38px;transform:perspective(700px) rotateX(63deg) translateY(26%);transform-origin:center bottom;mask-image:linear-gradient(to top,black,transparent 78%)}.auth-noise{position:absolute;inset:0;opacity:.12;pointer-events:none;background-image:radial-gradient(rgba(23,38,56,.18) .7px,transparent .7px);background-size:5px 5px;mix-blend-mode:multiply}.auth-scan{position:absolute;left:0;right:0;top:-30%;height:18%;background:linear-gradient(to bottom,transparent,rgba(206,101,75,.035),rgba(206,101,75,.11),rgba(206,101,75,.035),transparent);animation:guardScan 7s linear infinite;pointer-events:none}.auth-beam{position:absolute;top:0;bottom:0;width:1px;background:linear-gradient(transparent,var(--terra),transparent);box-shadow:0 0 24px rgba(206,101,75,.45);left:50%;opacity:.28;animation:beamSweep 10s ease-in-out infinite}.auth-orbit{position:absolute;border:1px solid rgba(23,38,56,.07);border-radius:50%;pointer-events:none}.orbit-a{width:680px;height:680px;right:-330px;top:-340px;animation:orbitSpin 28s linear infinite}.orbit-b{width:540px;height:540px;left:-260px;bottom:-260px;animation:orbitSpin 22s linear infinite reverse}.auth-orbit:before,.auth-orbit:after{content:"";position:absolute;width:7px;height:7px;border-radius:50%;background:var(--terra);box-shadow:0 0 18px rgba(206,101,75,.7)}.auth-orbit:before{left:50%;top:-4px}.auth-orbit:after{right:12%;bottom:12%}.auth-back-link{position:absolute;left:28px;top:26px;display:flex;align-items:center;gap:8px;color:rgba(23,38,56,.58);font-size:12px;font-weight:800;text-decoration:none;z-index:8;transition:.2s}.auth-back-link:hover{color:var(--terra)}.auth-stage{position:relative;z-index:3;width:min(1460px,100%);display:grid;grid-template-columns:minmax(250px,330px) minmax(420px,510px) minmax(250px,330px);gap:22px;align-items:center}.auth-card{position:relative;background:rgba(255,253,249,.96);border:1px solid rgba(23,38,56,.14);border-radius:28px;padding:28px;box-shadow:0 34px 100px rgba(23,38,56,.18),0 0 0 1px rgba(255,255,255,.55) inset;backdrop-filter:blur(20px);overflow:hidden}.auth-card:before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 20%,rgba(206,101,75,.035),transparent 65%);transform:translateX(-100%);animation:cardGlint 7s ease-in-out infinite;pointer-events:none}.card-corners i{position:absolute;width:18px;height:18px;border-color:var(--terra);opacity:.75}.card-corners i:nth-child(1){left:12px;top:12px;border-left:1px solid;border-top:1px solid}.card-corners i:nth-child(2){right:12px;top:12px;border-right:1px solid;border-top:1px solid}.card-corners i:nth-child(3){left:12px;bottom:12px;border-left:1px solid;border-bottom:1px solid}.card-corners i:nth-child(4){right:12px;bottom:12px;border-right:1px solid;border-bottom:1px solid}.auth-guard-head{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding-bottom:18px;border-bottom:1px solid rgba(23,38,56,.1)}.guard-icon-wrap{width:46px;height:46px;border-radius:14px;background:var(--night);color:var(--paper);display:grid;place-items:center;box-shadow:0 10px 24px rgba(23,38,56,.18)}.guard-label,.console-eyebrow{font:800 9px/1 Manrope,Inter,sans-serif;letter-spacing:.18em;color:var(--terra)}.auth-guard-head p{margin-top:5px;font:800 10px/1 Manrope,Inter,sans-serif;letter-spacing:.08em;color:rgba(23,38,56,.72)}.guard-dot{width:9px;height:9px;border-radius:999px;background:var(--green);box-shadow:0 0 0 5px rgba(78,154,103,.1),0 0 15px rgba(78,154,103,.4);animation:guardPulse 2.4s infinite}.guard-dot.alert{background:#bd3c32;box-shadow:0 0 0 5px rgba(189,60,50,.12),0 0 18px rgba(189,60,50,.48);animation-duration:.75s}.auth-security-strip{display:flex;gap:7px;overflow-x:auto;padding:12px 0;border-bottom:1px solid rgba(23,38,56,.08);scrollbar-width:none}.auth-security-strip span{display:flex;align-items:center;gap:5px;white-space:nowrap;border:1px solid rgba(23,38,56,.09);background:rgba(23,38,56,.035);border-radius:999px;padding:6px 8px;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace;color:rgba(23,38,56,.56)}.auth-heading{padding:22px 0 18px}.auth-kicker{font:800 9px/1 Manrope,Inter,sans-serif;letter-spacing:.2em;color:var(--terra)}.auth-heading h1{margin:8px 0 0;font:800 clamp(34px,6vw,48px)/1 Manrope,Inter,sans-serif;letter-spacing:-.05em;color:var(--night)}.auth-heading p{margin-top:10px;color:rgba(23,38,56,.62);font-size:12px;line-height:1.6}.auth-form{display:grid;gap:14px}.auth-field{display:grid;gap:7px}.auth-field label{font-size:11px;font-weight:800;color:var(--night)}.auth-field input{height:50px!important;border-radius:13px!important;border:1px solid rgba(23,38,56,.16)!important;background:rgba(255,255,255,.92)!important;color:var(--night)!important;padding:0 14px!important;box-shadow:none!important;transition:.2s}.auth-field input:focus{border-color:var(--terra)!important;box-shadow:0 0 0 4px rgba(206,101,75,.1),0 0 28px rgba(206,101,75,.08)!important;background:#fff!important}.auth-main-button{height:52px!important;border-radius:14px!important;background:var(--night)!important;color:#fff!important;font:800 12px Manrope,Inter,sans-serif!important;display:flex!important;gap:9px!important;box-shadow:0 14px 30px rgba(23,38,56,.22)!important;transition:.2s!important;position:relative;overflow:hidden}.auth-main-button:after{content:"";position:absolute;inset:-100% auto -100% -35%;width:22%;transform:rotate(15deg);background:rgba(255,255,255,.17);animation:buttonSweep 4.5s ease-in-out infinite}.auth-main-button:hover{background:#20364f!important;transform:translateY(-1px)}.auth-recovery-link,.auth-secondary-button{border:0;background:transparent;color:rgba(23,38,56,.58);font-size:11px;font-weight:750;display:flex;justify-content:center;align-items:center;gap:7px;padding:4px;cursor:pointer}.auth-recovery-link:hover,.auth-secondary-button:hover{color:var(--terra)}.recovery-warning{display:flex;align-items:center;gap:9px;padding:11px 12px;border-radius:12px;background:rgba(23,38,56,.055);color:rgba(23,38,56,.72);font-size:11px;font-weight:700}.auth-message-error,.auth-message-ok{padding:11px 12px;border-radius:11px;font-size:11px;font-weight:700;line-height:1.45}.auth-message-error{background:#fff0ed;color:#9f3025;border:1px solid #f1c7c0}.auth-message-ok{background:#eff8f1;color:#326c43;border:1px solid #c9e1d0}.auth-footer-status{margin-top:20px;padding-top:16px;border-top:1px solid rgba(23,38,56,.08);display:flex;align-items:center;justify-content:center;gap:7px;color:rgba(23,38,56,.38);font:700 8px Manrope,Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase}.auth-footer-status i{width:3px;height:3px;border-radius:50%;background:rgba(23,38,56,.25)}.guard-console{background:rgba(23,38,56,.965);color:#e9edf1;border:1px solid rgba(206,101,75,.23);border-radius:22px;padding:18px;box-shadow:0 26px 70px rgba(23,38,56,.18),inset 0 0 0 1px rgba(255,255,255,.025);position:relative;overflow:hidden}.guard-console:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px);background-size:100% 5px;pointer-events:none}.console-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding-bottom:15px;border-bottom:1px solid rgba(255,255,255,.08);position:relative;z-index:1}.console-head strong{display:block;margin-top:5px;font:800 12px Manrope,Inter,sans-serif;letter-spacing:.08em}.console-head svg{color:var(--terra)}.threat-score{display:flex;align-items:center;gap:13px;padding:18px 0;border-bottom:1px solid rgba(255,255,255,.07)}.score-ring{width:68px;height:68px;border-radius:50%;border:1px solid rgba(206,101,75,.44);box-shadow:inset 0 0 22px rgba(206,101,75,.08);display:grid;place-items:center;align-content:center;position:relative}.score-ring:after{content:"";position:absolute;inset:-4px;border-radius:inherit;border-top:1px solid var(--terra);animation:orbitSpin 3.2s linear infinite}.score-ring span{font:800 22px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#fff}.score-ring small{margin-top:3px;font:700 7px Manrope,Inter,sans-serif;letter-spacing:.18em;color:#7f8b97}.threat-score p{font:800 10px Manrope,Inter,sans-serif;color:#fff;letter-spacing:.06em}.threat-score>div:last-child>span{display:block;margin-top:5px;color:#81909f;font-size:9px;line-height:1.45}.telemetry-list{display:grid;gap:0;padding:10px 0}.telemetry-list>div{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.045);font:600 8.5px ui-monospace,SFMono-Regular,Menlo,monospace}.telemetry-list span{color:#8593a1}.telemetry-list b{font-weight:800;color:#d9e3ea}.telemetry-list .ok{color:#6ec68a}.telemetry-list .idle{color:#e9aa61}.telemetry-list .warn{color:#ff6958}.signal-bars{height:55px;display:flex;align-items:flex-end;gap:3px;padding-top:8px}.signal-bars i{flex:1;min-height:6px;background:linear-gradient(to top,var(--terra),#e0a08d);border-radius:2px 2px 0 0;opacity:.65;animation:signalWave 1.4s ease-in-out infinite alternate}.stream-window{margin-top:14px;border:1px solid rgba(255,255,255,.08);background:#0d1722;border-radius:13px;overflow:hidden}.stream-top{display:flex;align-items:center;gap:7px;padding:9px 10px;border-bottom:1px solid rgba(255,255,255,.07);font:800 8px ui-monospace,SFMono-Regular,Menlo,monospace;color:#81909f}.stream-top b{margin-left:auto;color:#d7e0e7}.live-dot{width:6px;height:6px;border-radius:50%;background:#65c581;box-shadow:0 0 10px rgba(101,197,129,.6);animation:guardPulse 1.4s infinite}.stream-lines{padding:8px 10px;min-height:155px}.stream-lines>div{display:grid;grid-template-columns:22px 1fr;gap:7px;padding:4px 0;font:600 8.5px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;color:#8291a0;opacity:.72;transition:.3s}.stream-lines>div.fresh{color:#dce5eb;opacity:1}.stream-lines>div>span{color:var(--terra)}.terminal-prompt{margin-top:4px!important;grid-template-columns:22px 1fr auto!important;color:#b9c4cd!important;opacity:1!important}.terminal-prompt b{animation:blink .8s steps(2) infinite}.modules-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px}.modules-grid>div{border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);border-radius:11px;padding:9px;display:grid;grid-template-columns:auto 1fr;gap:2px 7px}.modules-grid svg{grid-row:1/3;color:var(--terra);align-self:center}.modules-grid span{font:800 8px Manrope,Inter,sans-serif;letter-spacing:.07em;color:#e4e9ed}.modules-grid small{font:600 7.5px ui-monospace,SFMono-Regular,Menlo,monospace;color:#748391}.kernel-status{margin-top:12px;border-top:1px solid rgba(255,255,255,.07);padding-top:12px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px}.kernel-status svg{color:#8b9aa8}.kernel-status span{display:block;font:600 8px ui-monospace,SFMono-Regular,Menlo,monospace;color:#758493}.kernel-status strong{display:block;margin-top:2px;font:800 8px Manrope,Inter,sans-serif;color:#dce4e9;letter-spacing:.06em}.kernel-status i{width:6px;height:6px;border-radius:50%;background:#62c17e;box-shadow:0 0 10px rgba(98,193,126,.5)}.guard-warning{margin:16px 0 2px;padding:14px;border-radius:14px;background:#161b22;color:#d7dde4;border:1px solid rgba(206,101,75,.45);box-shadow:0 0 28px rgba(125,40,32,.12),inset 0 0 0 1px rgba(255,255,255,.02);animation:alertIn .28s ease-out}.guard-warning-title{display:flex;align-items:center;gap:8px;color:#ff795f;font:800 10px Manrope,Inter,sans-serif;letter-spacing:.08em}.guard-warning>p{margin:9px 0 12px;color:#aeb7c2;font-size:10px;line-height:1.55}.guard-terminal{background:#0b0f14;border:1px solid #2c3540;border-radius:10px;padding:10px;font:600 8.5px/1.75 ui-monospace,SFMono-Regular,Menlo,monospace;color:#798897}.guard-terminal div{display:flex;gap:7px}.guard-terminal span{color:#ce654b}.guard-terminal b{margin-left:auto;color:#72c48a}.guard-terminal .deny{color:#ff6657}.guard-alert{background:#eee6db}.guard-alert .auth-card{box-shadow:0 34px 100px rgba(105,34,27,.19),0 0 48px rgba(189,60,50,.08)}.guard-alert .guard-icon-wrap{background:#7d2820}.guard-alert .auth-beam{background:linear-gradient(transparent,#bd3c32,transparent);box-shadow:0 0 30px rgba(189,60,50,.7);animation-duration:2.5s}.guard-alert .guard-console{border-color:rgba(189,60,50,.42)}.guard-alert .signal-bars i{background:linear-gradient(to top,#8d3028,#e16d5e);animation-duration:.45s}.auth-bottom-code{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:2;display:flex;gap:13px;white-space:nowrap;font:600 8px ui-monospace,SFMono-Regular,Menlo,monospace;color:rgba(23,38,56,.37);max-width:92vw;overflow:hidden;mask-image:linear-gradient(90deg,transparent,black 6%,black 94%,transparent)}.auth-bottom-code i{font-style:normal;color:rgba(206,101,75,.7)}.auth-loading{background:var(--cream)}.boot-panel{width:min(420px,90vw);border:1px solid rgba(23,38,56,.11);background:rgba(255,253,249,.92);border-radius:22px;padding:24px;box-shadow:0 28px 80px rgba(23,38,56,.12)}.boot-radar{width:54px;height:54px;margin-bottom:18px;border-radius:50%;display:grid;place-items:center;background:var(--night);color:#fff;position:relative}.boot-radar:after{content:"";position:absolute;inset:-7px;border:1px solid rgba(206,101,75,.4);border-radius:50%;border-top-color:var(--terra);animation:orbitSpin 1.2s linear infinite}.boot-panel>p{font:800 10px Manrope,Inter,sans-serif;letter-spacing:.12em}.boot-line{margin-top:11px;padding-top:11px;border-top:1px solid rgba(23,38,56,.07);font:600 9px ui-monospace,SFMono-Regular,Menlo,monospace;color:rgba(23,38,56,.55)}.boot-line span{display:inline-block;width:6px;height:6px;margin-right:7px;border-radius:50%;background:var(--terra);animation:guardPulse 1.2s infinite}@keyframes guardScan{0%{transform:translateY(-22vh)}100%{transform:translateY(160vh)}}@keyframes beamSweep{0%,100%{transform:translateX(-44vw);opacity:0}15%,85%{opacity:.28}50%{transform:translateX(44vw)}}@keyframes orbitSpin{to{transform:rotate(360deg)}}@keyframes guardPulse{0%,100%{opacity:1}50%{opacity:.35}}@keyframes cardGlint{0%,55%{transform:translateX(-120%)}75%,100%{transform:translateX(140%)}}@keyframes buttonSweep{0%,65%{left:-35%}90%,100%{left:135%}}@keyframes signalWave{from{transform:scaleY(.55);opacity:.35}to{transform:scaleY(1);opacity:.9}}@keyframes blink{50%{opacity:0}}@keyframes alertIn{from{transform:translateY(-6px);opacity:0}to{transform:none;opacity:1}}@media(max-width:1100px){.auth-stage{grid-template-columns:minmax(0,1fr) minmax(420px,510px)}.guard-console-right{display:none}.guard-console-left{max-width:310px;justify-self:end}}@media(max-width:800px){.auth-shell{padding:78px 14px 64px;overflow:auto}.auth-stage{display:block;width:min(510px,100%)}.guard-console{display:none}.auth-card{width:100%}.auth-grid{position:fixed}.auth-bottom-code{position:fixed}.auth-beam,.auth-orbit{position:fixed}.auth-back-link{left:18px;top:20px}.auth-heading h1{font-size:38px}}@media(max-width:520px){.auth-card{padding:21px;border-radius:22px}.auth-security-strip{margin-inline:-2px}.auth-heading{padding-top:19px}.auth-footer-status{flex-wrap:wrap}.auth-bottom-code{font-size:7px;bottom:12px}}@media(prefers-reduced-motion:reduce){.auth-scan,.auth-beam,.auth-orbit,.auth-card:before,.guard-dot,.signal-bars i,.score-ring:after,.live-dot,.terminal-prompt b,.auth-main-button:after,.boot-radar:after,.boot-line span{animation:none!important}.auth-main-button:hover{transform:none}}
    `}</style>
  );
}
