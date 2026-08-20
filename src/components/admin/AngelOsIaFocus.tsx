import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2 } from "lucide-react";
import { getAngelOsIaFocus } from "@/lib/angel-os-ia/prioritization.functions";
import { AdminCard } from "./AdminShell";

const labels: Record<string, string> = {
  "studies-work": "Études & Travail",
  applications: "Archives candidatures",
  mail: "Mails",
  agenda: "Agenda",
  news: "Actualités",
  media: "Films & séries",
  preferences: "Personnel",
};

export function AngelOsIaFocus() {
  const loadFocus = useServerFn(getAngelOsIaFocus);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["angel-os-ia-focus"],
    queryFn: () => loadFocus(),
    staleTime: 60_000,
    retry: 1,
  });

  return (
    <AdminCard
      title="Priorités · Angel OS IA"
      description="Priorité actuelle : BTS Communication au CNED, travail, revenu, mobilité et organisation."
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Analyse des priorités…
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">
          Priorisation temporairement indisponible. Angel OS continue de fonctionner normalement.
        </p>
      ) : !data?.focus?.length ? (
        <p className="text-sm text-muted-foreground">Aucune priorité forte détectée pour le moment.</p>
      ) : (
        <ol className="space-y-2">
          {data.focus.map((item, index) => (
            <li key={item.id} className="rounded-lg border border-border/70 bg-background px-3 py-2.5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-foreground text-xs font-bold text-background">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[.08em] text-muted-foreground">
                      {labels[item.domain] ?? item.domain}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.reason}</p>
                </div>
                <Sparkles className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </li>
          ))}
        </ol>
      )}
    </AdminCard>
  );
}
