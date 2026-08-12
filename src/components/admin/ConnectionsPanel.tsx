import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck } from "lucide-react";
import { AdminCard } from "./AdminShell";
import { Button } from "@/components/ui/button";
import { integrationReadiness, type IntegrationReadiness } from "@/lib/system.functions";

function StatusPill({ ready }: { ready: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
        ready ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      }`}
    >
      {ready ? "Prêt" : "Activation serveur"}
    </span>
  );
}

function ServiceCard({ service }: { service: IntegrationReadiness }) {
  const ready = service.status === "ready";
  return (
    <li className="flex flex-col rounded-xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-foreground">{service.name}</p>
        <StatusPill ready={ready} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
      {!ready && (
        <p className="mt-2 text-xs text-muted-foreground">
          Activation à finaliser côté serveur : {service.missing.join(", ")}.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {ready && service.connectPath ? (
          <>
            <Button asChild size="sm" className="min-h-11">
              <a href={service.connectPath}>Se connecter</a>
            </Button>
            {service.reconnectPath && (
              <Button asChild size="sm" variant="outline" className="min-h-11">
                <a href={service.reconnectPath}>Reconnecter</a>
              </Button>
            )}
          </>
        ) : service.connectPath ? (
          <Button size="sm" variant="outline" className="min-h-11" disabled>
            Connexion bientôt disponible
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function ConnectionsPanel() {
  const fetchReadiness = useServerFn(integrationReadiness);
  const { data, isPending, error } = useQuery({
    queryKey: ["integration-readiness"],
    queryFn: () => fetchReadiness(),
  });

  const groups = (data ?? []).reduce<Record<string, IntegrationReadiness[]>>(
    (acc, service) => {
      (acc[service.category] ??= []).push(service);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-5">
      <AdminCard className="border-primary/30 bg-primary/5">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium text-foreground">Zéro gestion manuelle de jetons</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Chaque service se connecte depuis Angel OS. Les jetons sont stockés côté
              serveur, renouvelés automatiquement lorsque le fournisseur le permet, et
              ne sont jamais visibles dans le navigateur.
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
              <ServiceCard key={s.key} service={s} />
            ))}
          </ul>
        </AdminCard>
      ))}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Une première autorisation, une double authentification, une révocation ou de
        nouveaux périmètres d'accès peuvent être imposés par le fournisseur. Ces étapes
        se gèrent depuis Angel OS, jamais via Lovable.
      </p>
    </div>
  );
}
