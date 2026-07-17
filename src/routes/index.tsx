import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Compass,
  FileText,
  Layers,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Ear,
  Lightbulb,
  Users,
  Repeat,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/AnimatedSection";
import heroImage from "@/assets/hero-illustration.jpg";

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
          "Piloter votre communication, structurer vos idées, faire avancer vos projets.",
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
          address: {
            "@type": "PostalAddress",
            streetAddress: "25 Grande Rue",
            postalCode: "03110",
            addressLocality: "Broût-Vernet",
            addressCountry: "FR",
          },
          areaServed: "France",
          founder: { "@type": "Person", name: "Angel Leclerc" },
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
    text: "Organisation des étapes, coordination des actions, recherche de partenaires et suivi du projet.",
  },
  {
    icon: Layers,
    title: "Conseil en communication",
    text: "Analyse des besoins, stratégie, positionnement, choix des publics, messages et supports.",
  },
  {
    icon: FileText,
    title: "Rédaction éditoriale",
    text: "Articles, interviews, dossiers, textes de présentation et contenus journalistiques ou numériques.",
  },
];

const mainServices = [
  {
    title: "Conseil express",
    price: "À partir de 40 €",
    intro:
      "Pour une question précise, une première analyse ou un avis extérieur rapide.",
    items: [
      "Échange téléphonique ou en visioconférence",
      "Analyse rapide de la situation",
      "Conseils prioritaires et pistes d'amélioration",
      "Court résumé écrit",
    ],
  },
  {
    title: "Stratégie de communication",
    price: "À partir de 150 €",
    intro:
      "Pour construire une direction claire et organiser la communication d'un projet.",
    items: [
      "Analyse du projet et définition des objectifs",
      "Identification des publics et positionnement",
      "Stratégie de marque et stratégie éditoriale",
      "Messages, supports et plan de communication",
      "Calendrier indicatif et recommandations",
    ],
  },
  {
    title: "Rédaction éditoriale et journalistique",
    price: "À partir de 50 €",
    intro: "Pour rédiger un contenu clair, structuré et adapté au public.",
    items: [
      "Articles, portraits, interviews, dossiers",
      "Textes de présentation et communiqués",
      "Publications et contenus numériques",
      "Rédaction journalistique et travaux de synthèse",
    ],
    note: "Le tarif dépend de la longueur, du niveau de recherche, du nombre d'entretiens, du travail de réécriture et du délai demandé.",
  },
  {
    title: "Gestion complète d'un projet",
    price: "À partir de 300 €",
    highlight: true,
    intro:
      "Pour accompagner un projet de manière globale, de la réflexion jusqu'au suivi.",
    items: [
      "Analyse du besoin et définition de la stratégie",
      "Organisation des étapes et coordination",
      "Recherche de partenaires et de prestataires",
      "Suivi du calendrier et centralisation des échanges",
      "Rédaction de certains contenus et supervision",
      "Ajustements réguliers avec le client",
    ],
    note: "Formule proposée en pack global. Le contenu exact est défini avec le client selon le projet, le budget et le niveau d'accompagnement souhaité.",
  },
];

const extraServices = [
  { label: "Rédaction d'un texte court ou publication", price: "à partir de 30 €" },
  { label: "Création d'un visuel simple", price: "à partir de 35 €" },
  { label: "Montage d'une vidéo courte", price: "à partir de 50 €" },
  { label: "Affiche ou flyer", price: "à partir de 60 €" },
  { label: "Présentation ou document professionnel", price: "à partir de 70 €" },
  { label: "Identité visuelle simple", price: "à partir de 150 €" },
  { label: "Recherche de partenaires", price: "sur devis" },
  { label: "Recherche et coordination de prestataires", price: "sur devis" },
  { label: "Production audio, vidéo ou numérique", price: "sur devis" },
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
    text: "Transformer les idées en messages simples et compréhensibles.",
  },
  {
    icon: Users,
    title: "Coordination",
    text: "Faire avancer les différentes personnes autour d'un objectif commun.",
  },
  {
    icon: Repeat,
    title: "Adaptation",
    text: "Faire évoluer la mission selon les besoins, les moyens et les retours du client.",
  },
];

const steps = [
  {
    n: "01",
    title: "Premier échange",
    text: "Le client présente son besoin, ses objectifs, ses contraintes, son public et son budget.",
  },
  {
    n: "02",
    title: "Proposition",
    text: "Une offre, un pack ou un devis adapté est préparé.",
  },
  {
    n: "03",
    title: "Réalisation et coordination",
    text: "La mission est organisée et les actions mises en œuvre. Le client reçoit régulièrement des informations sur l'avancement.",
  },
  {
    n: "04",
    title: "Suivi et adaptation",
    text: "Les actions peuvent être ajustées selon les retours, les besoins et l'évolution du projet.",
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
            Piloter votre communication, structurer vos idées,{" "}
            <span className="text-primary">faire avancer vos projets.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            J'accompagne les professionnels, associations, particuliers et porteurs de
            projets dans l'organisation de leur communication, la définition de leur
            stratégie et la rédaction de leurs contenus.
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
            Une direction claire pour faire avancer votre projet.
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            Une communication efficace ne repose pas seulement sur de beaux supports.
            Elle demande une organisation, des messages cohérents, des partenaires
            adaptés et une vision globale. Mon rôle est de comprendre votre projet,
            de structurer les étapes et de coordonner les solutions nécessaires à sa
            réalisation.
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
            La création graphique, audio ou vidéo peut être proposée ponctuellement
            selon les besoins.
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
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Des services simples et adaptables
          </h2>
          <p className="mt-4 text-muted-foreground">
            Les tarifs affichés sont des estimations. Le prix final dépend de la
            durée, de la complexité, du temps nécessaire et des besoins précis du
            projet. Chaque mission peut être adaptée et négociée avec le client.
          </p>
        </AnimatedSection>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {mainServices.map((s, i) => (
            <AnimatedSection key={s.title} delay={i * 0.08}>
              <article
                className={`flex h-full flex-col rounded-2xl border p-8 transition-shadow hover:shadow-md ${
                  s.highlight
                    ? "border-primary bg-card"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    {s.title}
                  </h3>
                  {s.highlight && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      Pack global
                    </span>
                  )}
                </div>
                <p className="mt-2 font-display text-lg font-semibold text-primary">
                  {s.price}
                </p>
                <p className="mt-4 text-sm text-muted-foreground">{s.intro}</p>
                <ul className="mt-5 space-y-2">
                  {s.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <Check
                        size={16}
                        className="mt-0.5 shrink-0 text-primary"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {s.note && (
                  <p className="mt-5 text-xs italic text-muted-foreground">
                    {s.note}
                  </p>
                )}
              </article>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.2} className="mt-14">
          <div className="rounded-2xl border border-border bg-muted/40 p-8 md:p-10">
            <h3 className="font-display text-2xl font-bold text-foreground">
              Services complémentaires
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Ils peuvent être réalisés seuls ou intégrés dans une mission globale.
              Ils ne constituent pas le cœur principal de l'activité.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {extraServices.map((e) => (
                <li
                  key={e.label}
                  className="flex flex-col gap-1 rounded-xl bg-card p-4 border border-border"
                >
                  <span className="text-sm font-medium text-foreground">
                    {e.label}
                  </span>
                  <span className="text-xs text-primary">{e.price}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs italic text-muted-foreground">
              Les frais de publicité, d'impression, de déplacement, de logiciels
              spécifiques ou de prestataires extérieurs ne sont pas automatiquement
              inclus. Ils sont présentés et validés avec le client avant toute dépense.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.3} className="mt-10 text-center">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Mon activité repose d'abord sur la gestion de projet, le conseil en
            communication et la rédaction. Je peux également réaliser ponctuellement
            certains supports ou coordonner leur création avec des professionnels
            spécialisés.
          </p>
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
              À propos d'Angel Leclerc
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Je développe Angel Leclerc Communication avec une idée simple :
                aider les projets à trouver une direction claire, une organisation
                efficace et les bonnes personnes pour avancer.
              </p>
              <p>
                Mon activité principale est centrée sur la gestion de projets de
                communication. J'accompagne les clients dans la préparation,
                l'organisation et le suivi de leurs actions, tout en veillant à la
                cohérence générale du projet.
              </p>
              <p>
                J'interviens également dans le conseil en communication — plans de
                communication, stratégie de marque et stratégie de contenu — et la
                rédaction éditoriale et journalistique. Je peux enfin réaliser
                ponctuellement certains supports visuels, audio ou vidéo, ou
                coordonner les bons prestataires quand la mission demande une
                compétence plus spécialisée.
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
                  Mon parcours mêle accueil, tourisme, communication, engagement
                  associatif, scoutisme et création de projets. Ces expériences
                  m'ont appris à écouter, expliquer, organiser, travailler avec
                  différents publics et coordonner des actions collectives.
                </p>
                <p>
                  Mon expérience dans le tourisme et l'accueil m'a également permis
                  de développer une bonne compréhension des besoins du public, de la
                  valorisation d'un territoire et de la transmission d'informations.
                </p>
                <p>
                  Je poursuis le développement de mes compétences en communication,
                  rédaction et journalisme afin de professionnaliser continuellement
                  mes méthodes.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>

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

        <div className="mt-16">
          <AnimatedSection>
            <h3 className="font-display text-2xl font-bold text-foreground">
              Comment se déroule une mission ?
            </h3>
          </AnimatedSection>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <AnimatedSection key={step.n} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-border bg-background p-6">
                  <span className="font-display text-3xl font-bold text-primary">
                    {step.n}
                  </span>
                  <h4 className="mt-4 font-display text-lg font-semibold text-foreground">
                    {step.title}
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <AnimatedSection delay={0.3}>
            <p className="mt-6 text-sm italic text-muted-foreground max-w-3xl">
              Le projet est construit avec le client. Les orientations, contenus et
              adaptations importantes sont présentés progressivement afin de
              conserver un fonctionnement clair et souple.
            </p>
          </AnimatedSection>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <AnimatedSection>
            <div className="h-full rounded-2xl border border-border bg-background p-8">
              <h3 className="font-display text-xl font-semibold text-foreground">
                Un fonctionnement clair
              </h3>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Le paiement peut être réparti en deux versements : un premier
                  versement avant le début de la mission, puis un second à la fin.
                </p>
                <p>
                  Le premier versement permet de couvrir le lancement du projet, le
                  temps de travail engagé, les logiciels, les outils et les
                  éventuels frais nécessaires.
                </p>
                <p>
                  Les montants et modalités sont convenus avec le client puis
                  confirmés sur le devis ou la facture. Les paiements sont traités
                  via Revolut Business.
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
                  En cas d'insatisfaction, contactez-moi afin que des corrections
                  ou une solution adaptée puissent être recherchées.
                </p>
                <p>
                  Si la prestation ne correspond manifestement pas à ce qui avait
                  été convenu et qu'aucune correction satisfaisante n'est possible,
                  un remboursement total ou partiel peut être effectué selon la
                  situation.
                </p>
                <p className="text-xs italic">
                  Les prestations de conseil et de communication sont soumises à
                  une obligation de moyens et non de résultat lorsque les
                  résultats dépendent de facteurs extérieurs.
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
  return (
    <section id="contact" className="section-padding bg-background">
      <div className="container-tight">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Contact et réalisations
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
            Parlons de votre projet
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Vous pouvez me présenter votre projet même s'il n'est pas encore
            totalement défini. Un premier échange par mail ou par téléphone permettra
            de clarifier vos besoins, vos priorités et les solutions possibles.
          </p>
        </AnimatedSection>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <AnimatedSection>
            <a
              href="mailto:contact@angel-leclerc.fr"
              className="flex h-full items-center gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"
            >
              <Mail size={20} className="text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Email
                </p>
                <p className="truncate font-medium text-foreground">
                  contact@angel-leclerc.fr
                </p>
              </div>
            </a>
          </AnimatedSection>
          <AnimatedSection delay={0.05}>
            <a
              href="tel:+33601766978"
              className="flex h-full items-center gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"
            >
              <Phone size={20} className="text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Téléphone
                </p>
                <p className="font-medium text-foreground">06 01 76 69 78</p>
              </div>
            </a>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="flex h-full items-start gap-3 rounded-xl border border-border bg-card p-5">
              <MapPin size={20} className="mt-0.5 text-primary shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Siège de l'entreprise
                </p>
                <p className="font-medium text-foreground">
                  25 Grande Rue<br />
                  03110 Broût-Vernet, France
                </p>
              </div>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <div className="flex h-full items-start gap-3 rounded-xl border border-border bg-card p-5">
              <MapPin size={20} className="mt-0.5 text-primary shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Adresse courrier
                </p>
                <p className="font-medium text-foreground">
                  CIAS<br />
                  4b rue Stéphane Hessel<br />
                  24200 Sarlat-la-Canéda, France
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pour l'envoi de courriers en dehors du siège de l'entreprise.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>

        <AnimatedSection delay={0.2} className="mt-10">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Découvrir mes réalisations
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Mes réalisations comprennent des projets de gestion et conseil en
              communication, des plans de communication, des travaux
              rédactionnels, des articles, des identités visuelles, des affiches,
              des présentations et différents supports numériques. Une sélection
              de travaux peut être envoyée directement sur demande.
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
          <div className="rounded-2xl border border-border bg-card p-6 md:p-10">
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-xl bg-muted p-3">
                <CreditCard size={22} className="text-primary" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                Modalités de paiement
              </h3>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Le règlement des prestations s'effectue au moyen de factures émises
                depuis le compte professionnel Revolut d'Angel Leclerc Communication.
              </p>
              <p>
                Pour chaque versement, le client reçoit une facture accompagnée d'un
                lien vers une page de paiement sécurisée hébergée par Revolut
                Business. Selon les options proposées, le règlement peut être
                effectué par carte bancaire de débit ou de crédit, Apple Pay,
                Google Pay, Revolut Pay ou virement bancaire. Plusieurs devises
                peuvent être prises en charge.
              </p>
              <div>
                <p className="font-medium text-foreground">
                  Le paiement est organisé en deux étapes :
                </p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                    <span>
                      un premier versement obligatoire avant le début de la mission ;
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                    <span>
                      un second versement à la fin de la prestation, lorsque le
                      client est satisfait du travail réalisé.
                    </span>
                  </li>
                </ul>
              </div>
              <p>
                Le premier versement confirme la commande et permet de couvrir le
                lancement du projet, le temps de travail engagé, l'utilisation des
                logiciels, les outils nécessaires ainsi que les éventuels frais
                liés à la mission. Le travail commence après réception de ce
                premier règlement.
              </p>
              <p>
                À la fin de la prestation, une seconde facture Revolut est envoyée
                au client pour le règlement final. En cas d'insatisfaction, le
                client est invité à me contacter avant ce second paiement afin que
                des corrections ou une solution adaptée puissent être recherchées.
              </p>
              <p>
                Les montants, les échéances et les éventuelles conditions
                particulières sont convenus avec le client avant le lancement du
                projet.
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}