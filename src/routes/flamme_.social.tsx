import { createFileRoute } from "@tanstack/react-router";
import { FlammeSocialAppV5 } from "@/components/flamme-social/FlammeSocialAppV5";
import "@/components/flamme-social/flamme-social-polish.css";
import "@/components/flamme-social/flamme-social-mobile-hardening.css";

function FlammeSocialRoute() {
  return (
    <div className="flamme-social-route">
      <FlammeSocialAppV5 />
    </div>
  );
}

export const Route = createFileRoute("/flamme_/social")({
  head: () => ({
    meta: [
      { title: "Flamme — recherche & social" },
      { name: "description", content: "Flamme réunit recherche Web, publications, vidéos, forum, découverte et messagerie chiffrée dans une interface unique." },
      { name: "robots", content: "noindex, nofollow" },
      { name: "theme-color", content: "#CE654B" },
    ],
    links: [
      { rel: "canonical", href: "/flamme/social" },
      { rel: "icon", type: "image/svg+xml", href: "/flamme-social-logo.svg" },
    ],
  }),
  component: FlammeSocialRoute,
});
