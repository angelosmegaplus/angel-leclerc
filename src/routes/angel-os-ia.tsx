import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Ban, Github, LockKeyhole, Radar, RefreshCcw, ShieldCheck, Siren } from "lucide-react";
import { BootIntro } from "@/components/angel-os/BootIntro";
import { Hero } from "@/components/angel-os/Hero";
import { SiteFlow } from "@/components/angel-os/SiteFlow";

export const Route = createFileRoute("/angel-os-ia")({
  head: () => ({
    meta: [
      { title: "Angel OS, Angel OS IA & Angel Guard OS — système, intelligence et sécurité" },
      {
        name: "description",
        content:
          "Angel OS est le noyau système indépendant. Angel OS IA ajoute l'intelligence personnelle et les agents. Angel Guard OS forme la couche de sécurité autonome : détection, isolation, récupération, audit et rollback.",
      },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/angel-os-ia" }],
  }),
  component: AngelOsPage,
});

const guardCapabilities = [
  [Radar, "Détection continue", "Les erreurs d’authentification, d’API, de production et de runtime deviennent des signaux structurés et exploitables."],
  [Siren, "Priorisation automatique", "Angel Guard classe les incidents par criticité pour traiter d’abord ceux qui menacent l’accès, les données ou la production."],
  [Ban, "Blocage et isolation", "Un fournisseur instable ou une anomalie critique peut être isolé sans faire tomber l’ensemble d’Angel OS."],
  [RefreshCcw, "Auto-récupération", "Nouvelle tentative, fallback, resynchronisation, restauration ou rollback sont déclenchés selon la nature de la panne."],
  [Activity, "Preuves et audit", "Chaque décision laisse une trace : signal, raison, date, action et résultat vérifiable."],
] as const;

function AngelOsPage() {
  const [booting, setBooting] = useState(true);
  const finishBoot = useCallback(() => setBooting(false), []);

  if (booting) {
    return (
      <main className="min-h-screen bg-[#050607] text-white">
        <BootIntro done={finishBoot} />
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#050607] text-white">
      <Hero />
      <SiteFlow />

      <section className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-red-500/20 bg-red-500/[.06] p-8 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <img src="/angel-os/logo.png" alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Angel OS Core · Linux-ready</p>
                <h2 className="mt-2 break-words font-display text-2xl font-bold leading-tight sm:text-3xl">
                  Angel OS reste indépendant. Angel OS IA devient la couche personnelle.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                  Angel OS porte les fonctions système neutres : événements, workflows durables, données, synchronisation, stockage, releases, déploiement multi-cibles, nœuds, récupération et observabilité. Il reste réutilisable dans d’autres projets et peut fonctionner sans intelligence artificielle personnelle.
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
                  Angel OS IA est la distribution personnelle construite au-dessus : fournisseurs IA, assistant, agents, mémoire personnelle, préférences, recommandations, priorisation, candidatures, mails, agenda, actualités personnalisées, Movix et automatisations intelligentes. Angel OS observe et exécute ; Angel OS IA comprend, personnalise et recommande.
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
                  Les services existants restent complémentaires : GitHub versionne le code, Vercel peut servir un nœud web, Google Drive archive les fichiers lourds et les moteurs Angel Native renforcent l’ensemble.
                </p>
              </div>
            </div>
            <a
              href="https://github.com/angelosmegaplus/angel-leclerc/tree/main/angel-os"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              <Github size={17} /> Code source
            </a>
          </div>
        </div>
      </section>

      <section className="border-y border-orange-500/15 bg-[radial-gradient(circle_at_75%_20%,rgba(249,115,22,.14),transparent_35%),#070707] px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-400/30 bg-orange-500/10">
                  <LockKeyhole className="h-7 w-7 text-orange-400" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.22em] text-orange-400">Couche de sécurité autonome</p>
                  <h2 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Angel Guard OS</h2>
                </div>
              </div>
              <p className="mt-6 text-base leading-8 text-white/65">
                Angel Guard OS est le système immunitaire d’Angel OS. Il observe les applications, les API, l’authentification, l’infrastructure et les workflows pour détecter une anomalie, choisir une réponse, agir puis vérifier que le système est réellement revenu dans un état sain.
              </p>
              <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/[.06] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
                  <div>
                    <p className="font-semibold text-white">Détecter → décider → agir → vérifier → apprendre</p>
                    <p className="mt-2 text-sm leading-6 text-white/50">
                      La sécurité ne doit pas être une simple page de réglages. Elle fait partie du fonctionnement permanent du système, avec des actions automatiques contrôlées et un historique compréhensible.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {guardCapabilities.map(([Icon, title, text]) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-white/[.035] p-5 last:sm:col-span-2">
                  <Icon className="h-5 w-5 text-orange-400" />
                  <h3 className="mt-4 font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">{text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[.025] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-white/35">Une seule architecture</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div><p className="font-semibold">Angel OS</p><p className="mt-2 text-sm leading-6 text-white/45">Le noyau : orchestration, données, événements, workflows, déploiement et services système.</p></div>
              <div><p className="font-semibold">Angel OS IA</p><p className="mt-2 text-sm leading-6 text-white/45">L’intelligence : compréhension, mémoire, agents, recommandations et automatisations personnalisées.</p></div>
              <div><p className="font-semibold">Angel Guard OS</p><p className="mt-2 text-sm leading-6 text-white/45">La protection : détection, isolation, récupération, vérification, audit et rollback.</p></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
