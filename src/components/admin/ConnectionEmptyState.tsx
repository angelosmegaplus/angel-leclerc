import { PlugZap } from "lucide-react";
import { goToAdminTab } from "@/lib/admin-navigation";

type Props = {
  title: string;
  description: string;
  cta?: string;
};

/**
 * État vide honnête : aucune donnée simulée, juste un renvoi vers Connexions.
 */
export function ConnectionEmptyState({ title, description, cta = "Ouvrir les connexions" }: Props) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center sm:p-6">
      <PlugZap className="mx-auto h-5 w-5 text-muted-foreground" />
      <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      <button
        type="button"
        onClick={() => goToAdminTab("connexions")}
        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-3.5 text-sm font-semibold text-foreground transition hover:bg-muted"
      >
        <PlugZap className="h-4 w-4" /> {cta}
      </button>
    </div>
  );
}
