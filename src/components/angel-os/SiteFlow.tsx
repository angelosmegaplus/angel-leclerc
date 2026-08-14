import { Cpu, GitBranch, ServerCog, Workflow } from "lucide-react";
import { Logo } from "@/components/Logo";

const steps = [
  {
    eyebrow: "01", title: "Le noyau démarre",
    simple: "Angel OS initialise les composants nécessaires et prépare l’environnement commun.",
    technical: "Le Core charge les interfaces communes, initialise l’état partagé et prépare les mécanismes d’orchestration qui seront utilisés par les modules et adaptateurs.",
    code: "core.boot → interfaces.load → state.init",
    tools: [{ label: "Angel OS Core", logo: "/angel-os/logo.png" }, { label: "Core", icon: Cpu }],
  },
  {
    eyebrow: "02", title: "Les modules se déclarent",
    simple: "Chaque capacité peut être organisée comme un module distinct au lieu d’être mélangée au reste du système.",
    technical: "Le registre de modules centralise les capacités disponibles et permet de limiter le couplage entre les composants. Une fonction peut évoluer sans imposer la même logique à tout le noyau.",
    code: "module.registry → capability.register → dependency.resolve",
    tools: [{ label: "Module Registry", icon: Cpu }, { label: "Modules", icon: ServerCog }],
  },
  {
    eyebrow: "03", title: "Les événements circulent",
    simple: "Les composants échangent des actions et des résultats sans devoir être directement reliés entre eux.",
    technical: "Le bus d’événements sert de mécanisme de circulation interne. Il transmet les signaux entre modules et réduit les dépendances directes dans l’architecture.",
    code: "event.emit → event.bus → subscriber.handle",
    tools: [{ label: "Event Bus", icon: Workflow }, { label: "Événements", icon: Workflow }],
  },
  {
    eyebrow: "04", title: "Les adaptateurs font le lien",
    simple: "Angel OS utilise des interfaces dédiées pour dialoguer avec les services réellement connectés.",
    technical: "Les adaptateurs constituent la frontière entre le Core et les fournisseurs externes. Ils normalisent les échanges et évitent d’intégrer directement la logique propre à un service dans le noyau.",
    code: "core.dispatch → adapter.select → provider.request → result.normalize",
    tools: [{ label: "Adapters", icon: ServerCog }, { label: "GitHub", domain: "github.com" }],
  },
  {
    eyebrow: "05", title: "Le code reste traçable",
    simple: "Le noyau et ses composants sont versionnés pour garder un historique clair des changements.",
    technical: "GitHub constitue la source de vérité du code du projet. Les changements sont versionnés avec Git et peuvent être contrôlés avant intégration et déploiement.",
    code: "git.diff → commit.write → history.trace",
    tools: [{ label: "GitHub", domain: "github.com" }, { label: "Git", icon: GitBranch }],
  },
  {
    eyebrow: "06", title: "La livraison est contrôlée",
    simple: "Les vérifications techniques précèdent le build et le déploiement de l’application qui utilise le système.",
    technical: "La chaîne CI/build contrôle la version destinée à la production. Vercel intervient ensuite pour construire et déployer l’application web lorsque le déploiement est autorisé par la plateforme.",
    code: "CI.check → build → Vercel.deploy → production",
    tools: [{ label: "CI / Build", icon: ServerCog }, { label: "Vercel", domain: "vercel.com" }],
  },
] as const;

export function SiteFlow() {
  return (
    <section id="site" className="relative overflow-hidden border-y border-white/10 bg-[#050607] px-5 py-20 sm:px-8 lg:px-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[.08] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-red-500/[.08] to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.22em] text-red-400"><span className="h-2 w-2 animate-pulse rounded-full bg-red-400"/> Angel OS Core / documentation</div>
            <h2 className="mt-4 max-w-4xl font-display text-3xl font-bold tracking-[-.04em] sm:text-5xl">Comprendre le noyau, puis ouvrir le capot.</h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/55">Chaque étape possède deux zones volontairement séparées : une lecture immédiate pour comprendre le rôle, puis une console technique pour voir le fonctionnement réel.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 font-mono text-[10px] text-white/35">
            <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> core.status: active</div>
            <div className="mt-1">mode: documentation</div>
          </div>
        </div>

        <div className="mt-10 space-y-6">
          {steps.map((step, index) => (
            <article key={step.eyebrow} className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b0d]/95 shadow-[0_24px_80px_rgba(0,0,0,.35)] transition duration-500 hover:-translate-y-1 hover:border-red-500/30">
              <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/70 to-transparent opacity-40" />
              <div className="grid lg:grid-cols-[.95fr_1.05fr]">
                <div className="relative p-6 sm:p-8 lg:p-10">
                  <div className="flex items-center gap-3"><span className="font-mono text-[10px] uppercase tracking-[.2em] text-red-400">Simple / {step.eyebrow}</span><div className="h-px flex-1 bg-gradient-to-r from-red-500/30 to-transparent"/></div>
                  <h3 className="mt-5 font-display text-2xl font-bold tracking-[-.03em] text-white sm:text-4xl">{step.title}</h3>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-white/72 sm:text-lg">{step.simple}</p>
                  <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.16em] text-white/35"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400"/> lecture humaine</div>
                </div>

                <div className="relative border-t border-white/10 bg-black/45 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                  <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[.12] [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:100%_24px]" />
                  <div className="relative">
                    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
                      <span className="font-mono text-[10px] uppercase tracking-[.2em] text-cyan-300/70">Documentation technique</span>
                      <span className="ml-auto font-mono text-[9px] text-white/20">NODE_{step.eyebrow}</span>
                    </div>
                    <p className="mt-5 max-w-3xl font-mono text-[12px] leading-7 text-white/43">{step.technical}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {step.tools.map((tool) => {
                        const Icon = "icon" in tool ? tool.icon : null;
                        return <span key={tool.label} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.035] px-2.5 py-1.5 font-mono text-[10px] text-white/50">
                          {"domain" in tool && tool.domain ? <Logo domain={tool.domain} alt={tool.label} size={16} link={false} /> : "logo" in tool && tool.logo ? <img src={tool.logo} alt="" className="h-4 w-4 rounded object-cover" loading="lazy" /> : Icon ? <Icon size={12} className="text-red-300/80" aria-hidden /> : null}{tool.label}
                        </span>;
                      })}
                    </div>
                    <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#020303]">
                      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2"><span className="h-2 w-2 rounded-full bg-red-400/80"/><span className="h-2 w-2 rounded-full bg-amber-300/70"/><span className="h-2 w-2 rounded-full bg-emerald-400/70"/><span className="ml-2 font-mono text-[9px] text-white/20">angel-os://core/runtime</span></div>
                      <div className="relative h-16 overflow-hidden px-4 py-4 font-mono text-[11px] text-red-300/65">
                        <div className="absolute inset-y-0 left-0 w-px animate-pulse bg-red-400/50" />
                        <div className="whitespace-nowrap">$ {step.code}<span className="ml-1 inline-block h-3 w-[2px] animate-pulse bg-red-400/80" /></div>
                        <div className="mt-2 whitespace-nowrap text-white/20">status: ok · route: core/{step.eyebrow} · latency: internal</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#08090b]">
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4"><span className="h-2 w-2 animate-pulse rounded-full bg-red-400"/><p className="font-mono text-[10px] uppercase tracking-[.2em] text-white/45">Implémentations utilisant Angel OS</p></div>
          <div className="grid gap-px bg-white/10 sm:grid-cols-2">
            <div className="bg-[#08090b] p-5"><p className="text-sm font-semibold text-white/75">Angel OS IA</p><p className="mt-2 text-sm leading-relaxed text-white/40">Distribution spécialisée qui ajoute l’intelligence artificielle, les tâches planifiées et les automatisations au-dessus du noyau.</p></div>
            <div className="bg-[#08090b] p-5"><p className="text-sm font-semibold text-white/75">angel-leclerc.fr</p><p className="mt-2 text-sm leading-relaxed text-white/40">Application web utilisant certaines capacités d’Angel OS IA. Ce n’est pas le noyau lui-même.</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
