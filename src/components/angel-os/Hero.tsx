import { Link } from "@tanstack/react-router";
import { ArrowLeft, Github, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-5 pb-20 pt-8 sm:px-8 lg:px-12">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_18%,rgba(225,55,55,.16),transparent_30%),linear-gradient(180deg,#0a0b0d_0%,#050607_76%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[.07] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <Link to="/parcours" hash="realisations" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/65 transition hover:text-white"><ArrowLeft size={15}/> Retour aux projets</Link>
          <div className="hidden items-center gap-2 sm:flex"><img src="/angel-os/logo.png" alt="" className="h-8 w-8 rounded-lg object-cover"/><span className="text-sm font-semibold text-white/70">Angel OS</span></div>
        </div>

        <div className="grid items-start gap-10 pt-14 lg:grid-cols-[1.2fr_.8fr] lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.2em] text-red-300"><Sparkles size={13}/> Noyau d’orchestration</div>
            <h1 className="mt-6 font-display text-5xl font-bold tracking-[-.05em] sm:text-7xl lg:text-8xl">Angel <span className="text-red-500">OS</span></h1>
            <p className="mt-5 max-w-2xl text-xl font-medium text-white/85 sm:text-2xl">Le noyau technique du projet.</p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">Angel OS est la base qui organise les modules, les événements, les adaptateurs et les échanges entre les composants. C’est cette architecture qui constitue le cœur du projet.</p>

            <div className="mt-7 rounded-[1.75rem] border border-red-500/20 bg-black/50 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[.2em] text-red-300">Niveau technique</p>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/45">Core d’orchestration générique avec registre de modules, bus d’événements, adaptateurs, état partagé et interfaces communes. Le noyau reste indépendant d’une application précise et peut accueillir des distributions spécialisées au-dessus de ses primitives.</p>
              <div className="mt-5 font-mono text-[11px] leading-relaxed text-white/35">core.boot → event.bus → module.registry → adapter.dispatch → state.sync</div>
            </div>

            <a href="https://github.com/angelosmegaplus/angel-leclerc/tree/main/angel-os" target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5"><Github size={17}/> Voir le noyau Angel OS sur GitHub</a>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10]/95 p-6 shadow-2xl">
            <div className="flex items-center gap-5"><img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-20 w-20 rounded-2xl object-cover"/><div><p className="text-xs uppercase tracking-[.22em] text-white/35">Architecture</p><p className="mt-2 text-2xl font-bold">Angel OS Core</p><p className="mt-1 text-sm text-white/45">orchestration · modules · événements · adaptateurs</p></div></div>
            <div className="mt-6 space-y-3 font-mono text-xs text-white/55"><p><span className="text-red-400">core</span> → noyau d’orchestration</p><p><span className="text-red-400">modules</span> → capacités spécialisées</p><p><span className="text-red-400">events</span> → circulation des actions</p><p><span className="text-red-400">adapters</span> → interfaces vers les services</p><p><span className="text-red-400">state</span> → état partagé</p></div>
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/35">Angel OS IA</p>
            <p className="mt-2 text-sm leading-relaxed text-white/55">Une distribution basée sur Angel OS qui ajoute l’intelligence artificielle, les tâches planifiées et les automatisations.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/35">angel-leclerc.fr</p>
            <p className="mt-2 text-sm leading-relaxed text-white/55">Une application web qui utilise certaines capacités d’Angel OS IA. Elle reste distincte du noyau.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
