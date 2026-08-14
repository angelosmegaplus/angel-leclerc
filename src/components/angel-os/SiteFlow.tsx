import { Bot, Clock3, Cpu, GitBranch, ServerCog, Workflow } from "lucide-react";
import { Logo } from "@/components/Logo";

const steps = [
  {
    eyebrow: "01",
    title: "UNE INSTRUCTION EST INTERPRÉTÉE",
    text: "Une demande peut être transmise depuis ChatGPT ou depuis l’espace d’administration. L’intelligence artificielle analyse l’intention, replace la demande dans son contexte et prépare une action exploitable par Angel OS.",
    code: "prompt.received → context.resolve → intent.parse → task.create",
    tools: [
      { label: "ChatGPT", domain: "chatgpt.com" },
      { label: "Espace admin", logo: "/angel-os/logo.png" },
      { label: "Prompt → action", icon: Bot },
    ],
  },
  {
    eyebrow: "02",
    title: "LES AUTOMATISATIONS PRENNENT LE RELAIS",
    text: "Les tâches planifiées assurent la veille, les contrôles réguliers, la collecte d’informations, la maintenance et l’exécution d’actions récurrentes. Elles permettent au système de fonctionner au-delà d’une simple interaction ponctuelle avec l’IA.",
    code: "scheduler.tick → monitor.scan → automation.run → result.store",
    tools: [
      { label: "ChatGPT", domain: "chatgpt.com" },
      { label: "Tâches planifiées", icon: Clock3 },
      { label: "Automatisations", icon: Workflow },
    ],
  },
  {
    eyebrow: "03",
    title: "ANGEL OS ORCHESTRE LES SERVICES",
    text: "Le noyau coordonne l’interface d’administration, les modules métier, les données, les services externes et les automatisations. L’objectif est de maintenir une logique unique entre raisonnement, exécution, suivi et restitution.",
    code: "event.bus → module.registry → adapter.dispatch → state.sync",
    tools: [
      { label: "Angel OS Core", logo: "/angel-os/logo.png" },
      { label: "Event Bus", icon: Workflow },
      { label: "Module Registry", icon: Cpu },
      { label: "Adapters", icon: ServerCog },
    ],
  },
  {
    eyebrow: "04",
    title: "LE CODE EST VERSIONNÉ ET CONTRÔLÉ",
    text: "GitHub constitue la source de vérité du projet. Chaque évolution utile est intégrée dans une chaîne de versionnement, de vérification et de synchronisation afin de garder un historique clair et de limiter les modifications concurrentes ou redondantes.",
    code: "change.prepare → git.diff → commit.write → main.sync",
    tools: [
      { label: "GitHub", domain: "github.com" },
      { label: "Git", icon: GitBranch },
      { label: "Contrôles", icon: ServerCog },
    ],
  },
  {
    eyebrow: "05",
    title: "LE PIPELINE DE PRODUCTION EST EXÉCUTÉ",
    text: "Les contrôles techniques précèdent le build. Vercel construit ensuite la version validée et la distribue vers l’environnement de production, ce qui relie directement les évolutions du code à la version réellement servie.",
    code: "typecheck.ok → build.ready → deploy.production → health.verify",
    tools: [
      { label: "Vercel", domain: "vercel.com" },
      { label: "React", domain: "react.dev" },
      { label: "TanStack", domain: "tanstack.com" },
      { label: "CI / Build", icon: ServerCog },
    ],
  },
  {
    eyebrow: "06",
    title: "ANGEL OS RESTE EN BOUCLE DE SUIVI",
    text: "Une fois la version publiée, les automatisations continuent de surveiller le site, l’administration, les données utiles et les régressions potentielles. Le système n’est donc pas seulement un outil de génération : il constitue une boucle continue de pilotage, de contrôle et d’amélioration.",
    code: "production.ready → monitor.observe → issue.detect → next.action",
    tools: [
      { label: "angel-leclerc.fr", logo: "/angel-os/logo.png" },
      { label: "Vercel", domain: "vercel.com" },
      { label: "Angel OS", logo: "/angel-os/logo.png" },
    ],
  },
] as const;

export function SiteFlow() {
  return (
    <section id="site" className="border-y border-white/10 bg-white/[.02] px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Architecture opérationnelle</p>
        <h2 className="mt-4 max-w-4xl font-display text-3xl font-bold sm:text-5xl">De l’instruction au suivi de production, une chaîne IA orchestrée de bout en bout.</h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/55 sm:text-lg">Angel OS transforme l’usage de ChatGPT en véritable système opérationnel : l’IA raisonne et prépare les actions, les automatisations assurent la continuité, les modules exécutent les opérations, GitHub versionne le code et Vercel distribue les versions validées.</p>

        <div className="mt-10 space-y-5">
          {steps.map((step, index) => (
            <article key={step.eyebrow} className="group rounded-[2rem] border border-white/10 bg-[#0b0d10] p-6 transition duration-300 hover:-translate-y-1 hover:border-red-500/25 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[.2em] text-red-400">étape {step.eyebrow}</p>
              <h3 className="mt-3 font-display text-2xl font-black tracking-[-.025em] text-white sm:text-4xl">{step.title}</h3>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/65 sm:text-lg">{step.text}</p>

              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/55">
                <div className="flex flex-wrap gap-2 border-b border-white/10 px-4 py-3">
                  {step.tools.map((tool) => {
                    const Icon = "icon" in tool ? tool.icon : null;
                    return (
                      <span key={tool.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 font-mono text-[10px] text-white/55">
                        {"domain" in tool && tool.domain ? (
                          <Logo domain={tool.domain} alt={tool.label} size={18} link={false} />
                        ) : "logo" in tool && tool.logo ? (
                          <img src={tool.logo} alt="" className="h-[18px] w-[18px] rounded object-cover" loading="lazy" />
                        ) : Icon ? (
                          <Icon size={13} className="text-red-300/80" aria-hidden />
                        ) : null}
                        {tool.label}
                      </span>
                    );
                  })}
                </div>
                <svg viewBox="0 0 900 44" aria-hidden className="h-11 w-full font-mono">
                  <circle cx="18" cy="22" r="3" fill="rgba(248,113,113,.9)">
                    <animate attributeName="opacity" values=".25;1;.25" dur={`${1.4 + index * 0.12}s`} repeatCount="indefinite" />
                  </circle>
                  <text x="40" y="27" fill="rgba(248,113,113,.68)" fontSize="11">
                    {step.code}     {step.code}
                    <animate attributeName="x" from="40" to="-360" dur={`${18 + index * 2}s`} repeatCount="indefinite" />
                  </text>
                </svg>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-4 rounded-2xl border border-red-500/15 bg-red-500/[.05] p-6">
          <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-12 w-12 shrink-0 rounded-xl object-cover" loading="lazy" />
          <p className="text-sm leading-relaxed text-white/60"><strong className="text-white">Principe de fonctionnement :</strong> ChatGPT apporte la couche de raisonnement et d’assistance, Angel OS structure et orchestre les opérations, les automatisations assurent la continuité, puis les outils techniques exécutent, versionnent, déploient et contrôlent le résultat.</p>
        </div>
      </div>
    </section>
  );
}
