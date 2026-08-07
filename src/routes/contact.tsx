import { createFileRoute } from "@tanstack/react-router";
import { Linkedin, Instagram, Facebook } from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ContactChat, type Track } from "@/components/ContactChat";
import { LatestArticles } from "@/components/LatestArticles";

const TITLE = "Contact — Angel Leclerc Communication";
const DESCRIPTION =
  "Échangez avec l'assistant du site : il répond à vos questions sur les services, les tarifs indicatifs et le parcours d'Angel Leclerc, puis prépare un récapitulatif de votre demande.";

export const Route = createFileRoute("/contact")({
  validateSearch: (search: Record<string, unknown>): { parcours?: Track } => {
    const raw = typeof search['parcours'] === "string" ? (search['parcours'] as string) : "";
    return raw === "projet" || raw === "alternance" || raw === "autre"
      ? { parcours: raw }
      : {};
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact — Angel Leclerc Communication",
          mainEntity: {
            "@type": "Person",
            name: "Angel Leclerc",
            url: "https://www.angel-leclerc.fr/contact",
          },
        }),
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { parcours } = Route.useSearch();
  return (
    <div className="bg-background">
      <section className="section-padding">
        <div className="container-tight">
          <AnimatedSection className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Contact
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Me contacter
            </h1>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Pas de long formulaire&nbsp;: une conversation. L'assistant répond d'abord à
              vos questions à partir du contenu public du site, puis prépare avec vous un
              récapitulatif envoyé directement à Angel.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.08} className="mt-10">
            <div className="mx-auto max-w-2xl">
              <ContactChat {...(parcours ? { initialTrack: parcours } : {})} />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.24} className="mt-10">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Me suivre
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <SocialLink
                  href="https://www.linkedin.com/company/angel-leclerc-communication/"
                  icon={<Linkedin size={18} className="text-primary" />}
                  label="LinkedIn"
                />
                <SocialLink
                  href="https://www.instagram.com/angelof_com?igsh=MWpqMjc3Mm03MHJpYg=="
                  icon={<Instagram size={18} className="text-primary" />}
                  label="Instagram"
                />
                <SocialLink
                  href="https://www.facebook.com/share/1LFGicX7qF/"
                  icon={<Facebook size={18} className="text-primary" />}
                  label="Facebook"
                />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <LatestArticles
        eyebrow="Blog"
        title="Mes derniers articles"
        description="Communication, politique, société et idées pour comprendre ce qui change."
      />
    </div>
  );
}

function SocialLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
    >
      {icon}
      {label}
    </a>
  );
}