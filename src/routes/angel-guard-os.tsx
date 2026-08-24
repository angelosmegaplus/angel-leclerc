import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole, Radar, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/angel-guard-os")({
  head: () => ({
    meta: [
      { title: "Angel Guard — Concept de sécurité d’Angel OS" },
      { name: "description", content: "Angel Guard est un concept expérimental de sécurité et de supervision lié à Angel OS, mon projet personnel autour du site angel-leclerc.fr." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Angel Guard" },
      { property: "og:description", content: "Un concept expérimental de sécurité et de supervision lié à Angel OS." },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/angel-guard-os" }],
  }),
  component: AngelGuardPage,
});

const ideas = [
  [Radar, "Observer", "Rassembler au même endroit les erreurs et les signaux techniques du site plutôt que de les laisser isolés."],
  [Activity, "Comprendre", "Garder une trace lisible de ce qui s’est passé, avec une date et une raison."],
  [ShieldCheck, "Protéger l’essentiel", "Ne jamais laisser un mécanisme de surveillance empêcher l’accès légitime à l’administration."],
] as const;

function AngelGuardPage() {
  return (
    <main className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-black text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(249,115,22,.22),transparent_38%)]" />
        <div className="container-tight relative py-16 md:py-24">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-400/30 bg-orange-500/10 md:h-16 md:w-16"><LockKeyhole className="h-7 w-7 text-orange-400" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-orange-400">Angel OS · Concept expérimental</p>
              <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Angel Guard</h1>
            </div>
          </div>
          <p className="mt-8 max-w-3xl text-base leading-8 text-white/70 md:text-lg">
            Angel Guard est une idée que j’explore autour d’Angel OS : une manière simple de surveiller la santé du site et de garder une trace claire des incidents. Ce n’est pas un système autonome et il ne remplace pas les protections réelles du site.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-orange-500 text-white hover:bg-orange-600"><Link to="/experiences" hash="angel-os">Voir les expériences <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      <section className="container-tight py-14 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-orange-500">L’idée</p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-bold text-foreground md:text-4xl">Trois principes simples</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {ideas.map(([Icon, title, text]) => (
            <article key={title} className="rounded-3xl border border-border bg-card p-6">
              <Icon className="h-5 w-5 text-orange-500" />
              <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-sm leading-7 text-muted-foreground">
          Aujourd’hui, la sécurité effective du site repose sur l’authentification, les rôles administrateur et les règles d’accès de la base de données. Angel Guard reste un concept en cours de réflexion, présenté comme tel.
        </p>
      </section>
    </main>
  );
}
