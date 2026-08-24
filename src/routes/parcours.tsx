import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Linkedin, Download, Mail, Target, Bike, CarFront, CircleCheck, LoaderCircle, Bus, ThumbsUp } from "lucide-react";
import {
  MyJourney,
  SkillsSection,
  PassionsSection,
} from "@/components/MyJourney";
import { UnifiedExperiencesPortfolio } from "@/components/UnifiedExperiencesPortfolio";
import { LatestArticles } from "@/components/LatestArticles";
import { AnimatedSection } from "@/components/AnimatedSection";
import { FeedbackBlock } from "@/components/FeedbackBlock";
import { Logo } from "@/components/Logo";
import { AssociationLogos } from "@/components/AssociationLogos";

export const Route = createFileRoute("/parcours")({
  head: () => ({
    meta: [
      { title: "Mon parcours — Angel Leclerc | CV en ligne" },
      { name: "description", content: "CV en ligne d'Angel Leclerc : expériences, formations, certifications, engagements associatifs, réalisations et outils." },
      { property: "og:title", content: "Mon parcours — Angel Leclerc | CV en ligne" },
      { property: "og:description", content: "Découvrez le parcours d'Angel Leclerc : expériences, formations, engagements, compétences et réalisations." },
      { property: "og:url", content: "/parcours" },
    ],
    links: [{ rel: "canonical", href: "/parcours" }],
  }),
  component: ParcoursPage,
});

function ObjectivesButton() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const toolsLink = document.querySelector<HTMLAnchorElement>('a[href="#outils"]');
    setTarget(toolsLink?.parentElement ?? null);
  }, []);
  if (!target) return null;
  return createPortal(
    <a href="/mes-objectifs" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 sm:justify-start">
      <Target size={16} /> Mes objectifs
    </a>, target,
  );
}

function PermisSection() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const certificationsSection = document.getElementById("certifications");
    const container = certificationsSection?.querySelector<HTMLElement>(".container-tight");
    if (!container) return;

    const mount = document.createElement("div");
    mount.dataset.permisSection = "true";
    container.appendChild(mount);
    setTarget(mount);

    return () => mount.remove();
  }, []);

  if (!target) return null;

  return createPortal(
    <div className="mt-8 border-t border-border pt-7 md:mt-10 md:pt-8">
      <div className="mx-auto max-w-2xl">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary">Mobilité</p>
        <h3 className="mt-2 text-center font-display text-2xl font-bold text-foreground">Mon permis</h3>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Bike size={21} /></div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">Permis AM</p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary"><CircleCheck size={14} /> Obtenu</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground"><CarFront size={21} /></div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">Permis B</p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary"><LoaderCircle size={14} /> En préparation</p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-2.5 text-center text-sm font-medium text-foreground/80">
          <Bus size={17} className="shrink-0 text-primary" />
          <span>En attendant : pro des transports en commun et du stop</span>
          <ThumbsUp size={16} className="shrink-0 text-primary" />
          <Logo domain="blablacar.fr" alt="BlaBlaCar" size={26} bare link={false} />
          <Logo domain="sncf-connect.com" alt="SNCF" size={26} bare link={false} />
        </div>
      </div>
    </div>,
    target,
  );
}

function ParcoursPage() {
  return (
    <div className="pb-24 md:pb-0" data-cv-page>
      <MyJourney />
      <ObjectivesButton />
      <PermisSection />
      <AssociationLogos />
      <UnifiedExperiencesPortfolio />
      <SkillsSection />
      <PassionsSection />
      <LatestArticles title="Mes derniers articles" description="Communication, politique, société et idées pour comprendre ce qui change." eyebrow="Analyses et réflexions" />
      <AnimatedSection>
        <section id="contact" className="section-padding bg-muted/40 scroll-mt-24">
          <div className="container-tight">
            <div className="mx-auto mb-10 max-w-2xl"><FeedbackBlock contentType="parcours" contentKey="/parcours" contentTitle="Mon parcours" /></div>
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">Contact</span>
              <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">Échangeons sur votre besoin</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">Une question sur mon parcours, une proposition professionnelle ou un projet de communication&nbsp;? Vous pouvez me contacter directement depuis le site.</p>
            </div>
            <div className="mx-auto mt-10 max-w-2xl"><div className="grid gap-4 sm:grid-cols-2">
              <a href="/contact" className="flex items-center gap-4 rounded-2xl border border-primary/40 bg-primary/5 p-5 transition-colors hover:bg-primary/10 sm:col-span-2"><div className="inline-flex rounded-xl bg-primary/15 p-3 text-primary"><Mail size={20} /></div><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Me contacter</p><p className="mt-1 text-sm font-medium text-foreground">Formulaire et coordonnées sur la page contact</p></div></a>
              <a href="https://www.linkedin.com/in/angel-leclerc" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary"><div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary"><Linkedin size={20} /></div><div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">LinkedIn</p><p className="mt-1 text-sm font-medium text-foreground">Angel Leclerc</p></div></a>
              <a href="/cv-angel-leclerc.pdf" download className="flex items-center gap-4 rounded-2xl border border-primary/40 bg-primary/5 p-5 transition-colors hover:bg-primary/10"><div className="inline-flex rounded-xl bg-primary/15 p-3 text-primary"><Download size={20} /></div><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">CV en PDF</p><p className="mt-1 text-sm font-medium text-foreground">Télécharger mon CV</p></div></a>
            </div></div>
          </div>
        </section>
      </AnimatedSection>
      <a href="#contact" className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg md:hidden">Me contacter</a>
    </div>
  );
}
