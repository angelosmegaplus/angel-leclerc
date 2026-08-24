import { createFileRoute } from "@tanstack/react-router";
import { FlammeSocialAppV2 } from "@/components/flamme-social/FlammeSocialAppV2";

export const Route = createFileRoute("/flamme_/social")({
  head: () => ({
    meta: [
      { title: "Flamme Social — bêta" },
      { name: "description", content: "Flamme Social : fil, stories, vidéos, groupes, événements et messages chiffrés." },
      { name: "robots", content: "noindex, nofollow" },
      { name: "theme-color", content: "#CE654B" },
    ],
    links: [{ rel: "canonical", href: "/flamme/social" }],
  }),
  component: FlammeSocialAppV2,
});
