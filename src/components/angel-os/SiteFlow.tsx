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
    simple: "Angel OS peut utiliser des interfaces dédiées pour dialoguer avec les services réellement connectés.",
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
    <section id="site" className="border-y border-white/10 bg-white/[.02] px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Angel OS Core</p>
        <h2 className="mt-4 max-w-4xl font-display text-3xl font-bold sm:text-5xl">Comment fonctionne le noyau</h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/60">Chaque bloc commence par une explication simple. Les détails techniques restent juste dessous pour montrer le fonctionnement réel sans alourdir la lecture principale.</p>

        <div className="mt-10 space-y-5">
          {steps.map((step, index) => (
            <article key={step.eyebrow} className="group rounded-[2rem] border border-white/10 bg-[#0b0d10] p-6 transition duration-300 hover:-translate-y-1 hover:border-red-500/25 sm:p-8">
              <div className="flex items-center gap-3"><span className="font-mono text-[10px] uppercase tracking-[.2em] text-red-400">{step.eyebrow}</span><div className="h-px flex-1 overflow-hidden bg-white/10"><div className="h-px w-1/3 animate-pulse bg-red-400/60" /></div></div>
              <h3 className="mt-4 font-display text-2xl font-bold tracking-[-.025em] text-white sm:text-4xl">{step.title}</h3>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/70 sm:text-lg">{step.simple}</p>
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4">
                <p className="font-mono text-[9px] uppercase tracking-[.18em] text-white/30">Niveau technique</p>
                <p className="mt-2 max-w-4xl text-xs leading-relaxed text-white/40 sm:text-sm">{step.technical}</p>
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/55">
                <div className="flex flex-wrap gap-2 border-b border-white/10 px-4 py-3">
                  {step.tools.map((tool) => {
                    const Icon = "icon" in tool ? tool.icon : null;
                    return <span key={tool.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 font-mono text-[10px] text-white/55">
                      {"domain" in tool && tool.domain ? <Logo domain={tool.domain} alt={tool.label} size={18} link={false} /> : "logo" in tool && tool.logo ? <img src={tool.logo} alt="" className="h-[18px] w-[18px] rounded object-cover" loading="lazy" /> : Icon ? <Icon size={13} className="text-red-300/80" aria-hidden /> : null}{tool.label}
                    </span>;
                  })}
                </div>
                <svg viewBox="0 0 900 44" aria-hidden className="h-11 w-full font-mono"><circle cx="18" cy="22" r="3" fill="rgba(248,113,113,.9)"><animate attributeName="opacity" values=".25;1;.25" dur={`${1.4 + index * 0.12}s`} repeatCount="indefinite" /></circle><text x="40" y="27" fill="rgba(248,113,113,.68)" fontSize="11">{step.code}     {step.code}<animate attributeName="x" from="40" to="-360" dur={`${18 + index * 2}s`} repeatCount="indefinite" /></text></svg>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.025] p-5">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/35">Autour du noyau</p>
          <p className="mt-2 text-sm leading-relaxed text-white/55"><strong className="text-white/75">Angel OS IA</strong> est une distribution qui ajoute IA et automatisations au-dessus d’Angel OS. <strong className="text-white/75">angel-leclerc.fr</strong> est une application web qui utilise certaines de ces capacités. Ces deux éléments sont secondaires sur cette page : le sujet principal reste le noyau Angel OS.</p>
        </div>
      </div>
    </section>
  );
}
