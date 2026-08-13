import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/communiques/reponse-article-chni-tombola-patrimoine")({
  beforeLoad: () => {
    throw redirect({
      to: "/articles/reponse-article-chni-tombola-patrimoine",
      replace: true,
    });
  },
});
