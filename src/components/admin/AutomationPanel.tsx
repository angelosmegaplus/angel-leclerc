import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminCard } from "./AdminShell";
import { AdminStatus, type AdminStatusTone } from "./AdminStatus";
import { integrationReadiness } from "@/lib/system.functions";
import { pushStatus } from "@/lib/notifications.functions";

type Level = "auto" | "approval" | "scheduled" | "manual" | "pending";

const LABELS: Record<Level, { text: string; tone: AdminStatusTone }> = {
  auto: { text: "Automatique", tone: "success" },
  approval: { text: "Après validation", tone: "info" },
  scheduled: { text: "Planifié", tone: "info" },
  manual: { text: "Manuel", tone: "pending" },
  pending: { text: "En attente", tone: "pending" },
};

function Row({ name, level, detail }: { name: string; level: Level; detail: string }) {
  const status = LABELS[level];
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[.025] p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="mt-1 text-xs leading-5 text-white/50 sm:text-sm">{detail}</p>
      </div>
      <AdminStatus tone={status.tone} compact>{status.text}</AdminStatus>
    </li>
  );
}

export function AutomationPanel() {
  const readiness = useServerFn(integrationReadiness);
  const status = useServerFn(pushStatus);
  const { data: services } = useQuery({
    queryKey: ["integration-readiness"],
    queryFn: () => readiness(),
  });
  const { data: push } = useQuery({ queryKey: ["push-status"], queryFn: () => status() });

  const connected = (key: string) =>
    (services ?? []).some((service) => service.key === key && service.connection === "connected");
  const anyConnected = (services ?? []).some((service) => service.connection === "connected");

  const rows: { name: string; level: Level; detail: string }[] = [
    {
      name: "Contrôles GitHub",
      level: "auto",
      detail: "La CI bloque une version qui échoue au lint, au build, à TypeScript ou aux contrôles de sortie de production.",
    },
    {
      name: "Publication Vercel",
      level: "auto",
      detail: "Le déploiement de main est suivi jusqu’à l’état READY, puis Angel OS vérifie la version réellement servie et son endpoint de santé.",
    },
    {
      name: "File Angel OS IA",
      level: "approval",
      detail: "Les opérations sûres peuvent s’exécuter et être journalisées ; une action sensible ou irréversible reste soumise à validation.",
    },
    {
      name: "Rafraîchissement OAuth",
      level: anyConnected ? "auto" : "pending",
      detail: anyConnected
        ? "Les connexions réellement présentes sont renouvelées côté serveur lorsque leur fournisseur le permet."
        : "Aucune connexion OAuth active n’est actuellement détectée par Angel OS.",
    },
    {
      name: "Notifications internes",
      level: "auto",
      detail: "Les alertes sont générées à partir des données réelles du centre de contrôle : tâches, candidatures, messages, agenda et publications.",
    },
    {
      name: "Notifications push",
      level: push?.serverReady ? "auto" : "pending",
      detail: push?.serverReady
        ? "Le serveur peut envoyer les alertes à un appareil abonné même lorsque l’application est fermée."
        : "Le centre de notifications interne fonctionne ; le push serveur attend encore une configuration VAPID complète.",
    },
    {
      name: "Synchronisation Gmail / Drive / Agenda",
      level: connected("google") ? "auto" : "pending",
      detail: connected("google")
        ? "Compte Google détecté : les modules peuvent exploiter les données synchronisées et renouveler l’accès côté serveur."
        : "Aucune connexion Google active n’est actuellement confirmée dans ce module.",
    },
    {
      name: "Supervision IA",
      level: "auto",
      detail: "Les requêtes critiques, erreurs et états Angel OS IA sont surveillés ; l’administration affiche un diagnostic au lieu d’un faux fallback local.",
    },
    {
      name: "Maintenance Angel OS",
      level: "scheduled",
      detail: "Les contrôles de santé et de production sont exécutés régulièrement par GitHub Actions.",
    },
    {
      name: "Synchronisation boutique",
      level: "manual",
      detail: "Les synchronisations commerciales restent déclenchées depuis le module Boutique lorsque l’action doit rester explicitement contrôlée.",
    },
  ];

  return (
    <AdminCard title="Automatisation" description="Un état simple et vérifiable : automatique, en attente, manuel ou soumis à validation.">
      <ul className="grid gap-2">
        {rows.map((row) => <Row key={row.name} {...row} />)}
      </ul>
    </AdminCard>
  );
}
