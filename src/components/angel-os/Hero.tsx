import { Link } from "@tanstack/react-router";
import { ArrowLeft, Github, Sparkles } from "lucide-react";

const layers = [
  {
    name: "Angel OS",
    role: "Le noyau",
    simple: "La base technique qui organise les modules, les événements et les échanges entre les composants.",
    technical: "Core d’orchestration générique : module registry, event bus, adapters, état partagé et interfaces communes. Il reste indépendant d’une application précise et n’impose pas l’usage de l’IA.",
  },
  {
    name: "Angel OS IA",
    role: "La distribution IA",
    simple: "Une version spécialisée construite sur Angel OS qui ajoute l’intelligence artificielle et les automatisations.",
    technical: "Distribution basée sur le Core : couche de raisonnement IA, tâches planifiées, règles opérationnelles et automatisations. Elle consomme les primitives du noyau sans se confondre avec lui.",
  },
  {
    name: "angel-leclerc.fr",
    role: "L’application web",
    simple: "Le site concret qui utilise Angel OS IA pour certaines fonctions d’administration et d’automatisation.",
    technical: "Application React/TanStack distincte. Elle appelle les capacités de la distribution pour les usages concernés, puis son code est versionné sur GitHub, contrôlé par la chaîne CI/build et déployé vers la production.",
  },
] as const;

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

        <div className="pt-14 lg:pt-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.2em] text-red-300"><Sparkles size={13}/> Documentation produit</div>
          <h1 className="mt-6 font-display text-5xl font-bold tracking-[-.05em] sm:text-7xl lg:text-8xl">Angel <span className="text-red-500">OS</span></h1>
          <p className="mt-5 max-w-2xl text-xl font-medium text-white/85 sm:text-2xl">Une architecture en trois couches clairement séparées.</p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/55">Le projet est parti d’un besoin simple : centraliser et automatiser des opérations récurrentes. La documentation ci-dessous distingue le noyau, sa distribution IA et l’application qui l’utilise.</p>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {layers.map((layer, index) => (
              <article key={layer.name} className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b0d10]/95 p-6 transition duration-300 hover:-translate-y-1 hover:border-red-500/30">
                <div className="absolute right-5 top-5 font-mono text-[10px] text-white/20">0{index + 1}</div>
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-red-300">{layer.role}</p>
                <h2 className="mt-3 font-display text-2xl font-bold">{layer.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{layer.simple}</p>
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="font-mono text-[9px] uppercase tracking-[.18em] text-white/30">Niveau technique</p>
                  <p className="mt-2 text-xs leading-relaxed text-white/40">{layer.technical}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-red-500/20 bg-black/65 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-red-300">Relation de référence</p>
            <div className="mt-5 flex flex-col items-stretch gap-3 md:flex-row md:items-center">
              {["Angel OS\nNoyau", "Angel OS IA\nDistribution", "angel-leclerc.fr\nApplication"].map((item, index) => (
                <div key={item} className="contents">
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-center">
                    {item.split("\n").map((line, lineIndex) => <p key={line} className={lineIndex === 0 ? "font-semibold text-white" : "mt-1 text-xs text-white/40"}>{line}</p>)}
                  </div>
                  {index < 2 && <div className="text-center font-mono text-red-400/70 md:rotate-0">→</div>}
                </div>
              ))}
            </div>
            <p className="mt-5 font-mono text-[11px] leading-relaxed text-white/35">core.boot → distribution.load → ai / scheduler / automation → application.request → CI / build → production</p>
          </div>

          <a href="https://github.com/angelosmegaplus/angel-leclerc/tree/main/angel-os" target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5"><Github size={17}/> Voir le Core sur GitHub</a>
        </div>
      </div>
    </section>
  );
}
