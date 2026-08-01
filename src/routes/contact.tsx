import { createFileRoute } from "@tanstack/react-router";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Linkedin,
  Instagram,
  Facebook,
  Paperclip,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ProjectForm } from "@/components/ProjectForm";

const TITLE = "Contact — Angel Leclerc Communication";
const DESCRIPTION =
  "Contacter Angel Leclerc : formulaire avec pièce jointe, e-mail contact@angel-leclerc.fr ou téléphone 06 01 76 69 78. Projet de communication, alternance BTS ou article du blog.";

export const Route = createFileRoute("/contact")({
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
            email: "contact@angel-leclerc.fr",
            telephone: "+33 6 01 76 69 78",
          },
        }),
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <main className="bg-background">
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
              Un projet de communication, une proposition d'alternance, une réaction à
              un article du blog ou une demande presse&nbsp;: tout passe par ici.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.08} className="mt-10">
            <div className="mx-auto max-w-2xl">
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                <Paperclip size={16} className="mt-0.5 shrink-0 text-primary" />
                <p>
                  Vous pouvez joindre un document au formulaire (cahier des charges,
                  offre d'alternance, visuel, PDF…) — 10&nbsp;Mo maximum.
                </p>
              </div>
              <ProjectForm />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.14} className="mt-12">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-center font-display text-xl font-semibold text-foreground">
                Mes coordonnées
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <ContactCard
                  icon={<Mail size={18} className="text-primary" />}
                  label="E-mail"
                  value="contact@angel-leclerc.fr"
                  href="mailto:contact@angel-leclerc.fr"
                />
                <ContactCard
                  icon={<Phone size={18} className="text-primary" />}
                  label="Téléphone"
                  value="06 01 76 69 78"
                  href="tel:+33601766978"
                />
                <ContactCard
                  icon={<MapPin size={18} className="text-primary" />}
                  label="Courrier"
                  value="CIAS, 4b rue Stéphane Hessel, 24200 Sarlat-la-Canéda"
                />
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock size={16} className="text-primary" />
                Réponse sous 48&nbsp;h ouvrées en général.
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2} className="mt-8">
            <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-primary" />
                <div className="text-sm leading-relaxed text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Pas de réponse&nbsp;? Appelez-moi.
                  </p>
                  <p className="mt-1">
                    Si votre demande est urgente, ou si vous n'avez pas de retour sous
                    48&nbsp;h, le plus efficace reste un appel direct&nbsp;: je réponds
                    volontiers de vive voix.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 border-foreground/20 bg-transparent text-foreground hover:bg-muted"
                    >
                      <a href="mailto:contact@angel-leclerc.fr">
                        <Mail size={18} className="mr-2" /> Envoyer un e-mail
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 border-foreground/20 bg-transparent text-foreground hover:bg-muted"
                    >
                      <a href="tel:+33601766978">
                        <Phone size={18} className="mr-2" /> Appeler — 06 01 76 69 78
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
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
    </main>
  );
}

function ContactCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <div className="h-full rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">{value}</p>
    </div>
  );
  return href ? (
    <a href={href} className="block h-full">
      {body}
    </a>
  ) : (
    body
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