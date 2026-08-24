import { createFileRoute } from "@tanstack/react-router";
import { FlammeSocialAppV4 } from "@/components/flamme-social/FlammeSocialAppV4";
import { FlammeCommentCollapseEnhancer } from "@/components/flamme-social/FlammeCommentCollapseEnhancer";
import "@/components/flamme-social/flamme-social-polish.css";
import "@/components/flamme-social/flamme-social-mobile-hardening.css";

function FlammeSocialRoute() {
  return (
    <div className="flamme-social-route">
      <FlammeCommentCollapseEnhancer />
      <FlammeSocialAppV4 />
    </div>
  );
}

export const Route = createFileRoute("/flamme_/social")({
  head: () => ({
    meta: [
      { title: "Flamme — recherche & social" },
      { name: "description", content: "Flamme réunit recherche Web, publications, vidéos, forum et messagerie chiffrée dans une interface unique." },
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
