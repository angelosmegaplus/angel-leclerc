import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CircleAlert, Database, Loader2, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import { AdminCard } from "./AdminShell";
import {
  disconnectOAuthConnection,
  integrationReadiness,
  startOAuthConnection,
  type IntegrationReadiness,
} from "@/lib/system.functions";

const GOOGLE_CALLBACK = "https://www.angel-leclerc.fr/oauth/google/callback";

function humanError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (/<!doctype|<html|<head|<body/i.test(raw)) return "Le service Google n’a pas répondu correctement. Réessayez.";
  return raw.replace(/\s+/g, " ").slice(0, 220) || "Connexion impossible.";
}

function stateLabel(item: IntegrationReadiness | undefined) {
  if (!item) return "Vérification…";
  if (item.connection === "connected") return "Connecté";
  if (item.connection === "reconnect_required") return "Reconnexion requise";
  return item.status === "ready" ? "Prêt à connecter" : "Configuration serveur requise";
}

export function ConnectionsPanel() {
  const getReadiness = useServerFn(integrationReadiness);
  const connect = useServerFn(startOAuthConnection);
  const disconnect = useServerFn(disconnectOAuthConnection);
  const [items, setItems] = useState<IntegrationReadiness[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const google = useMemo(() => items.find((item) => item.key === "google"), [items]);

  const refresh = async () => {
    setError(null);
    try {
      setItems(await getReadiness());
    } catch (e) {
      setError(humanError(e));
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const connectGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await connect({ data: { provider: "google" } });
      window.location.assign(result.url);
    } catch (e) {
      setError(humanError(e));
      setBusy(false);
    }
  };

  const disconnectGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      await disconnect({ data: { provider: "google" } });
      await refresh();
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(false);
    }
  };

  const connected = google?.connection === "connected";
  const reconnect = google?.connection === "reconnect_required";
  const canConnect = google?.status === "ready";

  return (
    <div className="space-y-4">
      <AdminCard className="border-red-500/15 bg-gradient-to-br from-red-500/[.06] via-[#090b0d] to-[#090b0d]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-base font-semibold text-white sm:text-lg">Google Workspace</p>
            <p className="mt-1 text-sm leading-relaxed text-white/50">
              Connecte ton compte Google directement à Angel OS. Une fois autorisé, Gmail, Agenda et Drive peuvent être lus côté serveur par les modules administrateur et par Angel OS IA quand ta demande en a besoin.
            </p>
            {google?.accountLabel ? (
              <p className="mt-2 text-sm font-medium text-white/75">
                {connected ? "Compte connecté" : "Dernier compte autorisé"} : {google.accountLabel}
              </p>
            ) : null}
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${connected ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : reconnect ? "border-amber-500/20 bg-amber-500/10 text-amber-200" : "border-white/10 bg-white/[.04] text-white/55"}`}>
            {stateLabel(google)}
          </span>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {["Gmail · lecture et gestion", "Agenda · lecture", "Drive · lecture"].map((label) => (
            <div key={label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white/65">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />{label}
            </div>
          ))}
        </div>

        {google?.note ? <p className="mt-4 text-xs leading-5 text-white/40">{google.note}</p> : null}
        {reconnect ? (
          <div className="mt-4 rounded-xl border border-amber-500/15 bg-amber-500/[.05] px-3 py-3 text-xs leading-5 text-amber-100/70">
            <p className="font-medium text-amber-100">Callback Google canonique</p>
            <code className="mt-1 block break-all font-mono text-[11px] text-amber-100/70">{GOOGLE_CALLBACK}</code>
            <p className="mt-1 text-amber-100/50">Cette adresse doit être enregistrée à l’identique dans les URI de redirection autorisées du client OAuth Google.</p>
          </div>
        ) : null}
        {error ? <div className="mt-4 flex gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs text-red-100"><CircleAlert className="h-4 w-4 shrink-0" />{error}</div> : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !canConnect}
            onClick={() => void connectGoogle()}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {connected ? "Reconnecter Google" : reconnect ? "Réautoriser Google" : "Se connecter avec Google"}
          </button>
          <button type="button" disabled={busy} onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-sm text-white/70 disabled:opacity-40">
            <RefreshCw className="h-4 w-4" />Actualiser
          </button>
          {(connected || reconnect) ? (
            <button type="button" disabled={busy} onClick={() => void disconnectGoogle()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-sm text-white/70 disabled:opacity-40">
              <Unplug className="h-4 w-4" />Déconnecter
            </button>
          ) : null}
        </div>
      </AdminCard>

      <AdminCard title="Accès de l’IA" description="L’autorisation Google reste liée à ton compte administrateur et les jetons ne sont jamais envoyés au navigateur.">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
          <p className="text-xs leading-5 text-white/50">
            Angel OS IA peut utiliser les données Google uniquement depuis le serveur et seulement pour répondre aux fonctions de l’espace privé. Les actions sensibles comme envoyer un mail restent séparées de la simple lecture.
          </p>
        </div>
      </AdminCard>

      <div className="flex items-center gap-2 px-1 font-mono text-[10px] uppercase tracking-[.14em] text-white/40">
        <Database className="h-3.5 w-3.5 text-red-300" /> Google OAuth → Angel OS → modules privés / IA
      </div>
    </div>
  );
}
