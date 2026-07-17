import { createFileRoute } from "@tanstack/react-router";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ContactForm } from "@/components/ContactForm";
import { Mail, MapPin, Phone, Clock } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Conseil & Création" },
      {
        name: "description",
        content:
          "Contactez Conseil & Création pour discuter de votre projet, demander un devis ou prendre rendez-vous.",
      },
      {
        property: "og:title",
        content: "Contact — Conseil & Création",
      },
      {
        property: "og:description",
        content:
          "Contactez Conseil & Création pour discuter de votre projet, demander un devis ou prendre rendez-vous.",
      },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-muted/30">
        <div className="container-tight py-20 text-center md:py-28">
          <AnimatedSection className="mx-auto max-w-2xl">
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">Contact</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Une question, un projet ou juste envie d'échanger ? Remplissez le formulaire ci-dessous,
              je vous réponds rapidement.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-tight">
          <div className="grid gap-12 lg:grid-cols-5">
            <AnimatedSection className="lg:col-span-2">
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Discutons de votre projet
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    Que vous ayez déjà une idée très claire ou juste une envie à creuser, le premier
                    échange est toujours gratuit et sans engagement.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/20">
                      <Mail size={18} className="text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">Email</h3>
                      <p className="text-sm text-muted-foreground">contact@exemple.fr</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/20">
                      <Phone size={18} className="text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">Téléphone</h3>
                      <p className="text-sm text-muted-foreground">06 12 34 56 78</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/20">
                      <MapPin size={18} className="text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">Localisation</h3>
                      <p className="text-sm text-muted-foreground">Paris, France</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/20">
                      <Clock size={18} className="text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">Disponibilité</h3>
                      <p className="text-sm text-muted-foreground">Lun — Ven, 9h — 18h</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2} className="lg:col-span-3">
              <ContactForm />
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  );
}
