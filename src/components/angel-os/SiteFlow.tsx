import { Bot, Clock3, Cpu, GitBranch, ServerCog, Workflow } from "lucide-react";
import { Logo } from "@/components/Logo";

const steps = [
  {
    eyebrow: "01",
    title: "UNE INSTRUCTION EST INTERPRÉTÉE",
    text: "Une demande peut être transmise depuis ChatGPT ou depuis une interface compatible. L’intelligence artificielle analyse le contexte et prépare une action exploitable par la distribution Angel OS IA.",
    code: "prompt.received → context.resolve → intent.parse → task.create",
    tools: [
      { label: "ChatGPT", domain: "chatgpt.com" },
      { label: "Angel OS IA", logo: "/angel-os/logo.png" },
      { label: "Prompt → action", icon: Bot },
    ],
  },
  {
    eyebrow: "02",
    title: "ANGEL OS IA AJOUTE LA COUCHE IA",
    text: "Angel OS IA est une distribution construite au-dessus du noyau Angel OS. Elle ajoute les modèles d’intelligence artificielle, les tâches planifiées, les automatisations et les règles opérationnelles nécessaires aux usages assistés par IA.",
    code: "distribution.load → ai.reason → scheduler.tick → automation.run",
    tools: [
      { label: "Angel OS IA", logo: "/angel-os/logo.png" },
      { label: "Tâches planifiées", icon: Clock3 },
      { label: "Automatisations", icon: Workflow },
    ],
  },
  {
    eyebrow: "03",
    title: "ANGEL OS FOURNIT LE NOYAU",
    text: "Angel OS reste la couche générique d’orchestration. Le noyau gère les modules, les événements, les adaptateurs, l’état partagé et les interfaces communes sans dépendre d’une application précise ni imposer l’usage de l’intelligence artificielle.",
    code: "core.boot → event.bus → module.registry → adapter.dispatch → state.sync",
    tools: [
      { label: "Angel OS Core", logo: "/angel-os/logo.png" },
      { label: "Event Bus", icon: Workflow },
      { label: "Module Registry", icon: Cpu },
      { label: "Adapters", icon: ServerCog },
    ],
  },
  {
    eyebrow: "04",
    title: "L’APPLICATION UTILISE LA DISTRIBUTION",
    text: "angel-leclerc.fr est une application web distincte. Elle utilise Angel OS IA pour certaines fonctions d’administration, de veille, de traitement et d’automatisation, mais le site n’est ni Angel OS ni Angel OS IA.",
    code: "app.request → distribution.api → core.service → app.render",
    tools: [
      { label: "angel-leclerc.fr", logo: "/angel-os/logo.png" },
      { label: "React", domain: "react.dev" },
      { label: "TanStack", domain: "tanstack.com" },
    ],
  },
  {
    eyebrow: "05",
    title: "LE CODE EST VERSIONNÉ ET DÉPLOYÉ",
    text: "GitHub versionne le code source. Les contrôles techniques précèdent le build, puis Vercel distribue la version validée de l’application web vers l’environnement de production.",
    code: "git.diff → commit.write → typecheck.ok → build.ready → deploy.production",
    tools: [
      { label: "GitHub", domain: "github.com" },
      { label: "Git", icon: GitBranch },
      { label: "Vercel", domain: "vercel.com" },
      { label: "CI / Build", icon: ServerCog },
    ],
  },
  {
    eyebrow: "06",
    title: "CHAQUE COUCHE RESTE INDÉPENDANTE",
    text: "La séparation core → distribution → application limite le couplage. Angel OS peut évoluer comme noyau, Angel OS IA comme distribution spécialisée et angel-leclerc.fr comme application, sans confondre leurs responsabilités respectives.",
    code: "core != distribution != application → responsibilities.isolated",
    tools: [
      { label: "Angel OS", logo: "/angel-os/logo.png" },
      { label: "Angel OS IA", logo: "/angel-os/logo.png" },
      { label: "angel-leclerc.fr", logo: "/angel-os/logo.png" },
    ],
  },
] as const;

export function SiteFlow() {
  return (
    <section id="site" className="border-y border-white/10 bg-white/[.02] px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Architecture en trois niveaux</p>
        <h2 className="mt-4 max-w-4xl font-display text-3xl font-bold sm:text-5xl">Un noyau, une distribution IA, une application web.</h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/55 sm:text-lg">Angel OS, Angel OS IA et angel-leclerc.fr correspondent à trois couches différentes. Le noyau fournit les mécanismes génériques, la distribution ajoute les fonctions IA et d’automatisation, puis l’application consomme ces capacités pour un usage concret.</p>

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
          <p className="text-sm leading-relaxed text-white/60"><strong className="text-white">Séparation de référence :</strong> Angel OS = noyau d’orchestration ; Angel OS IA = distribution spécialisée intégrant IA et automatisations ; angel-leclerc.fr = application web utilisant cette distribution.</p>
        </div>
      </div>
    </section>
  );
}
