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
  FolderOpen,
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    <section id="accueil" className="bg-background">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-16 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Sparkles size={14} /> Angel Leclerc Communication
          </span>

          <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            J’accompagne vos projets de communication{" "}
            <span className="text-primary">de l’idée à la mise en œuvre.</span>
          </h1>

          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            Conseil, stratégie, gestion de projet et réalisation de prestations concrètes :
            un accompagnement adapté à votre besoin, votre organisation et votre budget.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="#services"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background transition-colors duration-300 hover:bg-primary"
            >
              Découvrir l’offre
              <ArrowRight size={16} />
            </a>
            <a
              href="/contact"
              className="inline-flex items-center rounded-full border border-foreground px-8 py-4 text-sm font-medium text-foreground transition-all duration-300 hover:bg-foreground hover:text-background"
            >
              Parler de mon projet
            </a>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
            {[
              "Devis gratuit",
              "À distance partout en France",
              "Projet ponctuel ou accompagnement global",
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
          className="relative mx-auto w-full max-w-xl"
        >
          <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-muted sm:aspect-[4/3] lg:aspect-[4/5]">
            <img
              src={heroImage}
              alt="Bureau de préparation d'un projet de communication"
              width={1400}
              height={1050}
              className="h-full w-full object-cover"
              fetchPriority="high"
            />
          </div>
          <div className="absolute -bottom-6 -left-4 rounded-2xl bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/25 sm:-left-6 sm:p-8">
            <p className="font-display text-xl font-bold sm:text-2xl">Un seul interlocuteur</p>
            <p className="mt-1 text-sm opacity-90">
              Réfléchir, organiser, coordonner et faire avancer le projet.
            </p>
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
    <section id="services" className="scroll-mt-24 border-y border-border/60 bg-card py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Offre principale
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Conseil en communication
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Un accompagnement adapté à votre projet, de la réflexion jusqu’à la mise en œuvre.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.08} className="mt-12 md:mt-16">
          <article className="group rounded-3xl border border-border p-8 transition-colors duration-300 hover:border-primary md:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Accompagnement sur mesure
                </span>
                <h3 className="mt-4 font-display text-2xl font-bold text-foreground md:text-3xl">
                  Votre projet, avec une direction claire
                </h3>
                <p className="mt-5 leading-relaxed text-muted-foreground">
                  Vous avez une idée, un projet, un événement ou simplement besoin d’améliorer votre communication ? Je vous accompagne de la réflexion jusqu’à la mise en œuvre, avec des solutions adaptées à vos besoins et à votre budget.
                </p>
              </div>
              <div className="shrink-0 lg:text-right">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Tarif indicatif</p>
                <p className="mt-2 font-display text-3xl font-extrabold text-foreground">À partir de 70 €</p>
                <p className="mt-1 text-xs text-muted-foreground">Devis gratuit et personnalisé</p>
              </div>
            </div>

            <div className="mt-10 overflow-hidden rounded-[2rem] bg-foreground text-background">
              <div className="grid lg:grid-cols-2">
                <div className="p-8 md:p-10 lg:p-14">
                  <span className="inline-block rounded-full border border-background/30 px-4 py-1.5 text-xs font-medium">
                    Exemple concret
                  </span>
                  <h4 className="mt-7 font-display text-2xl font-bold md:text-3xl">
                    Une association prépare un événement…
                  </h4>
                  <p className="mt-4 leading-relaxed text-background/70">
                    …mais ne sait pas comment le faire connaître. Je peux définir avec elle la stratégie de communication, identifier les publics à toucher, choisir les supports adaptés et organiser un calendrier d’actions.
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-background/70">
                    Je peux également gérer ses réseaux sociaux, rédiger les contenus nécessaires, créer certains supports simples, rechercher des prestataires comme un imprimeur, un photographe, un vidéaste ou un développeur, comparer les offres et coordonner les différents intervenants.
                  </p>
                </div>
                <div className="flex flex-col justify-between border-t border-background/15 p-8 md:p-10 lg:border-l lg:border-t-0 lg:p-14">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                      Conseiller ou chef de projet
                    </p>
                    <p className="mt-4 leading-relaxed text-background/80">
                      Selon le projet, je peux intervenir aussi bien comme conseiller que comme chef de projet, tout en réalisant directement certaines actions lorsque cela est pertinent.
                    </p>
                    <p className="mt-4 text-sm text-background/60">
                      Le tarif évolue selon l’importance, la complexité et les besoins du projet.
                    </p>
                  </div>
                  <a
                    href="/contact"
                    className="group/link mt-8 inline-flex items-center gap-2 font-bold text-primary transition-all duration-300 hover:gap-4"
                  >
                    Demander un devis
                    <ArrowRight size={18} />
                  </a>
                </div>
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

          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {extras.map((service, index) => {
              const Icon = service.icon;
              return (
                <AnimatedSection key={service.label} delay={index * 0.04}>
                  <li className="group flex h-full flex-col rounded-3xl border border-border p-8 transition-colors duration-300 hover:border-primary">
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
                    <p className="mt-6 font-display text-base font-bold text-foreground">
                      {service.price}
                    </p>
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
    <section className="bg-background py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Méthode</span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Comment se déroule une mission ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Quatre étapes simples pour savoir où l’on va, qui fait quoi et comment le projet avance.
          </p>
        </AnimatedSection>

        <ol className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {steps.map((step, index) => (
            <AnimatedSection key={step.n} delay={index * 0.08}>
              <li className="relative">
                <span
                  aria-hidden
                  className="absolute -top-8 left-0 font-display text-8xl font-black leading-none text-primary/10"
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
    <section className="border-y border-border/60 bg-card py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pour aller plus loin</span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
            L’essentiel ici, les détails dans mon parcours
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Cette page reste centrée sur mes services. Mon CV, mes réalisations et ma boîte à outils sont déjà détaillés ailleurs sur le site.
          </p>
        </AnimatedSection>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {parcoursLinks.map((item, index) => {
            const Icon = item.icon;
            return (
              <AnimatedSection key={item.title} delay={index * 0.08}>
                <a
                  href={item.href}
                  className="group flex h-full min-h-64 flex-col rounded-3xl border border-border bg-background p-8 transition-colors duration-300 hover:border-primary"
                >
                  <div className="flex items-center justify-between">
                    <Icon size={22} className="text-primary" />
                    <ArrowUpRight
                      size={20}
                      className="text-muted-foreground transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary"
                    />
                  </div>
                  <p className="mt-6 text-xs font-bold uppercase tracking-widest text-primary">{item.eyebrow}</p>
                  <h3 className="mt-2 font-display text-2xl font-bold text-foreground">{item.title}</h3>
                  {item.href === "/portfolio" && (
                    <div data-canva-enterprise="true" className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                      <span className="font-display text-2xl font-bold leading-none text-primary">950</span>
                      <span className="text-[11px] font-semibold leading-tight text-foreground">créations Canva<br />depuis avril 2022</span>
                    </div>
                  )}
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
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
    <section className="bg-background py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <AnimatedSection>
            <div className="h-full rounded-3xl border border-border bg-card p-8 transition-colors duration-300 hover:border-primary md:p-10">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                <ShieldCheck size={16} /> Fonctionnement
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground">Simple et transparent</h2>

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
            <div className="h-full overflow-hidden rounded-3xl border border-border bg-card">
              <div className="grid h-full md:grid-cols-[1fr_.88fr]">
                <div className="p-8 md:p-10">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    <ReceiptText size={16} /> Paiement
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-extrabold text-foreground">Facturation sécurisée</h2>
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
    <section id="contact" className="scroll-mt-24 border-t border-border/60 bg-card py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <AnimatedSection>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Votre projet</span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Une idée, un besoin ou un projet encore flou ?
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted-foreground">
            Décrivez-moi simplement la situation. Nous pourrons clarifier ensemble ce qui est utile et construire une proposition adaptée.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-auto rounded-full bg-primary px-10 py-5 text-base font-bold text-primary-foreground transition-transform duration-300 hover:scale-105 hover:bg-primary"
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
