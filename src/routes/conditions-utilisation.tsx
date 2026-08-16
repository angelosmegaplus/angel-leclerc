import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/conditions-utilisation")({
  head: () => ({
    meta: [
      { title: "Conditions d’utilisation | Angel OS" },
      { name: "description", content: "Conditions d’utilisation de l’application Angel OS et de ses connecteurs externes, notamment Google OAuth." },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/conditions-utilisation" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <section className="section-padding bg-background">
      <div className="container-tight max-w-3xl">
        <Link to="/angel-os" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} />Retour à Angel OS</Link>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">Conditions d’utilisation d’Angel OS</h1>
        <div className="mt-10 space-y-9 text-sm leading-7 text-muted-foreground">
          <section><h2 className="font-display text-xl font-semibold text-foreground">Objet</h2><p className="mt-3">Angel OS est une application personnelle de productivité, d’administration et d’automatisation. Elle centralise notamment l’administration du site, l’assistance IA, les communications, l’agenda, les fichiers, les candidatures et des connecteurs de services externes.</p></section>
          <section><h2 className="font-display text-xl font-semibold text-foreground">Accès</h2><p className="mt-3">L’espace d’administration est privé et réservé aux utilisateurs autorisés. Des mécanismes de vérification et d’authentification peuvent être utilisés avant l’accès aux fonctions privées.</p></section>
          <section><h2 className="font-display text-xl font-semibold text-foreground">Services Google</h2><p className="mt-3">La connexion à Gmail, Google Calendar ou Google Drive est facultative et repose sur OAuth. Angel OS n’accède qu’aux autorisations accordées par l’utilisateur et uniquement pour fournir les fonctions qu’il active. L’utilisateur peut révoquer ces autorisations depuis son compte Google.</p></section>
          <section><h2 className="font-display text-xl font-semibold text-foreground">Données</h2><p className="mt-3">Les données obtenues via les API Google ne sont pas vendues et ne sont pas utilisées pour de la publicité. Les modalités de traitement, de conservation et de protection sont décrites dans la politique de confidentialité.</p></section>
          <section><h2 className="font-display text-xl font-semibold text-foreground">Disponibilité</h2><p className="mt-3">Certaines fonctions dépendent de services tiers. Une interruption, une limitation d’API ou une révocation d’autorisation peut rendre temporairement une fonction indisponible.</p></section>
          <section><h2 className="font-display text-xl font-semibold text-foreground">Liens utiles</h2><div className="mt-3 flex flex-wrap gap-4"><Link to="/politique-confidentialite" className="font-medium text-primary hover:underline">Politique de confidentialité</Link><Link to="/mentions-legales" className="font-medium text-primary hover:underline">Mentions légales</Link></div></section>
        </div>
      </div>
    </section>
  );
}
