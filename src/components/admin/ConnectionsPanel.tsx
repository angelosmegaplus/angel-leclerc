import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "./AdminShell";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import {
  disconnectOAuthConnection,
  integrationReadiness,
  startOAuthConnection,
  type IntegrationReadiness,
} from "@/lib/system.functions";

function StatusPill({ label, tone }: { label: string; tone: "ok" | "warn" | "idle" }) {
  const classes = tone === "ok" ? "bg-[#0078d7] text-white" : tone === "warn" ? "bg-destructive text-white" : "bg-[#222] text-white/55";
  return <span className={`shrink-0 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${classes}`}>{label}</span>;
}

function statusOf(service: IntegrationReadiness) {
  if (service.status !== "ready") return { label: "activation serveur", tone: "idle" as const };
  if (!service.provider) return { label: "géré", tone: "ok" as const };
  if (service.connection === "connected") return { label: "connecté", tone: "ok" as const };
  if (service.connection === "reconnect_required") return { label: "reconnexion", tone: "warn" as const };
  return { label: "non connecté", tone: "idle" as const };
}

function ServiceCard({ service, onConnect, onDisconnect, busy }: {
  service: IntegrationReadiness;
  onConnect: (provider: string) => void;
  onDisconnect: (provider: string) => void;
  busy: boolean;
}) {
  const state = statusOf(service);
  const configured = service.status === "ready";
  const connected = service.connection === "connected" || service.connection === "reconnect_required";

  return (
    <li className="flex flex-col border border-white/15 bg-black p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-light text-white">{service.name}</p>
        <StatusPill label={state.label} tone={state.tone} />
      </div>
      <p className="mt-2 text-sm font-light text-white/55">{service.description}</p>
      {service.provider ? <p className="mt-3 border-l-4 border-[#0078d7] py-1 pl-3 text-xs text-white/55">connexion OAuth officielle, gérée côté serveur</p> : null}
      {service.accountLabel ? <p className="mt-3 text-xs text-white">compte : {service.accountLabel}</p> : null}
      {service.lastSyncAt ? <p className="text-xs text-white/45">dernière synchro : {new Date(service.lastSyncAt).toLocaleString("fr-FR")}</p> : null}
      {service.note ? <p className="mt-2 text-xs text-white/45">{service.note}</p> : null}
      {!configured && service.missing.length > 0 ? <p className="mt-2 text-xs text-white/45">configuration serveur manquante : {service.missing.join(", ")}.</p> : null}

      {service.provider ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {configured ? (
            <>
              <Button size="sm" className="min-h-11 rounded-none bg-[#0078d7] px-4 text-white hover:bg-[#1684df]" disabled={busy} onClick={() => onConnect(service.provider!)}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {connected ? "reconnecter" : `se connecter à ${service.name}`}
              </Button>
              {connected ? <Button size="sm" variant="outline" className="min-h-11 rounded-none border-white/35 bg-black px-4 text-white hover:bg-white hover:text-black" disabled={busy} onClick={() => onDisconnect(service.provider!)}>déconnecter</Button> : null}
            </>
          ) : <Button size="sm" variant="outline" className="min-h-11 rounded-none" disabled>activation serveur requise</Button>}
        </div>
      ) : null}
    </li>
  );
}

export function ConnectionsPanel() {
  const fetchReadiness = useServerFn(integrationReadiness);
  const startConnection = useServerFn(startOAuthConnection);
  const disconnect = useServerFn(disconnectOAuthConnection);
  const queryClient = useQueryClient();
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({ queryKey: ["integration-readiness"], queryFn: () => fetchReadiness() });

  const connectMutation = useMutation({
    mutationFn: (provider: string) => startConnection({ data: { provider } }),
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setPendingProvider(null),
  });

  const disconnectMutation = useMutation({
    mutationFn: (provider: string) => disconnect({ data: { provider } }),
    onSuccess: () => { toast.success("Compte déconnecté d’Angel OS."); void queryClient.invalidateQueries({ queryKey: ["integration-readiness"] }); },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setPendingProvider(null),
  });

  const groups = (data ?? []).reduce<Record<string, IntegrationReadiness[]>>((acc, service) => {
    (acc[service.category] ??= []).push(service);
    return acc;
  }, {});

  const google = (data ?? []).find((service) => service.key === "google");
  const googleBusy = pendingProvider === "google";

  return (
    <div className="space-y-5">
      <AdminCard className="border-l-4 border-l-[#0078d7]">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1684df]" />
          <div>
            <p className="text-lg font-light text-white">connexion Google sécurisée</p>
            <p className="mt-1 text-sm font-light leading-relaxed text-white/55">Angel OS utilise OAuth Google côté serveur. Tu n’as aucun jeton à copier : Google crée les jetons après autorisation, puis Angel OS les chiffre côté serveur.</p>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Connexion rapide" description="Connecter Gmail, Drive et Agenda à Angel OS.">
        <button
          type="button"
          disabled={isPending || googleBusy || !google || google.status !== "ready"}
          onClick={() => { setPendingProvider("google"); connectMutation.mutate("google"); }}
          className="flex min-h-20 w-full items-center gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-left transition hover:border-blue-500/30 hover:bg-blue-500/[.05] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Logo domain="google.com" alt="Google" size={42} link={false} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-white">{google?.connection === "connected" ? "Google connecté" : "Se connecter à Google"}</span>
            <span className="mt-1 block text-xs leading-5 text-white/45">Gmail, Drive et Agenda.</span>
          </span>
          {googleBusy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-300" /> : null}
        </button>
        {google && google.status !== "ready" ? <p className="mt-2 text-xs text-white/45">Le serveur n’a pas encore reçu toutes les variables OAuth nécessaires.</p> : null}
      </AdminCard>

      {isPending ? <p className="flex items-center gap-2 text-sm text-white/55"><Loader2 className="h-4 w-4 animate-spin" /> vérification des services…</p> : null}
      {error ? <p className="text-sm text-destructive">état des connexions indisponible : {(error as Error).message}</p> : null}

      {Object.entries(groups).map(([category, services]) => (
        <AdminCard key={category} title={category}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {services.map((service) => <ServiceCard key={service.key} service={service} busy={pendingProvider === service.provider} onConnect={(provider) => { setPendingProvider(provider); connectMutation.mutate(provider); }} onDisconnect={(provider) => { setPendingProvider(provider); disconnectMutation.mutate(provider); }} />)}
          </ul>
        </AdminCard>
      ))}
    </div>
  );
}
