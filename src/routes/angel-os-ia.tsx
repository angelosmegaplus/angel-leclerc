import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { BootIntro } from "@/components/angel-os/BootIntro";
import { Hero } from "@/components/angel-os/Hero";
import { SiteFlow } from "@/components/angel-os/SiteFlow";

export const Route = createFileRoute("/angel-os-ia")({
  head: () => ({
    meta: [
      { title: "Angel OS & Angel OS IA — noyau indépendant et distribution personnelle" },
      {
        name: "description",
        content:
          "Angel OS est le noyau système Linux-ready, neutre et réutilisable. Angel OS IA est la distribution personnelle intelligente construite au-dessus : assistant, mémoire personnelle, agents, recommandations, candidatures, mails, agenda, actualités et automatisations.",
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
                  Angel OS reste indépendant. Angel OS IA devient la couche personnelle.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                  Angel OS porte les fonctions système neutres : événements, workflows durables, données, synchronisation, stockage, releases, déploiement multi-cibles, nœuds, Guardian/Recovery et observabilité. Il doit rester réutilisable dans d’autres projets et continuer à fonctionner sans intelligence artificielle personnelle.
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
                  Angel OS IA est la distribution personnelle construite au-dessus : fournisseurs IA, assistant, agents, mémoire personnelle, préférences, recommandations, priorisation, candidatures, mails, agenda, actualités personnalisées, Movix et automatisations intelligentes. Angel OS observe et exécute ; Angel OS IA comprend, personnalise et recommande.
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
                  Les services existants restent complémentaires : GitHub versionne le code, Vercel peut servir un nœud web, Google Drive archive les fichiers lourds et les moteurs Angel Native renforcent l’ensemble.
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
