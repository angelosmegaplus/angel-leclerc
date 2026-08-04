import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderTracker } from "@/components/OrderTracker";

export const Route = createFileRoute("/boutique/suivi")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  head: () => {
    const title = "Suivre ma commande — Boutique ALC!";
    const description =
      "Suivez en temps réel la préparation, l'expédition et la livraison de votre commande ALC! (t-shirts, tasses, objets et créations).";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: SuiviPage,
});

function SuiviPage() {
  const { session_id: sessionId } = Route.useSearch();
  const navigate = useNavigate();
  const [value, setValue] = useState(sessionId ?? "");

  return (
    <div className="container-tight py-14 sm:py-20">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        Boutique ALC!
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Suivre ma commande
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Renseignez la référence reçue par e-mail après votre paiement pour voir où en est
        votre commande.
      </p>

      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const clean = value.trim();
          if (clean) navigate({ to: "/boutique/suivi", search: { session_id: clean } });
        }}
      >
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="ref">Référence de commande</Label>
          <Input
            id="ref"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="cs_…"
            autoComplete="off"
          />
        </div>
        <Button type="submit">
          <PackageSearch className="mr-2 h-4 w-4" /> Suivre
        </Button>
      </form>

      {sessionId && (
        <div className="mt-8">
          <OrderTracker sessionId={sessionId} />
        </div>
      )}

      <Button asChild variant="outline" className="mt-8">
        <Link to="/boutique">Retour à la boutique</Link>
      </Button>
    </div>
  );
}
