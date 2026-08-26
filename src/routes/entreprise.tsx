import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  CircleCheck,
  CreditCard,
  FileImage,
  FileText,
  FolderOpen,
  Globe,
  Layers,
  Mail,
  Network,
  Palette,
  PenLine,
  Radio,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { contentQuery, iconFor } from "@/lib/content";
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
      { property: "og:url", content: "/entreprise" },
    ],
    links: [{ rel: "canonical", href: "/entreprise" }],
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
    icon: Smartphone,
    label: "Réseaux sociaux",
    price: "sur devis",
    hint: "Création, gestion ou accompagnement de comptes et pages.",
  },
  {
    icon: Building2,
    label: "Accompagnement création d'association",
    price: "sur devis",
    hint: "Démarches, organisation et communication d'une association loi 1901.",
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
    icon: FolderOpen,
    eyebrow: "Portfolio créatif",
    title: "Mes créations graphiques",
    text: "950 créations Canva recensées depuis avril 2022 : logos, affiches, publications, identités visuelles et supports numériques.",
    href: "/portfolio",
    cta: "Voir le portfolio",
  },
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
    <section id="accueil" className="relative isolate overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-28 top-24 h-96 w-96 rounded-full bg-secondary/30 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-muted/30" />
      </div>

      <div className="container-tight grid items-center gap-12 py-14 lg:grid-cols-[1.08fr_.92fr] lg:gap-16 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Sparkles size={14} /> Angel Leclerc Communication
          </span>

          <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.03] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            J’accompagne vos projets de communication
            <span className="block text-primary">de l’idée à la mise en œuvre.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Conseil, stratégie, gestion de projet et réalisation de prestations concrètes :
            un accompagnement adapté à votre besoin, votre organisation et votre budget.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-accent">
              <a href="#services">
                Découvrir l’offre
                <ArrowRight size={18} className="ml-2" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-foreground/15 bg-background/70 text-foreground backdrop-blur hover:bg-muted"
            >
              <a href="/contact">Parler de mon projet</a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
            {[
              "Devis gratuit",
              "À distance partout en France",
              "Projet ponctuel ou accompagnement global",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5">
                <CircleCheck size={14} className="text-primary" /> {item}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-xl"
        >
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-2 shadow-xl shadow-foreground/5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.55rem]">
              <img
                src={heroImage}
                alt="Bureau de préparation d'un projet de communication"
                width={1400}
                height={1050}
                className="h-full w-full object-cover"
                fetchPriority="high"
              />
              <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/20 bg-background/90 p-4 shadow-lg backdrop-blur-md sm:inset-x-5 sm:bottom-5 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Un seul interlocuteur
                </p>
                <p className="mt-1 font-display text-base font-semibold text-foreground sm:text-lg">
                  Réfléchir, organiser, coordonner et faire avancer le projet.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Services() {
  const { data: dbExtra } = useQuery(contentQuery("service_extra"));
  const extras: {
    icon: LucideIcon;
    label: string;
    price: string;
    hint?: string;
  }[] =
    dbExtra && dbExtra.length
      ? dbExtra.map((item) => ({
          icon: iconFor(item.icon, Sparkles),
          label: item.title,
          price: item.extra_value ?? "sur devis",
          hint: item.description ?? undefined,
        }))
      : extraServices;

  return (
    <section id="services" className="section-padding bg-muted/35 scroll-mt-24">
      <div className="container-tight">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Offre principale
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Conseil en communication
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Un accompagnement adapté à votre projet, de la réflexion jusqu’à la mise en œuvre.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.08} className="mx-auto mt-10 max-w-5xl md:mt-14">
          <article className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-lg shadow-foreground/[0.04]">
            <div aria-hidden className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative grid gap-8 p-6 md:p-9 lg:grid-cols-[1fr_auto] lg:items-start lg:p-10">
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                    <Layers size={24} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                      Accompagnement sur mesure
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-bold text-foreground md:text-3xl">
                      Votre projet, avec une direction claire
                    </h3>
                  </div>
                </div>

                <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
                  Vous avez une idée, un projet, un événement ou simplement besoin d’améliorer votre communication ? Je vous accompagne de la réflexion jusqu’à la mise en œuvre, avec des solutions adaptées à vos besoins et à votre budget.
                </p>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/10 px-5 py-4 lg:min-w-48 lg:text-right">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Tarif indicatif</p>
                <p className="mt-1 font-display text-2xl font-bold text-foreground">À partir de 70 €</p>
                <p className="mt-1 text-xs text-muted-foreground">Devis gratuit et personnalisé</p>
              </div>
            </div>

            <div className="border-t border-border bg-background/60 p-6 md:p-9 lg:p-10">
              <div className="flex items-center gap-2 text-primary">
                <FileText size={18} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">Exemple concret</p>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Le besoin</p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground">
                    Une association prépare un événement mais ne sait pas comment le faire connaître.
                  </p>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 md:p-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">Ce que je peux prendre en charge</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                    Je peux définir avec elle la stratégie de communication, identifier les publics à toucher, choisir les supports adaptés et organiser un calendrier d’actions. Je peux également gérer ses réseaux sociaux, rédiger les contenus nécessaires, créer certains supports simples, rechercher des prestataires comme un imprimeur, un photographe, un vidéaste ou un développeur, comparer les offres et coordonner les différents intervenants.
                  </p>
                  <p className="mt-4 text-sm font-medium leading-relaxed text-foreground">
                    Selon le projet, je peux donc intervenir aussi bien comme conseiller que comme chef de projet, tout en réalisant directement certaines actions lorsque cela est pertinent.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Le tarif évolue selon l’importance, la complexité et les besoins du projet.
                </p>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-accent">
                  <a href="/contact">
                    Demander un devis
                    <ArrowRight size={16} className="ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          </article>
        </AnimatedSection>

        <AnimatedSection delay={0.12} className="mt-16 md:mt-20">
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

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {extras.map((service, index) => {
              const Icon = service.icon;
              return (
                <AnimatedSection key={service.label} delay={index * 0.04}>
                  <li className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg hover:shadow-foreground/[0.04]">
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex rounded-xl bg-muted p-2.5 text-primary transition-colors group-hover:bg-primary/10">
                        <Icon size={19} />
                      </span>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                        {service.price}
                      </span>
                    </div>
                    <h4 className="mt-5 font-display text-base font-semibold text-foreground">
                      {service.label}
                    </h4>
                    {service.hint && (
                      <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                        {service.hint}
                      </p>
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

function Method() {
  return (
    <section className="section-padding bg-background">
      <div className="container-tight">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Méthode</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Comment se déroule une mission ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Quatre étapes simples pour savoir où l’on va, qui fait quoi et comment le projet avance.
          </p>
        </AnimatedSection>

        <ol className="relative mt-10 grid gap-4 md:mt-14 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <AnimatedSection key={step.n} delay={index * 0.08}>
              <li className="relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6">
                <span className="absolute right-4 top-2 font-display text-5xl font-bold text-primary/[0.08]">
                  {step.n}
                </span>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.n}
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
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
    <section className="section-padding bg-card">
      <div className="container-tight">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pour aller plus loin</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            L’essentiel ici, les détails dans mon parcours
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Cette page reste centrée sur mes services. Mon CV, mes réalisations et ma boîte à outils sont déjà détaillés ailleurs sur le site.
          </p>
        </AnimatedSection>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {parcoursLinks.map((item, index) => {
            const Icon = item.icon;
            return (
              <AnimatedSection key={item.title} delay={index * 0.08}>
                <a
                  href={item.href}
                  className="group relative flex h-full min-h-64 flex-col overflow-hidden rounded-[1.6rem] border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-foreground/[0.05] md:p-7"
                >
                  <div aria-hidden className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-primary/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
                  <div className="relative">
                    <span className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                      <Icon size={22} />
                    </span>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-primary">{item.eyebrow}</p>
                    <h3 className="mt-2 font-display text-2xl font-bold text-foreground">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                  <span className="relative mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {item.cta}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
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
          className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-2.5"
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
      <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-2.5">
        <CreditCard size={14} className="text-primary" />
        <span className="text-[11px] font-medium text-foreground">Virement</span>
      </div>
    </div>
  );
}

function WorkingTogether() {
  return (
    <section className="section-padding bg-muted/35">
      <div className="container-tight">
        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <AnimatedSection>
            <div className="h-full rounded-[1.75rem] border border-border bg-card p-6 md:p-8">
              <span className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                <ShieldCheck size={22} />
              </span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Fonctionnement</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-foreground">Simple et transparent</h2>

              <div className="mt-6 space-y-4">
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

              <p className="mt-6 border-t border-border pt-5 text-xs italic text-muted-foreground">
                Les prestations de conseil et de communication sont soumises à une obligation de moyens.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.08}>
            <div className="h-full overflow-hidden rounded-[1.75rem] border border-border bg-card">
              <div className="grid h-full md:grid-cols-[1fr_.88fr]">
                <div className="p-6 md:p-8">
                  <span className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                    <ReceiptText size={22} />
                  </span>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Paiement</p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-foreground">Facturation sécurisée</h2>
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
    <section id="contact" className="section-padding bg-background scroll-mt-24">
      <div className="container-tight">
        <AnimatedSection>
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground shadow-xl shadow-primary/15 md:px-10 md:py-12 lg:px-14">
            <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
            <div aria-hidden className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/75">
                  Votre projet
                </span>
                <h2 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight md:text-5xl">
                  Une idée, un besoin ou un projet encore flou ?
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-foreground/80 md:text-base">
                  Décrivez-moi simplement la situation. Nous pourrons clarifier ensemble ce qui est utile et construire une proposition adaptée.
                </p>
              </div>

              <Button
                asChild
                size="lg"
                className="bg-background text-foreground hover:bg-background/90 lg:min-w-56"
              >
                <a href="/contact">
                  <Mail size={18} className="mr-2" />
                  Me contacter
                </a>
              </Button>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.08} className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Formulaire de contact avec possibilité d’ajouter une pièce jointe.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
