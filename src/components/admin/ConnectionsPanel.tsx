import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "./AdminShell";
import { Button } from "@/components/ui/button";
import {
  disconnectOAuthConnection,
  integrationReadiness,
  startOAuthConnection,
  type IntegrationReadiness,
} from "@/lib/system.functions";

function StatusPill({ label, tone }: { label: string; tone: "ok" | "warn" | "idle" }) {
  const classes =
    tone === "ok"
      ? "bg-primary/10 text-primary"
      : tone === "warn"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${classes}`}
    >
      {label}
    </span>
  );
}

function statusOf(service: IntegrationReadiness) {
  if (service.status !== "ready") return { label: "Activation serveur", tone: "idle" as const };
  if (!service.provider) return { label: "Prêt", tone: "ok" as const };
  if (service.connection === "connected") return { label: "Connecté", tone: "ok" as const };
  if (service.connection === "reconnect_required")
    return { label: "Reconnexion requise", tone: "warn" as const };
  return { label: "Non connecté", tone: "idle" as const };
}

function ServiceCard({
  service,
  onConnect,
  onDisconnect,
  busy,
}: {
  service: IntegrationReadiness;
  onConnect: (provider: string) => void;
  onDisconnect: (provider: string) => void;
  busy: boolean;
}) {
  const state = statusOf(service);
  const configured = service.status === "ready";
  const connected = service.connection === "connected" || service.connection === "reconnect_required";

  return (
    <li className="flex flex-col rounded-xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-foreground">{service.name}</p>
        <StatusPill label={state.label} tone={state.tone} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>

      {service.accountLabel && (
        <p className="mt-2 text-xs text-foreground">Compte : {service.accountLabel}</p>
      )}
      {service.lastSyncAt && (
        <p className="text-xs text-muted-foreground">
          Dernière synchro : {new Date(service.lastSyncAt).toLocaleString("fr-FR")}
        </p>
      )}
      {service.note && <p className="mt-2 text-xs text-muted-foreground">{service.note}</p>}
      {!configured && service.missing.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Activation à finaliser côté serveur : {service.missing.join(", ")}.
        </p>
      )}

      {service.provider && (
        <div className="mt-3 flex flex-wrap gap-2">
          {configured ? (
            <>
              <Button
                size="sm"
                className="min-h-11"
                disabled={busy}
                onClick={() => onConnect(service.provider!)}
              >
                {connected ? "Reconnecter" : "Se connecter"}
              </Button>
              {connected && (
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-11"
                  disabled={busy}
                  onClick={() => onDisconnect(service.provider!)}
                >
                  Déconnecter
                </Button>
              )}
            </>
          ) : (
            <Button size="sm" variant="outline" className="min-h-11" disabled>
              Activation serveur requise
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

export function ConnectionsPanel() {
  const fetchReadiness = useServerFn(integrationReadiness);
  const startConnection = useServerFn(startOAuthConnection);
  const disconnect = useServerFn(disconnectOAuthConnection);
  const queryClient = useQueryClient();
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["integration-readiness"],
    queryFn: () => fetchReadiness(),
  });

  const connectMutation = useMutation({
    mutationFn: (provider: string) => startConnection({ data: { provider } }),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setPendingProvider(null),
  });

  const disconnectMutation = useMutation({
    mutationFn: (provider: string) => disconnect({ data: { provider } }),
    onSuccess: () => {
      toast.success("Compte déconnecté d'Angel OS.");
      void queryClient.invalidateQueries({ queryKey: ["integration-readiness"] });
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setPendingProvider(null),
  });

  const groups = (data ?? []).reduce<Record<string, IntegrationReadiness[]>>((acc, service) => {
    (acc[service.category] ??= []).push(service);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <AdminCard className="border-primary/30 bg-primary/5">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium text-foreground">Zéro gestion manuelle de jetons</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Chaque service se connecte depuis Angel OS. Les jetons sont chiffrés et stockés côté
              serveur, renouvelés automatiquement lorsque le fournisseur le permet, et ne sont
              jamais visibles dans le navigateur.
            </p>
          </div>
        </div>
      </AdminCard>

      {isPending && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Vérification des services…
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive">
          État des connexions indisponible : {(error as Error).message}
        </p>
      )}

      {Object.entries(groups).map(([category, services]) => (
        <AdminCard key={category} title={category}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {services.map((s) => (
              <ServiceCard
                key={s.key}
                service={s}
                busy={pendingProvider === s.provider}
                onConnect={(provider) => {
                  setPendingProvider(provider);
                  connectMutation.mutate(provider);
                }}
                onDisconnect={(provider) => {
                  setPendingProvider(provider);
                  disconnectMutation.mutate(provider);
                }}
              />
            ))}
          </ul>
        </AdminCard>
      ))}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Une première autorisation, une double authentification, une révocation ou de nouveaux
        périmètres d'accès peuvent être imposés par le fournisseur. Ces étapes se gèrent depuis
        Angel OS, jamais via Lovable. « Déconnecter » supprime les jetons stockés localement ;
        pensez à révoquer aussi l'accès chez le fournisseur si nécessaire.
      </p>
    </div>
  );
}
