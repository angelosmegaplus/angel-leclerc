import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales | Angel Leclerc Communication" },
      {
        name: "description",
        content:
          "Mentions légales du site angel-leclerc.fr : éditeur, hébergeur, propriété intellectuelle et responsabilité.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Mentions légales | Angel Leclerc Communication" },
      {
        property: "og:description",
        content: "Éditeur, hébergeur et informations légales du site Angel Leclerc Communication.",
      },
    ],
    links: [{ rel: "canonical", href: "/mentions-legales" }],
  }),
  component: MentionsLegales,
});

function MentionsLegales() {
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
          Mentions légales
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
        </p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Éditeur du site</h2>
            <ul className="mt-4 space-y-1">
              <li><span className="text-foreground">Nom commercial :</span> Angel Leclerc Communication</li>
              <li><span className="text-foreground">Statut :</span> Entrepreneur individuel</li>
              <li><span className="text-foreground">Responsable de la publication :</span> Angel Leclerc</li>
              <li><span className="text-foreground">Siège social :</span> 25 Grande Rue, 03110 Broût-Vernet, France</li>
              <li><span className="text-foreground">SIREN :</span> 106 487 192</li>
              <li><span className="text-foreground">SIRET :</span> 106 487 192 00010</li>
              <li><span className="text-foreground">Code APE :</span> 7021Z — Conseil en relations publiques et communication</li>
              <li><span className="text-foreground">TVA :</span> non applicable, article 293 B du Code général des impôts</li>
              <li><span className="text-foreground">Email :</span> contact@angel-leclerc.fr</li>
              <li>
                <span className="text-foreground">Téléphone :</span> communiqué sur demande via la
                page Contact
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Hébergement</h2>
            <p className="mt-4">
              Ce site est hébergé par Lovable (services d'hébergement fournis via Cloudflare, Inc.),
              accessible depuis <span className="text-foreground">https://lovable.dev</span>.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Propriété intellectuelle</h2>
            <p className="mt-4">
              L'ensemble des contenus présents sur ce site (textes, images, logo, illustrations, mise
              en page, structure) sont, sauf mention contraire, la propriété exclusive d'Angel
              Leclerc. Toute reproduction, représentation, modification ou diffusion, totale ou
              partielle, sans autorisation écrite préalable est interdite et constituerait une
              contrefaçon au sens des articles L.335-2 et suivants du Code de la propriété
              intellectuelle.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Responsabilité</h2>
            <p className="mt-4">
              Les informations diffusées sur ce site sont présentées à titre indicatif. Angel Leclerc
              Communication s'efforce d'assurer leur exactitude et leur mise à jour, mais ne peut
              garantir l'absence d'erreurs ou d'omissions. L'utilisateur reste seul responsable de
              l'usage qu'il fait des informations présentées.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Liens externes</h2>
            <p className="mt-4">
              Ce site peut contenir des liens vers des sites externes. Angel Leclerc Communication
              n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur
              contenu.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Droit applicable</h2>
            <p className="mt-4">
              Les présentes mentions légales sont soumises au droit français. En cas de litige, les
              tribunaux français sont seuls compétents.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}