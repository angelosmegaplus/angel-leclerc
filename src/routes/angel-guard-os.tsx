import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity, ArrowRight, Ban, Bot, Braces, CloudCog, Database, Fingerprint,
  KeyRound, LockKeyhole, Radar, RefreshCcw, ServerCog, ShieldCheck, Siren,
  Sparkles, Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/angel-guard-os")({
  head: () => ({
    meta: [
      { title: "Angel Guard OS — Sécurité autonome d’Angel OS" },
      { name: "description", content: "Angel Guard OS est la couche de sécurité autonome d’Angel OS : détection, décision, isolation, récupération, audit et rollback." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Angel Guard OS" },
      { property: "og:description", content: "Une couche de sécurité automatisée intégrée au cœur d’Angel OS." },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/angel-guard-os" }],
  }),
  component: AngelGuardPage,
});

const capabilities = [
  [Radar, "Détection continue", "Les erreurs d’authentification, d’API, de production et de runtime deviennent des signaux structurés au lieu de rester des messages isolés."],
  [Siren, "Priorisation automatique", "Angel Guard classe les événements par criticité pour traiter immédiatement les incidents qui peuvent compromettre l’accès, la production ou les données."],
  [Ban, "Blocage et isolation", "Une anomalie critique d’accès peut être bloquée automatiquement. Un fournisseur instable peut être isolé sans arrêter tout Angel OS."],
  [RefreshCcw, "Auto-récupération", "Nouvelle tentative, fallback, resynchronisation ou restauration sont déclenchés selon la nature de la panne."],
  [CloudCog, "Rollback production", "Une régression critique liée à une publication peut déclencher une politique de retour vers un état précédemment vérifié."],
  [Activity, "Preuves et journal", "Chaque décision de sécurité est reliée à un signal, une raison, une date et une action afin de rendre l’automatisation observable."],
] as const;

const layers = [
  [Fingerprint, "Identité", "Compte, session, rôles administrateur et récupération propriétaire."],
  [KeyRound, "Secrets", "Clés techniques et secrets doivent rester côté serveur et peuvent être reliés au coffre chiffré Angel OS."],
  [ServerCog, "Runtime", "Fonctions serveur, workflows et applications sont observés comme des composants indépendants."],
  [Database, "Données", "Les opérations sensibles doivent être contrôlées et les erreurs de stockage ne doivent pas casser les chemins de récupération critiques."],
  [Braces, "Code", "CI, TypeScript, lint et build bloquent les régressions avant publication."],
  [Bot, "Automatisation", "Guardian, agents et règles automatiques réduisent la dépendance à une intervention humaine permanente."],
] as const;

function AngelGuardPage() {
  return <main className="overflow-hidden bg-background">
    <section className="relative border-b border-border bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(249,115,22,.28),transparent_36%),radial-gradient(circle_at_20%_80%,rgba(255,255,255,.08),transparent_34%)]" />
      <div className="container-tight relative py-20 md:py-28">
        <div className="flex items-center gap-4"><span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-400/30 bg-orange-500/10 shadow-2xl shadow-orange-500/20 md:h-20 md:w-20"><LockKeyhole className="h-8 w-8 text-orange-400 md:h-10 md:w-10" /></span><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-orange-400">Angel OS · Security layer</p><h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">Angel Guard OS</h1></div></div>
        <h2 className="mt-10 max-w-4xl font-display text-3xl font-bold leading-tight md:text-5xl">La sécurité n’est pas un écran. C’est un système qui observe, décide, agit et vérifie en permanence.</h2>
        <p className="mt-6 max-w-3xl text-base leading-8 text-white/65 md:text-lg">Angel Guard OS est la couche de sécurité autonome intégrée à Angel OS. Son rôle est de transformer les incidents techniques en signaux exploitables, d’appliquer automatiquement la bonne réponse, puis de laisser une preuve claire de ce qui a été décidé.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg" className="bg-orange-500 text-white hover:bg-orange-600"><Link to="/angel-os-ia">Voir la présentation complète <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10"><Link to="/auth">Accès privé</Link></Button></div>
      </div>
    </section>

    <section className="container-tight py-16 md:py-20"><p className="text-xs font-semibold uppercase tracking-[.18em] text-orange-500">Boucle autonome</p><h2 className="mt-3 max-w-3xl font-display text-3xl font-bold md:text-4xl">Détecter → décider → agir → vérifier → apprendre</h2><div className="mt-8 grid gap-3 md:grid-cols-5">{["Détection", "Décision", "Action", "Vérification", "Mémoire"].map((item, i) => <div key={item} className="relative rounded-3xl border border-border bg-card p-5"><span className="text-xs font-bold text-orange-500">0{i + 1}</span><p className="mt-4 font-semibold">{item}</p>{i < 4 ? <ArrowRight className="absolute -right-4 top-1/2 hidden h-4 w-4 text-muted-foreground md:block" /> : null}</div>)}</div></section>

    <section className="border-y border-border bg-muted/30"><div className="container-tight py-16 md:py-20"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-orange-500">Moteurs</p><h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">Une réponse automatique adaptée à chaque type d’incident</h2></div><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{capabilities.map(([Icon,title,text]) => <article key={title} className="rounded-3xl border border-border bg-background p-6"><Icon className="h-5 w-5 text-orange-500" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div></div></section>

    <section className="container-tight py-16 md:py-20"><div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr]"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-orange-500">Périmètre</p><h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">La sécurité traverse toutes les couches</h2><p className="mt-5 leading-7 text-muted-foreground">Angel Guard ne remplace pas les mécanismes de sécurité de Supabase, GitHub, Vercel ou du système d’exploitation. Il les orchestre et surveille leurs signaux afin d’éviter qu’une panne isolée devienne une panne générale.</p></div><div className="grid gap-3 sm:grid-cols-2">{layers.map(([Icon,title,text]) => <article key={title} className="rounded-3xl border border-border bg-card p-5"><Icon className="h-5 w-5 text-orange-500" /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div></div></section>

    <section className="border-y border-border bg-black text-white"><div className="container-tight py-16 md:py-20"><div className="grid gap-8 lg:grid-cols-2"><div><div className="flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-orange-400" /><p className="text-sm font-semibold uppercase tracking-[.18em] text-orange-400">Règle absolue</p></div><h2 className="mt-5 font-display text-3xl font-bold md:text-4xl">Un mécanisme de sécurité ne doit jamais bloquer la récupération de son propriétaire à cause de sa propre télémétrie.</h2></div><div className="space-y-3 text-sm text-white/65">{["Le chemin critique d’accès reste minimal.","La journalisation est secondaire à la restauration d’accès.","Les erreurs techniques sont transformées en messages structurés, jamais affichées comme une page HTML brute.","Chaque automatisme possède une raison et un résultat vérifiable.","Les actions dangereuses restent séparées des simples alertes."].map((x)=><div key={x} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" /><span>{x}</span></div>)}</div></div></div></section>

    <section className="container-tight py-16 md:py-20"><div className="rounded-[2rem] border border-orange-500/20 bg-orange-500/5 p-7 md:p-10"><div className="flex items-center gap-3"><Workflow className="h-6 w-6 text-orange-500" /><h2 className="font-display text-2xl font-bold md:text-3xl">Angel Guard OS fait partie d’Angel OS</h2></div><p className="mt-4 max-w-3xl leading-7 text-muted-foreground">Le Core reste le cerveau d’orchestration. Angel Guard OS est son système immunitaire : il reçoit les signaux des applications, de l’infrastructure et des workflows, puis applique des politiques automatiques de protection et de récupération.</p></div></section>
  </main>;
}
