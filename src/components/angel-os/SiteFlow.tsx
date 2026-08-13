import { Bot, Clock3, Cpu, GitBranch, ServerCog, Workflow } from "lucide-react";
import { Logo } from "@/components/Logo";

const steps = [
  {
    eyebrow: "01",
    title: "JE DONNE UN ORDRE",
    text: "Depuis ChatGPT ou directement depuis mon espace administrateur, je décris simplement ce que je veux faire.",
    tools: [
      { label: "ChatGPT", domain: "chatgpt.com" },
      { label: "Espace admin", logo: "/angel-os/logo.png" },
      { label: "Prompt → action", icon: Bot },
    ],
  },
  {
    eyebrow: "02",
    title: "LE SYSTÈME TRAVAILLE AUSSI TOUT SEUL",
    text: "Les tâches planifiées de ChatGPT font une grosse partie du travail automatiquement : surveillance, recherches, vérifications, maintenance et actions récurrentes.",
    tools: [
      { label: "ChatGPT", domain: "chatgpt.com" },
      { label: "Tâches planifiées", icon: Clock3 },
      { label: "Automatisations", icon: Workflow },
    ],
  },
  {
    eyebrow: "03",
    title: "ANGEL OS COORDONNE LE TOUT",
    text: "Angel OS relie les outils, distribue les actions et garde une logique commune sans m'obliger à intervenir dans le code à chaque fois.",
    tools: [
      { label: "Angel OS Core", logo: "/angel-os/logo.png" },
      { label: "Event Bus", icon: Workflow },
      { label: "Module Registry", icon: Cpu },
      { label: "Adapters", icon: ServerCog },
    ],
  },
  {
    eyebrow: "04",
    title: "LE CODE EST MODIFIÉ ET PUBLIÉ",
    text: "GitHub garde et versionne le code. Lovable peut intervenir ponctuellement. Vercel construit ensuite la nouvelle version et la publie.",
    tools: [
      { label: "GitHub", domain: "github.com" },
      { label: "Lovable", domain: "lovable.dev" },
      { label: "Vercel", domain: "vercel.com" },
      { label: "Git / CI", icon: GitBranch },
    ],
  },
  {
    eyebrow: "05",
    title: "LE RÉSULTAT ARRIVE SUR ANGEL-LECLERC.FR",
    text: "La modification est disponible sur le site sans que j'aie eu besoin de reconstruire manuellement tout le projet.",
    tools: [
      { label: "React", domain: "react.dev" },
      { label: "TanStack", domain: "tanstack.com" },
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
        <h2 className="mt-4 max-w-4xl font-display text-3xl font-bold sm:text-5xl">De mon idée jusqu'à angel-leclerc.fr.</h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/55 sm:text-lg">Le principe en gros est simple. Les détails techniques restent juste dessous pour ceux qui veulent regarder sous le capot.</p>

        <div className="mt-10 space-y-5">
          {steps.map((step) => (
            <article key={step.eyebrow} className="rounded-[2rem] border border-white/10 bg-[#0b0d10] p-6 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[.2em] text-red-400">étape {step.eyebrow}</p>
              <h3 className="mt-3 font-display text-2xl font-black tracking-[-.025em] text-white sm:text-4xl">{step.title}</h3>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/65 sm:text-lg">{step.text}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {step.tools.map((tool) => {
                  const Icon = "icon" in tool ? tool.icon : null;
                  return (
                    <span key={tool.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-2 font-mono text-[11px] text-white/55">
                      {"domain" in tool && tool.domain ? (
                        <Logo domain={tool.domain} alt={tool.label} size={22} link={false} />
                      ) : "logo" in tool && tool.logo ? (
                        <img src={tool.logo} alt="" className="h-[22px] w-[22px] rounded-md object-cover" loading="lazy" />
                      ) : Icon ? (
                        <Icon size={15} className="text-red-300/80" aria-hidden />
                      ) : null}
                      {tool.label}
                    </span>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-4 rounded-2xl border border-red-500/15 bg-red-500/[.05] p-6">
          <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-12 w-12 shrink-0 rounded-xl object-cover" loading="lazy" />
          <p className="text-sm leading-relaxed text-white/60"><strong className="text-white">En clair :</strong> je donne l'ordre — ou une tâche planifiée se déclenche — Angel OS coordonne, les outils exécutent et le résultat arrive sur le site.</p>
        </div>
      </div>
    </section>
  );
}
