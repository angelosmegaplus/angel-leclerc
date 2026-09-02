import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BrainCircuit,
  ChevronDown,
  Cpu,
  Database,
  ExternalLink,
  Network,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { brandLogos } from "@/assets/brands";
import { getAngelOsPublicStatus } from "@/lib/angel-os-status.functions";

export const Route = createFileRoute("/experiences")({
  head: () => ({
    meta: [
      { title: "Flamme OS — système, intelligence et supervision" },
      {
        name: "description",
        content: "Présentation de Flamme OS : système central d’administration, couche d’intelligence intégrée, supervision technique, données, connecteurs et automatisations.",
      },
      { name: "robots", content: "index,follow" },
      { name: "theme-color", content: "#f6f3ee" },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/experiences" }],
  }),
  component: FlammeOsPage,
});

type Technology = {
  name: string;
  logo?: string;
  text: string;
  wordmark?: string;
  href?: string;
  actionLabel?: string;
  state?: string;
};

const technologies: Technology[] = [
  { name: "Passerelle IA Lovable", wordmark: "IA", text: "Fournit les capacités d’intelligence artificielle utilisées par la couche IA de Flamme OS.", href: "https://docs.lovable.dev/features/ai", actionLabel: "Documentation", state: "En service" },
  { name: "Flamme Guard", wordmark: "FG", text: "Couche interne de supervision : santé technique, anomalies, incidents et récupération.", href: "/angel-guard-os", actionLabel: "Voir Flamme Guard", state: "Interne" },
  { name: "React", logo: brandLogos.react, text: "Structure les interfaces et les composants interactifs de Flamme OS.", href: "https://react.dev", actionLabel: "Site officiel", state: "En service" },
  { name: "TypeScript", logo: brandLogos.typescript, text: "Porte la logique applicative et sécurise le développement par le typage.", href: "https://www.typescriptlang.org", actionLabel: "Site officiel", state: "En service" },
  { name: "TanStack", logo: brandLogos.tanstack, text: "Gère le routage, les données asynchrones et une partie de l’architecture.", href: "https://tanstack.com", actionLabel: "Site officiel", state: "En service" },
  { name: "Tailwind CSS", logo: brandLogos.tailwindcss, text: "Gère la mise en page responsive et l’identité visuelle.", href: "https://tailwindcss.com", actionLabel: "Site officiel", state: "En service" },
  { name: "Vite", logo: brandLogos.vite, text: "Construit l’application et fournit l’environnement de développement.", href: "https://vite.dev", actionLabel: "Site officiel", state: "En service" },
  { name: "GitHub", logo: brandLogos.github, text: "Centralise le code source, l’historique des modifications et les versions du projet.", href: "https://github.com/angelosmegaplus/angel-leclerc", actionLabel: "Voir le dépôt GitHub", state: "En service" },
  { name: "Hébergement Lovable", wordmark: "LOV", text: "Construit et publie le site à partir du code du dépôt.", href: "https://lovable.dev", actionLabel: "Site officiel", state: "En service" },
  { name: "Supabase", logo: brandLogos.supabase, text: "Gère la base de données, l’authentification et les données privées.", href: "https://supabase.com", actionLabel: "Site officiel", state: "En service" },
  { name: "Gmail API", logo: brandLogos.gmail, text: "Relie les mails utiles à l’administration et au suivi.", href: "https://developers.google.com/gmail/api", actionLabel: "Documentation", state: "Espace privé" },
  { name: "Google Calendar API", logo: brandLogos.googlecalendar, text: "Relie l’agenda Google aux informations utilisées dans Flamme OS.", href: "https://developers.google.com/calendar", actionLabel: "Documentation", state: "Espace privé" },
  { name: "Google Drive API", logo: brandLogos.googledrive, text: "Donne accès aux fichiers Google Drive nécessaires aux fonctions connectées.", href: "https://developers.google.com/drive", actionLabel: "Documentation", state: "Espace privé" },
  { name: "TMDB API", logo: brandLogos.themoviedatabase, text: "Fournit les recherches, affiches et métadonnées du module Films & Séries.", href: "https://www.themoviedb.org", actionLabel: "Site officiel", state: "En service" },
];

const card = "rounded-[1.35rem] border border-[#ded8cf] bg-white";

const codeRows = [
  "flamme_os.route()        // system",
  "flamme_os.data.sync()    // active",
  "flamme_os.ai.context()   // intelligence",
  "flamme_os.ai.assist()    // ready",
  "flamme_guard.health()    // monitoring",
  "flamme_guard.recover()   // standby",
  "deployment.main()        // production",
  "connectors.refresh()     // available",
];

function TechCard({ technology }: { technology: Technology }) {
  return (
    <article className={`${card} min-w-0 p-4 sm:p-5`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e6e0d8] bg-[#faf8f4] p-2.5">
          {technology.logo ? <img src={technology.logo} alt={`Logo ${technology.name}`} className="h-full w-full object-contain" loading="lazy" /> : <span className="text-[10px] font-black text-[#111]">{technology.wordmark}</span>}
        </span>
        <h3 className="min-w-0 break-words font-semibold text-[#181614]">{technology.name}</h3>
      </div>
      {technology.state ? <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#ded8cf] bg-[#faf8f4] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#6b655e]"><span className="h-1.5 w-1.5 rounded-full bg-[#3f8f5f]" />{technology.state}</span> : null}
      <p className="mt-3 text-sm leading-6 text-[#6b655e]">{technology.text}</p>
      {technology.href ? technology.href.startsWith("/") ? (
        <Link to={technology.href} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d8d1c8] bg-[#faf8f4] px-3 py-2 text-xs font-bold text-[#181614]">{technology.actionLabel || "Ouvrir"}</Link>
      ) : (
        <a href={technology.href} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d8d1c8] bg-[#faf8f4] px-3 py-2 text-xs font-bold text-[#181614]">{technology.actionLabel || "Ouvrir"}<ExternalLink className="h-3.5 w-3.5" /></a>
      ) : null}
    </article>
  );
}

function ExpandableWidget({ title, eyebrow, children, defaultOpen = false }: { title: string; eyebrow: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className={`${card} group p-4 sm:p-5`}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3">
        <span><span className="block text-[10px] font-bold uppercase tracking-[.16em] text-[#b44738]">{eyebrow}</span><span className="mt-1 block text-lg font-bold text-[#181614] sm:text-xl">{title}</span></span>
        <span className="grid h-9 w-9 place-items-center rounded-full border border-[#ded8cf] bg-[#faf8f4] text-[#5e5750] transition group-open:rotate-180"><ChevronDown className="h-4 w-4" /></span>
      </summary>
      <div className="pt-4 text-sm leading-7 text-[#6b655e]">{children}</div>
    </details>
  );
}

function FlammeOsPage() {
  const loadStatus = useServerFn(getAngelOsPublicStatus);
  const statusQuery = useQuery({ queryKey: ["flamme-os-public-status"], queryFn: () => loadStatus(), staleTime: 60_000, retry: 1 });
  const status = statusQuery.data;
  const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }) : "—";

  return (
    <main className="min-h-screen overflow-x-clip bg-[#f6f3ee] text-[#181614]">
      <style>{`@keyframes flammeCodeFlow{0%{transform:translateY(-22%)}100%{transform:translateY(8%)}}.flamme-code-stream{animation:flammeCodeFlow 26s linear infinite alternate}@media(prefers-reduced-motion:reduce){.flamme-code-stream{animation:none}}`}</style>

      <section className="relative isolate overflow-hidden px-4 pb-10 pt-6 sm:px-7 sm:pb-14 lg:px-10 lg:pb-16">
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,#fbfaf8_0%,#f6f3ee_100%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] overflow-hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-l from-[#f6f3ee]/30 via-[#f6f3ee]/72 to-[#f6f3ee]" />
          <div className="flamme-code-stream absolute right-0 top-0 w-full space-y-3 pr-8 pt-8 font-mono text-[11px] leading-6 text-[#665f57]/35">{[...codeRows, ...codeRows, ...codeRows].map((row, index) => <div key={`${row}-${index}`} className="whitespace-nowrap border-l border-[#c54f41]/15 pl-3">{row}</div>)}</div>
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-4xl pt-8 sm:pt-12 lg:pt-16">
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#b44738] sm:text-xs">Système · intelligence · supervision</p>
            <h1 className="mt-3 max-w-5xl font-display text-[clamp(3rem,11vw,7rem)] font-black leading-[.9] tracking-[-.06em] text-[#171513]">Flamme <span className="text-[#c54f41]">OS</span></h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-snug text-[#37322d] sm:text-2xl lg:text-3xl">Un système central, une couche d’intelligence et une couche de supervision.</p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6b655e] sm:text-base sm:leading-8">Flamme OS organise l’administration, les données, les applications, les connecteurs et les automatisations. Sa couche IA ajoute les capacités d’analyse et d’assistance. Flamme Guard surveille l’ensemble et prend en charge les contrôles techniques, les incidents et la récupération.</p>
            <a href="https://github.com/angelosmegaplus/angel-leclerc" target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#181614] px-4 py-3 text-sm font-bold text-white">Voir le code sur GitHub <ExternalLink className="h-4 w-4" /></a>
          </div>

          <div className="mt-8 grid gap-3 lg:grid-cols-3">
            <article className={`${card} p-5 sm:p-6`}><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#181614] text-white"><Cpu className="h-6 w-6" /></span><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[#6f675f]">Système central</p><h2 className="mt-1 text-2xl font-black">Flamme OS</h2><p className="mt-3 text-sm leading-7 text-[#625b54]">Le noyau qui organise l’administration, les données, les applications, les connecteurs, les tâches et les automatisations.</p></article>
            <article className={`${card} border-[#e1b7b0] p-5 sm:p-6`}><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#c94f40] text-white"><BrainCircuit className="h-6 w-6" /></span><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[#b44738]">Couche d’intelligence</p><h2 className="mt-1 text-2xl font-black">IA Flamme OS</h2><p className="mt-3 text-sm leading-7 text-[#625b54]">Comprend le contexte fourni par Flamme OS pour rechercher, analyser, résumer, rédiger, préparer des brouillons et assister certaines opérations.</p></article>
            <article className={`${card} border-[#d9d2e6] p-5 sm:p-6`}><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#65558f] text-white"><ShieldCheck className="h-6 w-6" /></span><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[#6f5c9a]">Couche de supervision</p><h2 className="mt-1 text-2xl font-black">Flamme Guard</h2><p className="mt-3 text-sm leading-7 text-[#625b54]">Observe la santé du système, détecte les anomalies, suit les incidents et aide à déclencher les contrôles ou mécanismes de récupération.</p><Link to="/angel-guard-os" className="mt-5 inline-flex min-h-10 items-center rounded-lg border border-[#ddd6eb] bg-[#faf8ff] px-3 py-2 text-xs font-bold text-[#65558f]">Voir Flamme Guard</Link></article>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className={`${card} p-5`}><Database className="h-5 w-5 text-[#5276a8]" /><p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-[#5276a8]">Données</p><h3 className="mt-1 text-lg font-black">Le contexte vient du système</h3><p className="mt-2 text-sm leading-6 text-[#6b655e]">Mails, agenda, candidatures, articles, projets et autres données restent organisés par Flamme OS.</p></article>
            <article className={`${card} p-5`}><Network className="h-5 w-5 text-[#5276a8]" /><p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-[#5276a8]">Connecteurs</p><h3 className="mt-1 text-lg font-black">Les services enrichissent Flamme OS</h3><p className="mt-2 text-sm leading-6 text-[#6b655e]">Google, API et autres services externes sont utilisés lorsqu’ils sont réellement disponibles.</p></article>
            <article className={`${card} p-5`}><Sparkles className="h-5 w-5 text-[#c54f41]" /><p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-[#b44738]">Intelligence</p><h3 className="mt-1 text-lg font-black">L’IA n’est pas le système</h3><p className="mt-2 text-sm leading-6 text-[#6b655e]">L’IA est une capacité intégrée à Flamme OS, pas le noyau qui remplace tout le reste.</p></article>
            <article className={`${card} p-5`}><Wrench className="h-5 w-5 text-[#7867a9]" /><p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-[#7867a9]">Maintenance</p><h3 className="mt-1 text-lg font-black">La supervision reste interne</h3><p className="mt-2 text-sm leading-6 text-[#6b655e]">Contrôles techniques, incidents et récupération sont assurés par Flamme Guard.</p></article>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-7 sm:py-14 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#b44738]">État réel</p>
          <h2 className="mt-2 font-display text-3xl font-black sm:text-4xl">Ce qui fonctionne vraiment, en direct</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6b655e] sm:text-base">Ces informations sont relevées sur le dépôt public, la base de données du site et la configuration serveur. Si une donnée n’est pas disponible, elle est affichée comme telle.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className={`${card} p-5`}><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#6f675f]">Code source</p><h3 className="mt-1 text-lg font-black">Dépôt GitHub</h3>{statusQuery.isPending ? <p className="mt-2 text-sm text-[#6b655e]">Relevé en cours…</p> : status?.repository.available ? <div className="mt-2 space-y-1 text-sm leading-6 text-[#6b655e]"><p className="font-semibold text-[#181614]">{status.repository.fullName}</p><p>Branche : {status.repository.defaultBranch ?? "—"}</p><p>Dernier commit : {formatDate(status.repository.lastCommit?.date ?? status.repository.pushedAt)}</p>{status.repository.lastCommit ? <a href={status.repository.lastCommit.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex break-all font-mono text-xs font-bold text-[#b44738] underline">{status.repository.lastCommit.sha} · {status.repository.lastCommit.message}</a> : null}</div> : <p className="mt-2 text-sm text-[#6b655e]">Dépôt indisponible.</p>}</article>
            <article className={`${card} p-5`}><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#6f675f]">Données</p><h3 className="mt-1 text-lg font-black">Contenus publiés</h3><div className="mt-2 space-y-1 text-sm leading-6 text-[#6b655e]"><p>Articles publiés : <strong className="text-[#181614]">{status?.database.publishedArticles ?? "—"}</strong></p><p>Base de données : {status?.database.available ? "accessible" : "non vérifiée"}</p></div></article>
            <article className={`${card} p-5`}><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#b44738]">Intelligence</p><h3 className="mt-1 text-lg font-black">IA Flamme OS</h3><div className="mt-2 space-y-1 text-sm leading-6 text-[#6b655e]"><p>Passerelle : {status?.intelligence.gatewayConfigured ? "configurée et active" : "non configurée"}</p><p>Modèles : {status?.intelligence.provider ?? "Google Gemini via passerelle IA Lovable"}</p></div></article>
            <article className={`${card} p-5`}><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#6f5c9a]">Supervision</p><h3 className="mt-1 text-lg font-black">Flamme Guard</h3><div className="mt-2 space-y-1 text-sm leading-6 text-[#6b655e]"><p>Déploiement : {status?.deployment.branch ? status.deployment.branch : "environnement géré"}</p><p>Contrôle effectué : {formatDate(status?.checkedAt)}</p></div></article>
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-7 sm:pb-14 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#b44738]">Infrastructure connectée</p>
          <h2 className="mt-2 font-display text-3xl font-black sm:text-4xl">Les technologies de l’écosystème Flamme OS</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6b655e] sm:text-base">Chaque technologie sert une partie précise du système : intelligence, interface, données, connexions, code ou déploiement.</p>
          <div className="mt-7 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{technologies.map((technology) => <TechCard key={technology.name} technology={technology} />)}</div>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-7 sm:pb-20 lg:px-10">
        <div className="mx-auto grid max-w-6xl items-start gap-3 lg:grid-cols-2">
          <ExpandableWidget eyebrow="Architecture" title="Comment les trois couches se répartissent" defaultOpen><div className="space-y-3"><div className="rounded-xl border border-[#ded8cf] bg-[#faf8f4] p-4"><strong className="text-[#181614]">Flamme OS — noyau</strong><p className="mt-1">Organise les données, les applications, les connecteurs, les fonctions internes et les automatisations.</p></div><div className="rounded-xl border border-[#ead1cc] bg-[#fff8f6] p-4"><strong className="text-[#181614]">IA Flamme OS — intelligence</strong><p className="mt-1">Lit le contexte disponible dans Flamme OS et ajoute analyse, recherche, rédaction et assistance.</p></div><div className="rounded-xl border border-[#ddd6eb] bg-[#faf8ff] p-4"><strong className="text-[#181614]">Flamme Guard — supervision</strong><p className="mt-1">Surveille la santé technique, les anomalies, les incidents et les mécanismes de récupération.</p></div></div></ExpandableWidget>
          <ExpandableWidget eyebrow="Autour du système" title="Ce qui reste volontairement séparé"><p>La passerelle IA fournit uniquement les capacités d’intelligence. Les services Google connectés apportent leurs données. Les modules complémentaires comme Films & Séries ou la recherche restent des fonctions autour du noyau administratif.</p></ExpandableWidget>
        </div>
        <div className="mx-auto mt-8 max-w-6xl rounded-[1.35rem] border border-[#2a2724] bg-[#181614] p-5 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Espace privé</p><p className="mt-1 text-xl font-bold sm:text-2xl">Flamme OS est le système central de l’administration.</p></div><Link to="/auth" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#181614] sm:mt-0 sm:w-auto">Accéder à l’administration</Link></div>
      </section>
    </main>
  );
}
