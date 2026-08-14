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
        <div className="grid items-center gap-12 pt-14 lg:grid-cols-[1.1fr_.9fr] lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.2em] text-red-300"><Sparkles size={13}/> IA · automatisation · orchestration</div>
            <h1 className="mt-6 font-display text-5xl font-bold tracking-[-.05em] sm:text-7xl lg:text-8xl">Angel <span className="text-red-500">OS</span></h1>
            <p className="mt-5 max-w-2xl text-xl font-medium text-white/85 sm:text-2xl">Un système qui relie intelligence artificielle, automatisations et services numériques.</p>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">À l’origine, je voulais réunir dans un même environnement les outils utilisés pour gérer le site et automatiser les tâches récurrentes. Angel OS est devenu l’architecture qui organise cet ensemble.</p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/40 sm:text-base">Techniquement, Angel OS coordonne des modèles d’intelligence artificielle, des déclencheurs planifiés, des composants React, des services de données, des connecteurs externes, GitHub et une chaîne CI/CD Vercel. L’IA analyse le contexte et prépare les opérations ; les modules applicatifs et les services autorisés assurent leur exécution, leur persistance et leur déploiement.</p>
            <a href="https://github.com/angelosmegaplus/angel-leclerc/tree/main/angel-os" target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5"><Github size={17}/> Voir le Core sur GitHub</a>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-black/80 p-6 shadow-2xl transition duration-300 hover:-translate-y-1 hover:border-red-500/25">
            <div className="flex items-center gap-5"><img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-24 w-24 rounded-2xl object-cover"/><div><p className="text-xs uppercase tracking-[.22em] text-white/35">Architecture</p><p className="mt-2 text-2xl font-bold">Angel OS IA</p><p className="mt-1 text-sm text-white/45">orchestration assistée par IA</p></div></div>
            <div className="mt-6 space-y-3 font-mono text-xs text-white/60"><p><span className="text-red-400">reasoning</span> → modèles IA / ChatGPT</p><p><span className="text-red-400">core</span> → orchestration Angel OS</p><p><span className="text-red-400">scheduler</span> → tâches planifiées</p><p><span className="text-red-400">runtime</span> → application / données / connecteurs</p><p><span className="text-red-400">source</span> → GitHub</p><p><span className="text-red-400">delivery</span> → CI/CD / Vercel</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
