import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { BootIntro } from "@/components/angel-os/BootIntro";
import { Hero } from "@/components/angel-os/Hero";
import { SiteFlow } from "@/components/angel-os/SiteFlow";

export const Route = createFileRoute("/angel-os-ia")({
  head: () => ({
    meta: [
      { title: "Angel OS IA — orchestration, automatisation et intelligence artificielle" },
      { name: "description", content: "Angel OS IA est une architecture numérique conçue et pilotée par Angel Leclerc pour relier ChatGPT, automatisations planifiées, services applicatifs, GitHub et Vercel dans une chaîne opérationnelle cohérente." },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: AngelOsPage,
});

function AngelOsPage() {
  const [booting, setBooting] = useState(true);
  const finishBoot = useCallback(() => setBooting(false), []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#050607] text-white">
      {booting && <BootIntro done={finishBoot} />}
      <Hero />
      <SiteFlow />
      <section className="px-5 py-20 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl rounded-[2rem] border border-red-500/20 bg-red-500/[.06] p-8 sm:p-10"><div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-4"><img src="/angel-os/logo.png" alt="" className="h-16 w-16 rounded-2xl object-cover"/><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Open source</p><h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Un noyau modulaire à étudier, reprendre et adapter.</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">Le code documente une partie de l’architecture utilisée pour transformer des instructions, automatisations et services connectés en opérations réellement exécutées sur l’environnement Angel OS.</p></div></div><a href="https://github.com/angelosmegaplus/angel-leclerc/tree/main/angel-os" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"><Github size={17}/> Code source</a></div></div></section>
    </main>
  );
}
