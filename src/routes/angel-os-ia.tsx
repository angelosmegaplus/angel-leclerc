import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Database,
  FileText,
  Github,
  Layers3,
  LockKeyhole,
  Mail,
  MessagesSquare,
  Radio,
  Smartphone,
  Sparkles,
  Workflow,
} from "lucide-react";

export const Route = createFileRoute("/angel-os-ia")({
  head: () => ({
    meta: [
      { title: "Angel OS IA — Projet numérique d'Angel Leclerc" },
      {
        name: "description",
        content:
          "Présentation publique d'Angel OS IA, centre de contrôle numérique conçu par Angel Leclerc.",
      },
      { name: "robots", content: "noindex,nofollow,noarchive" },
    ],
  }),
  component: AngelOsShowcase,
});

const modules = [
  { label: "Pilotage", icon: BarChart3 },
  { label: "Projets", icon: BriefcaseBusiness },
  { label: "Éditorial", icon: FileText },
  { label: "Messagerie", icon: Mail },
  { label: "Assistant IA", icon: Bot },
  { label: "Automatisations", icon: Workflow },
  { label: "Studio", icon: Radio },
  { label: "Retours", icon: MessagesSquare },
];

const stack = [
  ["React + TanStack Start", "Interface et application web"],
  ["Supabase", "Authentification, base de données et stockage"],
  ["GitHub", "Code source, historique et déploiements"],
  ["Lovable + Vercel", "Publication et services serveur"],
  ["PWA", "Installation et usage mobile Android"],
  ["OAuth / API officielles", "Connexions aux services externes"],
];

function AngelOsShowcase() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080b12] text-white">
      <section className="relative isolate min-h-[92vh] overflow-hidden px-5 pb-16 pt-8 sm:px-8 lg:px-12">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_15%,rgba(232,139,96,.2),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(88,101,242,.16),transparent_30%),linear-gradient(180deg,#0d111c_0%,#080b12_70%)]" />
        <motion.div
          aria-hidden
          className="absolute -right-32 top-16 -z-10 h-96 w-96 rounded-full border border-white/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />

        <div className="mx-auto max-w-6xl">
          <Link
            to="/parcours"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur transition hover:border-[#e88b60]/60 hover:text-white"
          >
            <ArrowLeft size={15} /> Retour au portfolio
          </Link>

          <div className="grid items-center gap-12 pt-14 lg:grid-cols-[1.05fr_.95fr] lg:pt-20">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e88b60]/30 bg-[#e88b60]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.22em] text-[#f3a47e]">
                <Sparkles size={13} /> Projet personnel · en évolution
              </div>
              <h1 className="mt-6 font-display text-5xl font-bold tracking-[-.045em] sm:text-7xl lg:text-8xl">
                Angel OS <span className="text-[#e88b60]">IA</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/65 sm:text-xl">
                Un centre de contrôle numérique conçu pour réunir activité professionnelle,
                publication, projets, candidatures et assistance intelligente dans une seule
                application.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[.055] px-5 py-4 backdrop-blur">
                  <p className="text-2xl font-bold text-[#f3a47e]">100+ h</p>
                  <p className="mt-1 text-xs text-white/50">estimation de conception, développement et tests</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.055] px-5 py-4 backdrop-blur">
                  <p className="text-2xl font-bold">8+</p>
                  <p className="mt-1 text-xs text-white/50">grands espaces fonctionnels</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.055] px-5 py-4 backdrop-blur">
                  <p className="text-2xl font-bold">Mobile</p>
                  <p className="mt-1 text-xs text-white/50">application web installable</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: .94, rotateY: -8 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: .9, delay: .15 }}
              className="relative"
            >
              <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-[#e88b60]/10 blur-3xl" />
              <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-black shadow-2xl shadow-black/50">
                <video
                  src="/angel-os/intro.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  preload="metadata"
                  className="aspect-video w-full object-cover"
                />
              </div>
              <p className="mt-3 text-center text-xs text-white/40">Générique d'ouverture d'Angel OS IA</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[.025] py-7">
        <motion.div
          className="flex w-max gap-4 px-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {[...modules, ...modules].map(({ label, icon: Icon }, index) => (
            <div key={`${label}-${index}`} className="flex min-w-44 items-center gap-3 rounded-2xl border border-white/10 bg-[#101622] px-5 py-4">
              <Icon size={19} className="text-[#e88b60]" />
              <span className="font-medium text-white/80">{label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#e88b60]">Le principe</p>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-5xl">Moins d'onglets. Plus de pilotage.</h2>
            <p className="mt-5 text-base leading-relaxed text-white/60 sm:text-lg">
              Angel OS IA ne remplace pas artificiellement les services existants. Il les rassemble,
              affiche leur état réel et simplifie les tâches répétitives, tout en gardant une
              validation humaine pour les actions sensibles ou publiques.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: Layers3, title: "Centraliser", text: "Contenus, projets, statistiques, formulaires et suivi professionnel dans un même cockpit." },
              { icon: Bot, title: "Assister", text: "Une couche d'IA pour rechercher, synthétiser, préparer et guider sans présenter de simulation comme une action réelle." },
              { icon: LockKeyhole, title: "Protéger", text: "Espace privé, authentification réelle et secrets conservés côté serveur. Cette vitrine n'expose aucune donnée interne." },
            ].map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: .3 }}
                transition={{ delay: index * .1 }}
                className="rounded-3xl border border-white/10 bg-white/[.04] p-7"
              >
                <item.icon className="text-[#e88b60]" size={25} />
                <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{item.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-10 rounded-[2rem] border border-white/10 bg-[#0f1420] p-7 sm:p-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#e88b60]">Socle technique</p>
            <h2 className="mt-4 font-display text-3xl font-bold">Les outils derrière le projet</h2>
            <div className="mt-7 space-y-3">
              {stack.map(([name, use]) => (
                <div key={name} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <Database size={18} className="mt-0.5 shrink-0 text-[#e88b60]" />
                  <div><p className="font-semibold">{name}</p><p className="mt-1 text-sm text-white/50">{use}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-3xl bg-[linear-gradient(145deg,rgba(232,139,96,.16),rgba(88,101,242,.08))] p-7 sm:p-9">
            <div>
              <Smartphone size={32} className="text-[#e88b60]" />
              <h2 className="mt-6 font-display text-3xl font-bold">Un projet construit, pas un décor.</h2>
              <p className="mt-5 leading-relaxed text-white/60">
                Chaque module présenté correspond à une fonction développée ou à une intégration
                suivie avec un état explicite. Angel OS IA reste un chantier vivant&nbsp;: les
                connexions avancées sont activées progressivement selon les accès officiels disponibles.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="https://github.com/angelosmegaplus/angel-leclerc" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0b0f18] transition hover:bg-[#f3a47e]">
                <Github size={17} /> Voir le projet technique
              </a>
              <Link to="/parcours" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-[#e88b60]/60">
                Retour au parcours <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
