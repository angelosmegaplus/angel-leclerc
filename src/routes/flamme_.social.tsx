import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/flamme_/social")({
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
});
