import { createFileRoute } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Mail, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ContactChat, type Track } from "@/components/ContactChat";
import { ContactAssistantThread } from "@/components/ContactAssistantThread";
import { LatestArticles } from "@/components/LatestArticles";

const TITLE = "Contact — Angel Leclerc Communication";
const DESCRIPTION =
  "Contactez Angel Leclerc simplement : projet de communication, proposition d'alternance BTS Communication ou autre demande. Le formulaire et l'espace de questions sont séparés pour rester clairs.";

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
    <div className="overflow-hidden bg-background">
      <section className="relative border-b border-border/60 bg-gradient-to-b from-muted/70 via-background to-background">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
        </div>
        <div className="container-tight relative py-14 md:py-20">
          <AnimatedSection className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <MessageCircle size={13} /> Contact direct
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Un formulaire clair, et un espace de questions juste en dessous.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Pour transmettre une demande, utilisez le formulaire. Pour poser une question avant ou après, utilisez simplement le fil séparé situé juste en dessous.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.06} className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              { icon: Sparkles, title: "Guidé", text: "Le formulaire reste simple" },
              { icon: ShieldCheck, title: "Séparé", text: "Questions et envoi ne se mélangent plus" },
              { icon: Mail, title: "Direct", text: "Récapitulatif transmis à Angel" },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-border/70 bg-card/85 p-4 text-left shadow-sm backdrop-blur">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding pt-10 md:pt-14">
        <div className="container-tight">
          <AnimatedSection delay={0.08}>
            <div className="mx-auto max-w-3xl">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Formulaire de contact</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Transmettre une demande à Angel</h2>
                <p className="mt-2 text-sm text-muted-foreground">Cette partie sert uniquement à préparer et envoyer votre demande.</p>
              </div>
              <div className="rounded-[2rem] border border-border bg-card p-2 shadow-[0_18px_60px_-30px_rgba(0,0,0,.28)] sm:p-4 md:rounded-[2.5rem] md:p-6">
                <div className="contact-form-clean rounded-[1.6rem] bg-muted/35 p-2 sm:p-3 md:rounded-[2rem]">
                  <ContactChat {...(parcours ? { initialTrack: parcours } : {})} />
                </div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.14} className="mt-10 md:mt-14">
            <ContactAssistantThread />
          </AnimatedSection>

          <AnimatedSection delay={0.2} className="mt-10">
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

      <style>{`
        .contact-form-clean > div > .mt-6.border-t.border-border.pt-4 {
          display: none !important;
        }
      `}</style>

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
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:text-foreground hover:shadow-md"
    >
      {icon}
      {label}
    </a>
  );
}
