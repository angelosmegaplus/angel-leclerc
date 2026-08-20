import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Archive, Briefcase, MapPin } from "lucide-react";
import { listRows, str, type Row } from "@/lib/angelos";
import { StudiesWorkPanel } from "./StudiesWorkPanel";
import { AdminCard } from "./AdminShell";

function renameLegacyLabels() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const value = node.textContent?.trim();
    if (
      value === "Candidatures" ||
      value === "Nouvelle candidature" ||
      value === "Candidatures à surveiller"
    ) {
      nodes.push(node);
    }
  }
  for (const node of nodes) {
    const value = node.textContent?.trim();
    if (value === "Candidatures") node.textContent = "Études & Travail";
    if (value === "Nouvelle candidature") node.textContent = "Études & Travail";
    if (value === "Candidatures à surveiller") node.textContent = "Suivi Études & Travail";
  }
}

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

export function ApplicationsPanel() {
  const { data: applications = [] } = useQuery({
    queryKey: ["angel", "applications", "archive"],
    queryFn: () => listRows("applications"),
  });

  useEffect(() => {
    renameLegacyLabels();
    const timer = window.setTimeout(renameLegacyLabels, 100);
    return () => window.clearTimeout(timer);
  }, []);

  const archived = applications
    .filter((row) => Boolean(str(row, "sent_at") || str(row, "company") || str(row, "position")))
    .slice(0, 12);

  return (
    <div className="space-y-4">
      <StudiesWorkPanel />

      <AdminCard
        title="Archives — anciennes candidatures"
        description="Les anciennes recherches d'alternance restent consultables, mais elles ne pilotent plus l'espace administrateur."
      >
        {archived.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Archive className="h-4 w-4" /> Aucun historique à afficher.
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {archived.map((row, index) => (
              <div
                key={str(row, "id") || `${applicationLabel(row)}-${index}`}
                className="rounded-xl border border-border/70 bg-background p-3"
              >
                <div className="flex items-start gap-2">
                  <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{applicationLabel(row)}</p>
                    {str(row, "position") && str(row, "company") ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{str(row, "position")}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      {str(row, "city") ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {str(row, "city")}
                        </span>
                      ) : null}
                      <span>{shortDate(str(row, "sent_at"))}</span>
                      {str(row, "status") ? <span>{str(row, "status")}</span> : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
