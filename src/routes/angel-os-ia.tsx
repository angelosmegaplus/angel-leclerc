import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/angel-os-ia")({
  beforeLoad: () => {
    throw redirect({ to: "/experiences" });
  },
});
