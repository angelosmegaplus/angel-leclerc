import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/angel-os")({
  beforeLoad: () => {
    throw redirect({ to: "/experiences", hash: "angel-os" });
  },
});
