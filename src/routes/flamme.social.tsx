import { createFileRoute } from "@tanstack/react-router";
import { FlammeSocialApp } from "@/components/flamme-social/FlammeSocialApp";

export const Route = createFileRoute("/flamme/social")({
  head: () => ({
    meta: [
      { title: "Flamme — Réseau social bêta" },
      { name: "description", content: "Flamme social : publications, vidéos, groupes, événements et messages chiffrés." },
      { name: "robots", content: "noindex, nofollow" },
      { name: "theme-color", content: "#F6F1E8" },
    ],
    links: [{ rel: "canonical", href: "/flamme/social" }],
  }),
  component: FlammeSocialRoute,
});

function FlammeSocialRoute() {
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-[#F6F1E8]">
      <FlammeSocialApp />
    </div>
  );
}
