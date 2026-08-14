import { useEffect } from "react";
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
          "CV en ligne d'Angel Leclerc : expériences, formations, certifications, engagements associatifs et outils. Recherche urgente d'alternance BTS Communication pour septembre 2026.",
      },
      { property: "og:title", content: "Mon parcours — Angel Leclerc | CV en ligne" },
      {
        property: "og:description",
        content:
          "CV en ligne d'Angel Leclerc : expériences, formations, engagements et recherche d'alternance BTS Communication à Bordeaux, Périgueux, Bergerac, Brive, Sarlat et alentours.",
      },
      { property: "og:url", content: "/parcours" },
    ],
    links: [{ rel: "canonical", href: "/parcours" }],
  }),
  component: ParcoursPage,
});

const CV_TEXT_REPLACEMENTS: Array<[string, string]> = [
  [
    "Étudiant en communication — recherche d'alternance à Sarlat",
    "Étudiant en communication — recherche d'alternance BTS Communication",
  ],
  [
    "d'une structure située à Sarlat-la-Canéda ou dans ses environs accessibles en scooter.",
    "d'une structure située à Bordeaux, Périgueux, Bergerac, Brive-la-Gaillarde, Sarlat-la-Canéda ou dans les secteurs accessibles autour de ces villes. Je reste ouvert à toute opportunité sérieuse dans la communication, quel que soit le secteur d'activité.",
  ],
  [
    "Ma recherche se concentre sur Sarlat-la-Canéda et les communes proches, accessibles quotidiennement en scooter.",
    "Ma recherche est désormais élargie à Bordeaux, Périgueux, Bergerac, Brive-la-Gaillarde, Sarlat-la-Canéda et aux secteurs accessibles autour de ces villes.",
  ],
  [
    "Sarlat-la-Canéda et communes proches",
    "Bordeaux, Périgueux, Bergerac, Brive, Sarlat et alentours",
  ],
  [
    "Scooter — trajets quotidiens autour de Sarlat",
    "Mobilité étudiée selon l'opportunité — déménagement possible",
  ],
  [
    "Je privilégie une alternance à Sarlat ou dans un rayon d'environ 10 km, accessible en scooter au quotidien. Je peux toutefois envisager une opportunité plus éloignée si elle est réellement cohérente avec mon projet, avec possibilité de déménagement.",
    "Je recherche désormais sur plusieurs bassins d'emploi : Bordeaux, Périgueux, Bergerac, Brive-la-Gaillarde, Sarlat-la-Canéda et alentours. Je peux envisager un déménagement si une opportunité sérieuse se présente.",
  ],
  [
    "Je privilégie une entreprise située à Sarlat ou dans un secteur raisonnablement accessible en scooter.",
    "Je reste ouvert à toute entreprise proposant une alternance cohérente en communication dans les zones actuellement recherchées.",
  ],
];

function ParcoursPage() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-cv-page]");
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      let value = node.nodeValue ?? "";
      for (const [before, after] of CV_TEXT_REPLACEMENTS) {
        if (value.includes(before)) value = value.replace(before, after);
      }
      node.nodeValue = value;
      node = walker.nextNode();
    }
  }, []);

  return (
    <div className="pb-24 md:pb-0" data-cv-page>
      <MyJourney />
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
                Vous recherchez un alternant capable de rédiger, de créer des supports, de participer à vos projets de communication et de comprendre les besoins du public&nbsp;? Je recherche actuellement une alternance pour septembre 2026 sur Bordeaux, Périgueux, Bergerac, Brive-la-Gaillarde, Sarlat-la-Canéda et les secteurs accessibles autour de ces villes. Je reste ouvert à toute opportunité sérieuse dans la communication, quel que soit le secteur d'activité.
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