import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { BootIntro } from "@/components/angel-os/BootIntro";
import { Hero } from "@/components/angel-os/Hero";
import { SiteFlow } from "@/components/angel-os/SiteFlow";

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
      <SiteFlow />
      <section className="px-5 py-20 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl rounded-[2rem] border border-red-500/20 bg-red-500/[.06] p-8 sm:p-10"><div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-4"><img src="/angel-os/logo.png" alt="" className="h-16 w-16 rounded-2xl object-cover"/><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Open source</p><h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Un noyau à reprendre et adapter.</h2></div></div><a href="https://github.com/angelosmegaplus/angel-leclerc/tree/main/angel-os" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"><Github size={17}/> Code source</a></div></div></section>
    </main>
  );
}
