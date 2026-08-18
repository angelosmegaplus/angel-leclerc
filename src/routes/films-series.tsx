import { createFileRoute } from "@tanstack/react-router";
import { FilmSeriesAccountPage } from "@/components/films/FilmSeriesAccountPage";
import { ProtonVpnBanner } from "@/components/films/ProtonVpnBanner";

export const Route = createFileRoute("/films-series")({
  head: () => ({
    meta: [
      { title: "Films & séries | Angel" },
      { name: "description", content: "Cinéma personnel multi-comptes avec recommandations et lecture intégrée." },
      { name: "robots", content: "noindex, nofollow, noarchive, nosnippet" },
    ],
  }),
  component: FilmSeriesRoute,
});

function FilmSeriesRoute() {
  return (
    <>
      <FilmSeriesAccountPage />
      <ProtonVpnBanner />
    </>
  );
}
