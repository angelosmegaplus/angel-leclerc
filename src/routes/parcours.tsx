import { createFileRoute } from "@tanstack/react-router";
import { MyJourney } from "@/components/MyJourney";

export const Route = createFileRoute("/parcours")({
  head: () => ({
    meta: [
      { title: "Mon parcours — Angel Leclerc | CV en ligne" },
      {
        name: "description",
        content:
          "CV en ligne d'Angel Leclerc : expériences, formations, certifications, engagements associatifs et outils. Recherche d'alternance BTS Communication.",
      },
      { property: "og:title", content: "Mon parcours — Angel Leclerc | CV en ligne" },
      {
        property: "og:description",
        content:
          "CV en ligne d'Angel Leclerc : expériences, formations, engagements et recherche d'alternance BTS Communication.",
      },
      { property: "og:url", content: "/parcours" },
    ],
    links: [{ rel: "canonical", href: "/parcours" }],
  }),
  component: ParcoursPage,
});

function ParcoursPage() {
  return (
    <div>
      <MyJourney />
    </div>
  );
}