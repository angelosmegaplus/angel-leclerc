import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bot, CalendarDays, Database, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/angel-os")({
  head: () => ({
    meta: [
      { title: "Angel OS — Application personnelle et intelligente" },
      { name: "description", content: "Angel OS centralise l'administration, l'intelligence artificielle, les communications, l'agenda, les fichiers, les candidatures, les automatisations et les connecteurs Google autorisés par l'utilisateur." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Angel OS" },
      { property: "og:description", content: "Application personnelle de centralisation, d'assistance et d'automatisation avec connecteurs Google autorisés." },
      { property: "og:url", content: "https://www.angel-leclerc.fr/angel-os" },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/angel-os" }],
  }),
  component: AngelOsPublicPage,
});

const features = [
  [Bot, "Assistance intelligente", "Angel OS IA aide à comprendre les informations, préparer des actions et exploiter le contexte autorisé."],
  [Mail, "Communications", "L'application peut connecter Gmail afin de consulter et traiter les communications demandées par l'utilisateur."],
  [CalendarDays, "Agenda", "Google Calendar peut être connecté pour afficher les rendez-vous, organiser les échéances et faciliter la planification."],
  [Database, "Fichiers et données", "Google Drive peut être utilisé pour accéder aux fichiers autorisés nécessaires au stockage, à la sauvegarde ou aux fonctions demandées."],
] as const;

function AngelOsPublicPage() {
  return (
    <main className="bg-background">
      <section className="border-b border-border">
        <div className="container-tight py-16 md:py-24">
          <div className="flex items-center gap-4">
            <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-16 w-16 rounded-2xl object-contain" />
            <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Application</p><h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">Angel OS</h1></div>
          </div>
          <p className="mt-8 max-w-3xl text-lg leading-8 text-muted-foreground">
            Angel OS est une application personnelle conçue pour centraliser, organiser et automatiser les outils numériques utiles à son administrateur. Elle réunit dans une même interface l'administration du site, l'assistance par intelligence artificielle, les communications, l'agenda, les candidatures, les fichiers, les connecteurs de services externes et les tâches automatisées.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/auth">Accéder à l'administration <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/politique-confidentialite">Politique de confidentialité</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/conditions-utilisation">Conditions d’utilisation</Link></Button>
          </div>
        </div>
      </section>

      <section className="container-tight py-14 md:py-20">
        <h2 className="font-display text-3xl font-bold text-foreground">À quoi sert Angel OS ?</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {features.map(([Icon, title, text]) => <article key={title} className="rounded-3xl border border-border bg-card p-6"><Icon className="h-5 w-5 text-primary" /><h3 className="mt-4 font-semibold text-foreground">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="container-tight py-14 md:py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" /><span className="text-sm font-semibold">Utilisation des services Google</span></div>
            <h2 className="mt-4 font-display text-3xl font-bold text-foreground">Connexion Google volontaire et limitée aux fonctions autorisées</h2>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">Lorsque l'administrateur choisit de connecter un compte Google, Angel OS utilise uniquement les autorisations OAuth accordées pour fournir les fonctionnalités demandées, par exemple consulter des messages Gmail, afficher ou organiser des événements Google Calendar et travailler avec des fichiers Google Drive. Angel OS n'utilise pas ces données à des fins publicitaires et ne vend pas les données obtenues via les API Google.</p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">L'accès peut être révoqué depuis le compte Google. Les détails sur les données, leurs finalités, leur conservation et les droits applicables sont décrits dans la politique de confidentialité et les conditions d’utilisation.</p>
            <div className="mt-5 flex flex-wrap gap-4"><Link to="/politique-confidentialite" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">Politique de confidentialité <ArrowRight className="h-4 w-4" /></Link><Link to="/conditions-utilisation" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">Conditions d’utilisation <ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </div>
      </section>
    </main>
  );
}
