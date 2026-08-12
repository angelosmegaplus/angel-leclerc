import { ExternalLink } from "lucide-react";
import { AdminCard } from "./AdminShell";

const SERVICES = [
  {
    name: "Google Workspace / Gmail",
    detail:
      "Boîte mail contact@angel-leclerc.fr, agenda et fichiers Drive dans Angel OS.",
    status: "Configuration serveur requise",
    help: "Un identifiant OAuth Google (client ID + secret) doit être ajouté côté serveur avant d'activer le bouton de connexion depuis le site publié.",
    url: "https://console.cloud.google.com/apis/credentials",
  },
  {
    name: "Microsoft 365 / Outlook",
    detail: "Alternative mail et agenda.",
    status: "Configuration serveur requise",
    help: "Une application Entra ID (Azure) avec redirection sur le domaine publié est nécessaire.",
    url: "https://entra.microsoft.com",
  },
  {
    name: "Stripe",
    detail: "Paiements de la boutique.",
    status: "Connecté",
    help: "Clés sandbox et live enregistrées côté serveur.",
  },
  {
    name: "Printful",
    detail: "Catalogue et expédition des produits.",
    status: "Connecté",
    help: "Jeton et boutique enregistrés ; synchronisation depuis l'onglet Boutique.",
  },
];

export function ConnectionsPanel() {
  return (
    <div className="space-y-5">
      <AdminCard
        title="Connexions"
        description="État réel des services externes. Aucune donnée simulée : un service non branché est affiché comme tel."
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {SERVICES.map((s) => {
            const connected = s.status === "Connecté";
            return (
              <li
                key={s.name}
                className="rounded-xl border border-border bg-background p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{s.name}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                      connected
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {connected ? "Connecté" : "Non connecté"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
                <p className="mt-2 text-xs text-muted-foreground">{s.help}</p>
                {!connected && s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-input px-3 text-xs font-medium text-foreground"
                  >
                    Préparer les identifiants <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </AdminCard>
    </div>
  );
}