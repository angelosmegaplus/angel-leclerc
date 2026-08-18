import { useCallback, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BrainCircuit, ChevronDown, Cpu, Database, ExternalLink, Network, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { BootIntro } from "@/components/angel-os/BootIntro";

export const Route = createFileRoute("/angel-os-ia")({
  head: () => ({
    meta: [
      { title: "Angel OS — système, intelligence et supervision" },
      {
        name: "description",
        content: "Présentation de l’architecture Angel OS : le système central, Angel OS IA pour l’intelligence intégrée et Angel Guard pour la supervision technique.",
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
  logo?: string;
  text: string;
  wordmark?: string;
  href?: string;
  actionLabel?: string;
};

const technologies: Technology[] = [
  { name: "Passerelle IA Lovable", wordmark: "IA", text: "Fournit les capacités d’intelligence artificielle (modèles Google Gemini) utilisées par Angel OS IA." },
  { name: "ChatGPT", logo: "/logos/chatgpt.com.svg", text: "Intervient autour du projet pour l’analyse, les corrections, le contrôle et la maintenance." },
  { name: "React", logo: "https://cdn.simpleicons.org/react/149ECA", text: "Structure les interfaces et les composants interactifs d’Angel OS." },
  { name: "TypeScript", logo: "https://cdn.simpleicons.org/typescript/3178C6", text: "Porte la logique applicative et sécurise le développement par le typage." },
  { name: "TanStack", logo: "https://cdn.simpleicons.org/tanstack/111111", text: "Gère le routage, les données asynchrones et une partie de l’architecture." },
  { name: "Tailwind CSS", logo: "https://cdn.simpleicons.org/tailwindcss/06B6D4", text: "Gère la mise en page responsive et l’identité visuelle." },
  { name: "Vite", logo: "https://cdn.simpleicons.org/vite/646CFF", text: "Construit l’application et fournit l’environnement de développement." },
  { name: "GitHub", logo: "https://cdn.simpleicons.org/github/111111", text: "Centralise le code source, l’historique des modifications et les versions publiques du projet.", href: "https://github.com/angelosmegaplus/angel-leclerc", actionLabel: "Voir le dépôt GitHub" },
  { name: "Vercel", logo: "https://cdn.simpleicons.org/vercel/111111", text: "Construit et publie l’application web à partir du code du projet." },
  { name: "Supabase", logo: "https://cdn.simpleicons.org/supabase/3FCF8E", text: "Gère la base de données, l’authentification et les données privées." },
  { name: "Gmail API", logo: "https://cdn.simpleicons.org/gmail/EA4335", text: "Relie les mails utiles à l’administration et au suivi des candidatures." },
  { name: "Google Calendar API", logo: "https://cdn.simpleicons.org/googlecalendar/4285F4", text: "Relie l’agenda Google aux informations utilisées dans Angel OS." },
  { name: "Google Drive API", logo: "https://cdn.simpleicons.org/googledrive/4285F4", text: "Donne accès aux fichiers Google Drive nécessaires aux fonctions connectées." },
  { name: "TMDB API", logo: "https://cdn.simpleicons.org/themoviedatabase/01B4E4", text: "Fournit les recherches, affiches et métadonnées de l’espace Films & séries." },
];

const card = "rounded-[1.35rem] border border-[#ded8cf] bg-white";

const codeRows = [
  "angel_os.route()         // system",
  "angel_os.data.sync()     // active",
  "angel_os_ia.context()    // intelligence",
  "angel_os_ia.assist()     // ready",
  "angel_guard.health()     // monitoring",
  "angel_guard.recover()    // standby",
  "deployment.main()        // production",
  "connectors.refresh()     // available",
];

function BackButton() {
  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/parcours#realisations";
  };
  return (
    <button onClick={goBack} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d8d1c8] bg-white px-4 py-2 text-sm font-semibold text-[#34302c] transition hover:bg-[#f8f5f0]">
      <ArrowLeft size={15} /> Retour
    </button>
  );
}

function TechCard({ technology }: { technology: Technology }) {
  return (
    <article className={`${card} min-w-0 p-4 sm:p-5`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e6e0d8] bg-[#faf8f4] p-2.5">
          {technology.logo ? (
            <img src={technology.logo} alt={`Logo ${technology.name}`} className="h-full w-full object-contain" loading="lazy" />
          ) : (
            <span className="text-[10px] font-black tracking-[-.04em] text-[#111]">{technology.wordmark}</span>
          )}
        </span>
        <h3 className="min-w-0 break-words font-semibold text-[#181614]">{technology.name}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#6b655e]">{technology.text}</p>
      {technology.href ? (
        <a href={technology.href} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d8d1c8] bg-[#faf8f4] px-3 py-2 text-xs font-bold text-[#181614] transition hover:bg-[#f1ede7]">
          {technology.actionLabel || "Ouvrir"} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : null}
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

function LiveCodeRail() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] overflow-hidden lg:block">
      <div className="absolute inset-0 bg-gradient-to-l from-[#f6f3ee]/30 via-[#f6f3ee]/72 to-[#f6f3ee]" />
      <div className="angel-code-stream absolute right-0 top-0 w-full space-y-3 pr-8 pt-8 font-mono text-[11px] leading-6 text-[#665f57]/35">
        {[...codeRows, ...codeRows, ...codeRows].map((row, index) => (
          <div key={`${row}-${index}`} className="whitespace-nowrap border-l border-[#c54f41]/15 pl-3">{row}</div>
        ))}
      </div>
    </div>
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
      <style>{`
        @keyframes angelCodeFlow {
          0% { transform: translateY(-22%); }
          100% { transform: translateY(8%); }
        }
        .angel-code-stream { animation: angelCodeFlow 26s linear infinite alternate; }
        @media (prefers-reduced-motion: reduce) { .angel-code-stream { animation: none; } }
      `}</style>

      <section className="relative isolate overflow-hidden px-4 pb-10 pt-5 sm:px-7 sm:pb-14 sm:pt-7 lg:px-10 lg:pb-16">
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,#fbfaf8_0%,#f6f3ee_100%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 opacity-[.14] [background-image:linear-gradient(rgba(91,79,68,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(91,79,68,.08)_1px,transparent_1px)] [background-size:38px_38px]" />
        <LiveCodeRail />

        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-3">
            <BackButton />
            <div className="flex items-center gap-2 rounded-full border border-[#ddd6ce] bg-white/90 px-3 py-2">
              <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-7 w-7 rounded-lg object-cover" />
              <span className="hidden text-xs font-semibold text-[#554e47] xs:inline sm:text-sm">Architecture Angel OS</span>
            </div>
          </div>

          <div className="max-w-4xl pt-10 sm:pt-14 lg:pt-16">
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#b44738] sm:text-xs">Système · intelligence · supervision</p>
            <h1 className="mt-3 max-w-5xl font-display text-[clamp(3rem,11vw,7rem)] font-black leading-[.9] tracking-[-.06em] text-[#171513]">
              Angel <span className="text-[#c54f41]">OS</span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-snug text-[#37322d] sm:text-2xl lg:text-3xl">
              Un système central, une couche d’intelligence et une couche de supervision.
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6b655e] sm:text-base sm:leading-8">
              Angel OS organise l’administration, les données, les applications, les connecteurs et les automatisations. Angel OS IA ajoute les capacités d’analyse et d’assistance. Angel Guard surveille l’ensemble et prend en charge les contrôles techniques, les incidents et la récupération.
            </p>
            <a href="https://github.com/angelosmegaplus/angel-leclerc" target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#181614] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2a2724]">
              Voir le code sur GitHub <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-8 grid gap-3 lg:grid-cols-3">
            <article className={`${card} border-[#d6d0c8] p-5 sm:p-6`}>
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#181614] text-white"><Cpu className="h-6 w-6" /></span>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[#6f675f]">Système central</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-.035em]">Angel OS</h2>
              <p className="mt-3 text-sm leading-7 text-[#625b54]">Le noyau qui organise l’administration, les données, les applications, les connecteurs, les tâches et les automatisations.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Administration", "Données", "Applications", "Connecteurs", "Automatisations"].map((item) => <span key={item} className="rounded-full border border-[#ded8cf] bg-[#faf8f4] px-3 py-1.5 text-xs font-semibold text-[#504941]">{item}</span>)}
              </div>
            </article>

            <article className={`${card} border-[#e1b7b0] p-5 sm:p-6`}>
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#c94f40] text-white"><BrainCircuit className="h-6 w-6" /></span>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[#b44738]">Couche d’intelligence</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-.035em]">Angel OS IA</h2>
              <p className="mt-3 text-sm leading-7 text-[#625b54]">Comprend le contexte fourni par Angel OS pour rechercher, analyser, résumer, rédiger, préparer des brouillons et assister certaines opérations.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Contexte", "Analyse", "Recherche", "Rédaction", "Assistance"].map((item) => <span key={item} className="rounded-full border border-[#ead1cc] bg-[#fff8f6] px-3 py-1.5 text-xs font-semibold text-[#8d4339]">{item}</span>)}
              </div>
            </article>

            <article className={`${card} border-[#d9d2e6] p-5 sm:p-6`}>
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#65558f] text-white"><ShieldCheck className="h-6 w-6" /></span>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[#6f5c9a]">Couche de supervision</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-.035em]">Angel Guard</h2>
              <p className="mt-3 text-sm leading-7 text-[#625b54]">Observe la santé du système, détecte les anomalies, suit les incidents et aide à déclencher les contrôles ou mécanismes de récupération.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Santé", "Incidents", "Anomalies", "Contrôles", "Récupération"].map((item) => <span key={item} className="rounded-full border border-[#ddd6eb] bg-[#faf8ff] px-3 py-1.5 text-xs font-semibold text-[#65558f]">{item}</span>)}
              </div>
            </article>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className={`${card} p-5`}><Database className="h-5 w-5 text-[#5276a8]" /><p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-[#5276a8]">Données</p><h3 className="mt-1 text-lg font-black">Le contexte vient du système</h3><p className="mt-2 text-sm leading-6 text-[#6b655e]">Mails, agenda, candidatures, articles, projets et autres données restent organisés par Angel OS.</p></article>
            <article className={`${card} p-5`}><Network className="h-5 w-5 text-[#5276a8]" /><p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-[#5276a8]">Connecteurs</p><h3 className="mt-1 text-lg font-black">Les services enrichissent Angel OS</h3><p className="mt-2 text-sm leading-6 text-[#6b655e]">Google, API et autres services externes sont utilisés uniquement lorsqu’ils sont réellement disponibles.</p></article>
            <article className={`${card} p-5`}><Sparkles className="h-5 w-5 text-[#c54f41]" /><p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-[#b44738]">Intelligence</p><h3 className="mt-1 text-lg font-black">L’IA n’est pas le système</h3><p className="mt-2 text-sm leading-6 text-[#6b655e]">Angel OS IA est une capacité intégrée à Angel OS, pas le noyau qui remplace tout le reste.</p></article>
            <article className={`${card} p-5`}><Wrench className="h-5 w-5 text-[#7867a9]" /><p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-[#7867a9]">Maintenance</p><h3 className="mt-1 text-lg font-black">ChatGPT reste autour du projet</h3><p className="mt-2 text-sm leading-6 text-[#6b655e]">Développement, corrections, contrôle du code et maintenance restent distingués d’Angel OS IA.</p></article>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-7 sm:py-14 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#b44738]">Infrastructure connectée</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-[-.045em] sm:text-4xl">Les technologies de l’écosystème Angel OS</h2>
            <p className="mt-3 text-sm leading-7 text-[#6b655e] sm:text-base">Ces technologies servent différentes parties du système. Angel OS IA alimente certaines fonctions d’Angel OS IA ; les autres composants assurent l’interface, les données, les connexions, le code et le déploiement.</p>
          </div>
          <div className="mt-7 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {technologies.map((technology) => <TechCard key={technology.name} technology={technology} />)}
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-7 sm:pb-20 lg:px-10">
        <div className="mx-auto grid max-w-6xl items-start gap-3 lg:grid-cols-2">
          <ExpandableWidget eyebrow="Architecture" title="Comment les trois couches se répartissent" defaultOpen>
            <div className="space-y-3">
              <div className="rounded-xl border border-[#ded8cf] bg-[#faf8f4] p-4"><strong className="text-[#181614]">Angel OS — noyau</strong><p className="mt-1">Organise les données, les applications, les connecteurs, les fonctions internes et les automatisations.</p></div>
              <div className="rounded-xl border border-[#ead1cc] bg-[#fff8f6] p-4"><strong className="text-[#181614]">Angel OS IA — intelligence</strong><p className="mt-1">Lit le contexte disponible dans Angel OS et ajoute analyse, recherche, rédaction et assistance.</p></div>
              <div className="rounded-xl border border-[#ddd6eb] bg-[#faf8ff] p-4"><strong className="text-[#181614]">Angel Guard — supervision</strong><p className="mt-1">Surveille la santé technique, les anomalies, les incidents et les mécanismes de récupération.</p></div>
            </div>
          </ExpandableWidget>

          <ExpandableWidget eyebrow="Autour du système" title="Ce qui reste volontairement séparé">
            <p><strong className="text-[#181614]">ChatGPT</strong> sert au développement, aux corrections, au contrôle et à la maintenance du projet. <strong className="text-[#181614]">Angel OS IA API</strong> peut fournir certaines capacités à Angel OS IA. Aucun de ces services ne remplace Angel OS lui-même ni Angel Guard.</p>
          </ExpandableWidget>
        </div>

        <div className="mx-auto mt-8 max-w-6xl rounded-[1.35rem] border border-[#2a2724] bg-[#181614] p-5 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Espace privé</p>
            <p className="mt-1 text-xl font-bold tracking-[-.03em] sm:text-2xl">Angel OS reste le système central de l’administration.</p>
          </div>
          <Link to="/auth" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#181614] transition hover:bg-[#f1ede7] sm:mt-0 sm:w-auto">Accéder à l’administration</Link>
        </div>
      </section>
    </main>
  );
}