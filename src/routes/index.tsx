import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Compass,
  FileText,
  Layers,
  Mail,
  Phone,
  Sparkles,
  Ear,
  Lightbulb,
  Users,
  Repeat,
  CreditCard,
  PenLine,
  FileImage,
  Palette,
  Network,
  Radio,
  Wand2,
  Linkedin,
  Instagram,
  Facebook,
  Globe,
  Smartphone,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ProjectForm } from "@/components/ProjectForm";
import heroImage from "@/assets/hero-illustration.jpg";
import revolutInvoiceImage from "@/assets/revolut-invoice-example.jpg";

const brandLogo = (domain: string) =>
  `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;

function BrandTag({
  name,
  domain,
  href,
}: {
  name: string;
  domain: string;
  href?: string;
}) {
  const content = (
    <span className="inline-flex items-center gap-1.5 align-middle rounded-md border border-border bg-background px-1.5 py-0.5 text-foreground">
      <img
        src={brandLogo(domain)}
        alt={`${name} logo`}
        width={16}
        height={16}
        loading="lazy"
        className="h-4 w-4 rounded-sm object-contain"
      />
      <span className="text-[0.95em] font-medium">{name}</span>
    </span>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">
      {content}
    </a>
  ) : (
    content
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Angel Leclerc Communication | Gestion de projet, conseil et rédaction",
      },
      {
        name: "description",
        content:
          "Gestion de projets de communication, conseil stratégique, rédaction éditoriale et journalistique pour professionnels, associations et porteurs de projets.",
      },
      {
        property: "og:title",
        content:
          "Angel Leclerc Communication | Gestion de projet, conseil et rédaction",
      },
      {
        property: "og:description",
        content:
          "Gestion de projets de communication, conseil stratégique, rédaction éditoriale et journalistique pour professionnels, associations et porteurs de projets.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          name: "Angel Leclerc Communication",
          description:
            "Gestion de projets de communication, conseil stratégique et rédaction éditoriale.",
          email: "contact@angel-leclerc.fr",
          telephone: "+33 6 01 76 69 78",
          address: {
            "@type": "PostalAddress",
            streetAddress: "25 Grande Rue",
            postalCode: "03110",
            addressLocality: "Broût-Vernet",
            addressCountry: "FR",
          },
          areaServed: "France",
          founder: { "@type": "Person", name: "Angel Leclerc" },
          sameAs: [
            "https://www.linkedin.com/company/angel-leclerc-communication/",
            "https://www.instagram.com/angelof_com",
            "https://www.facebook.com/share/1LFGicX7qF/",
          ],
        }),
      },
    ],
  }),
  component: HomePage,
});

const pillars = [
  {
    icon: Compass,
    title: "Gestion de projet",
    text: "Organisation, coordination et suivi des actions pour faire avancer le projet.",
  },
  {
    icon: Layers,
    title: "Conseil en communication",
    text: "Stratégie, positionnement, messages clés et choix des supports adaptés.",
  },
  {
    icon: FileText,
    title: "Rédaction éditoriale",
    text: "Articles, interviews, dossiers et contenus professionnels ou numériques.",
  },
];

const mainServices = [
  {
    icon: Compass,
    title: "Gestion de projet",
    intro:
      "Organisation et suivi de votre projet de la conception à la mise en œuvre.",
    items: [
      "Cadrage, planning et jalons",
      "Coordination des étapes et intervenants",
      "Recherche et pilotage des prestataires",
      "Suivi et points d'avancement",
    ],
  },
  {
    icon: Layers,
    title: "Conseil en communication",
    intro:
      "Analyse des besoins et définition d'une stratégie adaptée au projet.",
    items: [
      "Analyse du contexte, des publics et des objectifs",
      "Positionnement et messages clés",
      "Choix des supports et canaux",
      "Plan d'action et recommandations",
    ],
  },
  {
    icon: FileText,
    title: "Rédaction et contenus éditoriaux",
    intro:
      "Rédaction de textes professionnels, journalistiques ou numériques.",
    items: [
      "Articles, portraits, interviews",
      "Enquêtes et recherches",
      "Textes institutionnels et communiqués",
      "Contenus web et réseaux sociaux",
      "Ton adapté au public visé",
    ],
  },
];

const extraServices = [
  {
    icon: PenLine,
    label: "Rédaction de textes",
    price: "à partir de 30 €",
    hint: "Articles, enquêtes et réflexions éditoriales.",
    substack: true,
  },
  { icon: FileImage, label: "Affiche ou flyer", price: "à partir de 50 €" },
  { icon: Palette, label: "Identité visuelle simple", price: "à partir de 150 €" },
  {
    icon: Network,
    label: "Recherche et coordination de prestataires",
    price: "sur devis",
  },
  {
    icon: Radio,
    label: "Production audio, vidéo ou numérique",
    price: "sur devis",
  },
  {
    icon: Globe,
    label: "Création de sites internet",
    price: "sur devis",
    hint: (
      <>
        Sites vitrines ou simples via{" "}
        <BrandTag name="Lovable" domain="lovable.dev" href="https://lovable.dev/" />{" "}
        ou <BrandTag name="Webnode" domain="webnode.com" href="https://www.webnode.com/" />.
      </>
    ),
  },
  {
    icon: Smartphone,
    label: "Réseaux sociaux",
    price: "sur devis",
    hint: (
      <>
        Création, gestion ou accompagnement de comptes et pages.{" "}
        <BrandTag name="Instagram" domain="instagram.com" href="https://www.instagram.com/" />
        ,{" "}
        <BrandTag name="Facebook" domain="facebook.com" href="https://www.facebook.com/" />
        ,{" "}
        <BrandTag name="TikTok" domain="tiktok.com" href="https://www.tiktok.com/" />
        …
      </>
    ),
  },
  {
    icon: Building2,
    label: "Accompagnement création d'association",
    price: "sur devis",
    hint: "Association loi 1901 : démarches, conseil et organisation.",
  },
];

const values = [
  {
    icon: Ear,
    title: "Écoute",
    text: "Comprendre le projet avant de proposer une solution.",
  },
  {
    icon: Lightbulb,
    title: "Clarté",
    text: "Transformer les idées en messages clairs.",
  },
  {
    icon: Users,
    title: "Coordination",
    text: "Faire avancer plusieurs acteurs vers un objectif commun.",
  },
  {
    icon: Repeat,
    title: "Adaptation",
    text: "Ajuster la mission selon les besoins et les retours.",
  },
];

const steps = [
  {
    n: "01",
    title: "Premier échange",
    text: "Compréhension du projet, des objectifs et des contraintes.",
  },
  {
    n: "02",
    title: "Proposition",
    text: "Mission, actions, calendrier et devis.",
  },
  {
    n: "03",
    title: "Réalisation",
    text: "Travail direct ou coordination des prestataires.",
  },
  {
    n: "04",
    title: "Livraison",
    text: "Validation, livraison et suivi.",
  },
];

function HomePage() {
  return (
    <div>
      <Hero />
      <Intro />
      <Services />
      <About />
      <Contact />
    </div>
  );
}

function Hero() {
  return (
    <section id="accueil" className="relative overflow-hidden bg-background">
      <div className="container-tight grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-foreground">
            <Sparkles size={14} className="text-primary" />
            Gestion de projet · Conseil · Rédaction
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Gestion de projet, conseil et rédaction{" "}
            <span className="text-primary">pour vos idées.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            J'accompagne professionnels, associations et porteurs de projets dans
            l'organisation, la stratégie et la rédaction de leurs contenus.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-accent"
            >
              <a href="#services">
                Découvrir mes services
                <ArrowRight size={18} className="ml-2" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-foreground/20 bg-transparent text-foreground hover:bg-muted"
            >
              <a href="#contact">Me contacter</a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted shadow-sm">
            <img
              src={heroImage}
              alt="Bureau chaleureux avec carnet, notes et documents de préparation d'un projet de communication"
              width={1400}
              height={1050}
              className="h-full w-full object-cover"
              fetchPriority="high"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Intro() {
  return (
    <section className="section-padding bg-card">
      <div className="container-tight">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Une direction claire pour vos projets.
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            Une communication efficace demande organisation, messages clairs et bons
            partenaires. Je structure les étapes et coordonne les solutions pour faire
            avancer votre projet.
          </p>
        </AnimatedSection>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <AnimatedSection key={pillar.title} delay={i * 0.1}>
                <div className="h-full rounded-2xl border border-border bg-background p-8">
                  <div className="inline-flex rounded-xl bg-muted p-3">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {pillar.text}
                  </p>
                </div>
              </AnimatedSection>
            );
          })}
        </div>

        <AnimatedSection delay={0.3}>
          <p className="mt-10 text-center text-sm italic text-muted-foreground">
            La création graphique, audio ou vidéo est proposée ponctuellement selon les besoins.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="services" className="section-padding bg-background">
      <div className="container-tight">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Services principaux
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
            Mes trois activités
          </h2>
          <p className="mt-4 text-muted-foreground">
            Gestion de projet, conseil et rédaction, proposées ensemble ou séparément.
          </p>
        </AnimatedSection>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {mainServices.map((s, i) => (
            <AnimatedSection key={s.title} delay={i * 0.08}>
              <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-8">
                <h3 className="font-display text-xl font-bold text-foreground md:text-2xl flex items-start gap-2">
                  <span className="mt-0.5 inline-flex shrink-0 rounded-lg bg-muted p-1.5">
                    <s.icon size={18} className="text-primary" />
                  </span>
                  {s.title}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {s.intro}
                </p>
                <ul className="mt-5 space-y-2">
                  {s.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </AnimatedSection>
          ))}
        </div>

        {/* Comment se déroule une mission ? */}
        <div className="mt-20">
          <AnimatedSection className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Méthode
            </span>
            <h3 className="mt-3 font-display text-2xl font-bold text-foreground md:text-3xl">
              Comment se déroule une mission ?
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Quatre étapes, de la première prise de contact au suivi final.
            </p>
          </AnimatedSection>

          <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <AnimatedSection key={step.n} delay={i * 0.08}>
                <li className="relative h-full list-none rounded-2xl border border-border bg-card p-6">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step.n}
                  </span>
                  <h4 className="mt-4 font-display text-lg font-semibold text-foreground">
                    {step.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.text}
                  </p>
                </li>
              </AnimatedSection>
            ))}
          </ol>
        </div>

        {/* Services complémentaires (visuellement secondaires) */}
        <AnimatedSection delay={0.2} className="mt-20">
          <div className="rounded-2xl border border-border bg-muted/40 p-6 md:p-8">
            <h3 className="font-display text-xl font-semibold text-foreground md:text-2xl">
              Services complémentaires
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Réalisables seuls ou intégrés à une mission globale.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {extraServices.map((e) => {
                const Icon = e.icon;
                return (
                  <li
                    key={e.label}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="inline-flex shrink-0 rounded-lg bg-muted p-2">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">
                        {e.label}
                      </span>
                      <span className="text-xs text-primary">{e.price}</span>
                      {e.hint && (
                        <span className="mt-1 text-xs text-muted-foreground">
                          {e.hint}
                        </span>
                      )}
                      {e.substack && (
                        <a
                          href="https://blog.angel-leclerc.fr"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground hover:border-primary"
                        >
                          <img
                            src="https://cdn.simpleicons.org/substack/FF6719"
                            alt="Logo Substack"
                            width={14}
                            height={14}
                            className="h-3.5 w-3.5"
                            loading="lazy"
                          />
                          <span>
                            Découvrez aussi mes articles et réflexions sur
                            Substack
                          </span>
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-6 text-[11px] italic text-muted-foreground/80">
              Toutes les prestations sont réalisées sur devis. Les montants
              affichés sont uniquement des tarifs indicatifs permettant de donner
              un ordre de prix.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="a-propos" className="section-padding bg-card">
      <div className="container-tight">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <AnimatedSection>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              À propos
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
              À propos
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                J'accompagne les projets pour leur donner une direction claire, une
                organisation efficace et les bons interlocuteurs.
              </p>
              <p>
                Mon cœur de métier est la gestion de projets de communication :
                préparation, organisation et suivi.
              </p>
              <p>
                J'interviens aussi en conseil et en rédaction, et réalise ponctuellement
                des supports visuels, audio ou vidéo.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="rounded-2xl border border-border bg-background p-8">
              <h3 className="font-display text-xl font-semibold text-foreground">
                Parcours
              </h3>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Mon parcours mêle accueil, tourisme, communication, associatif et
                  scoutisme. J'ai appris à écouter, expliquer, organiser et coordonner.
                </p>
                <p>
                  Cette expérience m'a donné une bonne compréhension des publics, des
                  territoires et de la transmission d'informations.
                </p>
                <p>
                  Je continue de me former en communication, rédaction et journalisme.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>

        <AnimatedSection delay={0.15} className="mt-10">
          <div className="rounded-2xl border border-border bg-background p-8">
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-xl bg-muted p-3">
                <Wand2 size={20} className="text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">
                Mes outils
              </h3>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                Je travaille sur{" "}
                <BrandTag name="Canva Pro" domain="canva.com" href="https://www.canva.com/" />
                {" "}pour les visuels, affiches, présentations et supports numériques.
              </p>
              <p>
                J'explore aussi l'<span className="font-medium text-foreground">intelligence artificielle</span>
                {" "}et les applications du{" "}
                <BrandTag name="Play Store" domain="play.google.com" href="https://play.google.com/" />{" "}
                et <BrandTag name="Windows" domain="microsoft.com" href="https://www.microsoft.com/windows" />, pour garder une veille active.
              </p>
            </div>
          </div>
        </AnimatedSection>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <AnimatedSection key={v.title} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-border bg-background p-6">
                  <Icon size={22} className="text-primary" />
                  <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
                </div>
              </AnimatedSection>
            );
          })}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <AnimatedSection>
            <div className="h-full rounded-2xl border border-border bg-background p-8">
              <h3 className="font-display text-xl font-semibold text-foreground">
                Fonctionnement clair
              </h3>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Paiement en deux fois : un acompte avant la mission, le solde à la fin.
                </p>
                <p>
                  Montants et modalités confirmés sur le devis. Paiements via{" "}
                  <BrandTag name="Revolut Business" domain="revolut.com" href="https://www.revolut.com/business/" />.
                </p>
              </div>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="h-full rounded-2xl border border-border bg-background p-8">
              <h3 className="font-display text-xl font-semibold text-foreground">
                Satisfait ou remboursé
              </h3>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  En cas d'insatisfaction, je recherche des corrections ou une solution adaptée.
                </p>
                <p>
                  Si la prestation ne correspond pas à ce qui était convenu, un remboursement
                  total ou partiel peut être effectué.
                </p>
                <p className="text-xs italic">
                  Les prestations de conseil et de communication sont soumises à une obligation de moyens.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return ContactSection();
}

const paymentMethods = [
  { name: "Visa", src: "https://cdn.simpleicons.org/visa/1A1F71" },
  { name: "Mastercard", src: "https://cdn.simpleicons.org/mastercard/EB001B" },
  { name: "Apple Pay", src: "https://cdn.simpleicons.org/applepay/000000" },
  { name: "Google Pay", src: "https://cdn.simpleicons.org/googlepay/4285F4" },
  { name: "Revolut Pay", src: "https://cdn.simpleicons.org/revolut/191C1F" },
];

function PaymentLogos() {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      {paymentMethods.map((m) => (
        <div
          key={m.name}
          title={m.name}
          className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3"
        >
          <img
            src={m.src}
            alt={`${m.name} logo`}
            width={22}
            height={22}
            loading="lazy"
            className="h-5 w-auto object-contain"
          />
          <span className="text-xs font-medium text-foreground">{m.name}</span>
        </div>
      ))}
      <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3">
        <CreditCard size={16} className="text-primary" />
        <span className="text-xs font-medium text-foreground">Virement</span>
      </div>
    </div>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="section-padding bg-background">
      <div className="container-tight">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Contact
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
            Me contacter
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Décrivez votre besoin, même flou. Je reviens vers vous rapidement pour
            clarifier et proposer une suite.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.05} className="mt-10">
          <div className="mx-auto max-w-2xl">
            <ProjectForm />
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="mt-10">
          <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="flex-1 border-foreground/20 bg-transparent text-foreground hover:bg-muted"
            >
              <a href="tel:+33601766978">
                <Phone size={18} className="mr-2" />
                Appeler — 06 01 76 69 78
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="flex-1 border-foreground/20 bg-transparent text-foreground hover:bg-muted"
            >
              <a href="mailto:contact@angel-leclerc.fr">
                <Mail size={18} className="mr-2" />
                Envoyer un e-mail
              </a>
            </Button>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.15} className="mt-10">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Suivez mes actualités
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://www.linkedin.com/company/angel-leclerc-communication/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                <Linkedin size={18} className="text-primary" />
                LinkedIn
              </a>
              <a
                href="https://www.instagram.com/angelof_com?igsh=MWpqMjc3Mm03MHJpYg=="
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                <Instagram size={18} className="text-primary" />
                Instagram
              </a>
              <a
                href="https://www.facebook.com/share/1LFGicX7qF/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                <Facebook size={18} className="text-primary" />
                Facebook
              </a>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2} className="mt-10">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Réalisations
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Gestion de projet, conseil, rédaction, identités visuelles, affiches et
              supports numériques. Une sélection est disponible sur demande.
            </p>
            <Button
              asChild
              className="mt-5 bg-primary text-primary-foreground hover:bg-accent"
            >
              <a href="mailto:contact@angel-leclerc.fr?subject=Demande%20de%20portfolio%20-%20Angel%20Leclerc%20Communication">
                Demander mon portfolio
                <ArrowRight size={16} className="ml-2" />
              </a>
            </Button>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.25} className="mt-16">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-xl bg-muted p-3">
                <CreditCard size={20} className="text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground md:text-2xl">
                Paiement
              </h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Facturation via{" "}
              <BrandTag name="Revolut Business" domain="revolut.com" href="https://www.revolut.com/business/" />
              , lien de paiement sécurisé. Acompte avant la mission, solde à la fin.
            </p>
            <PaymentLogos />
            <figure className="mt-6">
              <div className="overflow-hidden rounded-xl border border-border bg-background">
                <img
                  src={revolutInvoiceImage}
                  alt="Exemple de facture émise via Revolut Business"
                  width={1200}
                  height={912}
                  loading="lazy"
                  className="h-auto w-full object-cover"
                />
              </div>
              <figcaption className="mt-2 text-[11px] italic text-muted-foreground/80">
                Exemple de facture Revolut Business.
              </figcaption>
            </figure>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
