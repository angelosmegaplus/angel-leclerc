import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/politique-confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité | Angel Leclerc Communication & Angel OS" },
      { name: "description", content: "Politique de confidentialité de angel-leclerc.fr et Angel OS, incluant l'utilisation des services Google via OAuth." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Politique de confidentialité | Angel OS" },
      { property: "og:description", content: "Données, services Google, finalités, conservation et droits." },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/politique-confidentialite" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <section className="section-padding bg-background">
      <div className="container-tight max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft size={16} />Retour à l'accueil</Link>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">Politique de confidentialité</h1>
        <p className="mt-3 text-sm text-muted-foreground">Applicable au site angel-leclerc.fr et à l'application Angel OS.</p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-muted-foreground">
          <div><h2 className="font-display text-xl font-semibold text-foreground">Responsable du traitement</h2><p className="mt-4">Le responsable du traitement est Angel Leclerc, entrepreneur individuel — Angel Leclerc Communication. Contact : contact@angel-leclerc.fr.</p></div>

          <div><h2 className="font-display text-xl font-semibold text-foreground">Objectif d'Angel OS</h2><p className="mt-4">Angel OS est une application personnelle permettant de centraliser l'administration du site, l'assistance par intelligence artificielle, les communications, l'agenda, les candidatures, les fichiers, les connecteurs de services externes et certaines automatisations. L'espace administrateur est privé et réservé aux utilisateurs autorisés.</p><p className="mt-3">Angel OS est présenté avec les autres prototypes et laboratoires numériques du site sur la page <Link to="/experiences" hash="angel-os" className="font-medium text-primary hover:underline">Expériences</Link>.</p></div>

          <div><h2 className="font-display text-xl font-semibold text-foreground">Données traitées</h2><p className="mt-4">Selon les fonctionnalités utilisées, le site ou Angel OS peuvent traiter les informations volontairement fournies par l'utilisateur, les données nécessaires à l'authentification, les communications, événements, fichiers ou autres éléments explicitement accessibles via les connecteurs autorisés. Les données sont utilisées uniquement pour fournir les fonctions demandées et assurer la sécurité, le fonctionnement et la maintenance du service.</p></div>

          <div><h2 className="font-display text-xl font-semibold text-foreground">Utilisation des services Google et OAuth</h2><p className="mt-4">La connexion d'un compte Google est volontaire. Lorsqu'elle est activée, Angel OS utilise OAuth afin que l'utilisateur puisse accorder des autorisations précises sans communiquer son mot de passe Google à Angel OS.</p><p className="mt-3">Selon les autorisations effectivement accordées, Angel OS peut utiliser les API Google pour fournir notamment les fonctions suivantes :</p><ul className="mt-3 list-disc space-y-1 pl-6"><li>Gmail : consulter les messages nécessaires aux fonctions de communication, de suivi et de synthèse demandées ;</li><li>Google Calendar : afficher, organiser ou créer des événements lorsque l'utilisateur utilise ces fonctions ;</li><li>Google Drive : accéder aux fichiers sélectionnés ou nécessaires aux fonctions de stockage, de consultation ou de sauvegarde autorisées.</li></ul><p className="mt-3">Angel OS n'utilise pas les données obtenues via les API Google à des fins publicitaires et ne vend pas ces données. L'accès est limité aux fonctionnalités visibles et demandées par l'utilisateur. Les autorisations Google peuvent être révoquées depuis les paramètres du compte Google.</p></div>

          <div><h2 className="font-display text-xl font-semibold text-foreground">Finalités et base légale</h2><p className="mt-4">Les données sont traitées pour fournir les fonctionnalités demandées, répondre aux communications, gérer les services et contenus, assurer la sécurité et, le cas échéant, exécuter des mesures précontractuelles, contractuelles ou respecter des obligations légales. Pour les connecteurs optionnels, le traitement repose notamment sur l'action volontaire de l'utilisateur et les autorisations qu'il accorde.</p></div>

          <div><h2 className="font-display text-xl font-semibold text-foreground">Conservation</h2><p className="mt-4">Les données sont conservées pendant la durée nécessaire aux finalités correspondantes, à la continuité du service ou aux obligations légales applicables. Les jetons et autorisations de connexion peuvent être supprimés ou révoqués lorsque la connexion n'est plus utilisée. Les données commerciales et comptables sont conservées pendant les durées légales applicables.</p></div>

          <div><h2 className="font-display text-xl font-semibold text-foreground">Destinataires et prestataires</h2><p className="mt-4">Les données ne sont pas vendues. Elles peuvent être traitées par les prestataires techniques strictement nécessaires au fonctionnement des services utilisés, notamment l'hébergement, la base de données, la messagerie, les services d'intelligence artificielle ou les connecteurs activés par l'utilisateur. Chaque fournisseur reste soumis à ses propres conditions et règles de protection des données.</p></div>

          <div><h2 className="font-display text-xl font-semibold text-foreground">Sécurité</h2><p className="mt-4">Des mesures techniques sont mises en place pour limiter l'accès aux espaces privés, protéger les secrets et réduire l'exposition des données. Les clés secrètes et jetons sensibles ne doivent pas être exposés dans les pages publiques ou dans le code exécuté côté navigateur.</p></div>

          <div><h2 className="font-display text-xl font-semibold text-foreground">Cookies et stockage technique</h2><p className="mt-4">Le site n'utilise pas de cookies publicitaires. Des cookies ou stockages techniques peuvent être nécessaires pour l'authentification, la sécurité, la conservation d'une session, les préférences et le fonctionnement des fonctionnalités privées.</p></div>

          <div><h2 className="font-display text-xl font-semibold text-foreground">Vos droits</h2><p className="mt-4">Conformément au RGPD et à la loi Informatique et Libertés, vous pouvez exercer vos droits d'accès, de rectification, d'effacement, de limitation, d'opposition et, lorsque cela s'applique, de portabilité en écrivant à contact@angel-leclerc.fr.</p><p className="mt-3">Vous pouvez également introduire une réclamation auprès de la CNIL. Pour les données provenant d'un compte Google, vous pouvez en plus retirer l'accès d'Angel OS depuis les paramètres de sécurité de votre compte Google.</p></div>
        </div>
      </div>
    </section>
  );
}
