import { useQuery } from "@tanstack/react-query";
import { Archive, Briefcase, MapPin } from "lucide-react";
import { listRows, str, type Row } from "@/lib/angelos";
import { StudiesWorkPanel } from "./StudiesWorkPanel";

function shortDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10) || "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function applicationLabel(row: Row) {
  return str(row, "company") || str(row, "position") || "Candidature historique";
}

/**
 * Module natif Études & Travail.
 * Les anciennes candidatures sont conservées uniquement comme archive repliée :
 * elles ne définissent plus la navigation, le planning, l'agenda ou les alertes.
 */
export function StudiesWorkWorkspace() {
  const { data: applications = [] } = useQuery({
    queryKey: ["angel", "applications", "archive"],
    queryFn: () => listRows("applications"),
  });

  const archived = applications
    .filter((row) => Boolean(str(row, "sent_at") || str(row, "company") || str(row, "position")))
    .slice(0, 12);

  return (
    <div className="space-y-4">
      <StudiesWorkPanel />

      <details id="angel-section-archives" data-angel-section="archives" className="group rounded-[1.35rem] border border-border bg-card shadow-sm sm:rounded-[1.75rem]">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-4 text-sm font-semibold text-muted-foreground sm:px-6">
          <Archive className="h-4 w-4" /> Archives des anciennes candidatures
          <span className="ml-auto text-xs font-normal">{archived.length}</span>
        </summary>
        <div className="border-t border-border p-3 sm:p-6">
          {archived.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Archive className="h-4 w-4" /> Aucun historique à afficher.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {archived.map((row, index) => (
                <div key={str(row, "id") || `${applicationLabel(row)}-${index}`} className="rounded-xl border border-border/70 bg-background p-3">
                  <div className="flex items-start gap-2">
                    <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{applicationLabel(row)}</p>
                      {str(row, "position") && str(row, "company") ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{str(row, "position")}</p> : null}
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        {str(row, "city") ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {str(row, "city")}</span> : null}
                        <span>{shortDate(str(row, "sent_at"))}</span>
                        {str(row, "status") ? <span>{str(row, "status")}</span> : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
