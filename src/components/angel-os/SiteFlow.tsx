import { Bot, Clock3, Cpu, GitBranch, ServerCog, Workflow } from "lucide-react";
import { Logo } from "@/components/Logo";

const steps = [
  {
    eyebrow: "01", title: "L’IA comprend la demande",
    simple: "Une instruction est analysée pour déterminer ce qu’il faut faire et quel contexte utiliser.",
    technical: "Entrée → résolution du contexte → interprétation de l’intention → création d’une action exploitable. L’IA prépare la décision ; les capacités réellement disponibles restent déterminées par les outils et connecteurs accessibles.",
    code: "prompt.received → context.resolve → intent.parse → task.create",
    tools: [{ label: "ChatGPT", domain: "chatgpt.com" }, { label: "Angel OS IA", logo: "/angel-os/logo.png" }, { label: "Raisonnement IA", icon: Bot }],
  },
  {
    eyebrow: "02", title: "Les tâches s’organisent",
    simple: "Angel OS IA ajoute les automatisations et les tâches planifiées nécessaires aux opérations récurrentes.",
    technical: "La distribution charge ses règles opérationnelles au-dessus du Core. Les tâches planifiées déclenchent les traitements prévus ; l’orchestration dirige ensuite l’action vers les modules ou interfaces concernés.",
    code: "distribution.load → scheduler.tick → automation.run → core.dispatch",
    tools: [{ label: "Angel OS IA", logo: "/angel-os/logo.png" }, { label: "Tâches planifiées", icon: Clock3 }, { label: "Automatisations", icon: Workflow }],
  },
  {
    eyebrow: "03", title: "Le noyau orchestre",
    simple: "Angel OS fait circuler les actions entre les composants sans dépendre d’une application précise.",
    technical: "Le Core fournit les primitives génériques d’orchestration : registre de modules, bus d’événements, adaptateurs, état partagé et interfaces communes. Cette couche reste distincte de la distribution IA.",
    code: "core.boot → event.bus → module.registry → adapter.dispatch → state.sync",
    tools: [{ label: "Angel OS Core", logo: "/angel-os/logo.png" }, { label: "Event Bus", icon: Workflow }, { label: "Module Registry", icon: Cpu }, { label: "Adapters", icon: ServerCog }],
  },
  {
    eyebrow: "04", title: "Les connecteurs exécutent",
    simple: "Les services réellement connectés permettent d’agir sur les systèmes externes autorisés.",
    technical: "Les adaptateurs/connecteurs constituent la frontière avec les services externes. Une capacité n’est considérée comme active que lorsqu’une intégration réelle et autorisée existe ; aucun connecteur purement visuel n’est présenté comme opérationnel.",
    code: "core.dispatch → adapter.select → provider.request → result.normalize",
    tools: [{ label: "Connecteurs", icon: ServerCog }, { label: "GitHub", domain: "github.com" }],
  },
  {
    eyebrow: "05", title: "Le site utilise le résultat",
    simple: "angel-leclerc.fr est l’application web qui exploite certaines capacités d’Angel OS IA.",
    technical: "L’application est distincte du Core et de la distribution. Son interface actuelle repose notamment sur React et TanStack Router ; elle consomme les fonctions disponibles sans devenir elle-même Angel OS.",
    code: "app.request → distribution.service → core.service → app.render",
    tools: [{ label: "angel-leclerc.fr", logo: "/angel-os/logo.png" }, { label: "React", domain: "react.dev" }, { label: "TanStack", domain: "tanstack.com" }],
  },
  {
    eyebrow: "06", title: "Le code part en production",
    simple: "GitHub conserve le code, les contrôles techniques vérifient la version, puis Vercel construit et déploie le site.",
    technical: "GitHub est la source de vérité du code. La chaîne de livraison vérifie la version avant build ; Vercel prend ensuite en charge le build et le déploiement de l’application web lorsque la plateforme autorise le déploiement.",
    code: "git.commit → CI.check → build → Vercel.deploy → production",
    tools: [{ label: "GitHub", domain: "github.com" }, { label: "Git", icon: GitBranch }, { label: "CI / Build", icon: ServerCog }, { label: "Vercel", domain: "vercel.com" }],
  },
] as const;

export function SiteFlow() {
  return (
    <section id="site" className="border-y border-white/10 bg-white/[.02] px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Fonctionnement général</p>
        <h2 className="mt-4 max-w-4xl font-display text-3xl font-bold sm:text-5xl">De la demande au déploiement</h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/60">Lecture rapide : chaque bloc explique d’abord simplement son rôle. La partie « niveau technique » décrit juste dessous le fonctionnement réel avec davantage de précision.</p>

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

        <div className="mt-8 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
          {["Angel OS|Noyau / architecture", "Angel OS IA|Distribution IA", "angel-leclerc.fr|Application web"].map((item, index) => {
            const [name, role] = item.split("|");
            return <div key={name} className="contents"><div className="rounded-2xl border border-red-500/15 bg-red-500/[.05] p-5 text-center"><p className="font-semibold text-white">{name}</p><p className="mt-1 text-xs text-white/40">{role}</p></div>{index < 2 && <span className="text-center font-mono text-red-400/60">→</span>}</div>;
          })}
        </div>
      </div>
    </section>
  );
}
