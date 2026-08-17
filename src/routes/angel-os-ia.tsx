import { useCallback, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BrainCircuit, ShieldCheck } from "lucide-react";
import { BootIntro } from "@/components/angel-os/BootIntro";

export const Route = createFileRoute("/angel-os-ia")({
  head: () => ({
    meta: [
      { title: "Angel OS IA — intelligence, maintenance et supervision" },
      {
        name: "description",
        content: "Angel OS IA réunit l’intelligence artificielle de l’espace administrateur, la maintenance avec ChatGPT, les données connectées et la supervision Angel Guard.",
      },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/angel-os-ia" }],
  }),
  component: AngelOsIaPage,
});

type Technology = {
  name: string;
  logo: string;
  text: string;
};

const technologies: Technology[] = [
  {
    name: "ChatGPT",
    logo: "/logos/chatgpt.com.svg",
    text: "Intervient autour du projet pour analyser les problèmes, corriger le code, faire évoluer les fonctions, contrôler les résultats et participer à la maintenance d’Angel OS.",
  },
  {
    name: "OpenAI API",
    logo: "https://cdn.simpleicons.org/openai/ffffff",
    text: "Fournit les capacités d’intelligence artificielle utilisées directement dans Angel OS IA pour la conversation, l’analyse et la rédaction.",
  },
  {
    name: "React",
    logo: "https://cdn.simpleicons.org/react/61DAFB",
    text: "Structure les interfaces et les composants interactifs du site et de l’espace administrateur.",
  },
  {
    name: "TypeScript",
    logo: "https://cdn.simpleicons.org/typescript/3178C6",
    text: "Porte la logique applicative et sécurise une grande partie du développement par le typage du code.",
  },
  {
    name: "TanStack",
    logo: "https://cdn.simpleicons.org/tanstack/ffffff",
    text: "Gère notamment le routage, les données asynchrones et une partie de l’architecture de l’application.",
  },
  {
    name: "Tailwind CSS",
    logo: "https://cdn.simpleicons.org/tailwindcss/06B6D4",
    text: "Gère une grande partie de la mise en page, du responsive et de l’identité visuelle de l’interface.",
  },
  {
    name: "Vite",
    logo: "https://cdn.simpleicons.org/vite/646CFF",
    text: "Construit l’application et fournit l’environnement de développement utilisé par le projet.",
  },
  {
    name: "GitHub",
    logo: "https://cdn.simpleicons.org/github/ffffff",
    text: "Centralise le code source, l’historique des modifications et les versions utilisées pour les corrections et les déploiements.",
  },
  {
    name: "Vercel",
    logo: "https://cdn.simpleicons.org/vercel/ffffff",
    text: "Construit et publie l’application web à partir du code du projet.",
  },
  {
    name: "Supabase",
    logo: "https://cdn.simpleicons.org/supabase/3FCF8E",
    text: "Gère la base de données, l’authentification et une partie des données privées de l’espace administrateur.",
  },
  {
    name: "Gmail API",
    logo: "https://cdn.simpleicons.org/gmail/EA4335",
    text: "Permet à l’espace administrateur de lire les mails utiles, y compris les messages reçus et envoyés, pour retrouver le contexte d’un échange ou d’une candidature.",
  },
  {
    name: "Google Calendar API",
    logo: "https://cdn.simpleicons.org/googlecalendar/4285F4",
    text: "Relie l’agenda Google aux informations affichées et utilisées dans Angel OS.",
  },
  {
    name: "Google Drive API",
    logo: "https://cdn.simpleicons.org/googledrive/4285F4",
    text: "Permet l’accès aux fichiers Google Drive utilisés par les fonctions connectées de l’administration.",
  },
  {
    name: "TMDB API",
    logo: "https://cdn.simpleicons.org/themoviedatabase/01B4E4",
    text: "Fournit les recherches, affiches, informations et métadonnées utilisées dans l’espace Films & séries.",
  },
];

function BackButton() {
  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/parcours#realisations";
  };

  return (
    <button
      onClick={goBack}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/65 transition hover:bg-white/10 hover:text-white"
    >
      <ArrowLeft size={15} /> Retour
    </button>
  );
}

function TechCard({ technology }: { technology: Technology }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[.025] p-5 transition hover:border-white/20 hover:bg-white/[.04]">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[.06] p-2.5">
          <img src={technology.logo} alt={`Logo ${technology.name}`} className="h-full w-full object-contain" loading="lazy" />
        </span>
        <h3 className="font-semibold text-white">{technology.name}</h3>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/50">{technology.text}</p>
    </article>
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
            <div className="hidden items-center gap-2 sm:flex">
              <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-8 w-8 rounded-lg object-cover" />
              <span className="text-sm font-semibold text-white/70">Angel OS IA</span>
            </div>
          </div>

          <div className="grid gap-10 pt-14 lg:grid-cols-[1.15fr_.85fr] lg:pt-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-300">Intelligence artificielle intégrée</p>
              <h1 className="mt-5 font-display text-5xl font-bold tracking-[-.05em] sm:text-7xl">Angel <span className="text-red-500">OS IA</span></h1>
              <p className="mt-6 max-w-3xl text-xl font-medium leading-snug text-white/85 sm:text-2xl">
                L’intelligence artificielle connectée à l’espace administrateur d’angel-leclerc.fr.
              </p>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/60 sm:text-lg">
                Angel OS IA utilise les données accessibles dans l’administration pour rechercher, analyser, rédiger, préparer des brouillons et assister certaines opérations à partir du contexte réel du site et de ses services connectés.
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
                <p>Candidatures, mails, agenda, articles, projets, tâches et autres données de l’espace administrateur servent de contexte lorsqu’elles sont accessibles.</p>
                <p>Les mails reçus et envoyés peuvent permettre de retrouver une candidature, une date d’envoi, une réponse ou de préparer un brouillon à partir du fil réel.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[.02] px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          <article className="rounded-[2rem] border border-red-500/20 bg-red-500/[.05] p-7 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10"><BrainCircuit className="h-6 w-6 text-red-300" /></div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-red-300">Angel OS IA</p>
            <h2 className="mt-2 text-2xl font-bold">Comprendre et assister</h2>
            <p className="mt-4 text-sm leading-7 text-white/55">Recherche, analyse, rédaction, résumés, brouillons, contexte administratif et assistance aux automatisations.</p>
          </article>

          <article className="rounded-[2rem] border border-orange-500/20 bg-orange-500/[.05] p-7 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10"><ShieldCheck className="h-6 w-6 text-orange-300" /></div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-orange-300">Angel Guard</p>
            <h2 className="mt-2 text-2xl font-bold">Surveiller et contrôler</h2>
            <p className="mt-4 text-sm leading-7 text-white/55">Surveille le fonctionnement d’Angel OS, détecte des anomalies, centralise les incidents et participe aux contrôles techniques et aux mécanismes de récupération.</p>
          </article>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-red-300">Infrastructure connectée</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Les technologies et API utilisées</h2>
            <p className="mt-4 text-base leading-8 text-white/55">Chaque élément ci-dessous a un rôle précis dans le fonctionnement, le développement ou les services connectés d’Angel OS IA.</p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {technologies.map((technology) => <TechCard key={technology.name} technology={technology} />)}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-white/[.025] p-7 sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-white/35">Fonctionnement</p>
          <h2 className="mt-3 font-display text-3xl font-bold">Un même environnement, des rôles différents</h2>
          <div className="mt-7 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <img src="/logos/chatgpt.com.svg" alt="Logo ChatGPT" className="mb-3 h-7 w-7 object-contain" />
              <p className="font-semibold">ChatGPT</p>
              <p className="mt-2 text-xs leading-5 text-white/45">Développement, corrections, contrôle et maintenance.</p>
            </div>
            <div className="rounded-2xl border border-red-500/25 bg-red-500/[.05] p-4">
              <img src="/angel-os/logo.png" alt="Logo Angel OS" className="mb-3 h-7 w-7 rounded-md object-cover" />
              <p className="font-semibold">Angel OS</p>
              <p className="mt-2 text-xs leading-5 text-white/45">Organisation de l’administration, des données et des fonctions internes.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <img src="https://cdn.simpleicons.org/openai/ffffff" alt="Logo OpenAI" className="mb-3 h-7 w-7 object-contain" />
              <p className="font-semibold">Angel OS IA</p>
              <p className="mt-2 text-xs leading-5 text-white/45">Intelligence intégrée, analyse, rédaction et assistance.</p>
            </div>
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[.04] p-4">
              <ShieldCheck className="mb-3 h-7 w-7 text-orange-300" />
              <p className="font-semibold">Angel Guard</p>
              <p className="mt-2 text-xs leading-5 text-white/45">Supervision, incidents et contrôles techniques.</p>
            </div>
          </div>
          <div className="mt-7">
            <Link to="/auth" className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">Accéder à l’administration</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
