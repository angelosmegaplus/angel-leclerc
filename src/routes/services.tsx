import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ServiceCard } from "@/components/ServiceCard";
import { PricingCard } from "@/components/PricingCard";
import { services, pricingPlans } from "@/data/services";
import { ArrowRight, Check } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services et tarifs — Conseil & Création" },
      {
        name: "description",
        content:
          "Découvrez les services et tarifs de Conseil & Création : conseil stratégique, design, web et coaching pour entrepreneurs.",
      },
      {
        property: "og:title",
        content: "Services et tarifs — Conseil & Création",
      },
      {
        property: "og:description",
        content:
          "Découvrez les services et tarifs de Conseil & Création : conseil stratégique, design, web et coaching pour entrepreneurs.",
      },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-muted/30">
        <div className="container-tight py-20 text-center md:py-28">
          <AnimatedSection className="mx-auto max-w-2xl">
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              Services et tarifs
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Des prestations claires, transparentes et adaptées à chaque étape de votre projet.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Services */}
      <section className="section-padding bg-background">
        <div className="container-tight">
          <AnimatedSection className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Mes prestations
            </h2>
            <p className="mt-4 text-muted-foreground">
              Chaque service peut être personnalisé selon vos besoins et votre budget.
            </p>
          </AnimatedSection>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => (
              <AnimatedSection key={service.id} delay={index * 0.1}>
                <ServiceCard service={service} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section-padding bg-muted/30">
        <div className="container-tight">
          <AnimatedSection className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Formules tarifaires
            </h2>
            <p className="mt-4 text-muted-foreground">
              Choisissez la formule qui correspond à votre ambition, ou demandez un devis sur mesure.
            </p>
          </AnimatedSection>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {pricingPlans.map((plan, index) => (
              <AnimatedSection key={plan.id} delay={index * 0.1}>
                <PricingCard plan={plan} />
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={0.4} className="mt-12 rounded-2xl bg-card border border-border p-8 md:p-10">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="max-w-xl">
                <h3 className="font-display text-2xl font-bold text-foreground">
                  Vous ne trouvez pas la formule idéale ?
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Je peux construire un devis personnalisé en fonction de vos objectifs, de votre
                  calendrier et de votre budget.
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/contact">
                  Demander un devis
                  <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Garantees / trust */}
      <section className="section-padding bg-background">
        <div className="container-tight">
          <AnimatedSection className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Transparence",
                text: "Des tarifs annoncés dès le départ, sans surprises en cours de projet.",
              },
              {
                title: "Réactivité",
                text: "Des échanges rapides et un suivi régulier pour garder le projet en bonne voie.",
              },
              {
                title: "Sur mesure",
                text: "Chaque prestation s'adapte à vos contraintes réelles, pas le contraire.",
              },
            ].map((item, index) => (
              <div key={item.title} className="flex flex-col items-center text-center">
                <div className="rounded-full bg-secondary/20 p-3">
                  <Check size={24} className="text-secondary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
