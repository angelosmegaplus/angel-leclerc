import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  CircleAlert,
  Database,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Unplug,
  PlugZap,
} from "lucide-react";
import { AdminCard } from "./AdminShell";
import {
  disconnectOAuthConnection,
  integrationReadiness,
  startOAuthConnection,
  type IntegrationReadiness,
} from "@/lib/system.functions";
import {
  GOOGLE_SERVICES,
  hasGoogleServiceScopes,
  type GoogleServiceId,
} from "@/lib/oauth/google-services";

const GOOGLE_CALLBACK = "https://www.angel-leclerc.fr/oauth/google/callback";

function humanError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (/<!doctype|<html|<head|<body/i.test(raw)) return "Le service Google n’a pas répondu correctement. Réessayez.";
  return raw.replace(/\s+/g, " ").slice(0, 220) || "Connexion impossible.";
}

export function ConnectionsPanel() {
  const getReadiness = useServerFn(integrationReadiness);
  const connect = useServerFn(startOAuthConnection);
  const disconnect = useServerFn(disconnectOAuthConnection);
  const [items, setItems] = useState<IntegrationReadiness[]>([]);
  const [busyService, setBusyService] = useState<GoogleServiceId | "all" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const google = useMemo(() => items.find((item) => item.key === "google"), [items]);
  const grantedScopes = google?.scopes ?? [];
  const connectedServices = GOOGLE_SERVICES.filter((service) => hasGoogleServiceScopes(grantedScopes, service));
  const oauthConnected = google?.connection === "connected";
  const reconnectRequired = google?.connection === "reconnect_required";
  const canConnect = google?.status === "ready";

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

  const connectService = async (service: GoogleServiceId) => {
    setBusyService(service);
    setError(null);
    try {
      const result = await connect({ data: { provider: "google", service } });
      window.location.assign(result.url);
    } catch (e) {
      setError(humanError(e));
      setBusyService(null);
    }
  };

  const disconnectGoogle = async () => {
    setBusyService("all");
    setError(null);
    try {
      await disconnect({ data: { provider: "google" } });
      await refresh();
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusyService(null);
    }
  };

  return (
    <div className="space-y-4">
      <AdminCard
        title="Google"
        description="Un seul compte Google, mais des autorisations séparées. Active uniquement les services dont Angel OS a besoin."
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {google?.accountLabel || "Compte Google"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {oauthConnected
                ? `${connectedServices.length} service${connectedServices.length > 1 ? "s" : ""} autorisé${connectedServices.length > 1 ? "s" : ""}`
                : reconnectRequired
                  ? "Une nouvelle autorisation Google est nécessaire."
                  : "Aucun service Google autorisé pour le moment."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={Boolean(busyService)}
              onClick={() => void refresh()}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm text-foreground disabled:opacity-40"
            >
              <RefreshCw className="h-4 w-4" /> Actualiser
            </button>
            {(oauthConnected || reconnectRequired) ? (
              <button
                type="button"
                disabled={Boolean(busyService)}
                onClick={() => void disconnectGoogle()}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm text-foreground disabled:opacity-40"
              >
                {busyService === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
                Tout déconnecter
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {GOOGLE_SERVICES.map((service) => {
            const connected = hasGoogleServiceScopes(grantedScopes, service);
            const busy = busyService === service.id;
            return (
              <section key={service.id} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{service.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${connected ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                        {connected ? "Connecté" : "Non connecté"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">{service.api}</p>
                  </div>
                  {connected ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <PlugZap className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {service.features.map((feature) => (
                    <span key={feature} className="rounded-lg border border-border bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground">
                      {feature}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={!canConnect || Boolean(busyService)}
                  onClick={() => void connectService(service.id)}
                  className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-foreground px-3.5 text-sm font-semibold text-background disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
                  {connected ? "Réautoriser" : `Connecter ${service.name}`}
                </button>
              </section>
            );
          })}
        </div>

        {error ? (
          <div className="mt-4 flex gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs text-red-700 dark:text-red-100">
            <CircleAlert className="h-4 w-4 shrink-0" /> {error}
          </div>
        ) : null}

        <div className="mt-4 rounded-xl border border-border bg-muted/30 px-3 py-3 text-xs leading-5 text-muted-foreground">
          <p className="font-medium text-foreground">Callback OAuth Google</p>
          <code className="mt-1 block break-all font-mono text-[11px]">{GOOGLE_CALLBACK}</code>
          <p className="mt-1">Les autorisations sont ajoutées progressivement au même compte Google sans effacer les services déjà accordés.</p>
        </div>
      </AdminCard>

      <AdminCard
        title="Accès de l’IA"
        description="Angel OS IA n’utilise que les services Google effectivement autorisés sur ton compte administrateur."
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-xs leading-5 text-muted-foreground">
            Les jetons OAuth restent côté serveur. Gmail, Agenda, Drive, Contacts et les services YouTube peuvent évoluer séparément sans donner automatiquement accès au reste de ton compte Google.
          </p>
        </div>
      </AdminCard>

      <div className="flex items-center gap-2 px-1 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">
        <Database className="h-3.5 w-3.5 text-red-500" /> Google OAuth modulaire → Angel OS → modules privés / IA
      </div>
    </div>
  );
}
