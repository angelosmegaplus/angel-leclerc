import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
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
      {
        name: "description",
        content:
          "Connexion, création de compte et récupération sécurisée de l’espace administrateur Angel OS.",
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

  function resetMessages() {
    setError(null);
    setNotice(null);
  }

  function switchMode(next: AuthMode) {
    resetMessages();
    setMode(next);
    setPassword("");
    setConfirmPassword("");
    setOwnerCode("");
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
      setError(
        message.includes("Invalid login credentials")
          ? "E-mail ou mot de passe incorrect."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }

  async function signup(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    if (password.length < 8)
      return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirmPassword)
      return setError("Les deux mots de passe ne correspondent pas.");
    setBusy(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (err) throw err;
      setPassword("");
      setConfirmPassword("");
      if (data.session) {
        setNotice(
          "Compte créé. Utilisez maintenant « Secours » pour prouver l’identité propriétaire.",
        );
        setMode("owner");
      } else {
        setNotice(
          "Compte créé. Vous pouvez maintenant utiliser la récupération par code si nécessaire.",
        );
      }
    } catch (err) {
      setError(cleanError(err, "Impossible de créer le compte."));
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
      return setError("Entrez le code d’urgence.");
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
        setNotice(
          "Mot de passe remplacé. Revenez à Connexion avec ce nouveau mot de passe.",
        );
        setMode("login");
        return;
      }
      if (result.adminRestored)
        setNotice("Mot de passe restauré. Ouverture de l’administration…");
      else
        setNotice(
          "Mot de passe restauré. Connexion validée ; vérification des droits administrateur…",
        );
    } catch (err) {
      setError(
        cleanError(
          err,
          "La récupération a rencontré une erreur serveur. Aucun code HTML n’est affiché : réessayez directement.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function claimOwner(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    if (!session) return setError("Connectez-vous d’abord avec votre compte Angel.");
    setBusy(true);
    try {
      await claimOwnerAdminAccess({ data: { code: ownerCode.trim() } });
      setNotice("Identité propriétaire validée. Accès administrateur activé.");
      setOwnerCode("");
    } catch (err) {
      setError(cleanError(err, "Impossible de valider le code de secours."));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    switchMode("login");
  }

  if (loading) {
    return (
      <section className="auth-shell auth-loading">
        <div className="auth-loader">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Ouverture de l’espace sécurisé…</span>
        </div>
        <AuthStyles />
      </section>
    );
  }

  const title =
    mode === "signup"
      ? "Créer votre accès"
      : mode === "forgot"
        ? "Récupérer votre accès"
        : mode === "owner"
          ? "Accès propriétaire"
          : "Bienvenue dans l’espace admin";

  const description =
    mode === "signup"
      ? "Créez votre compte sécurisé. Les droits administrateur restent protégés séparément."
      : mode === "forgot"
        ? "Utilisez votre code d’urgence pour définir un nouveau mot de passe."
        : mode === "owner"
          ? "Validez votre identité propriétaire pour activer les droits administrateur."
          : "Connectez-vous pour accéder à Angel OS et piloter vos contenus, projets et outils.";

  return (
    <section className="auth-shell">
      <div className="auth-orb auth-orb-one" aria-hidden />
      <div className="auth-orb auth-orb-two" aria-hidden />
      <div className="auth-grid" aria-hidden />

      <a href="/" className="auth-back-link">
        <ArrowLeft className="h-4 w-4" />
        Retour au site
      </a>

      <div className="auth-layout">
        <aside className="auth-brand-panel">
          <div className="auth-brand-top">
            <div className="auth-brand-mark" aria-hidden>
              ALC<span>!</span>
            </div>
            <div>
              <p className="auth-eyebrow">Angel Leclerc Communication</p>
              <p className="auth-brand-subtitle">Espace privé</p>
            </div>
          </div>

          <div className="auth-brand-copy">
            <span className="auth-mini-badge">
              <Sparkles className="h-3.5 w-3.5" />
              Angel OS
            </span>
            <h1>
              Votre espace de travail,
              <br />
              <em>au même endroit.</em>
            </h1>
            <p>
              Une interface privée pour centraliser l’administration du site,
              les contenus et vos outils de pilotage.
            </p>
          </div>

          <div className="auth-trust-list" aria-label="Fonctionnalités de sécurité">
            <div>
              <span className="auth-trust-icon"><LockKeyhole className="h-4 w-4" /></span>
              <span><strong>Accès protégé</strong><small>Authentification sécurisée</small></span>
            </div>
            <div>
              <span className="auth-trust-icon"><ShieldCheck className="h-4 w-4" /></span>
              <span><strong>Droits séparés</strong><small>Validation propriétaire dédiée</small></span>
            </div>
          </div>

          <div className="auth-brand-footer">
            <span className="auth-status-dot" />
            Espace administrateur sécurisé
          </div>
        </aside>

        <main className="auth-panel-wrap">
          <div className="auth-panel">
            <div className="auth-panel-heading">
              <div>
                <span className="auth-panel-kicker">Espace Admin</span>
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
              <span className="auth-secure-pill">
                <ShieldCheck className="h-3.5 w-3.5" />
                Sécurisé
              </span>
            </div>

            <div className="auth-tabs" role="tablist" aria-label="Options de connexion">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                onClick={() => switchMode("login")}
                className={mode === "login" ? "active" : ""}
              >
                Connexion
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signup"}
                onClick={() => switchMode("signup")}
                className={mode === "signup" ? "active" : ""}
              >
                Créer un compte
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "owner"}
                onClick={() => switchMode("owner")}
                className={mode === "owner" ? "active" : ""}
              >
                Secours
              </button>
            </div>

            <div className="auth-form-area">
              {mode === "login" && (
                <form onSubmit={login} className="auth-form">
                  <FieldEmail value={email} onChange={setEmail} />
                  <FieldPassword
                    label="Mot de passe"
                    value={password}
                    onChange={setPassword}
                    autoComplete="current-password"
                  />
                  <div className="auth-form-meta">
                    <span className="auth-private-note">
                      <LockKeyhole className="h-3.5 w-3.5" />
                      Connexion privée
                    </span>
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="auth-link"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <Messages error={error} notice={notice} />
                  <Button type="submit" disabled={busy} className="auth-main-button">
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="h-4 w-4" />
                    )}
                    Me connecter
                  </Button>
                </form>
              )}

              {mode === "signup" && (
                <form onSubmit={signup} className="auth-form">
                  <FieldEmail value={email} onChange={setEmail} />
                  <FieldPassword
                    label="Mot de passe"
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
                  <p className="auth-field-hint">8 caractères minimum.</p>
                  <Messages error={error} notice={notice} />
                  <Button type="submit" disabled={busy} className="auth-main-button">
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Créer mon compte
                  </Button>
                </form>
              )}

              {mode === "forgot" && (
                <form onSubmit={resetPasswordWithCode} className="auth-form">
                  <div className="auth-warning">
                    <span><KeyRound className="h-4 w-4" /></span>
                    <div>
                      <strong>Récupération sécurisée</strong>
                      <p>Le code d’urgence remplace la récupération par e-mail.</p>
                    </div>
                  </div>
                  <FieldEmail value={email} onChange={setEmail} />
                  <div className="auth-field">
                    <Label htmlFor="emergency-code">Code d’urgence</Label>
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
                    label="Confirmer le nouveau mot de passe"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                  />
                  <Messages error={error} notice={notice} />
                  <Button type="submit" disabled={busy} className="auth-main-button">
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    Restaurer l’accès
                  </Button>
                  <button
                    type="button"
                    className="auth-secondary-button"
                    onClick={() => switchMode("login")}
                  >
                    Retour à la connexion
                  </button>
                </form>
              )}

              {mode === "owner" && (
                <form onSubmit={claimOwner} className="auth-form">
                  <div className="auth-warning">
                    <span><ShieldCheck className="h-4 w-4" /></span>
                    <div>
                      <strong>Preuve propriétaire</strong>
                      <p>Une vérification supplémentaire protège les droits administrateur.</p>
                    </div>
                  </div>
                  {!session ? (
                    <p className="auth-session-box">
                      Connectez-vous ou créez votre compte avant cette vérification.
                    </p>
                  ) : (
                    <p className="auth-session-box auth-session-active">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Compte connecté : <strong>{session.user.email}</strong></span>
                    </p>
                  )}
                  <div className="auth-field">
                    <Label htmlFor="owner-code">Code propriétaire</Label>
                    <Input
                      id="owner-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={ownerCode}
                      onChange={(e) => setOwnerCode(e.target.value)}
                      placeholder="••••"
                      required
                    />
                  </div>
                  <Messages error={error} notice={notice} />
                  <Button
                    type="submit"
                    disabled={busy || !session || ownerCode.length < 4}
                    className="auth-main-button"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    Valider mon identité
                  </Button>
                  {session && (
                    <button type="button" onClick={logout} className="auth-secondary-button">
                      Changer de compte
                    </button>
                  )}
                </form>
              )}
            </div>

            <div className="auth-panel-footer">
              <span>Angel OS</span>
              <span aria-hidden>•</span>
              <span>Accès privé</span>
            </div>
          </div>
        </main>
      </div>

      <AuthStyles />
    </section>
  );
}

function FieldEmail({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="auth-field">
      <Label htmlFor="auth-email">Adresse e-mail</Label>
      <Input
        id="auth-email"
        type="email"
        autoComplete="email"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="nom@exemple.fr"
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
        placeholder="••••••••"
      />
    </div>
  );
}

function Messages({ error, notice }: { error: string | null; notice: string | null }) {
  return (
    <div aria-live="polite">
      {error ? <p className="auth-message auth-message-error">{error}</p> : null}
      {notice ? <p className="auth-message auth-message-ok">{notice}</p> : null}
    </div>
  );
}

function AuthStyles() {
  return (
    <style>{`
      .auth-shell {
        --alc-terracotta: #CE654B;
        --alc-terracotta-dark: #A84D38;
        --alc-navy: #172638;
        --alc-ink: #181716;
        --alc-cream: #F6F1E8;
        --alc-warm-white: #FFFDF9;
        --alc-sand: #E6DED2;
        min-height: 100dvh;
        position: relative;
        isolation: isolate;
        overflow: hidden;
        display: grid;
        place-items: center;
        padding: clamp(20px, 4vw, 52px);
        background:
          radial-gradient(circle at 12% 16%, rgba(206, 101, 75, .14), transparent 28%),
          radial-gradient(circle at 90% 84%, rgba(23, 38, 56, .10), transparent 32%),
          var(--alc-cream);
        color: var(--alc-ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .auth-loading { color: var(--alc-navy); }
      .auth-loader {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 14px 18px;
        border: 1px solid rgba(23, 38, 56, .10);
        border-radius: 999px;
        background: rgba(255, 253, 249, .82);
        box-shadow: 0 12px 36px rgba(23, 38, 56, .08);
        backdrop-filter: blur(18px);
        font-size: 13px;
        font-weight: 700;
      }

      .auth-grid {
        position: absolute;
        inset: 0;
        z-index: -3;
        opacity: .32;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(23, 38, 56, .055) 1px, transparent 1px),
          linear-gradient(90deg, rgba(23, 38, 56, .055) 1px, transparent 1px);
        background-size: 48px 48px;
        mask-image: linear-gradient(to bottom, transparent, #000 24%, #000 76%, transparent);
      }

      .auth-orb {
        position: absolute;
        z-index: -2;
        border-radius: 999px;
        filter: blur(2px);
        pointer-events: none;
      }
      .auth-orb-one {
        width: 360px;
        height: 360px;
        top: -190px;
        right: 5%;
        background: rgba(206, 101, 75, .10);
        border: 1px solid rgba(206, 101, 75, .14);
      }
      .auth-orb-two {
        width: 260px;
        height: 260px;
        bottom: -140px;
        left: 8%;
        background: rgba(23, 38, 56, .07);
        border: 1px solid rgba(23, 38, 56, .10);
      }

      .auth-back-link {
        position: absolute;
        top: clamp(18px, 3vw, 34px);
        left: clamp(18px, 3vw, 38px);
        z-index: 5;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 12px;
        border-radius: 999px;
        color: rgba(23, 38, 56, .70);
        background: rgba(255, 253, 249, .56);
        border: 1px solid rgba(23, 38, 56, .08);
        backdrop-filter: blur(14px);
        font-size: 12px;
        font-weight: 700;
        transition: color .2s ease, background .2s ease, transform .2s ease;
      }
      .auth-back-link:hover {
        color: var(--alc-navy);
        background: rgba(255, 253, 249, .92);
        transform: translateX(-2px);
      }

      .auth-layout {
        width: min(1180px, 100%);
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(420px, .82fr);
        gap: clamp(18px, 3vw, 34px);
        align-items: stretch;
      }

      .auth-brand-panel,
      .auth-panel {
        min-height: 650px;
        border-radius: 32px;
      }

      .auth-brand-panel {
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding: clamp(30px, 5vw, 58px);
        color: var(--alc-warm-white);
        background:
          linear-gradient(145deg, rgba(255,255,255,.055), transparent 45%),
          var(--alc-navy);
        box-shadow: 0 28px 80px rgba(23, 38, 56, .15);
      }
      .auth-brand-panel::before {
        content: "";
        position: absolute;
        width: 280px;
        height: 280px;
        right: -110px;
        top: -90px;
        border-radius: 50%;
        border: 54px solid rgba(206, 101, 75, .17);
      }
      .auth-brand-panel::after {
        content: "";
        position: absolute;
        width: 180px;
        height: 180px;
        right: 28px;
        bottom: -92px;
        border-radius: 50%;
        background: rgba(206, 101, 75, .18);
      }

      .auth-brand-top {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 15px;
      }
      .auth-brand-mark {
        width: 54px;
        height: 54px;
        display: grid;
        place-items: center;
        border-radius: 17px;
        background: var(--alc-warm-white);
        color: var(--alc-navy);
        font-family: Manrope, Inter, sans-serif;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: -.06em;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.6);
      }
      .auth-brand-mark span { color: var(--alc-terracotta); }
      .auth-eyebrow {
        margin: 0 0 2px;
        color: rgba(255, 253, 249, .58);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .13em;
        text-transform: uppercase;
      }
      .auth-brand-subtitle {
        margin: 0;
        font-family: Manrope, Inter, sans-serif;
        font-size: 16px;
        font-weight: 700;
      }

      .auth-brand-copy {
        position: relative;
        z-index: 1;
        margin: auto 0;
        padding: 54px 0 46px;
      }
      .auth-mini-badge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 7px 10px;
        margin-bottom: 22px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 999px;
        background: rgba(255,255,255,.055);
        color: rgba(255,253,249,.82);
        font-size: 11px;
        font-weight: 700;
      }
      .auth-brand-copy h1 {
        max-width: 650px;
        margin: 0;
        font-family: Manrope, Inter, sans-serif;
        font-size: clamp(40px, 5.1vw, 66px);
        line-height: .98;
        letter-spacing: -.055em;
        font-weight: 800;
      }
      .auth-brand-copy h1 em {
        color: #E48A73;
        font-style: normal;
      }
      .auth-brand-copy > p {
        max-width: 510px;
        margin: 24px 0 0;
        color: rgba(255, 253, 249, .66);
        font-size: 14px;
        line-height: 1.7;
      }

      .auth-trust-list {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: repeat(2, minmax(0,1fr));
        gap: 10px;
        margin-bottom: 30px;
      }
      .auth-trust-list > div {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 12px 13px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 16px;
        background: rgba(255,255,255,.045);
      }
      .auth-trust-icon {
        flex: 0 0 auto;
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        background: rgba(206, 101, 75, .16);
        color: #E89883;
      }
      .auth-trust-list span:last-child { min-width: 0; }
      .auth-trust-list strong,
      .auth-trust-list small { display: block; }
      .auth-trust-list strong {
        color: rgba(255,253,249,.92);
        font-size: 11px;
        font-weight: 700;
      }
      .auth-trust-list small {
        margin-top: 2px;
        color: rgba(255,253,249,.46);
        font-size: 9px;
      }

      .auth-brand-footer {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        color: rgba(255,253,249,.48);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .04em;
      }
      .auth-status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #6FB984;
        box-shadow: 0 0 0 4px rgba(111,185,132,.10);
      }

      .auth-panel-wrap { min-width: 0; }
      .auth-panel {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: clamp(26px, 4vw, 46px);
        background: rgba(255, 253, 249, .92);
        border: 1px solid rgba(23, 38, 56, .08);
        box-shadow: 0 28px 80px rgba(23, 38, 56, .10);
        backdrop-filter: blur(22px);
      }

      .auth-panel-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
      }
      .auth-panel-kicker {
        display: block;
        margin-bottom: 10px;
        color: var(--alc-terracotta-dark);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .14em;
        text-transform: uppercase;
      }
      .auth-panel-heading h2 {
        margin: 0;
        color: var(--alc-navy);
        font-family: Manrope, Inter, sans-serif;
        font-size: clamp(27px, 3vw, 36px);
        line-height: 1.08;
        letter-spacing: -.035em;
        font-weight: 800;
      }
      .auth-panel-heading p {
        max-width: 460px;
        margin: 12px 0 0;
        color: rgba(24, 23, 22, .57);
        font-size: 12px;
        line-height: 1.6;
      }
      .auth-secure-pill {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 7px 9px;
        border: 1px solid rgba(23, 38, 56, .08);
        border-radius: 999px;
        color: rgba(23,38,56,.66);
        background: var(--alc-cream);
        font-size: 9px;
        font-weight: 800;
      }

      .auth-tabs {
        display: grid;
        grid-template-columns: repeat(3, minmax(0,1fr));
        gap: 5px;
        margin: 28px 0 30px;
        padding: 5px;
        border-radius: 15px;
        background: #EFE9DF;
      }
      .auth-tabs button {
        min-width: 0;
        padding: 10px 8px;
        border-radius: 11px;
        color: rgba(24,23,22,.50);
        font-size: 10px;
        font-weight: 800;
        transition: color .2s ease, background .2s ease, box-shadow .2s ease;
      }
      .auth-tabs button:hover { color: var(--alc-navy); }
      .auth-tabs button.active {
        color: var(--alc-navy);
        background: var(--alc-warm-white);
        box-shadow: 0 3px 12px rgba(23, 38, 56, .07);
      }

      .auth-form-area { flex: 1; }
      .auth-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .auth-field {
        display: flex;
        flex-direction: column;
        gap: 7px;
      }
      .auth-field label,
      .auth-form-area label {
        color: rgba(24,23,22,.72);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .015em;
      }
      .auth-field input,
      .auth-form-area input {
        height: 48px !important;
        padding: 0 14px !important;
        border: 1px solid rgba(23,38,56,.12) !important;
        border-radius: 14px !important;
        background: #FBF8F3 !important;
        color: var(--alc-ink) !important;
        font-size: 13px !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.7) !important;
        transition: border-color .2s ease, box-shadow .2s ease, background .2s ease !important;
      }
      .auth-field input::placeholder,
      .auth-form-area input::placeholder { color: rgba(24,23,22,.30) !important; }
      .auth-field input:focus,
      .auth-form-area input:focus {
        outline: none !important;
        border-color: rgba(206,101,75,.66) !important;
        background: var(--alc-warm-white) !important;
        box-shadow: 0 0 0 4px rgba(206,101,75,.10) !important;
      }

      .auth-form-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        margin-top: -2px;
      }
      .auth-private-note {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: rgba(24,23,22,.40);
        font-size: 9px;
        font-weight: 700;
      }
      .auth-link {
        color: var(--alc-terracotta-dark);
        font-size: 10px;
        font-weight: 800;
        text-decoration: none;
      }
      .auth-link:hover { text-decoration: underline; text-underline-offset: 3px; }
      .auth-field-hint {
        margin: -8px 0 0;
        color: rgba(24,23,22,.38);
        font-size: 9px;
      }

      .auth-main-button {
        width: 100%;
        height: 50px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        margin-top: 2px;
        border: 0 !important;
        border-radius: 15px !important;
        background: var(--alc-navy) !important;
        color: var(--alc-warm-white) !important;
        font-size: 11px !important;
        font-weight: 800 !important;
        box-shadow: 0 12px 28px rgba(23,38,56,.16) !important;
        transition: transform .2s ease, background .2s ease, box-shadow .2s ease !important;
      }
      .auth-main-button:hover:not(:disabled) {
        background: var(--alc-terracotta-dark) !important;
        transform: translateY(-1px);
        box-shadow: 0 14px 32px rgba(168,77,56,.20) !important;
      }
      .auth-main-button:disabled { opacity: .55; cursor: not-allowed; }
      .auth-main-button:focus-visible,
      .auth-secondary-button:focus-visible,
      .auth-tabs button:focus-visible,
      .auth-link:focus-visible,
      .auth-back-link:focus-visible {
        outline: 3px solid rgba(206,101,75,.24);
        outline-offset: 2px;
      }

      .auth-secondary-button {
        width: 100%;
        height: 44px;
        border-radius: 13px;
        color: rgba(23,38,56,.62);
        background: transparent;
        border: 1px solid rgba(23,38,56,.10);
        font-size: 10px;
        font-weight: 800;
        transition: background .2s ease, color .2s ease;
      }
      .auth-secondary-button:hover {
        color: var(--alc-navy);
        background: var(--alc-cream);
      }

      .auth-warning {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 13px;
        border: 1px solid rgba(206,101,75,.18);
        border-radius: 14px;
        background: rgba(206,101,75,.075);
      }
      .auth-warning > span {
        flex: 0 0 auto;
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        color: var(--alc-terracotta-dark);
        background: rgba(206,101,75,.12);
      }
      .auth-warning strong {
        display: block;
        color: var(--alc-navy);
        font-size: 10px;
      }
      .auth-warning p {
        margin: 3px 0 0;
        color: rgba(24,23,22,.50);
        font-size: 9px;
        line-height: 1.5;
      }

      .auth-session-box {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        padding: 11px 12px;
        border-radius: 13px;
        background: var(--alc-cream);
        color: rgba(24,23,22,.55);
        font-size: 9px;
        line-height: 1.5;
      }
      .auth-session-active { color: #416B4D; }
      .auth-session-box strong { color: var(--alc-navy); font-weight: 800; }

      .auth-message {
        margin: 0;
        padding: 10px 12px;
        border-radius: 12px;
        font-size: 9px;
        font-weight: 700;
        line-height: 1.5;
      }
      .auth-message-error {
        border: 1px solid rgba(180,60,60,.16);
        background: rgba(180,60,60,.07);
        color: #9A3C3C;
      }
      .auth-message-ok {
        border: 1px solid rgba(63,120,79,.15);
        background: rgba(63,120,79,.07);
        color: #3F784F;
      }

      .auth-panel-footer {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        margin-top: auto;
        padding-top: 28px;
        color: rgba(24,23,22,.30);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: .09em;
        text-transform: uppercase;
      }

      @media (max-width: 900px) {
        .auth-shell { padding: 70px 16px 18px; }
        .auth-layout { grid-template-columns: 1fr; width: min(560px, 100%); }
        .auth-brand-panel { min-height: auto; padding: 24px; border-radius: 25px; }
        .auth-brand-copy { padding: 36px 0 26px; }
        .auth-brand-copy h1 { font-size: clamp(34px, 9vw, 48px); }
        .auth-brand-copy > p { margin-top: 16px; }
        .auth-trust-list { margin-bottom: 24px; }
        .auth-panel { min-height: auto; border-radius: 25px; }
        .auth-panel-footer { margin-top: 30px; }
      }

      @media (max-width: 560px) {
        .auth-shell { padding-inline: 11px; }
        .auth-back-link { top: 14px; left: 14px; }
        .auth-brand-panel { padding: 20px; }
        .auth-brand-copy { padding: 28px 0 20px; }
        .auth-brand-copy h1 { font-size: 34px; }
        .auth-brand-copy > p { font-size: 12px; }
        .auth-trust-list { grid-template-columns: 1fr; }
        .auth-trust-list > div:nth-child(2) { display: none; }
        .auth-panel { padding: 23px 18px; }
        .auth-panel-heading { display: block; }
        .auth-secure-pill { margin-top: 13px; }
        .auth-tabs { margin-block: 22px 24px; }
        .auth-tabs button { padding: 9px 5px; font-size: 9px; }
        .auth-form-meta { align-items: flex-start; }
      }

      @media (prefers-reduced-motion: reduce) {
        .auth-shell *, .auth-shell *::before, .auth-shell *::after {
          scroll-behavior: auto !important;
          animation-duration: .01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: .01ms !important;
        }
      }
    `}</style>
  );
}
