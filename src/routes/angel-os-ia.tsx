import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { BootIntro } from "@/components/angel-os/BootIntro";
import { Hero } from "@/components/angel-os/Hero";
import { SiteFlow } from "@/components/angel-os/SiteFlow";

export const Route = createFileRoute("/angel-os-ia")({
  head: () => ({
    meta: [
      { title: "Angel OS & Angel OS IA — architecture distribuée hybride" },
      {
        name: "description",
        content:
          "Angel OS est le noyau système Linux-ready : workflows, déploiement multi-cibles, mémoire, événements, synchronisation, supervision et reprise. Angel OS IA est une distribution distincte construite au-dessus du noyau pour les fonctions d'intelligence artificielle.",
      },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: AngelOsPage,
});

function AngelOsPage() {
  const [booting, setBooting] = useState(true);
  const finishBoot = useCallback(() => setBooting(false), []);

  if (booting) {
    return (
      <main className="min-h-screen bg-[#050607] text-white">
        <BootIntro done={finishBoot} />
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#050607] text-white">
      <Hero />
      <SiteFlow />
      <section className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-red-500/20 bg-red-500/[.06] p-8 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <img src="/angel-os/logo.png" alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Angel OS Core · Linux-ready</p>
                <h2 className="mt-2 break-words font-display text-2xl font-bold leading-tight sm:text-3xl">
                  Le noyau système et la distribution IA sont volontairement séparés.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                  Angel OS porte l’infrastructure : événements, mémoire, workflows durables, synchronisation, Guardian/Recovery, releases, déploiement multi-cibles et sélection des nœuds. Angel OS IA dépend de ce noyau et ajoute les fournisseurs IA, la conversation, l’analyse, la génération, les agents et les automatisations intelligentes. Angel OS continue de fonctionner sans Angel OS IA.
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
                  GitHub reste la source du code, Vercel peut rester un nœud web, Google Drive sert d’archive lourde et les moteurs Angel Native complètent les services déjà connectés au lieu de les supprimer.
                </p>
              </div>
            </div>
            <a
              href="https://github.com/angelosmegaplus/angel-leclerc/tree/main/angel-os"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              <Github size={17} /> Code source
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
