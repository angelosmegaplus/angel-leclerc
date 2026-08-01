import { createFileRoute } from "@tanstack/react-router";
import { Linkedin, Download, Mail } from "lucide-react";
import {
  MyJourney,
  SkillsSection,
  PassionsSection,
  RealisationsSection,
} from "@/components/MyJourney";
import LatestSubstackArticles from "@/components/LatestSubstackArticles";
import { AnimatedSection } from "@/components/AnimatedSection";

export const Route = createFileRoute("/parcours")({
  head: () => ({
    meta: [
      { title: "Mon parcours — Angel Leclerc | CV en ligne" },
      {
        name: "description",
        content:
          "CV en ligne d'Angel Leclerc : expériences, formations, certifications, engagements associatifs et outils. Recherche d'alternance BTS Communication.",
      },
      { property: "og:title", content: "Mon parcours — Angel Leclerc | CV en ligne" },
      {
        property: "og:description",
        content:
          "CV en ligne d'Angel Leclerc : expériences, formations, engagements et recherche d'alternance BTS Communication.",
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
      <MyJourney />
      <RealisationsSection />
      <SkillsSection />
      <PassionsSection />
      <LatestSubstackArticles />

      <AnimatedSection>
        <section id="contact-alternance" className="section-padding bg-muted/40 scroll-mt-24">
          <div className="container-tight">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                Contact
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
                Échangeons sur votre besoin
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Vous recherchez un alternant capable de rédiger, de créer des
                supports, de participer à vos projets de communication et de
                comprendre les besoins du public&nbsp;? Je recherche une
                opportunité principalement à Sarlat-la-Canéda ou dans ses
                environs accessibles en scooter.
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

      {/* Mobile fixed CTA */}
      <a
        href="#contact-alternance"
        className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg md:hidden"
      >
        Me contacter pour une alternance
      </a>
    </div>
  );
}