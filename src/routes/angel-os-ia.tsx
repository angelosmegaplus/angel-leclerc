import { useCallback, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BrainCircuit, ShieldCheck, Wrench, Database, Cloud, Code2, Mail, CalendarDays, Film, GitBranch } from "lucide-react";
import { BootIntro } from "@/components/angel-os/BootIntro";

export const Route = createFileRoute("/angel-os-ia")({
  head: () => ({
    meta: [
      { title: "Angel OS IA — intelligence, maintenance et supervision" },
      {
        name: "description",
        content:
          "Angel OS IA réunit les fonctions d’intelligence artificielle de l’espace administrateur, la maintenance avec ChatGPT et la supervision Angel Guard.",
      },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/angel-os-ia" }],
  }),
  component: AngelOsIaPage,
});

const technologies = [
  { icon: Wrench, name: "ChatGPT", text: "Intervient sur le développement, les corrections, la maintenance et certaines opérations automatisées autour d’Angel OS." },
  { icon: BrainCircuit, name: "OpenAI API", text: "Fournit les capacités d’intelligence artificielle intégrées à Angel OS IA." },
  { icon: Code2, name: "React", text: "Structure les interfaces et les composants de l’application." },
  { icon: Code2, name: "TypeScript", text: "Porte la logique applicative et une grande partie du fonctionnement du système." },
  { icon: GitBranch, name: "GitHub", text: "Centralise le code source, les versions et l’historique des modifications." },
  { icon: Cloud, name: "Vercel", text: "Construit et déploie l’application web." },
  { icon: Database, name: "Supabase", text: "Gère la base de données, l’authentification et les données internes utilisées par l’administration." },
  { icon: Mail, name: "Google APIs", text: "Relient notamment Gmail et Google Calendar aux fonctions de l’espace administrateur." },
  { icon: Film, name: "TMDB API", text: "Alimente les recherches et les informations utilisées dans l’espace Films & séries." },
] as const;

function BackButton() {
  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/parcours#realisations";
  };
  return (
    <button onClick={goBack} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/65 transition hover:text-white">
      <ArrowLeft size={15} /> Retour
    </button>
  );
}

function AngelOsIaPage() {
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
      <section className="relative isolate overflow-hidden px-5 pb-20 pt-8 sm:px-8 lg:px-12">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_18%,rgba(225,55,55,.16),transparent_30%),linear-gradient(180deg,#0a0b0d_0%,#050607_76%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 opacity-[.07] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4">
            <BackButton />
            <div className="hidden items-center gap-2 sm:flex"><img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-8 w-8 rounded-lg object-cover" /><span className="text-sm font-semibold text-white/70">Angel OS IA</span></div>
          </div>

          <div className="grid gap-10 pt-14 lg:grid-cols-[1.15fr_.85fr] lg:pt-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-300">Intelligence artificielle intégrée</p>
              <h1 className="mt-5 font-display text-5xl font-bold tracking-[-.05em] sm:text-7xl">Angel <span className="text-red-500">OS IA</span></h1>
              <p className="mt-6 max-w-3xl text-xl font-medium leading-snug text-white/85 sm:text-2xl">
                L’intelligence artificielle de l’espace administrateur d’angel-leclerc.fr.
              </p>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/60 sm:text-lg">
                Angel OS IA utilise les données disponibles dans l’administration pour rechercher, analyser, rédiger, assister certaines actions et exploiter le contexte des outils connectés.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10]/95 p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                <div>
                  <p className="text-xs uppercase tracking-[.22em] text-white/35">Angel OS</p>
                  <h2 className="mt-2 text-2xl font-bold">Administration connectée</h2>
                </div>
              </div>
              <div className="mt-6 space-y-3 text-sm leading-7 text-white/55">
                <p>Candidatures, mails, agenda, articles, projets, tâches et autres données de l’espace administrateur peuvent être utilisées comme contexte lorsqu’elles sont accessibles.</p>
                <p>Les mails reçus et envoyés peuvent notamment servir à retrouver l’historique d’une candidature ou préparer un brouillon à partir d’un fil réel.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[.02] px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          <article className="rounded-[2rem] border border-red-500/20 bg-red-500/[.05] p-7 sm:p-8">
            <BrainCircuit className="h-6 w-6 text-red-300" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-red-300">Angel OS IA</p>
            <h2 className="mt-2 text-2xl font-bold">Comprendre et assister</h2>
            <p className="mt-4 text-sm leading-7 text-white/55">Recherche, analyse, rédaction, résumés, brouillons, contexte administratif et assistance aux automatisations.</p>
          </article>
          <article className="rounded-[2rem] border border-orange-500/20 bg-orange-500/[.05] p-7 sm:p-8">
            <ShieldCheck className="h-6 w-6 text-orange-300" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-orange-300">Angel Guard</p>
            <h2 className="mt-2 text-2xl font-bold">Surveiller et contrôler</h2>
            <p className="mt-4 text-sm leading-7 text-white/55">Surveille le fonctionnement d’Angel OS, détecte des anomalies, centralise des incidents et participe aux contrôles techniques et à la récupération.</p>
          </article>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-red-300">Infrastructure connectée</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Les outils utilisés autour d’Angel OS IA</h2>
            <p className="mt-4 text-base leading-8 text-white/55">L’ensemble fonctionne avec une infrastructure connectée associant les technologies et API utilisées par le système.</p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {technologies.map(({ icon: Icon, name, text }) => (
              <article key={name} className="rounded-3xl border border-white/10 bg-white/[.025] p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"><Icon className="h-5 w-5 text-red-300" /></span>
                  <h3 className="font-semibold text-white">{name}</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/50">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-white/[.025] p-7 sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-white/35">Fonctionnement</p>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 font-semibold">ChatGPT</div>
            <div className="rounded-2xl border border-red-500/25 bg-red-500/[.05] p-4 font-semibold">Angel OS</div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 font-semibold">Angel OS IA</div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 font-semibold">Angel Guard</div>
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-7 text-white/50">ChatGPT intervient sur le développement et la maintenance. Angel OS organise l’application et ses données. Angel OS IA apporte les fonctions intelligentes intégrées. Angel Guard assure la supervision technique.</p>
          <div className="mt-7"><Link to="/auth" className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black">Accéder à l’administration</Link></div>
        </div>
      </section>
    </main>
  );
}
