import { useState } from "react";
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
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ProjectForm } from "@/components/ProjectForm";
import { LatestArticles } from "@/components/LatestArticles";

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

          <AnimatedSection delay={0.14} className="mt-10">
            <EmergencyContact />
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
    </main>
  );
}

function EmergencyContact() {
  const [step, setStep] = useState<"hidden" | "confirm" | "open">("hidden");
  const open = step === "open";
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-dashed border-border/70 bg-transparent p-3">
        {step === "hidden" && (
          <button
            type="button"
            onClick={() => setStep("confirm")}
            className="mx-auto flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
          >
            <AlertCircle size={12} className="text-muted-foreground/70" />
            Uniquement en cas d'urgence
            <ChevronDown size={12} />
          </button>
        )}

        {step === "confirm" && (
          <div className="space-y-3 text-center">
            <p className="text-sm font-medium text-foreground">
              Votre demande est-elle vraiment urgente&nbsp;?
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Toutes les demandes passent normalement par le formulaire ci-dessus, qui
              me parvient immédiatement. Mes coordonnées directes sont réservées aux
              urgences.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                size="sm"
                className="border-foreground/20 bg-transparent text-muted-foreground hover:bg-muted"
                onClick={() => setStep("hidden")}
              >
                Non, j'utilise le formulaire
              </Button>
              <Button size="sm" onClick={() => setStep("open")}>
                Oui, afficher les coordonnées
              </Button>
            </div>
          </div>
        )}

        {open && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Coordonnées directes — urgences
              </p>
              <button
                type="button"
                onClick={() => setStep("hidden")}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Masquer
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
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
            <div className="flex flex-col gap-3 sm:flex-row">
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
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock size={14} className="text-primary" />
              Réponse sous 48&nbsp;h ouvrées en général.
            </p>
          </div>
        )}
      </div>
    </div>
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