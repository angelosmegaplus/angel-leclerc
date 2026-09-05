import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Check,
  CircleCheck,
  CreditCard,
  FileImage,
  FileText,
  Globe,
  HeartHandshake,
  Mail,
  Network,
  Palette,
  PenLine,
  PhoneCall,
  Radio,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { contentQuery } from "@/lib/content";
import { AnimatedSection } from "@/components/AnimatedSection";
import heroImage from "@/assets/hero-illustration.jpg";
import revolutInvoiceImage from "@/assets/revolut-invoice-example.jpg";
import { brandLogos } from "@/assets/brands";

export const Route = createFileRoute("/entreprise")({
  head: () => ({
    meta: [
      {
        title: "Conseil en communication | Angel Leclerc Communication",
      },
      {
        name: "description",
        content:
          "Conseil en communication, gestion de projet et prestations concrètes pour associations, professionnels et porteurs de projets, partout en France.",
      },
      {
        property: "og:title",
        content: "Conseil en communication | Angel Leclerc Communication",
      },
      {
        property: "og:description",
        content:
          "Un accompagnement de la réflexion à la mise en œuvre : stratégie, gestion de projet, contenus et coordination de prestataires.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/entreprise" },
    ],
    links: [
      { rel: "canonical", href: "/entreprise" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          name: "Angel Leclerc Communication",
          description:
            "Conseil en communication, gestion de projet, rédaction et prestations de communication.",
          url: "https://www.angel-leclerc.fr/entreprise",
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
  component: EnterprisePage,
});

const extraServices = [
  {
    icon: PenLine,
    label: "Rédaction de textes",
    price: "à partir de 30 €",
    hint: "Articles, textes professionnels, contenus web et éditoriaux.",
  },
  {
    icon: FileImage,
    label: "Affiche ou flyer",
    price: "à partir de 50 €",
    hint: "Création d'un support clair et adapté à votre public.",
  },
  {
    icon: Palette,
    label: "Identité visuelle simple",
    price: "à partir de 150 €",
    hint: "Base graphique cohérente pour lancer ou harmoniser un projet.",
  },
  {
    icon: Network,
    label: "Recherche et coordination de prestataires",
    price: "sur devis",
    hint: "Recherche, comparaison et suivi des intervenants utiles au projet.",
  },
  {
    icon: Radio,
    label: "Production audio, vidéo ou numérique",
    price: "sur devis",
    hint: "Prestations ponctuelles selon le format et les besoins.",
  },
  {
    icon: Globe,
    label: "Création de sites internet",
    price: "sur devis",
    hint: "Sites vitrines et projets web simples.",
  },
  {
    icon: HeartHandshake,
    label: "Accompagnement personnel en communication",
    price: "50 € / 1 h",
    hint: "Un échange individuel pour clarifier une situation, mettre de l’ordre dans ses idées, préparer une conversation ou mieux exprimer un message, dans un cadre personnel ou professionnel. À distance par téléphone ou visioconférence.",
  },
  {
    icon: Building2,
    label: "Accompagnement création d'association",
    price: "sur devis",
    hint: "Démarches, organisation et communication d'une association loi 1901.",
  },
];

type ComplementaryService = {
  label: string;
  price: string;
  hint?: string;
};

const complementaryGroups: {
  icon: LucideIcon;
  label: string;
  hint: string;
  matches: (service: ComplementaryService) => boolean;
}[] = [
  {
    icon: FileImage,
    label: "Textes & visuels",
    hint: "Textes, affiches, flyers et contenus ponctuels pour vos réseaux sociaux.",
    matches: (service) => /rédaction|texte|affiche|flyer|réseaux sociaux|contenu/i.test(service.label),
  },
  {
    icon: Palette,
    label: "Identité visuelle",
    hint: "Une image simple et cohérente pour lancer ou améliorer votre projet.",
    matches: (service) => /identité|visuel|graphique/i.test(service.label),
  },
  {
    icon: Globe,
    label: "Site, audio & vidéo",
    hint: "Un site simple ou une création ponctuelle en audio ou en vidéo.",
    matches: (service) => /site|web|audio|vidéo|numérique/i.test(service.label),
  },
  {
    icon: Network,
    label: "Organisation de projet",
    hint: "Je cherche les bons prestataires et j’organise leur travail avec vous.",
    matches: (service) => /prestataire|coordination|projet|intervenant/i.test(service.label),
  },
  {
    icon: HeartHandshake,
    label: "Autres accompagnements",
    hint: "Création d’association ou aide personnelle en communication, selon votre besoin.",
    matches: (service) => /association|accompagnement personnel/i.test(service.label),
  },
];

const steps = [
  {
    n: "01",
    title: "Premier échange",
    text: "On clarifie le besoin, les objectifs, le public et les contraintes.",
  },
  {
    n: "02",
    title: "Proposition",
    text: "Je définis la mission, les actions, le calendrier et le devis.",
  },
  {
    n: "03",
    title: "Mise en œuvre",
    text: "Je réalise les actions prévues ou je coordonne les prestataires nécessaires.",
  },
  {
    n: "04",
    title: "Livraison et suivi",
    text: "On valide le résultat, les derniers ajustements et la suite éventuelle.",
  },
];

const parcoursLinks = [
  {
    icon: BriefcaseBusiness,
    eyebrow: "Profil",
    title: "Mon parcours",
    text: "Expériences, formations, compétences et engagements sont regroupés sur mon CV en ligne.",
    href: "/parcours#cv",
    cta: "Découvrir mon parcours",
  },
  {
    icon: Wrench,
    eyebrow: "Boîte à outils",
    title: "Mes outils",
    text: "Création, bureautique, web, réseaux sociaux, audio, vidéo et intelligence artificielle.",
    href: "/parcours#outils",
    cta: "Voir mes outils",
  },
];

const paymentMethods = [
  { name: "Visa", src: brandLogos.visa },
  { name: "Mastercard", src: brandLogos.mastercard },
  { name: "Apple Pay", src: brandLogos.applepay },
  { name: "Google Pay", src: brandLogos.googlepay },
  { name: "Revolut Pay", src: brandLogos.revolut },
];

function EnterprisePage() {
  return (
    <div className="overflow-hidden">
      <DevelopmentNotice />
      <Hero />
      <Services />
      <Method />
      <Explore />
      <WorkingTogether />
      <Contact />
    </div>
  );
}

function Hero() {
  return (
    <section id="accueil" className="relative overflow-hidden border-b border-border/70 bg-gradient-to-b from-primary/[0.07] via-background to-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-[-6rem] h-72 w-72 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-[-8rem] h-80 w-80 rounded-full bg-accent/10 blur-3xl"
      />
      <div className="mx-auto grid min-h-[calc(100svh-10rem)] max-w-7xl items-center gap-10 px-5 py-12 sm:px-6 md:py-16 lg:min-h-[42rem] lg:grid-cols-[1.08fr_.92fr] lg:gap-20 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 space-y-7"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            <Sparkles size={14} /> Angel Leclerc Communication
          </span>

          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
            Donnons ensemble une direction claire à{" "}
            <span className="text-primary">votre communication.</span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Je m’appelle Angel. J’aide les entreprises, les artisans et les associations à
            dire clairement ce qu’ils font, avec des mots simples et des supports soignés.
            On commence toujours par discuter, sans engagement.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-accent">
              <a href="#services">Découvrir mes services <ArrowRight size={16} /></a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-foreground/25 bg-card px-6 font-bold hover:border-foreground hover:bg-foreground hover:text-background">
              <a href="/contact?parcours=projet&sujet=Je%20souhaite%20discuter%20d%27un%20projet%20de%20communication.">Discutons de votre projet</a>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
            {[
              "Premier échange offert",
              "Partout en France, à distance",
              "Un petit besoin ou un projet complet",
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5"
              >
                <CircleCheck size={14} className="text-primary" /> {item}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-xl lg:justify-self-end"
        >
          <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-muted shadow-2xl shadow-primary/10 lg:aspect-[4/5]">
            <img
              src={heroImage}
              alt="Bureau de préparation d'un projet de communication"
              width={1400}
              height={1050}
              className="h-full w-full object-cover"
              fetchPriority="high"
            />
          </div>
          <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-foreground/95 p-5 text-background shadow-xl backdrop-blur sm:inset-x-auto sm:-bottom-5 sm:-left-5 sm:max-w-sm sm:p-6">
            <p className="font-display text-lg font-bold sm:text-xl">Une vraie personne au bout du fil</p>
            <p className="mt-1 text-xs leading-relaxed text-background/75 sm:text-sm">
              Vous m’expliquez votre besoin, je m’occupe du reste et je vous tiens au courant.
            </p>
          </div>
        </motion.div>
      </div>
    </section>

  );
}

function Services() {
  const { data: dbExtra } = useQuery(contentQuery("service_extra"));
  const sourceExtras: ComplementaryService[] =
    dbExtra && dbExtra.length
      ? dbExtra.map((item) => ({
          label: item.title,
          price: item.extra_value ?? "sur devis",
          hint: item.description ?? undefined,
        }))
      : extraServices;
  const groupedExtras = complementaryGroups.map((group) => ({
    ...group,
    services: sourceExtras.filter(group.matches).map((service) => ({
      ...service,
      label: /réseaux sociaux/i.test(service.label)
        ? "Contenus ponctuels pour réseaux sociaux"
        : service.label,
    })),
  }));

  return (
    <section id="services" className="scroll-mt-24 bg-card py-16 md:py-20 lg:py-24">
      <div className="container-tight">
        <AnimatedSection className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Offre principale
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-5xl">
            Deux façons de vous accompagner
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Une mission ponctuelle pour faire avancer un projet, ou un abonnement pour vous aider au quotidien.
          </p>
        </AnimatedSection>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <AnimatedSection delay={0.08}>
          <article className="group flex h-full flex-col rounded-xl border border-border bg-background p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-xl hover:shadow-foreground/5 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Accompagnement sur mesure
                </span>
                <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BriefcaseBusiness size={23} />
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold text-foreground md:text-3xl">
                  Conseil en communication
                </h3>
                <p className="mt-5 leading-relaxed text-muted-foreground">
                  Vous avez une idée, un projet, un événement ou simplement besoin d’améliorer votre communication ? Je vous accompagne de la réflexion jusqu’à la mise en œuvre, avec des solutions adaptées à vos besoins et à votre budget.
                </p>
              </div>
              <div className="shrink-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Tarif indicatif</p>
                <p className="mt-2 font-display text-3xl font-bold text-foreground">À partir de 70 €</p>
                <p className="mt-1 text-xs text-muted-foreground">Devis gratuit et personnalisé</p>
              </div>
            </div>

            <div className="mt-auto border-t border-border pt-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Exemple : définir la communication d’un événement, préparer les contenus et coordonner les bons prestataires.
              </p>
              <a href="/contact?parcours=projet&sujet=Je%20souhaite%20un%20devis%20pour%20un%20accompagnement%20en%20communication." className="group/link mt-5 inline-flex items-center gap-2 font-bold text-foreground transition-colors hover:text-primary">
                Demander un devis <ArrowRight size={18} className="transition-transform group-hover/link:translate-x-1" />
              </a>
            </div>
          </article>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <article className="group flex h-full flex-col rounded-xl border-2 border-primary bg-background p-6 shadow-xl shadow-primary/10 transition-transform duration-300 hover:-translate-y-1 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Abonnement · Périgord noir et à distance
                </span>
                <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <PhoneCall size={23} />
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold text-foreground md:text-3xl">
                  Communication externalisée
                </h3>
                <p className="mt-5 leading-relaxed text-muted-foreground">
                   Vous n’avez pas le temps de répondre à tous vos clients ? Je peux prendre le relais pour les appels, e-mails, messages et réseaux sociaux, selon ce que vous me confiez.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                   On met tout en place ensemble au départ, puis je m’occupe des échanges prévus dans votre formule.
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">Mini permanence</p>
                  <p className="mt-2 font-display text-3xl font-bold text-foreground">173,33 €/mois</p>
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">soit 40 €/semaine</p>
                </div>
                <a
                  href="/accueil-client"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all duration-300 hover:gap-3 hover:bg-accent"
                >
                  Voir comment ça marche
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </article>
        </AnimatedSection>
        </div>

        <AnimatedSection delay={0.12} className="mt-16 border-t border-border pt-14 md:mt-20 md:pt-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Prestations concrètes
              </span>
              <h3 className="mt-2 font-display text-2xl font-bold text-foreground md:text-3xl">
                Services complémentaires
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Disponibles seuls ou intégrés à un accompagnement global.
              </p>
            </div>
            <p className="text-xs italic text-muted-foreground">Tarifs indicatifs · devis selon le projet</p>
          </div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupedExtras.map((service, index) => {
              const Icon = service.icon;
              return (
                <AnimatedSection key={service.label} delay={index * 0.04}>
                  <li className="group flex h-full flex-col rounded-xl border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lg hover:shadow-foreground/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Icon size={20} className="text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                    <h4 className="mt-5 font-display text-lg font-bold text-foreground">
                      {service.label}
                    </h4>
                    {service.hint && (
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {service.hint}
                      </p>
                    )}
                    {service.services.length ? (
                      <ul className="mt-5 space-y-2 border-t border-border pt-4">
                        {service.services.map((item) => (
                          <li key={item.label} className="flex items-start justify-between gap-3 text-xs leading-relaxed text-muted-foreground">
                            <span>{item.label}</span>
                            <span className="shrink-0 font-semibold text-foreground">{item.price}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-5 border-t border-border pt-4 text-xs font-semibold text-foreground">Sur devis selon le besoin</p>
                    )}
                  </li>
                </AnimatedSection>
              );
            })}
          </ul>
        </AnimatedSection>
      </div>
    </section>
  );
}

function DevelopmentNotice() {
  return (
    <aside className="border-b border-primary/20 bg-primary/8">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-5 py-3 sm:px-6 md:flex-row md:items-center">
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Mon auto-entreprise est encore en développement.</span>{" "}
          J’ai plusieurs idées et de nouveaux services à construire, donc tout n’est pas encore figé. Si vous avez une idée ou un besoin auquel je n’ai pas pensé, dites-le-moi : je suis ouvert à faire évoluer l’activité.
        </p>
        <a
          href="/contact?parcours=autre&sujet=J%27ai%20une%20id%C3%A9e%20de%20service%20%C3%A0%20vous%20proposer."
          className="inline-flex shrink-0 items-center gap-2 text-xs font-bold text-primary transition-colors hover:text-accent"
        >
          Me proposer une idée
          <ArrowRight size={14} />
        </a>
      </div>
    </aside>
  );
}

function Method() {

  return (
    <section className="bg-background py-16 md:py-20 lg:py-24">
      <div className="container-tight">
        <AnimatedSection className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Méthode</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Comment se déroule une mission ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Quatre étapes simples pour savoir où l’on va, qui fait quoi et comment le projet avance.
          </p>
        </AnimatedSection>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <AnimatedSection key={step.n} delay={index * 0.08}>
              <li className="relative min-h-52 bg-card p-6 md:p-8">
                <span
                  aria-hidden
                  className="absolute right-5 top-4 font-display text-6xl font-bold leading-none text-primary/10"
                >
                  {step.n}
                </span>
                <div className="relative">
                  <h3 className="font-display text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              </li>
            </AnimatedSection>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Explore() {
  return (
    <section className="border-y border-border/60 bg-foreground py-16 text-background md:py-20 lg:py-24">
      <div className="container-tight">
        <AnimatedSection className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pour aller plus loin</span>
          <h2 className="mt-3 font-display text-3xl font-bold text-background md:text-5xl">
            L’essentiel ici, les détails dans mon parcours
          </h2>
          <p className="mt-4 max-w-2xl text-background/65">
            Cette page reste centrée sur mes services. Mon CV, mes réalisations et ma boîte à outils sont déjà détaillés ailleurs sur le site.
          </p>
        </AnimatedSection>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {parcoursLinks.map((item, index) => {
            const Icon = item.icon;
            return (
              <AnimatedSection key={item.title} delay={index * 0.08}>
                <a
                  href={item.href}
                  className="group flex h-full min-h-56 flex-col rounded-xl border border-background/15 bg-background/5 p-7 transition-colors duration-300 hover:border-primary hover:bg-background/10"
                >
                  <div className="flex items-center justify-between">
                    <Icon size={22} className="text-primary" />
                    <ArrowUpRight
                      size={20}
                     className="text-background/50 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary"
                    />
                  </div>
                  <p className="mt-6 text-xs font-bold uppercase tracking-widest text-primary">{item.eyebrow}</p>
                   <h3 className="mt-2 font-display text-2xl font-bold text-background">{item.title}</h3>
                   <p className="mt-3 text-sm leading-relaxed text-background/65">{item.text}</p>
                   <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-background transition-colors group-hover:text-primary">
                    {item.cta}
                  </span>
                </a>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PaymentLogos() {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {paymentMethods.map((method) => (
        <div
          key={method.name}
          title={method.name}
          className="flex h-9 items-center gap-2 rounded-full border border-border bg-background px-3"
        >
          <img
            src={method.src}
            alt={`${method.name} logo`}
            width={20}
            height={20}
            loading="lazy"
            className="h-4.5 w-auto object-contain"
          />
          <span className="text-[11px] font-medium text-foreground">{method.name}</span>
        </div>
      ))}
      <div className="flex h-9 items-center gap-2 rounded-full border border-border bg-background px-3">
        <CreditCard size={14} className="text-primary" />
        <span className="text-[11px] font-medium text-foreground">Virement</span>
      </div>
    </div>
  );
}

function WorkingTogether() {
  return (
    <section className="bg-background py-16 md:py-20 lg:py-24">
      <div className="container-tight">
        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <AnimatedSection>
            <div className="h-full rounded-xl border border-border bg-card p-7 transition-colors duration-300 hover:border-primary md:p-10">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                <ShieldCheck size={16} /> Fonctionnement
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-foreground">Simple et transparent</h2>

              <div className="mt-8 space-y-5">
                {[
                  ["Devis gratuit", "Le contenu de la mission et le tarif sont définis avant de commencer."],
                  ["Paiement en deux fois", "Un acompte avant la mission, puis le solde à la fin."],
                  ["Ajustements", "Si un élément ne correspond pas à ce qui était convenu, je recherche d’abord une correction ou une solution adaptée."],
                ].map(([title, text]) => (
                  <div key={title} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check size={14} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-8 border-t border-border pt-5 text-xs italic text-muted-foreground">
                Les prestations de conseil et de communication sont soumises à une obligation de moyens.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.08}>
            <div className="h-full overflow-hidden rounded-xl border border-border bg-card">
              <div className="grid h-full md:grid-cols-[1fr_.88fr]">
                <div className="p-8 md:p-10">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    <ReceiptText size={16} /> Paiement
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-bold text-foreground">Facturation sécurisée</h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Les devis, factures et paiements sont gérés via Revolut Business. Les modalités exactes sont toujours précisées sur le devis.
                  </p>
                  <PaymentLogos />
                </div>

                <figure className="relative min-h-64 overflow-hidden border-t border-border bg-muted md:border-l md:border-t-0">
                  <img
                    src={revolutInvoiceImage}
                    alt="Exemple de facture émise via Revolut Business"
                    width={1200}
                    height={912}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                  <figcaption className="absolute inset-x-3 bottom-3 rounded-xl bg-background/90 px-3 py-2 text-[10px] text-muted-foreground backdrop-blur">
                    Exemple de facture Revolut Business
                  </figcaption>
                </figure>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="scroll-mt-24 border-t border-border/60 bg-card py-16 md:py-20 lg:py-24">
      <div className="container-tight max-w-3xl text-center">
        <AnimatedSection>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Votre projet</span>
          <h2 className="mt-4 font-display text-3xl font-bold text-foreground md:text-5xl">
            Une idée, un besoin ou un projet encore flou ?
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted-foreground">
            Décrivez-moi simplement la situation. Nous pourrons clarifier ensemble ce qui est utile et construire une proposition adaptée.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-lg bg-primary px-8 text-base font-bold text-primary-foreground shadow-lg shadow-primary/15 hover:bg-accent"
            >
              <a href="/contact">
                <Mail size={18} className="mr-2" />
                Me contacter
              </a>
            </Button>
            <a
              href="/parcours"
              className="group inline-flex items-center gap-2 font-bold text-foreground transition-colors hover:text-primary"
            >
              En savoir plus sur mon parcours
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            Formulaire de contact avec possibilité d’ajouter une pièce jointe.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
