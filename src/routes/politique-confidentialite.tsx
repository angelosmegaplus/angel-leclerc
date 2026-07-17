import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/politique-confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité | Angel Leclerc Communication" },
      {
        name: "description",
        content:
          "Politique de confidentialité du site angel-leclerc.fr : données collectées, finalités, durée de conservation et droits RGPD.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Politique de confidentialité | Angel Leclerc Communication" },
      {
        property: "og:description",
        content: "Comment vos données personnelles sont collectées, utilisées et protégées.",
      },
    ],
    links: [{ rel: "canonical", href: "/politique-confidentialite" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <section className="section-padding bg-background">
      <div className="container-tight max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Retour à l'accueil
        </Link>

        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Politique de confidentialité
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
        </p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Responsable du traitement</h2>
            <p className="mt-4">
              Le responsable du traitement des données personnelles collectées via ce site est
              Angel Leclerc, entrepreneur individuel — Angel Leclerc Communication, 25 Grande Rue,
              03110 Broût-Vernet, France. Contact : contact@angel-leclerc.fr.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Données collectées</h2>
            <p className="mt-4">
              Ce site ne comporte pas de formulaire de contact. Aucune donnée personnelle n'est
              collectée automatiquement par une inscription en ligne. Des données peuvent être
              transmises uniquement lorsque vous choisissez de me contacter par les moyens indiqués
              sur le site :
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-1">
              <li>par e-mail (nom, adresse e-mail et contenu de votre message) ;</li>
              <li>par téléphone (numéro et informations que vous communiquez) ;</li>
              <li>par courrier postal (nom, adresse et contenu du courrier).</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Finalités et base légale</h2>
            <p className="mt-4">
              Les données transmises sont utilisées uniquement pour répondre à vos demandes,
              établir des devis, exécuter les prestations convenues et respecter les obligations
              légales et comptables. La base légale du traitement est l'exécution de mesures
              précontractuelles ou du contrat, ainsi que le respect d'obligations légales.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Durée de conservation</h2>
            <p className="mt-4">
              Les échanges commerciaux sont conservés le temps nécessaire au suivi de la relation
              client. Les documents comptables et pièces justificatives sont conservés pendant la
              durée légale de conservation applicable (généralement 10 ans).
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Destinataires</h2>
            <p className="mt-4">
              Les données ne sont pas cédées ni vendues à des tiers. Elles peuvent être transmises,
              dans la stricte mesure du nécessaire, à des prestataires techniques (hébergement,
              messagerie, service de facturation Revolut Business) qui agissent en qualité de
              sous-traitants.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Cookies</h2>
            <p className="mt-4">
              Ce site n'utilise pas de cookies de suivi publicitaire ni d'outils d'analyse
              d'audience. Seuls des éléments techniques strictement nécessaires au bon
              fonctionnement du site peuvent être utilisés.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Vos droits</h2>
            <p className="mt-4">
              Conformément au Règlement général sur la protection des données (RGPD) et à la loi
              Informatique et Libertés, vous disposez d'un droit d'accès, de rectification,
              d'effacement, de limitation, d'opposition et de portabilité concernant vos données.
              Vous pouvez exercer ces droits en écrivant à contact@angel-leclerc.fr.
            </p>
            <p className="mt-3">
              Vous disposez également du droit d'introduire une réclamation auprès de la CNIL
              (www.cnil.fr).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}