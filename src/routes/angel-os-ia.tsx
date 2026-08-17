import { useCallback, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BrainCircuit, ChevronDown, Database, Network, ShieldCheck, Sparkles, Wrench } from "lucide-react";
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
      { name: "theme-color", content: "#f6f3ee" },
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
  { name: "ChatGPT", logo: "/logos/chatgpt.com.svg", text: "Analyse les problèmes, aide aux corrections, au contrôle et à la maintenance du projet." },
  { name: "OpenAI API", logo: "https://cdn.simpleicons.org/openai/111111", text: "Fournit les capacités d’intelligence artificielle utilisées directement dans Angel OS IA." },
  { name: "React", logo: "https://cdn.simpleicons.org/react/149ECA", text: "Structure les interfaces et les composants interactifs." },
  { name: "TypeScript", logo: "https://cdn.simpleicons.org/typescript/3178C6", text: "Porte la logique applicative et sécurise le développement par le typage." },
  { name: "TanStack", logo: "https://cdn.simpleicons.org/tanstack/111111", text: "Gère le routage, les données asynchrones et une partie de l’architecture." },
  { name: "Tailwind CSS", logo: "https://cdn.simpleicons.org/tailwindcss/06B6D4", text: "Gère la mise en page responsive et l’identité visuelle." },
  { name: "Vite", logo: "https://cdn.simpleicons.org/vite/646CFF", text: "Construit l’application et fournit l’environnement de développement." },
  { name: "GitHub", logo: "https://cdn.simpleicons.org/github/111111", text: "Centralise le code, l’historique des modifications et les versions." },
  { name: "Vercel", logo: "https://cdn.simpleicons.org/vercel/111111", text: "Construit et publie l’application web à partir du code du projet." },
  { name: "Supabase", logo: "https://cdn.simpleicons.org/supabase/3FCF8E", text: "Gère la base de données, l’authentification et les données privées." },
  { name: "Gmail API", logo: "https://cdn.simpleicons.org/gmail/EA4335", text: "Relie les mails utiles à l’administration et au suivi des candidatures." },
  { name: "Google Calendar API", logo: "https://cdn.simpleicons.org/googlecalendar/4285F4", text: "Relie l’agenda Google aux informations utilisées dans Angel OS." },
  { name: "Google Drive API", logo: "https://cdn.simpleicons.org/googledrive/4285F4", text: "Donne accès aux fichiers Google Drive nécessaires aux fonctions connectées." },
  { name: "TMDB API", logo: "https://cdn.simpleicons.org/themoviedatabase/01B4E4", text: "Fournit les recherches, affiches et métadonnées de l’espace Films & séries." },
];

const card = "rounded-[1.6rem] border border-[#ded8cf] bg-white shadow-[0_14px_45px_rgba(35,31,27,.06)]";

function BackButton() {
  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/parcours#realisations";
  };
  return (
    <button onClick={goBack} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d8d1c8] bg-white px-4 py-2 text-sm font-semibold text-[#34302c] shadow-sm transition hover:bg-[#f8f5f0]">
      <ArrowLeft size={15} /> Retour
    </button>
  );
}

function TechCard({ technology }: { technology: Technology }) {
  return (
    <article className={`${card} min-w-0 p-4 sm:p-5`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#e6e0d8] bg-[#faf8f4] p-2.5">
          <img src={technology.logo} alt={`Logo ${technology.name}`} className="h-full w-full object-contain" loading="lazy" />
        </span>
        <h3 className="min-w-0 break-words font-semibold text-[#181614]">{technology.name}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#6b655e]">{technology.text}</p>
    </article>
  );
}

function ExpandableWidget({ title, eyebrow, children, defaultOpen = false }: { title: string; eyebrow: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className={`${card} group p-4 sm:p-5`}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl outline-none marker:hidden">
        <span className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-[.16em] text-[#b44738]">{eyebrow}</span>
          <span className="mt-1 block text-lg font-bold tracking-[-.025em] text-[#181614] sm:text-xl">{title}</span>
        </span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#ded8cf] bg-[#faf8f4] text-[#5e5750] transition group-open:rotate-180">
          <ChevronDown className="h-4 w-4" />
        </span>
      </summary>
      <div className="pt-4 text-sm leading-7 text-[#6b655e]">{children}</div>
    </details>
  );
}

function AngelOsIaPage() {
  const [booting, setBooting] = useState(true);
  const finishBoot = useCallback(() => setBooting(false), []);

  if (booting) {
    return (
      <main className="min-h-screen bg-[#f6f3ee] text-[#181614]">
        <BootIntro done={finishBoot} />
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#f6f3ee] text-[#181614]">
      <section className="relative isolate overflow-hidden px-4 pb-10 pt-5 sm:px-7 sm:pb-14 sm:pt-7 lg:px-10 lg:pb-16">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_12%_8%,rgba(203,78,62,.12),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(72,112,190,.09),transparent_24%),linear-gradient(180deg,#fbfaf8_0%,#f6f3ee_100%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 opacity-[.18] [background-image:linear-gradient(rgba(91,79,68,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(91,79,68,.08)_1px,transparent_1px)] [background-size:38px_38px]" />

        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-3">
            <BackButton />
            <div className="flex items-center gap-2 rounded-full border border-[#ddd6ce] bg-white/80 px-3 py-2 shadow-sm backdrop-blur">
              <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-7 w-7 rounded-lg object-cover" />
              <span className="hidden text-xs font-semibold text-[#554e47] xs:inline sm:text-sm">Angel OS IA</span>
            </div>
          </div>

          <div className="pt-10 sm:pt-14 lg:pt-16">
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#b44738] sm:text-xs">Intelligence artificielle intégrée</p>
            <h1 className="mt-3 max-w-5xl font-display text-[clamp(3rem,12vw,7.4rem)] font-black leading-[.86] tracking-[-.065em] text-[#171513]">
              Angel <span className="text-[#c54f41]">OS IA</span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-snug text-[#37322d] sm:text-2xl lg:text-3xl">
              Une couche d’intelligence reliée aux outils réels de l’administration.
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6b655e] sm:text-base sm:leading-8">
              Angel OS IA peut exploiter les données disponibles dans l’espace administrateur pour rechercher, analyser, résumer, rédiger, préparer des brouillons et assister certaines opérations, tout en restant séparé des fonctions de supervision d’Angel Guard.
            </p>
          </div>

          <div className="mt-8 grid auto-rows-[minmax(9rem,auto)] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4">
            <article className={`${card} relative overflow-hidden p-5 sm:p-6 lg:col-span-7 lg:row-span-2`}>
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#c94f40]/10 blur-3xl" />
              <div className="relative flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#c94f40] text-white shadow-lg shadow-[#c94f40]/20"><BrainCircuit className="h-6 w-6" /></span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#b44738]">Cœur IA</p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-.035em] sm:text-3xl">Comprendre le contexte, puis agir avec lui</h2>
                </div>
              </div>
              <p className="relative mt-5 max-w-2xl text-sm leading-7 text-[#625b54] sm:text-base sm:leading-8">
                Candidatures, mails, agenda, articles, projets, tâches et autres données de l’administration peuvent devenir un contexte exploitable. L’objectif n’est pas d’avoir un simple chatbot posé à côté du site, mais une IA capable de comprendre ce qui se passe réellement dans le système.
              </p>
              <div className="relative mt-6 flex flex-wrap gap-2">
                {["Recherche", "Analyse", "Rédaction", "Résumés", "Brouillons", "Contexte"].map((item) => <span key={item} className="rounded-full border border-[#ded8cf] bg-[#faf8f4] px-3 py-1.5 text-xs font-semibold text-[#504941]">{item}</span>)}
              </div>
            </article>

            <article className={`${card} p-5 sm:p-6 lg:col-span-5`}>
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff0e8] text-[#c2643c]"><ShieldCheck className="h-5 w-5" /></span>
                <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#b9673d]">Angel Guard</p><h2 className="mt-1 text-xl font-black tracking-[-.03em]">Surveiller sans mélanger les rôles</h2></div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#6b655e]">Angel Guard reste le bloc de supervision : incidents, contrôles techniques, détection d’anomalies et récupération.</p>
            </article>

            <article className={`${card} p-5 sm:p-6 lg:col-span-5`}>
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#edf3ff] text-[#466fa8]"><Database className="h-5 w-5" /></span>
                <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#5276a8]">Données</p><h2 className="mt-1 text-xl font-black tracking-[-.03em]">Connecté au réel</h2></div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#6b655e]">Les réponses utiles doivent venir de données accessibles et de services réellement connectés, pas d’un décor qui prétend être connecté.</p>
            </article>

            <article className={`${card} p-5 sm:col-span-2 sm:p-6 lg:col-span-4`}>
              <Sparkles className="h-5 w-5 text-[#c54f41]" />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-[#b44738]">Administration</p>
              <h2 className="mt-1 text-xl font-black tracking-[-.03em]">Une IA dans le système, pas à côté</h2>
              <p className="mt-3 text-sm leading-7 text-[#6b655e]">L’IA peut être appelée depuis les espaces où le contexte est déjà présent.</p>
            </article>

            <article className={`${card} p-5 sm:p-6 lg:col-span-4`}>
              <Network className="h-5 w-5 text-[#5276a8]" />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-[#5276a8]">Connecteurs</p>
              <h2 className="mt-1 text-xl font-black tracking-[-.03em]">Google, données et API</h2>
              <p className="mt-3 text-sm leading-7 text-[#6b655e]">Les services externes enrichissent Angel OS uniquement lorsqu’ils sont réellement disponibles.</p>
            </article>

            <article className={`${card} p-5 sm:p-6 lg:col-span-4`}>
              <Wrench className="h-5 w-5 text-[#7867a9]" />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-[#7867a9]">Maintenance</p>
              <h2 className="mt-1 text-xl font-black tracking-[-.03em]">ChatGPT autour du projet</h2>
              <p className="mt-3 text-sm leading-7 text-[#6b655e]">Analyse, corrections, contrôle du code et évolution des fonctionnalités restent distingués du moteur IA intégré.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-7 sm:py-14 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#b44738]">Infrastructure connectée</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-[-.045em] sm:text-4xl">Les technologies derrière Angel OS IA</h2>
            <p className="mt-3 text-sm leading-7 text-[#6b655e] sm:text-base">Sur mobile, les cartes restent lisibles et empilées. Sur écran plus large, elles se recomposent automatiquement sans imposer une hauteur identique.</p>
          </div>
          <div className="mt-7 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {technologies.map((technology) => <TechCard key={technology.name} technology={technology} />)}
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-7 sm:pb-20 lg:px-10">
        <div className="mx-auto grid max-w-6xl items-start gap-3 lg:grid-cols-2">
          <ExpandableWidget eyebrow="Fonctionnement" title="Comment les rôles se répartissent" defaultOpen>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#faf8f4] p-4"><strong className="text-[#181614]">ChatGPT</strong><p className="mt-1">Développement, corrections, contrôle et maintenance.</p></div>
              <div className="rounded-2xl bg-[#faf8f4] p-4"><strong className="text-[#181614]">Angel OS</strong><p className="mt-1">Organisation de l’administration, des données et des fonctions internes.</p></div>
              <div className="rounded-2xl bg-[#faf8f4] p-4"><strong className="text-[#181614]">Angel OS IA</strong><p className="mt-1">Intelligence intégrée, analyse, rédaction et assistance.</p></div>
              <div className="rounded-2xl bg-[#faf8f4] p-4"><strong className="text-[#181614]">Angel Guard</strong><p className="mt-1">Supervision, incidents et contrôles techniques.</p></div>
            </div>
          </ExpandableWidget>

          <ExpandableWidget eyebrow="Principe" title="Une interface qui peut respirer">
            <p>Les widgets ne sont plus enfermés dans une grille rigide. Une carte courte reste courte ; une carte qui a plus de contenu peut s’allonger naturellement. Les blocs détaillés peuvent aussi être ouverts ou repliés, ce qui évite les kilomètres de scroll sur téléphone.</p>
          </ExpandableWidget>
        </div>

        <div className="mx-auto mt-8 max-w-6xl rounded-[1.8rem] bg-[#181614] p-5 text-white shadow-[0_20px_60px_rgba(24,22,20,.16)] sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Espace privé</p>
            <p className="mt-1 text-xl font-bold tracking-[-.03em] sm:text-2xl">Angel OS reste accessible depuis l’administration.</p>
          </div>
          <Link to="/auth" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#181614] transition hover:bg-[#f1ede7] sm:mt-0 sm:w-auto">Accéder à l’administration</Link>
        </div>
      </section>
    </main>
  );
}
