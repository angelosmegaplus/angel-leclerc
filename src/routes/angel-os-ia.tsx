import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Boxes,
  Braces,
  Cpu,
  Github,
  Globe2,
  Layers3,
  MonitorSmartphone,
  Network,
  PackageOpen,
  PlugZap,
  ServerCog,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Workflow,
} from "lucide-react";

export const Route = createFileRoute("/angel-os-ia")({
  head: () => ({
    meta: [
      { title: "Angel OS — noyau open source et Angel OS IA" },
      {
        name: "description",
        content:
          "Angel OS est un noyau open source modulaire inspiré de la logique Linux. Angel OS IA est la première distribution construite au-dessus.",
      },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: AngelOsPage,
});

const principles = [
  {
    icon: Cpu,
    title: "Un noyau, pas un simple site",
    text: "Angel OS est le socle commun : configuration, événements, modules, capacités et adaptateurs. Il n'impose ni interface, ni base de données, ni fournisseur d'IA.",
  },
  {
    icon: Layers3,
    title: "Des couches par-dessus",
    text: "Angel OS IA est une distribution construite au-dessus du Core. D'autres variantes pourront utiliser le même noyau sans modifier son fonctionnement de base.",
  },
  {
    icon: PlugZap,
    title: "Réutilisable ailleurs",
    text: "Un autre projet peut reprendre le Core, ajouter ses propres modules, son design, ses IA et ses services sans dépendre de mon site personnel.",
  },
];

const coreBlocks = [
  ["Event Bus", "Communication entre modules sans couplage direct."],
  ["Module Registry", "Chargement et démarrage de modules remplaçables."],
  ["Configuration", "Paramètres du système séparés des interfaces."],
  ["Capabilities", "Déclaration des capacités disponibles selon la plateforme."],
  ["Adapters", "Ponts vers le web aujourd'hui, puis d'autres plateformes demain."],
];

const roadmap = [
  { icon: Globe2, title: "Web", text: "Déjà utilisé par angel-leclerc.fr via une intégration passive." },
  { icon: MonitorSmartphone, title: "Desktop", text: "Objectif : créer une couche desktop au-dessus du même Core." },
  { icon: ServerCog, title: "Serveur", text: "Prévoir des services et modules exécutables côté serveur." },
  { icon: Smartphone, title: "Mobile / embarqué", text: "Perspective à long terme, avec adaptateurs dédiés plutôt qu'un Core réécrit." },
];

function AngelOsPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050607] text-white">
      <section className="relative isolate overflow-hidden px-5 pb-20 pt-8 sm:px-8 lg:px-12">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_18%,rgba(225,55,55,.17),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,.07),transparent_25%),linear-gradient(180deg,#0a0b0d_0%,#050607_75%)]" />
        <motion.div
          aria-hidden
          className="absolute -right-24 top-20 -z-10 h-80 w-80 rounded-full border border-white/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        />

        <div className="mx-auto max-w-6xl">
          <Link
            to="/parcours"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/65 transition hover:border-white/25 hover:text-white"
          >
            <ArrowLeft size={15} /> Retour au portfolio
          </Link>

          <div className="grid items-center gap-12 pt-14 lg:grid-cols-[1.1fr_.9fr] lg:pt-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.2em] text-red-300">
                <Sparkles size={13} /> Open source · Core v0.1
              </div>
              <h1 className="mt-6 font-display text-5xl font-bold tracking-[-.05em] sm:text-7xl lg:text-8xl">
                Angel <span className="text-red-500">OS</span>
              </h1>
              <p className="mt-5 max-w-2xl text-xl font-medium text-white/85 sm:text-2xl">
                Un noyau commun pour construire plusieurs systèmes au lieu de recommencer chaque projet de zéro.
              </p>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
                L'idée reprend la logique de l'écosystème Linux : une base légère et indépendante, puis des distributions et des interfaces construites au-dessus. Angel OS IA est la première de ces couches.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="https://github.com/angelosmegaplus/angel-leclerc/tree/main/angel-os"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5"
                >
                  <Github size={17} /> Voir le Core sur GitHub
                </a>
                <a
                  href="#architecture"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30"
                >
                  Comprendre l'architecture <ArrowRight size={16} />
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: .95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: .7, delay: .1 }}
              className="relative"
            >
              <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-red-500/10 blur-3xl" />
              <div className="rounded-[2rem] border border-white/10 bg-black p-6 shadow-2xl shadow-black/50">
                <div className="flex items-center gap-5">
                  <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-24 w-24 rounded-2xl object-cover" />
                  <div>
                    <p className="text-xs uppercase tracking-[.22em] text-white/35">Socle actuel</p>
                    <p className="mt-2 text-2xl font-bold">Angel OS Core</p>
                    <p className="mt-1 text-sm text-white/45">v0.1 · web adapter actif</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3 font-mono text-xs text-white/60">
                  <p><span className="text-red-400">host</span> → Linux / environnement hôte</p>
                  <p><span className="text-red-400">core</span> → Angel OS</p>
                  <p><span className="text-red-400">distribution</span> → Angel OS IA</p>
                  <p><span className="text-red-400">client</span> → site / desktop / mobile / serveur</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[.025] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {principles.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: .25 }}
              transition={{ delay: index * .08 }}
              className="rounded-3xl border border-white/10 bg-[#0c0e11] p-7"
            >
              <item.icon size={26} className="text-red-400" />
              <h2 className="mt-5 text-xl font-semibold">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/50">{item.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="architecture" className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Architecture</p>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-5xl">La logique Linux, appliquée à Angel OS.</h2>
            <p className="mt-5 text-base leading-relaxed text-white/55 sm:text-lg">
              Angel OS n'est pas une copie de Linux et ne cherche pas à remplacer son noyau. Il s'inspire de sa philosophie : séparer une base commune des distributions et des interfaces. Quand une plateforme Linux est pertinente, Angel OS peut s'appuyer dessus plutôt que de réinventer l'OS hôte.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-4">
            {[
              ["01", "OS hôte / Linux", "Le système sous-jacent et les capacités matérielles."],
              ["02", "Angel OS Core", "Le socle commun, indépendant du design et des produits."],
              ["03", "Angel OS IA", "Première distribution spécialisée dans l'IA et l'automatisation."],
              ["04", "Applications", "Site web, interface admin, desktop ou autres clients."],
            ].map(([n, title, text]) => (
              <div key={n} className="rounded-3xl border border-white/10 bg-white/[.035] p-6">
                <p className="font-mono text-xs text-red-400">{n}</p>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/45">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-[#0b0d10] p-7 sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <div className="inline-flex rounded-2xl bg-red-500/10 p-4 text-red-400"><Braces size={30} /></div>
              <h2 className="mt-6 font-display text-3xl font-bold sm:text-4xl">Ce que contient déjà le Core v0.1</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/50">
                La base existe réellement dans le dépôt public. Elle reste volontairement légère pour pouvoir évoluer sans devenir dépendante du site actuel.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {coreBlocks.map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[.02] px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Angel OS IA</p>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-5xl">La première distribution au-dessus du Core.</h2>
              <p className="mt-5 text-base leading-relaxed text-white/55">
                Angel OS IA correspond à mon environnement personnel : assistant IA, automatisations, recherche, projets, contenus, messagerie, statistiques, studio et outils de pilotage. Ces fonctions vivent au-dessus du Core et ne doivent pas être confondues avec le noyau lui-même.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Bot, title: "IA", text: "Agents, assistance, synthèse et orchestration." },
                { icon: Workflow, title: "Automatisation", text: "Enchaînement de tâches et actions récurrentes." },
                { icon: Network, title: "Connexions", text: "APIs, services externes et modules optionnels." },
                { icon: ShieldCheck, title: "Séparation", text: "Le Core reste indépendant des données privées et de l'interface." },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-[#0b0d10] p-6">
                  <item.icon size={22} className="text-red-400" />
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-white/45">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Aujourd'hui et demain</p>
          <h2 className="mt-4 max-w-3xl font-display text-3xl font-bold sm:text-5xl">Un Core pensé pour plusieurs plateformes.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {roadmap.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[.035] p-6">
                <item.icon size={24} className="text-red-400" />
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/45">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-red-500/20 bg-[linear-gradient(135deg,rgba(239,68,68,.13),rgba(255,255,255,.03))] p-7 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 text-red-300"><PackageOpen size={20} /> GPL-2.0-only</div>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-5xl">Le Core est public et forkable.</h2>
              <p className="mt-4 max-w-3xl leading-relaxed text-white/55">
                Quelqu'un peut repartir d'Angel OS, créer sa propre distribution et ajouter son propre code. Les composants tiers gardent leurs licences respectives. Le projet est encore jeune : le but est de faire évoluer progressivement le Core sans casser les projets qui l'utilisent.
              </p>
            </div>
            <a
              href="https://github.com/angelosmegaplus/angel-leclerc/tree/main/angel-os"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-400"
            >
              <Github size={18} /> Code source <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
