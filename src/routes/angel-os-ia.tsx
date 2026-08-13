import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Braces,
  Cpu,
  Github,
  Globe2,
  Layers3,
  MonitorSmartphone,
  Network,
  PlugZap,
  ServerCog,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Volume2,
  Workflow,
  Zap,
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

const floatTransition = { duration: 7, repeat: Infinity, ease: "easeInOut" as const };

function AngelOsPage() {
  const [booting, setBooting] = useState(true);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const introRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = introRef.current;
    if (!video) return;

    video.muted = false;
    video.volume = 1;
    void video.play().catch(() => {
      video.muted = true;
      setSoundBlocked(true);
      void video.play().catch(() => undefined);
    });

    const fallback = window.setTimeout(() => setBooting(false), 8000);
    return () => window.clearTimeout(fallback);
  }, []);

  const enableSound = () => {
    const video = introRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    setSoundBlocked(false);
    void video.play().catch(() => undefined);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050607] text-white">
      {booting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black"
        >
          <video
            ref={introRef}
            src="/angel-os/intro.mp4"
            autoPlay
            playsInline
            preload="auto"
            onEnded={() => setBooting(false)}
            className="h-full w-full object-contain"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(255,0,0,.035)_50%,transparent_100%)]" />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 h-px bg-red-500/60 shadow-[0_0_20px_rgba(239,68,68,.7)]"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "linear" }}
          />
          {soundBlocked && (
            <button
              type="button"
              onClick={enableSound}
              className="absolute bottom-8 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/75 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xl transition hover:border-red-500/60 hover:bg-red-500/10"
            >
              <Volume2 size={17} /> Activer le son
            </button>
          )}
        </motion.div>
      )}

      <div className="pointer-events-none fixed inset-0 z-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:42px_42px]" />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed -left-40 top-20 z-0 h-[34rem] w-[34rem] rounded-full bg-red-600/10 blur-3xl"
        animate={{ x: [0, 80, 0], y: [0, 50, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed -right-40 bottom-0 z-0 h-[30rem] w-[30rem] rounded-full bg-white/[.035] blur-3xl"
        animate={{ x: [0, -60, 0], y: [0, -40, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      <section className="relative isolate z-10 overflow-hidden px-5 pb-20 pt-8 sm:px-8 lg:px-12">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_18%,rgba(225,55,55,.17),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,.07),transparent_25%),linear-gradient(180deg,#0a0b0d_0%,#050607_75%)]" />
        <motion.div
          aria-hidden
          className="absolute -right-24 top-20 -z-10 h-80 w-80 rounded-full border border-white/10"
          animate={{ rotate: 360, scale: [1, 1.08, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          aria-hidden
          className="absolute right-2 top-48 -z-10 h-52 w-52 rounded-full border border-red-500/20"
          animate={{ rotate: -360, scale: [1, .92, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />

        <div className="mx-auto max-w-6xl">
          <Link
            to="/parcours"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/65 backdrop-blur transition hover:-translate-y-0.5 hover:border-white/25 hover:text-white"
          >
            <ArrowLeft size={15} /> Retour au portfolio
          </Link>

          <div className="grid items-center gap-12 pt-14 lg:grid-cols-[1.1fr_.9fr] lg:pt-20">
            <motion.div
              initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
              animate={{ opacity: booting ? 0 : 1, y: booting ? 28 : 0, filter: "blur(0px)" }}
              transition={{ duration: .9, delay: .15 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.2em] text-red-300"
                animate={{ boxShadow: ["0 0 0 rgba(239,68,68,0)", "0 0 28px rgba(239,68,68,.25)", "0 0 0 rgba(239,68,68,0)"] }}
                transition={{ duration: 2.8, repeat: Infinity }}
              >
                <Sparkles size={13} /> Open source · Core v0.1
              </motion.div>
              <h1 className="mt-6 font-display text-5xl font-bold tracking-[-.05em] sm:text-7xl lg:text-8xl">
                Angel <motion.span className="inline-block text-red-500" animate={{ textShadow: ["0 0 0px #ef4444", "0 0 26px #ef4444", "0 0 0px #ef4444"] }} transition={{ duration: 3, repeat: Infinity }}>OS</motion.span>
              </h1>
              <p className="mt-5 max-w-2xl text-xl font-medium text-white/85 sm:text-2xl">
                Un noyau commun pour construire plusieurs systèmes au lieu de recommencer chaque projet de zéro.
              </p>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
                L'idée reprend la logique de l'écosystème Linux : une base légère et indépendante, puis des distributions et des interfaces construites au-dessus. Angel OS IA est la première de ces couches.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <motion.a
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: .98 }}
                  href="https://github.com/angelosmegaplus/angel-leclerc/tree/main/angel-os"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-xl shadow-white/5"
                >
                  <Github size={17} /> Voir le Core sur GitHub
                </motion.a>
                <motion.a
                  whileHover={{ y: -3 }}
                  href="#architecture"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur"
                >
                  Comprendre l'architecture <ArrowRight size={16} />
                </motion.a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: .92, rotateY: -10 }}
              animate={{ opacity: booting ? 0 : 1, scale: booting ? .92 : 1, rotateY: 0 }}
              transition={{ duration: 1, delay: .3 }}
              className="relative"
            >
              <motion.div className="absolute -inset-8 -z-10 rounded-[3rem] bg-red-500/10 blur-3xl" animate={{ opacity: [.45, .85, .45], scale: [1, 1.08, 1] }} transition={floatTransition} />
              <motion.div
                whileHover={{ y: -8, rotateX: 2, rotateY: -2 }}
                transition={{ type: "spring", stiffness: 160, damping: 16 }}
                className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/85 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl"
              >
                <motion.div className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/[.06] to-transparent" animate={{ x: ["-140%", "650%"] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} />
                <div className="flex items-center gap-5">
                  <motion.img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-24 w-24 rounded-2xl object-cover" animate={{ y: [0, -6, 0] }} transition={floatTransition} />
                  <div>
                    <p className="text-xs uppercase tracking-[.22em] text-white/35">Socle actuel</p>
                    <p className="mt-2 text-2xl font-bold">Angel OS Core</p>
                    <p className="mt-1 inline-flex items-center gap-2 text-sm text-white/45"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> v0.1 · web adapter actif</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3 font-mono text-xs text-white/60">
                  {["host → Linux / environnement hôte", "core → Angel OS", "distribution → Angel OS IA", "client → site / desktop / mobile / serveur"].map((line, i) => (
                    <motion.p key={line} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: .4 + i * .15 }}>
                      <span className="mr-2 text-red-400">›</span>{line}
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-white/[.025] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {principles.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: .25 }}
              transition={{ delay: index * .1 }}
              whileHover={{ y: -8, scale: 1.015 }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c0e11] p-7"
            >
              <motion.div className="absolute inset-0 opacity-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,.18),transparent_45%)] transition-opacity duration-300 group-hover:opacity-100" />
              <motion.div animate={{ rotate: [0, 3, -3, 0] }} transition={{ duration: 5 + index, repeat: Infinity }} className="relative inline-flex rounded-2xl bg-red-500/10 p-3"><item.icon size={26} className="text-red-400" /></motion.div>
              <h2 className="relative mt-5 text-xl font-semibold">{item.title}</h2>
              <p className="relative mt-3 text-sm leading-relaxed text-white/50">{item.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="architecture" className="relative z-10 px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Architecture</p>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-5xl">La logique Linux, appliquée à Angel OS.</h2>
            <p className="mt-5 text-base leading-relaxed text-white/55 sm:text-lg">
              Angel OS n'est pas une copie de Linux et ne cherche pas à remplacer son noyau. Il s'inspire de sa philosophie : séparer une base commune des distributions et des interfaces. Quand une plateforme Linux est pertinente, Angel OS peut s'appuyer dessus plutôt que de réinventer l'OS hôte.
            </p>
          </div>

          <div className="relative mt-14 grid gap-5 lg:grid-cols-4">
            <motion.div aria-hidden className="absolute left-[6%] right-[6%] top-1/2 hidden h-px origin-left bg-gradient-to-r from-transparent via-red-500/70 to-transparent lg:block" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.5 }} />
            {[
              ["01", "OS hôte / Linux", "Le système sous-jacent et les capacités matérielles."],
              ["02", "Angel OS Core", "Le socle commun, indépendant du design et des produits."],
              ["03", "Angel OS IA", "Première distribution spécialisée dans l'IA et l'automatisation."],
              ["04", "Applications", "Site web, interface admin, desktop ou autres clients."],
            ].map(([n, title, text], index) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 24, scale: .95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * .18 }}
                whileHover={{ y: -7, borderColor: "rgba(239,68,68,.45)" }}
                className="relative rounded-3xl border border-white/10 bg-[#090b0e]/95 p-6 backdrop-blur"
              >
                <motion.div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-red-500 shadow-[0_0_18px_rgba(239,68,68,.9)]" animate={{ opacity: [.35, 1, .35] }} transition={{ duration: 2, repeat: Infinity, delay: index * .3 }} />
                <p className="font-mono text-xs text-red-400">{n}</p>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/45">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-20 sm:px-8 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0d10] p-7 sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} className="inline-flex rounded-2xl bg-red-500/10 p-4 text-red-400"><Settings size={30} /></motion.div>
              <h2 className="mt-6 font-display text-3xl font-bold sm:text-4xl">Ce que contient déjà le Core v0.1</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/50">La base existe réellement dans le dépôt public. Elle reste volontairement légère pour pouvoir évoluer sans devenir dépendante du site actuel.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {coreBlocks.map(([title, text], index) => (
                <motion.div key={title} initial={{ opacity: 0, x: 18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }} whileHover={{ scale: 1.025, borderColor: "rgba(239,68,68,.35)" }} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.035] p-5">
                  <motion.div className="absolute bottom-0 left-0 h-px bg-red-500" initial={{ width: 0 }} whileInView={{ width: "100%" }} viewport={{ once: true }} transition={{ delay: .2 + index * .1, duration: .8 }} />
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">{text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-white/[.02] px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Angel OS IA</p>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-5xl">La première distribution au-dessus du Core.</h2>
              <p className="mt-5 text-base leading-relaxed text-white/55">Angel OS IA correspond à mon environnement personnel : assistant IA, automatisations, recherche, projets, contenus, messagerie, statistiques, studio et outils de pilotage. Ces fonctions vivent au-dessus du Core et ne doivent pas être confondues avec le noyau lui-même.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Bot, title: "IA", text: "Agents, assistance, synthèse et orchestration." },
                { icon: Workflow, title: "Automatisation", text: "Enchaînement de tâches et actions récurrentes." },
                { icon: Network, title: "Connexions", text: "APIs, services externes et modules optionnels." },
                { icon: ShieldCheck, title: "Séparation", text: "Le Core reste indépendant des données privées et de l'interface." },
              ].map((item, index) => (
                <motion.div key={item.title} initial={{ opacity: 0, scale: .92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * .1 }} whileHover={{ y: -7, scale: 1.02 }} className="group rounded-3xl border border-white/10 bg-[#0b0d10] p-6 transition-colors hover:border-red-500/30">
                  <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3 + index, repeat: Infinity }}><item.icon size={22} className="text-red-400" /></motion.div>
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-white/45">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Aujourd'hui et demain</p>
              <h2 className="mt-4 max-w-3xl font-display text-3xl font-bold sm:text-5xl">Un Core pensé pour plusieurs plateformes.</h2>
            </div>
            <motion.div className="hidden text-red-400 lg:block" animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}><Zap size={40} /></motion.div>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {roadmap.map((item, index) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .12 }} whileHover={{ y: -8, rotate: index % 2 ? .6 : -.6 }} className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[.035] p-6">
                <motion.div className="absolute -right-8 -top-8 h-20 w-20 rounded-full border border-red-500/15" animate={{ scale: [1, 1.25, 1], opacity: [.25, .7, .25] }} transition={{ duration: 4 + index, repeat: Infinity }} />
                <item.icon size={24} className="text-red-400" />
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/45">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-24 sm:px-8 lg:px-12">
        <motion.div initial={{ opacity: 0, scale: .97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="mx-auto max-w-6xl overflow-hidden rounded-[2.2rem] border border-red-500/20 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,.16),transparent_32%),#090b0e] p-8 sm:p-12">
          <motion.div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent)]" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Open source</p>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-5xl">Prendre le noyau. Construire autre chose.</h2>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/55">Le but n'est pas que tout le monde reproduise mon interface. Le Core sert de fondation : chacun peut écrire ses propres modules, ajouter ses IA, ses services, son design et ses adaptateurs. Angel OS IA n'est qu'une distribution possible.</p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/45">
                {["GPL-2.0-only", "modulaire", "fork-friendly", "Core v0.1", "web adapter actif"].map((tag) => <motion.span key={tag} whileHover={{ y: -2, color: "#fff" }} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{tag}</motion.span>)}
              </div>
            </div>
            <motion.a whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: .98 }} href="https://github.com/angelosmegaplus/angel-leclerc/tree/main/angel-os" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(239,68,68,.22)] transition hover:bg-red-400"><Github size={17} /> Code source <ArrowRight size={16} /></motion.a>
          </div>
        </motion.div>
      </section>

      <div className="pointer-events-none fixed bottom-4 right-4 z-20 hidden items-center gap-2 rounded-full border border-white/10 bg-black/65 px-3 py-2 text-[10px] uppercase tracking-[.18em] text-white/35 backdrop-blur md:flex">
        <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-400" animate={{ opacity: [.3, 1, .3] }} transition={{ duration: 1.5, repeat: Infinity }} /> Angel OS runtime · online
      </div>
    </main>
  );
}
