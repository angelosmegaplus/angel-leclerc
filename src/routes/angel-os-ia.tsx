import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { BootIntro } from "@/components/angel-os/BootIntro";
import { Hero } from "@/components/angel-os/Hero";
import { SiteFlow } from "@/components/angel-os/SiteFlow";
import { DevFlow } from "@/components/angel-os/DevFlow";

export const Route = createFileRoute("/angel-os-ia")({
  head: () => ({
    meta: [
      { title: "Angel OS — noyau open source et Angel OS IA" },
      { name: "description", content: "Angel OS est un noyau open source modulaire. Angel OS IA est la première distribution construite au-dessus et angel-leclerc.fr en est une intégration web." },
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
      <section className="border-y border-white/10 bg-white/[.02] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {[["Angel OS","Le noyau commun : événements, modules, configuration, capacités et adaptateurs."],["Angel OS IA","Ma distribution personnelle : IA, automatisations, administration et outils de pilotage."],["angel-leclerc.fr","Une application web qui utilise le Core sans lui confier son design ni ses fonctions essentielles."]].map(([title,text])=><article key={title} className="rounded-3xl border border-white/10 bg-[#0c0e11] p-7"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 text-sm leading-relaxed text-white/50">{text}</p></article>)}
        </div>
      </section>
      <section className="px-5 py-20 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl"><p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Core v0.1</p><h2 className="mt-4 font-display text-3xl font-bold sm:text-5xl">Petit noyau, couches séparées.</h2><p className="mt-5 max-w-3xl text-base leading-relaxed text-white/55">Event Bus, Module Registry, configuration, capabilities et adapters forment le socle actuel. Angel OS IA et le site restent des couches distinctes.</p><div className="mt-8 flex flex-wrap gap-3">{["Event Bus","Module Registry","Configuration","Capabilities","Adapters"].map((item)=><span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/65">{item}</span>)}</div></div></section>
      <SiteFlow />
      <DevFlow />
      <section className="px-5 py-20 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl rounded-[2rem] border border-red-500/20 bg-red-500/[.06] p-8 sm:p-10"><div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-4"><img src="/angel-os/logo.png" alt="" className="h-16 w-16 rounded-2xl object-cover"/><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Open source</p><h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Un noyau à reprendre et adapter.</h2></div></div><a href="https://github.com/angelosmegaplus/angel-leclerc/tree/main/angel-os" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"><Github size={17}/> Code source</a></div></div></section>
    </main>
  );
}
