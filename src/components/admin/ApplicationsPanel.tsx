import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  RefreshCw,
  Radio,
  MapPin,
  Clock3,
  Zap,
  GraduationCap,
} from "lucide-react";
import { applicationFields, listRows, str } from "@/lib/angelos";
import { Button } from "@/components/ui/button";
import { AdminCard } from "./AdminShell";
import { CrudModule } from "./CrudModule";
import { AdminAutomationSummary } from "./AdminAutomationSummary";

const SEARCH_ZONES = [
  "Bordeaux centre / secteurs bien desservis",
  "Périgueux",
  "Bergerac",
  "Brive-la-Gaillarde",
  "Sarlat-la-Canéda et alentours accessibles",
];

const SEARCH_PRIORITIES = [
  "Radio & animation",
  "Médias & journalisme local",
  "Communication éditoriale",
  "Création de contenus & réseaux sociaux",
  "Communication digitale & événementiel culturel",
];

function daysUntil(date: string) {
  const now = new Date();
  const end = new Date(`${date}T23:59:59`);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
}

function getApplicationStatus(status: string) {
  if (status === "refusee") {
    return {
      label: "Refusé",
      marker: <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden />,
    };
  }
  if (status === "acceptee") {
    return {
      label: "Accepté",
      marker: <span className="h-2.5 w-2.5 rounded-full bg-green-500" aria-hidden />,
    };
  }
  if (status === "entretien" || status === "peut_etre") {
    return {
      label: "Peut-être",
      marker: <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" aria-hidden />,
    };
  }
  return {
    label: "En attente",
    marker: (
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        <span className="h-3 w-0.5 rounded-full bg-yellow-400" />
        <span className="h-3 w-0.5 rounded-full bg-yellow-400" />
      </span>
    ),
  };
}

export function ApplicationsPanel() {
  const queryClient = useQueryClient();
  const { data: rows = [], isFetching } = useQuery({
    queryKey: ["angel", "applications"],
    queryFn: () => listRows("applications"),
  });

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: rows.length,
      waiting: rows.filter((row) => ["envoyee", "relance"].includes(str(row, "status"))).length,
      replies: rows.filter((row) => Boolean(str(row, "response"))).length,
      due: rows.filter((row) => {
        const followUp = str(row, "follow_up_at");
        return (
          followUp && followUp <= today && !["refusee", "acceptee"].includes(str(row, "status"))
        );
      }).length,
    };
  }, [rows]);

  const recentApplications = useMemo(() => {
    return [...rows]
      .filter((row) => str(row, "status") !== "a_envoyer")
      .sort((a, b) => {
        const aDate = str(a, "sent_at") || str(a, "created_at") || str(a, "updated_at");
        const bDate = str(b, "sent_at") || str(b, "created_at") || str(b, "updated_at");
        return bDate.localeCompare(aDate);
      })
      .slice(0, 10);
  }, [rows]);

  const urgentSearch = useMemo(() => {
    const mediaRows = rows.filter((row) => {
      const haystack = [
        str(row, "company"),
        str(row, "position"),
        str(row, "city"),
        str(row, "notes"),
      ]
        .join(" ")
        .toLowerCase();
      return /radio|média|media|journal|communication|contenu|social|réseaux|reseaux/.test(haystack);
    });

    return {
      mediaCount: mediaRows.length,
      activeMediaCount: mediaRows.filter(
        (row) => !["refusee", "acceptee"].includes(str(row, "status")),
      ).length,
      deadlineDays: daysUntil("2026-09-15"),
    };
  }, [rows]);

  return (
    <div className="space-y-4">
      <AdminAutomationSummary mode="applications" />

      <AdminCard className="overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-primary/5">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  <Zap className="h-3.5 w-3.5" />
                  Recherche urgente
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-2.5 py-1 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  Jusqu’à 8 candidatures / passage · 4 passages/jour
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Radio className="h-6 w-6 text-primary" />
                <h2 className="font-display text-xl font-bold text-foreground">Alternance communication — rentrée 2026</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Recherche accélérée sur tous les secteurs compatibles BTS Communication, avec priorité
                aux radios, médias, journalisme local et création de contenus. Bordeaux, Périgueux,
                Bergerac, Brive et Sarlat restent les zones principales. Les doublons sont vérifiés
                dans Gmail et l’historique avant tout nouvel envoi.
              </p>
            </div>

            <div className="grid min-w-56 grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-background/70 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Pistes médias enregistrées</p>
                <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
                  {urgentSearch.mediaCount}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Encore actives</p>
                <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
                  {urgentSearch.activeMediaCount}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-primary" /> Zones ciblées
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {SEARCH_ZONES.map((zone) => (
                  <span key={zone} className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
                    {zone}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Radio className="h-4 w-4 text-primary" /> Priorités métiers
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {SEARCH_PRIORITIES.map((priority) => (
                  <span key={priority} className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
                    {priority}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <GraduationCap className="h-4 w-4 text-primary" /> Stratégie rentrée
              </div>
              <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                <p>
                  <strong className="text-foreground">Bordeaux :</strong> privilégier centre et secteurs bien desservis, avec possibilité de transfert de dossier Talis si nécessaire.
                </p>
                <p>
                  <strong className="text-foreground">Candidatures :</strong> jusqu’à huit envois automatiques par passage, uniquement vers des contacts professionnels vérifiés et sans doublon.
                </p>
                <p>
                  <strong className="text-foreground">Horizon veille :</strong> jusqu’au 15 septembre 2026 · {urgentSearch.deadlineDays} jour{urgentSearch.deadlineDays > 1 ? "s" : ""} restant{urgentSearch.deadlineDays > 1 ? "s" : ""}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminCard>

      <AdminCard className="border-primary/25 bg-primary/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <p className="font-display font-bold text-foreground">Suivi des candidatures</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Angel OS centralise les candidatures, les réponses et les relances. La veille urgente
              recherche en parallèle de nouvelles opportunités compatibles avec la rentrée 2026.
            </p>
          </div>
          <Button
            variant="outline"
            className="min-h-11 shrink-0"
            disabled={isFetching}
            onClick={() => void queryClient.invalidateQueries({ queryKey: ["angel", "applications"] })}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Actualiser la liste
          </Button>
        </div>
      </AdminCard>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Total", stats.total],
          ["En attente", stats.waiting],
          ["Réponses", stats.replies],
          ["Relances dues", stats.due],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card px-3 py-2.5">
            <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
            <dd className="font-display text-xl font-bold tabular-nums text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      <AdminCard>
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-foreground">Candidatures récemment envoyées</h3>
        </div>
        <div className="mt-3 divide-y divide-border">
          {recentApplications.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">Aucune candidature envoyée pour le moment.</p>
          ) : (
            recentApplications.map((row, index) => {
              const status = getApplicationStatus(str(row, "status"));
              const company = str(row, "company") || "Candidature";
              const position = str(row, "position");
              const city = str(row, "city");
              return (
                <div key={str(row, "id") || `${company}-${index}`} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{company}</p>
                    {(position || city) && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[position, city].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-foreground">
                    {status.marker}
                    <span>{status.label}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </AdminCard>

      <CrudModule
        table="applications"
        entityLabel="Candidature"
        title="Candidatures BTS Communication"
        description="Entreprises contactées, relances, réponses et documents."
        fields={applicationFields}
        titleField="company"
        subtitleFields={["position", "city"]}
        statusField="status"
        duplicateKeys={["company", "email"]}
        filters={[
          { label: "À envoyer", test: (row) => str(row, "status") === "a_envoyer" },
          {
            label: "En attente",
            test: (row) => ["envoyee", "relance"].includes(str(row, "status")),
          },
          { label: "Entretien", test: (row) => str(row, "status") === "entretien" },
          { label: "Refusées", test: (row) => str(row, "status") === "refusee" },
        ]}
      />
    </div>
  );
}
