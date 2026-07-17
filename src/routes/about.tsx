import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatedSection } from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import aboutImage from "@/assets/about-workspace.jpg";
import { ArrowRight, Heart, Lightbulb, Target } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos — Conseil & Création" },
      {
        name: "description",
        content:
          "Découvrez qui se cache derrière Conseil & Création, mon parcours et ma façon d'accompagner les entrepreneurs.",
      },
      {
        property: "og:title",
        content: "À propos — Conseil & Création",
      },
      {
        property: "og:description",
        content:
          "Découvrez qui se cache derrière Conseil & Création, mon parcours et ma façon d'accompagner les entrepreneurs.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-muted/30">
        <div className="container-tight py-20 text-center md:py-28">
          <AnimatedSection className="mx-auto max-w-2xl">
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">À propos</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Un parcours atypique, une envie de créer du sens et une méthode simple : écouter,
              structurer, concrétiser.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-tight">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <AnimatedSection>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
                <img
                  src={aboutImage}
                  alt="Espace de travail lumineux avec ordinateur, plantes et café"
                  width={800}
                  height={1000}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2} className="flex flex-col gap-6">
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                Passionnée par les projets qui ont du sens
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Après plusieurs années à accompagner des entreprises et des entrepreneurs sur leurs
                stratégies digitales, j'ai choisi de me lancer en auto-entreprise pour proposer un
                accompagnement plus humain, plus direct et plus agile.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Aujourd'hui, je mets mon expérience au service de ceux qui veulent structurer leur
                projet, créer une identité forte ou lancer un site web qui leur ressemble.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Je crois profondément que la clarté et la bienveillance sont les meilleurs leviers de
                performance. Mon objectif : vous aider à avancer avec confiance et sérénité.
              </p>

              <Button
                asChild
                className="mt-2 w-fit bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/contact">
                  Travaillons ensemble
                  <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/30">
        <div className="container-tight">
          <AnimatedSection className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Mes valeurs
            </h2>
            <p className="mt-4 text-muted-foreground">
              Trois principes qui guident chacune de mes collaborations.
            </p>
          </AnimatedSection>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Heart,
                title: "Bienveillance",
                text: "Un accompagnement sans jugement, à votre rythme, avec une vraie écoute de vos besoins.",
              },
              {
                icon: Target,
                title: "Efficacité",
                text: "Des actions concrètes, des livrables clairs et une vision à long terme de votre projet.",
              },
              {
                icon: Lightbulb,
                title: "Créativité",
                text: "Des solutions sur mesure, pensées différemment pour vous démarquer durablement.",
              },
            ].map((value, index) => (
              <AnimatedSection key={value.title} delay={index * 0.1}>
                <div className="h-full rounded-2xl bg-card border border-border p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20">
                    <value.icon size={24} className="text-secondary" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-foreground">
                    {value.title}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{value.text}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
