import { createFileRoute } from "@tanstack/react-router";
import { Linkedin, Download, Mail } from "lucide-react";
import {
  MyJourney,
  SkillsSection,
  PassionsSection,
  RealisationsSection,
} from "@/components/MyJourney";
import { LatestArticles } from "@/components/LatestArticles";
import { AnimatedSection } from "@/components/AnimatedSection";
import { FeedbackBlock } from "@/components/FeedbackBlock";

export const Route = createFileRoute("/parcours")({
  head: () => ({
    meta: [
      { title: "Mon parcours — Angel Leclerc | CV en ligne" },
      {
        name: "description",
        content:
          "CV en ligne d'Angel Leclerc : expériences, formations, certifications, engagements associatifs et outils. Recherche urgente d'alternance BTS Communication pour septembre 2026, notamment en radio, médias et communication.",
      },
      { property: "og:title", content: "Mon parcours — Angel Leclerc | CV en ligne" },
      {
        property: "og:description",
        content:
          "CV en ligne d'Angel Leclerc : recherche d'alternance BTS Communication pour septembre 2026 à Bordeaux, Périgueux, Bergerac, Brive, Sarlat et alentours.",
      },
      { property: "og:url", content: "/parcours" },
    ],
    links: [{ rel: "canonical", href: "/parcours" }],
  }),
  component: ParcoursPage,
});

function ParcoursPage() {
  return (
    <div className="pb-24 md:pb-0">
      <section className="relative overflow-hidden bg-background">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-24 h-[420px] w-[420px] rounded-full bg-secondary/20 blur-3xl" />
        </div>
        <div className="container-tight relative py-10 md:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Recherche urgente — septembre 2026
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Angel <span className="italic text-primary">Leclerc</span>
            </h1>
            <p className="mt-3 font-display text-base text-foreground/80 sm:text-lg md:text-xl">
              Étudiant en communication — recherche d'alternance BTS Communication
            </p>
            <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground md:mt-6 md:text-base">
              Je recherche une entreprise pour un BTS Communication en alternance à partir de septembre 2026. Je suis particulièrement intéressé par la radio, les médias, le journalisme, la création de contenu et la communication, tout en restant ouvert à toute opportunité sérieuse dans le domaine. Ma recherche est désormais élargie à Bordeaux, Périgueux, Bergerac, Brive-la-Gaillarde, Sarlat-la-Canéda et aux secteurs accessibles autour de ces villes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/cv-angel-leclerc.pdf"
                download
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Download size={16} /> Télécharger mon CV
              </a>
              <a
                href="#contact-alternance"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Mail size={16} /> Me contacter
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="legacy-journey">
        <style>{`.legacy-journey > section:first-child { display: none; }`}</style>
        <MyJourney />
      </div>
      <RealisationsSection />
      <SkillsSection />
      <PassionsSection />
      <LatestArticles
        title="Mes derniers articles"
        description="Communication, politique, société et idées pour comprendre ce qui change."
        eyebrow="Analyses et réflexions"
      />

      <AnimatedSection>
        <section id="contact-alternance" className="section-padding bg-muted/40 scroll-mt-24">
          <div className="container-tight">
            <div className="mx-auto mb-10 max-w-2xl">
              <FeedbackBlock
                contentType="parcours"
                contentKey="/parcours"
                contentTitle="Mon parcours"
              />
            </div>
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                Contact
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
                Échangeons sur votre besoin
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Vous recherchez un alternant capable de rédiger, de créer des supports, de participer à vos projets de communication et de comprendre les besoins du public&nbsp;? Je recherche actuellement une alternance pour septembre 2026 sur Bordeaux, Périgueux, Bergerac, Brive-la-Gaillarde, Sarlat-la-Canéda et les secteurs accessibles autour de ces villes. Les médias et la radio m'attirent particulièrement, mais je reste ouvert à toute opportunité sérieuse en communication.
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-2xl">
              <div className="grid gap-4 sm:grid-cols-2">
                <a
                  href="/contact"
                  className="flex items-center gap-4 rounded-2xl border border-primary/40 bg-primary/5 p-5 transition-colors hover:bg-primary/10 sm:col-span-2"
                >
                  <div className="inline-flex rounded-xl bg-primary/15 p-3 text-primary">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                      Me contacter
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      Formulaire et coordonnées sur la page contact
                    </p>
                  </div>
                </a>
                <a
                  href="https://www.linkedin.com/in/angel-leclerc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary"
                >
                  <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                    <Linkedin size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">LinkedIn</p>
                    <p className="mt-1 text-sm font-medium text-foreground">Angel Leclerc</p>
                  </div>
                </a>
                <a
                  href="/cv-angel-leclerc.pdf"
                  download
                  className="flex items-center gap-4 rounded-2xl border border-primary/40 bg-primary/5 p-5 transition-colors hover:bg-primary/10"
                >
                  <div className="inline-flex rounded-xl bg-primary/15 p-3 text-primary">
                    <Download size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">CV en PDF</p>
                    <p className="mt-1 text-sm font-medium text-foreground">Télécharger mon CV</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <a
        href="#contact-alternance"
        className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg md:hidden"
      >
        Me contacter pour une alternance
      </a>
    </div>
  );
}
