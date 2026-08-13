import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2 } from "lucide-react";
import { unsubscribeFromBlog } from "@/lib/subscribers.functions";

export const Route = createFileRoute("/desabonnement")({
  head: () => ({
    meta: [
      { title: "Désabonnement | Angel Leclerc Communication" },
      {
        name: "description",
        content:
          "Se désabonner des notifications de nouveaux articles du blog d'Angel Leclerc Communication.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Désabonnement | Angel Leclerc Communication" },
      {
        property: "og:description",
        content: "Se désabonner des notifications du blog.",
      },
      { name: "twitter:title", content: "Désabonnement | Angel Leclerc Communication" },
      {
        name: "twitter:description",
        content: "Se désabonner des notifications du blog.",
      },
    ],
  }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const run = useServerFn(unsubscribeFromBlog);
  const [state, setState] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setState("error");
      return;
    }
    run({ data: { token } })
      .then(() => setState("done"))
      .catch(() => setState("error"));
  }, [run]);

  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-md px-5 text-center">
        {state === "loading" && (
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        )}
        {state === "done" && (
          <>
            <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
              Vous êtes désabonné
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Vous ne recevrez plus de notification lors de la publication d'un article.
            </p>
          </>
        )}
        {state === "error" && (
          <>
            <h1 className="font-display text-2xl font-bold text-foreground">Lien invalide</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Ce lien de désabonnement n'est plus valide.
            </p>
          </>
        )}
        <Link to="/articles" className="mt-6 inline-flex text-sm text-primary hover:underline">
          Retour au blog
        </Link>
      </div>
    </section>
  );
}
