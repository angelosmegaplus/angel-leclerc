import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/actualites/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/articles/$slug", params, replace: true });
  },
});
