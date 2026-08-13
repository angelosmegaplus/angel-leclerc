import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { confirmSubscription } from "@/lib/subscribers.functions";

export const Route = createFileRoute("/confirmation-abonnement")({
  head: () => ({
    meta: [
      { title: "Confirmation d'inscription | Angel Leclerc Communication" },
      {
        name: "description",
        content:
          "Confirmez votre inscription à la lettre hebdomadaire d'Angel Leclerc Communication.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Confirmation d'inscription" },
      {
        property: "og:description",
        content: "Confirmez votre inscription à la lettre hebdomadaire.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmPage,
});

function ConfirmPage() {
  const confirm = useServerFn(confirmSubscription);
  const [state, setState] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    if (!token) {
      setState("error");
      return;
    }
    confirm({ data: { token } })
      .then(() => setState("done"))
      .catch(() => setState("error"));
  }, [confirm]);

  return (
    <section className="bg-background py-20">
      <div className="container-tight max-w-lg text-center">
        {state === "loading" && (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Confirmation en cours…
          </p>
        )}
        {state === "done" && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
              Votre inscription est confirmée
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Vous recevrez chaque dimanche soir un résumé des articles publiés dans la semaine.
              Aucun envoi s'il n'y a pas de nouvel article.
            </p>
            <Link
              to="/articles"
              className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Découvrir les derniers articles
            </Link>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
              Lien invalide ou expiré
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Réinscrivez-vous depuis la page Blog pour recevoir un nouveau lien.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
