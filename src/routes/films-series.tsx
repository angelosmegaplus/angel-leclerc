import { createFileRoute, Link } from "@tanstack/react-router";
import { Film, LogIn, UserPlus } from "lucide-react";
import { FilmSeriesAccountPage } from "@/components/films/FilmSeriesAccountPage";
import { ProtonVpnBanner } from "@/components/films/ProtonVpnBanner";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/films-series")({
  head: () => ({
    meta: [
      { title: "Angel Movies | Angel Leclerc" },
      { name: "description", content: "Profil cinéma personnel, recommandations, likes, dislikes, vus et lecture Movix intégrée." },
      { name: "robots", content: "noindex, nofollow, noarchive, nosnippet" },
    ],
  }),
  component: FilmSeriesRoute,
});

function FilmSeriesRoute() {
  const { user, loading } = useAuth();

  if (loading) return <main className="grid min-h-[100dvh] place-items-center bg-[#070708] text-white/50">Chargement d’Angel Movies…</main>;

  if (!user) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#070708] px-4 text-white">
        <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[.035] p-7 shadow-2xl">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-400/10 text-red-300"><Film className="h-6 w-6" /></div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-violet-200/70">Angel Movies</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.05em]">Ton cinéma, ton compte.</h1>
          <p className="mt-3 text-sm leading-6 text-white/50">Crée ton profil Angel Movies pour conserver tes likes, dislikes, contenus vus et recommandations personnalisées.</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Link to="/movies-auth" search={{ mode: "signup" }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 font-semibold text-black"><UserPlus className="h-4 w-4" />Créer mon compte</Link>
            <Link to="/movies-auth" search={{ mode: "login" }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 font-semibold text-white"><LogIn className="h-4 w-4" />Connexion</Link>
          </div>
          <p className="mt-4 text-[11px] leading-5 text-white/25">L’espace cinéma est séparé visuellement de l’administration et n’affiche aucun outil Angel OS.</p>
        </section>
        <ProtonVpnBanner />
      </main>
    );
  }

  return <FilmSeriesAccountPage />;
}
