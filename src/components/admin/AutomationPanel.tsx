import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminCard } from "./AdminShell";
import { integrationReadiness } from "@/lib/system.functions";
import { pushStatus } from "@/lib/notifications.functions";

type Level = "auto" | "approval" | "scheduled" | "manual" | "pending";

const LABELS: Record<Level, { text: string; className: string }> = {
  auto: { text: "Automatique", className: "bg-primary/10 text-primary" },
  approval: { text: "Après validation", className: "bg-sky-500/10 text-sky-700" },
  scheduled: { text: "Planifié", className: "bg-emerald-500/10 text-emerald-700" },
  manual: { text: "Manuel", className: "bg-amber-500/10 text-amber-700" },
  pending: { text: "En attente de connexion", className: "bg-muted text-muted-foreground" },
};

function Row({ name, level, detail }: { name: string; level: Level; detail: string }) {
  const l = LABELS[level];
  return (
    <li className="flex flex-col gap-1 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="font-medium text-foreground">{name}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
      <span
        className={`w-fit shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${l.className}`}
      >
        {l.text}
      </span>
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
    (services ?? []).some((s) => s.key === key && s.connection === "connected");
  const anyConnected = (services ?? []).some((s) => s.connection === "connected");

  const rows: { name: string; level: Level; detail: string }[] = [
    {
      name: "Build & vérifications GitHub",
      level: "auto",
      detail:
        "GitHub Actions installe les dépendances puis contrôle TypeScript et le build sur chaque PR et chaque push vers main.",
    },
    {
      name: "Publication Lovable",
      level: "approval",
      detail:
        "Après CI et fusion autorisée, l'opérateur publie via le mécanisme officiel Lovable puis vérifie le site réel.",
    },
    {
      name: "File Angel AI (ai_actions)",
      level: "approval",
      detail:
        "Les commandes locales sûres s'exécutent et sont journalisées ; les actions externes ou irréversibles attendent une validation finale.",
    },
    {
      name: "Rafraîchissement des jetons OAuth",
      level: anyConnected ? "auto" : "pending",
      detail:
        "Le serveur renouvelle automatiquement les jetons expirés des comptes réellement connectés, sans intervention.",
    },
    {
      name: "Notifications internes Angel OS",
      level: "auto",
      detail:
        "Générées à partir de vos données réelles (tâches, candidatures, messages, connexions, agenda, publications) à chaque ouverture de l'admin.",
    },
    {
      name: "Notifications push système",
      level: push?.serverReady ? "auto" : "pending",
      detail: push?.serverReady
        ? "Le serveur peut envoyer des notifications même application fermée."
        : "Clés VAPID serveur absentes : les notifications locales fonctionnent, l'envoi serveur reste à activer.",
    },
    {
      name: "Synchronisation Gmail / Drive / Agenda",
      level: connected("google") ? "auto" : "pending",
      detail: connected("google")
        ? "Compte Google connecté : les candidatures sont vérifiées automatiquement à l'ouverture du module et les jetons sont renouvelés côté serveur."
        : "Nécessite la connexion du compte Google depuis Connexions.",
    },
    {
      name: "Supervision et journal IA",
      level: "auto",
      detail:
        "Chaque commande, exécution, erreur et synchronisation importante est enregistrée dans Angel OS.",
    },
    {
      name: "Newsletter hebdomadaire",
      level: "scheduled",
      detail: "Tâche planifiée côté base de données, protégée par un secret d'appel.",
    },
    {
      name: "Synchronisation boutique Printful",
      level: "manual",
      detail:
        "Import déclenché depuis l'onglet Boutique ; le webhook met ensuite les commandes à jour automatiquement.",
    },
  ];

  return (
    <AdminCard title="Automatisation réelle">
      <p className="mb-3 text-sm text-muted-foreground">
        État honnête de chaque mécanisme : rien n'est marqué « automatique » sans dispositif concret
        derrière.
      </p>
      <ul className="grid gap-2">
        {rows.map((r) => (
          <Row key={r.name} {...r} />
        ))}
      </ul>
    </AdminCard>
  );
}
