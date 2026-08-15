import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Briefcase, CheckCircle2, ChevronDown, RefreshCw } from "lucide-react";
import { listRows, str, type Row } from "@/lib/angelos";
import { syncGoogleApplications } from "@/lib/applications.functions";
import { Button } from "@/components/ui/button";
import { AdminCard } from "./AdminShell";
import { AdminStatus, type AdminStatusTone } from "./AdminStatus";

function getApplicationStatus(status: string): { label: string; tone: AdminStatusTone } {
  if (status === "refusee") return { label: "Refusé", tone: "error" };
  if (status === "acceptee") return { label: "Accepté", tone: "success" };
  if (status === "entretien" || status === "peut_etre") return { label: "Peut-être", tone: "pending" };
  return { label: "En attente", tone: "pending" };
}

function sentMailOf(row: Row) {
  return (
    str(row, "sent_message") ||
    str(row, "email_body") ||
    str(row, "mail_body") ||
    str(row, "message_sent") ||
    ""
  );
}

export function ApplicationsPanel() {
  const queryClient = useQueryClient();
  const syncApplications = useServerFn(syncGoogleApplications);
  const [openId, setOpenId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const { data: rows = [], isFetching } = useQuery({
    queryKey: ["angel", "applications"],
    queryFn: () => listRows("applications"),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  const applications = useMemo(() => {
    return [...rows]
      .filter((row) => str(row, "status") !== "a_envoyer")
      .sort((a, b) => {
        const aDate = str(a, "sent_at") || str(a, "created_at") || str(a, "updated_at");
        const bDate = str(b, "sent_at") || str(b, "created_at") || str(b, "updated_at");
        return bDate.localeCompare(aDate);
      });
  }, [rows]);

  const refresh = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    setSyncError(null);

    try {
      const result = await syncApplications();
      await queryClient.invalidateQueries({ queryKey: ["angel", "applications"] });
      await queryClient.refetchQueries({ queryKey: ["angel", "applications"], type: "active" });

      if (result.status === "not_connected") {
        setSyncError(result.message || "La source Gmail n’est pas connectée au serveur.");
      } else {
        const details = [
          result.imported ? `${result.imported} ajoutée${result.imported > 1 ? "s" : ""}` : null,
          result.updated ? `${result.updated} mise${result.updated > 1 ? "s" : ""} à jour` : null,
          result.skipped ? `${result.skipped} inchangée${result.skipped > 1 ? "s" : ""}` : null,
        ].filter(Boolean).join(" · ");
        setSyncMessage(details || result.message || "Candidatures synchronisées.");
      }
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "La synchronisation des candidatures a échoué.");
      await queryClient.invalidateQueries({ queryKey: ["angel", "applications"] });
    } finally {
      setSyncing(false);
    }
  };

  const busy = syncing || isFetching;

  return (
    <div className="space-y-4">
      <AdminCard>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="font-display font-bold text-foreground">Candidatures</h2>
          </div>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void refresh()}>
            <RefreshCw className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`} />
            {syncing ? "Synchronisation…" : "Actualiser"}
          </Button>
        </div>

        {syncMessage ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        ) : null}
        {syncError ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{syncError}</span>
          </div>
        ) : null}

        <div className="mt-4 divide-y divide-border">
          {applications.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Aucune candidature envoyée pour le moment.</p>
          ) : (
            applications.map((row, index) => {
              const id = str(row, "id") || `application-${index}`;
              const status = getApplicationStatus(str(row, "status"));
              const company = str(row, "company") || "Candidature";
              const position = str(row, "position");
              const city = str(row, "city");
              const mail = sentMailOf(row);
              const response = str(row, "response");
              const isOpen = openId === id;

              return (
                <div key={id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 py-3 text-left"
                    aria-expanded={isOpen}
                    onClick={() => setOpenId(isOpen ? null : id)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{company}</p>
                      {(position || city) && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {[position, city].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <AdminStatus tone={status.tone} compact>{status.label}</AdminStatus>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="pb-4 pl-0 sm:pl-2">
                      <div className="grid gap-3 rounded-xl border border-border bg-background/60 p-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Mail envoyé</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                            {mail || "Le contenu du mail n’est pas enregistré dans cette candidature."}
                          </p>
                        </div>
                        <div className="border-t border-border pt-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Réponse</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                            {response || "Aucune réponse reçue pour le moment."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </AdminCard>
    </div>
  );
}
