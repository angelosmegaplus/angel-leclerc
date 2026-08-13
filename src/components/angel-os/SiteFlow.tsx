import { Bot, Clock3, Cpu, GitBranch, ServerCog, Workflow } from "lucide-react";
import { Logo } from "@/components/Logo";

const steps = [
  {
    eyebrow: "01",
    title: "JE DONNE UN ORDRE",
    text: "Depuis ChatGPT ou mon espace administrateur, je décris simplement ce que je veux faire.",
    code: "prompt.received → intent.parse → task.create",
    tools: [
      { label: "ChatGPT", domain: "chatgpt.com" },
      { label: "Espace admin", logo: "/angel-os/logo.png" },
      { label: "Prompt → action", icon: Bot },
    ],
  },
  {
    eyebrow: "02",
    title: "LE SYSTÈME TRAVAILLE AUSSI TOUT SEUL",
    text: "Les tâches planifiées de ChatGPT surveillent, recherchent, vérifient et déclenchent automatiquement des actions récurrentes.",
    code: "scheduler.tick → monitor.scan → automation.run",
    tools: [
      { label: "ChatGPT", domain: "chatgpt.com" },
      { label: "Tâches planifiées", icon: Clock3 },
      { label: "Automatisations", icon: Workflow },
    ],
  },
  {
    eyebrow: "03",
    title: "ANGEL OS COORDONNE LE TOUT",
    text: "Le noyau relie les outils, distribue les actions et garde une logique commune entre le site, l'administration et les automatismes.",
    code: "event.bus → module.registry → adapter.dispatch",
    tools: [
      { label: "Angel OS Core", logo: "/angel-os/logo.png" },
      { label: "Event Bus", icon: Workflow },
      { label: "Module Registry", icon: Cpu },
      { label: "Adapters", icon: ServerCog },
    ],
  },
  {
    eyebrow: "04",
    title: "LE CODE ET LE CONTENU SONT MODIFIÉS",
    text: "GitHub versionne les changements. Lovable peut intervenir ponctuellement quand c'est utile, sans être le centre du système.",
    code: "change.prepare → git.diff → commit.write → branch.sync",
    tools: [
      { label: "GitHub", domain: "github.com" },
      { label: "Lovable", domain: "lovable.dev" },
      { label: "Git", icon: GitBranch },
    ],
  },
  {
    eyebrow: "05",
    title: "LA NOUVELLE VERSION EST CONSTRUITE ET MISE EN LIGNE",
    text: "Les vérifications passent, Vercel construit le projet et publie automatiquement la version validée.",
    code: "ci.check → typecheck.ok → build.ready → deploy.production",
    tools: [
      { label: "Vercel", domain: "vercel.com" },
      { label: "React", domain: "react.dev" },
      { label: "TanStack", domain: "tanstack.com" },
      { label: "CI / Build", icon: ServerCog },
    ],
  },
  {
    eyebrow: "06",
    title: "LE RÉSULTAT ARRIVE SUR ANGEL-LECLERC.FR",
    text: "Le changement est visible sur le site sans que j'aie besoin de reconstruire manuellement toute la chaîne.",
    code: "production.ready → edge.route → angel-leclerc.fr",
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
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Comment ça marche</p>
        <h2 className="mt-4 max-w-4xl font-display text-3xl font-bold sm:text-5xl">De l'idée au noyau, du code à la mise en ligne.</h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/55 sm:text-lg">En gros, le parcours est simple. Juste dessous, la couche technique montre ce qui se passe réellement sous le capot.</p>

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
          <p className="text-sm leading-relaxed text-white/60"><strong className="text-white">En clair :</strong> je donne l'ordre — ou une tâche planifiée se déclenche — Angel OS coordonne, les outils exécutent, le code est vérifié et la nouvelle version arrive sur le site.</p>
        </div>
      </div>
    </section>
  );
}
