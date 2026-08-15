import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, ChevronDown, RefreshCw } from "lucide-react";
import { listRows, str, type Row } from "@/lib/angelos";
import { Button } from "@/components/ui/button";
import { AdminCard } from "./AdminShell";

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
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: rows = [], isFetching } = useQuery({
    queryKey: ["angel", "applications"],
    queryFn: () => listRows("applications"),
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

  return (
    <div className="space-y-4">
      <AdminCard>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="font-display font-bold text-foreground">Candidatures</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => void queryClient.invalidateQueries({ queryKey: ["angel", "applications"] })}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

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
                      <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                        {status.marker}
                        <span>{status.label}</span>
                      </div>
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
