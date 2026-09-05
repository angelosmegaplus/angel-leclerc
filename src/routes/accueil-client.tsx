import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  AtSign,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Cloud,
  Computer,
  FileText,
  Headphones,
  Info,
  Mail,
  MapPin,
  MessageSquare,
  PhoneCall,
  Quote,
  RefreshCw,
  Share2,
  Settings,
  ShieldCheck,
  Smartphone,
  TestTube2,
  type LucideIcon,
} from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ringoverAsset from "@/assets/tools/ringover.svg.asset.json";

export const Route = createFileRoute("/accueil-client")({
  head: () => ({
    meta: [
      { title: "Communication externalisée | ALC!" },
      {
        name: "description",
        content:
          "Communication externalisée : appels, e-mails, SMS et réseaux sociaux. Abonnement fixe : 173,33 €/mois, soit 40 €/semaine.",
      },
      { property: "og:title", content: "Communication externalisée | Angel Leclerc Communication" },
      {
        property: "og:description",
        content:
          "Déléguez appels, e-mails, SMS et messages sociaux selon vos consignes. Tarif fixe : 173,33 €/mois, soit 40 €/semaine.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://angel-leclerc.fr/accueil-client" },
    ],
    links: [{ rel: "canonical", href: "https://angel-leclerc.fr/accueil-client" }],
  }),
  component: AccueilClientPage,
});

const callSteps: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: PhoneCall, title: "Le client appelle", text: "Il compose le numéro habituel de votre entreprise : aucun nouveau numéro public à communiquer." },
  { icon: RefreshCw, title: "L’appel m’est transféré", text: "Si vous ne répondez pas, l’appel est transféré vers moi selon la règle choisie ensemble." },
  { icon: Smartphone, title: "Mon Pixel 10 sonne", text: "Je vois pour quelle entreprise est l’appel avant de répondre." },
  { icon: Headphones, title: "Je réponds pour vous", text: "Je décroche avec la phrase d’accueil que nous avons préparée ensemble." },
  { icon: ClipboardList, title: "Je note la demande", text: "Sur mon ordinateur, je note le nom, le numéro, la demande et son urgence." },
  { icon: MessageSquare, title: "Je vous envoie les informations", text: "Je vous transmets la demande par SMS, e-mail ou par le moyen choisi ensemble." },
];

const digitalSteps: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: AtSign, title: "Un client écrit", text: "Il vous contacte par e-mail, SMS, Facebook ou Instagram." },
  { icon: ClipboardList, title: "Je regarde vos consignes", text: "Je vérifie les réponses que nous avons préparées ensemble." },
  { icon: MessageSquare, title: "Je réponds si je peux", text: "Si la réponse est prévue, je réponds avec les informations que vous m’avez données." },
  { icon: Share2, title: "Sinon, je vous transmets", text: "Si je ne peux pas répondre, je prends les informations utiles et je vous envoie la demande." },
  { icon: RefreshCw, title: "Je peux suivre la demande", text: "Si votre formule le prévoit, je peux faire le suivi ou confirmer un rendez-vous." },
];

const setupSteps = [
  "On vérifie votre ligne et ce que permet votre opérateur.",
  "On choisit quand un appel doit m’être transféré.",
  "On règle le transfert d’appel ensemble.",
  "Je prépare l’outil qui me permet de recevoir vos appels.",
  "On choisit la phrase d’accueil dite au nom de votre entreprise.",
  "On écrit les réponses possibles, les urgences et les demandes à vous transmettre.",
  "Vous choisissez les moyens de contact à me confier : téléphone, SMS, e-mail ou réseaux sociaux.",
  "On fait un appel test pour vérifier que tout fonctionne.",
  "On corrige si besoin, puis l’abonnement commence avec votre accord.",
];

const tools: { name: string; role: string; icon?: LucideIcon; logo?: string; note?: string }[] = [
  {
    name: "Ringover",
    role: "Sert à recevoir les appels transférés sur mon téléphone ou mon ordinateur.",
    logo: ringoverAsset.url,
    note: "Solution technique actuellement envisagée, sans partenariat commercial.",
  },
  {
    name: "Quicktalk by Ringover",
    role: "Autre solution simple pour recevoir les appels et régler les horaires.",
    icon: Cloud,
    note: "Le choix final dépend de la ligne et du fonctionnement attendu.",
  },
  {
    name: "Google Pixel 10 · Android",
    role: "Sert à recevoir vos appels professionnels.",
    logo: "/logos/google.com.svg",
  },
  {
    name: "Ordinateur",
    role: "Sert à lire vos consignes, noter les demandes et préparer le suivi.",
    icon: Computer,
  },
  {
    name: "SMS · e-mail",
    role: "Servent à recevoir des messages et à vous transmettre les demandes.",
    icon: Mail,
  },
  {
    name: "Facebook · Instagram",
    role: "Servent à répondre aux messages simples que vous me confiez.",
    icon: Share2,
    note: "Plateformes tierces utilisées sans partenariat avec ALC!.",
  },
  {
    name: "Orange Pro · autres opérateurs",
    role: "Servent à transférer vos appels vers moi quand vous ne répondez pas.",
    icon: PhoneCall,
  },
];

const plans = [
  {
    name: "Mini permanence",
    price: "173,33 €/mois",
    weekly: "soit 40 €/semaine",
    lead: "Pour un petit nombre de demandes et peu de moyens de contact.",
    features: [
      "Surtout les appels et la prise de messages",
      "Réponses simples sur les moyens de contact choisis",
      "Envoi des demandes selon vos consignes",
    ],
  },
  {
    name: "Formule régulière",
    price: "260 €/mois",
    weekly: "soit 60 €/semaine",
    lead: "Pour répondre plus souvent et par plusieurs moyens de contact.",
    highlight: true,
    features: [
      "Appels, e-mails et messages selon vos consignes",
      "Réponses régulières pendant les horaires choisis",
      "Confirmations ou rendez-vous simples si vous m’y autorisez",
      "Suivi régulier des demandes reçues",
    ],
  },
  {
    name: "Formule renforcée",
    price: "390 €/mois",
    weekly: "soit 90 €/semaine",
    lead: "Pour plus de demandes, plus de suivi et plusieurs moyens de contact.",
    features: [
      "Plusieurs moyens de contact et plus de demandes, sans service 24 h/24",
      "Suivi plus complet de vos clients",
      "Gestion de réservations ou d’agenda avec autorisation et accès adaptés",
      "Petites actions de communication prévues dans la formule",
    ],
  },
];

const faq = [
  {
    q: "Quels canaux puis-je vous confier ?",
    a: "Vous pouvez me confier les appels, SMS, e-mails et messages privés Facebook ou Instagram. Vous choisissez seulement ce dont vous avez besoin. Tout est écrit dans votre fiche de consignes.",
  },
  {
    q: "Est-ce vous qui publiez aussi sur mes réseaux sociaux ?",
    a: "Pas automatiquement. Cette offre sert surtout à répondre à vos clients. De petites publications peuvent être ajoutées si elles sont clairement prévues dans votre formule.",
  },
  {
    q: "Pouvez-vous répondre aux messages privés Facebook ou Instagram ?",
    a: "Oui, si vous me donnez un accès adapté et si la réponse est prévue dans vos consignes. ALC! n’a aucun partenariat avec Meta, Facebook ou Instagram.",
  },
  {
    q: "Comment savez-vous quoi répondre ?",
    a: "Nous préparons ensemble une fiche simple. Elle contient vos informations, les réponses possibles, les horaires, les urgences et ce que je dois vous transmettre.",
  },
  {
    q: "Que faites-vous si une demande dépasse vos consignes ?",
    a: "Je n’invente pas de réponse. Je prends les coordonnées et les informations utiles, puis je vous transmets la demande.",
  },
  {
    q: "Puis-je choisir seulement téléphone et e-mail ?",
    a: "Oui. Vous choisissez les moyens de contact que vous voulez me confier. Rien n’est ajouté sans votre accord.",
  },
  {
    q: "Puis-je changer de formule ou de canaux ?",
    a: "Oui. Nous regardons ensemble le nombre de demandes, les horaires et les moyens de contact souhaités. Tout ajout se fait avec votre accord et, si besoin, un nouveau devis.",
  },
  {
    q: "Que se passe-t-il quand quelqu’un appelle ?",
    a: "Le client appelle votre numéro habituel. Si vous ne répondez pas, l’appel m’est transféré. Je réponds au nom de votre entreprise, je note la demande et je vous envoie les informations.",
  },
  {
    q: "Est-ce que mon client voit qu’il est transféré ?",
    a: "Il appelle toujours votre numéro habituel. Le fonctionnement peut changer selon votre opérateur. Nous faisons donc un appel test ensemble avant de commencer.",
  },
  {
    q: "Comment je sais quelle entreprise est appelée ?",
    a: "L’outil affiche l’entreprise concernée avant que je réponde. Nous vérifions cette fonction avec la solution choisie avant de commencer.",
  },
  {
    q: "Que se passe-t-il si je suis déjà en ligne ?",
    a: "Selon le réglage choisi, le nouvel appel peut attendre, aller sur une messagerie ou suivre une autre règle. Si les appels deviennent plus nombreux, nous adaptons la formule ensemble.",
  },
  {
    q: "Puis-je prendre des rendez-vous ?",
    a: "Oui, si vous m’y autorisez et me donnez l’accès nécessaire à votre agenda. Nous écrivons ensemble les horaires, les durées et les rendez-vous que je peux confirmer.",
  },
  {
    q: "Puis-je répondre à des questions de prix ?",
    a: "Oui, seulement avec les prix et les réponses que vous m’avez donnés. Je ne négocie pas et je n’invente jamais un prix.",
  },
  {
    q: "Puis-je rappeler au nom de l’entreprise ?",
    a: "Oui, si cela est prévu dans votre formule et si une ligne professionnelle adaptée est prête. Je n’utilise jamais un faux numéro.",
  },
  {
    q: "Est-ce que cela remplace un salarié ?",
    a: "Non. Je prends en charge les appels, messages et petites tâches que nous avons choisis. Le service aide votre entreprise, mais ne remplace pas forcément un poste complet.",
  },
  {
    q: "Comment sont traitées les données et la confidentialité ?",
    a: "Je garde seulement les informations utiles pour traiter la demande. Les accès, l’envoi et la durée de conservation sont décidés avec vous avant de commencer.",
  },
  {
    q: "Comment se passe l’arrêt ?",
    a: "L’abonnement est mensuel. À l’arrêt, le transfert d’appel est coupé et mes accès sont retirés selon les conditions prévues dans le contrat.",
  },
];

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="max-w-3xl">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</span>
      <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground md:text-4xl">{title}</h2>
      {text ? <p className="mt-4 leading-relaxed text-muted-foreground">{text}</p> : null}
    </div>
  );
}

function AccueilClientPage() {
  return (
    <div className="bg-background">
      <section className="border-b border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <AnimatedSection className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              <MapPin size={14} /> Périgord noir · à distance partout en France
            </span>
             <h1 className="mt-6 font-display text-4xl font-extrabold text-foreground md:text-6xl">Communication externalisée</h1>
            <p className="mt-6 max-w-3xl text-xl font-medium leading-relaxed text-foreground md:text-2xl">
              Quand vous êtes indisponible ou souhaitez déléguer certains échanges, je prends en charge une partie de votre communication client.
            </p>
            <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
               Vous choisissez ce que vous me confiez : appels, SMS, e-mails ou messages sur les réseaux sociaux. Nous préparons ensemble les réponses possibles. Le téléphone fait partie du service, mais je ne promets ni du 24 h/24 ni des demandes sans limite.
            </p>
            <div className="mt-8 flex flex-col gap-5 border-l-4 border-primary pl-5 sm:flex-row sm:items-end sm:gap-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Mini permanence</p>
                <p className="mt-1 font-display text-4xl font-extrabold text-foreground">173,33 €/mois</p>
                <p className="mt-1 font-semibold text-muted-foreground">soit 40 €/semaine</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:gap-3">
                  Demander une mise en place <ArrowRight size={16} />
                </Link>
                <a href="#tarifs" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary">
                  Voir les tarifs <ArrowDown size={16} />
                </a>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <AnimatedSection>
          <SectionHeading eyebrow="Les appels" title="Comment fonctionne un appel ?" text="Vous gardez votre numéro habituel. Si vous ne répondez pas, l’appel peut m’être transféré selon la règle choisie ensemble." />
        </AnimatedSection>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {callSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <AnimatedSection key={step.title} delay={index * 0.04}>
                <article className="relative h-full rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon size={19} /></span>
                    <span className="font-display text-2xl font-extrabold text-primary/35">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                  {index < callSteps.length - 1 ? <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden text-primary lg:block" size={20} aria-hidden="true" /> : null}
                </article>
              </AnimatedSection>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border/60 bg-card py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection>
             <SectionHeading eyebrow="Messages et e-mails" title="Comment je réponds aux messages ?" text="Vous choisissez les moyens de contact que vous me confiez. Vos consignes indiquent ce que je peux répondre ou vous transmettre. La publication régulière sur vos réseaux sociaux est comprise seulement si elle est prévue dans votre formule." />
          </AnimatedSection>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {digitalSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <AnimatedSection key={step.title} delay={index * 0.05}>
                  <article className="relative h-full rounded-2xl border border-border bg-background p-6">
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon size={19} /></span>
                      <span className="font-display text-2xl font-extrabold text-primary/35">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="mt-5 font-display text-lg font-bold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                  </article>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <AnimatedSection>
            <SectionHeading eyebrow="Mise en place" title="Comment on installe le service ?" text="Je vous accompagne à chaque étape. On règle tout ensemble, puis on vérifie que cela fonctionne avant de commencer." />
            <p className="mt-6 font-display text-xl font-extrabold text-primary">Vous gardez votre numéro, je m’occupe de la mise en place.</p>
            <div className="mt-7 rounded-2xl border border-primary/25 bg-primary/5 p-6">
              <p className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={20} />
                Si une démarche auprès d’Orange, SFR, Bouygues Telecom, Free ou d’un autre opérateur est nécessaire, je peux échanger avec lui avec votre autorisation ou avec vous à mes côtés. Je ne modifie jamais votre contrat ni votre compte sans votre accord.
              </p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.08}>
            <ol className="grid gap-3 sm:grid-cols-2">
              {setupSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 rounded-2xl border border-border bg-background p-5 text-sm leading-relaxed text-muted-foreground">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </AnimatedSection>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <AnimatedSection>
            <SectionHeading eyebrow="Outils" title="Les outils que j’utilise" text="Les outils sont choisis selon votre ligne, les moyens de contact souhaités et vos besoins." />
        </AnimatedSection>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <AnimatedSection key={tool.name} delay={index * 0.05}>
                <article className="h-full rounded-2xl border border-border bg-card p-6">
                  <div className="flex h-14 items-center">
                    {tool.logo ? <img src={tool.logo} alt={`Logo ${tool.name}`} className="max-h-10 max-w-[150px] object-contain" loading="lazy" /> : Icon ? <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={23} /></span> : null}
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold text-foreground">{tool.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tool.role}</p>
                  {tool.note ? <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">{tool.note}</p> : null}
                </article>
              </AnimatedSection>
            );
          })}
        </div>
        <AnimatedSection delay={0.1} className="mt-6">
          <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm leading-relaxed text-muted-foreground">
            <p className="flex items-start gap-3"><Info className="mt-0.5 shrink-0 text-primary" size={19} /><span><strong className="text-foreground">En toute transparence :</strong> ALC! n’a aucun partenariat avec ces marques. Leurs fonctions et leurs prix peuvent changer. Si besoin, nous pouvons choisir un autre outil plus adapté.</span></p>
          </div>
        </AnimatedSection>
      </section>

      <section className="border-y border-border/60 bg-foreground py-20 text-background lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Exemple fictif</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">Dupont Plomberie — Sarlat</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-background/65">Cette entreprise est entièrement fictive et sert uniquement à illustrer le fonctionnement. Elle n’est pas présentée comme un client d’ALC!.</p>
          </AnimatedSection>
          <AnimatedSection delay={0.08} className="mt-10">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-background/15 p-6"><PhoneCall className="text-primary" /><h3 className="mt-4 font-display text-lg font-bold">1. L’appel</h3><p className="mt-2 text-sm leading-relaxed text-background/70">Un client appelle le numéro habituel. Le plombier est sur un chantier et ne peut pas répondre. Après le délai choisi, l’appel est renvoyé vers le standard.</p></div>
              <div className="rounded-2xl border border-background/15 p-6"><Smartphone className="text-primary" /><h3 className="mt-4 font-display text-lg font-bold">2. La réponse</h3><p className="mt-2 text-sm leading-relaxed text-background/70">Mon Pixel 10 sonne. Le contexte configuré me permet d’identifier l’entreprise et je réponds : « Dupont Plomberie bonjour ».</p></div>
              <div className="rounded-2xl border border-background/15 p-6"><FileText className="text-primary" /><h3 className="mt-4 font-display text-lg font-bold">3. Le compte rendu</h3><p className="mt-2 text-sm leading-relaxed text-background/70">Je note le nom, le téléphone, l’adresse, le motif et l’urgence, puis j’envoie la demande au plombier par le moyen choisi.</p></div>
              <div className="rounded-2xl border border-background/15 p-6"><AtSign className="text-primary" /><h3 className="mt-4 font-display text-lg font-bold">4. Les autres canaux</h3><p className="mt-2 text-sm leading-relaxed text-background/70">Un autre client écrit sur Facebook ou par e-mail. Je réponds aux demandes simples prévues ; sinon je recueille les éléments et transmets. Je peux confirmer un rendez-vous seulement avec l’autorisation et l’accès adaptés.</p></div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section id="tarifs" className="scroll-mt-24 bg-card py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection>
            <SectionHeading eyebrow="Les formules" title="Choisissez la formule adaptée" text="Avant de commencer, nous décidons du nombre de demandes, des horaires, des moyens de contact et des actions comprises dans votre formule." />
          </AnimatedSection>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <AnimatedSection key={plan.name} delay={index * 0.07}>
                <article className={`flex h-full flex-col rounded-2xl p-8 ${plan.highlight ? "bg-foreground text-background" : "border border-border bg-background"}`}>
                  <h3 className={`font-display text-xl font-bold ${plan.highlight ? "text-background" : "text-foreground"}`}>{plan.name}</h3>
                  <p className="mt-5 font-display text-3xl font-extrabold text-primary">{plan.price}</p>
                  <p className={`mt-1 text-sm font-semibold ${plan.highlight ? "text-background/75" : "text-muted-foreground"}`}>{plan.weekly}</p>
                  <p className={`mt-5 text-sm leading-relaxed ${plan.highlight ? "text-background/70" : "text-muted-foreground"}`}>{plan.lead}</p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => <li key={feature} className={`flex items-start gap-3 text-sm ${plan.highlight ? "text-background/80" : "text-muted-foreground"}`}><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />{feature}</li>)}
                  </ul>
                  <Link to="/contact" className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-bold text-primary transition-all hover:gap-3">Choisir cette formule <ArrowRight size={16} /></Link>
                </article>
              </AnimatedSection>
            ))}
          </div>
          <AnimatedSection delay={0.1} className="mt-8">
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-6 text-sm leading-relaxed text-muted-foreground">
              <p className="flex items-start gap-3"><ClipboardCheck className="mt-0.5 shrink-0 text-primary" size={20} /><span><strong className="text-foreground">Tout est clair dès le départ :</strong> le nombre de demandes, les horaires et les actions comprises sont écrits dans votre formule. Pour tout besoin en plus, je vous demande votre accord et je prépare un devis si nécessaire.</span></p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <AnimatedSection>
          <SectionHeading eyebrow="Démarrage" title="On prépare, on teste, puis on commence" text="La mise en place est prévue dans le devis. Nous vérifions ensemble que tout fonctionne avant le début de l’abonnement." />
        </AnimatedSection>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-border p-6"><Settings className="text-primary" /><h3 className="mt-4 font-display text-lg font-bold text-foreground">Préparation</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">On règle le transfert d’appel, la phrase d’accueil et vos consignes comme prévu dans le devis.</p></article>
          <article className="rounded-2xl border border-border p-6"><TestTube2 className="text-primary" /><h3 className="mt-4 font-display text-lg font-bold text-foreground">Appel test et validation</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Un appel depuis un second téléphone confirme le bon cheminement, la réponse et la transmission du compte rendu.</p></article>
          <article className="rounded-2xl border border-border p-6"><CalendarCheck className="text-primary" /><h3 className="mt-4 font-display text-lg font-bold text-foreground">Début de l’abonnement</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Quand tout fonctionne, l’abonnement commence. Vous pouvez ensuite l’arrêter selon les conditions prévues dans le contrat.</p></article>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <AnimatedSection>
            <SectionHeading eyebrow="Questions fréquentes" title="Tout savoir avant de démarrer" text="Ouvrez chaque rubrique pour consulter une réponse détaillée." />
          </AnimatedSection>
          <AnimatedSection delay={0.08} className="mt-10">
            <Accordion type="multiple" className="rounded-2xl border border-border bg-background px-5 sm:px-7">
              {faq.map((item, index) => (
                <AccordionItem key={item.q} value={`item-${index}`} className="last:border-b-0">
                  <AccordionTrigger className="min-h-16 py-5 text-left font-display text-base font-bold text-foreground hover:text-primary hover:no-underline">{item.q}</AccordionTrigger>
                  <AccordionContent className="pb-6 pr-8 text-sm leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </AnimatedSection>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <AnimatedSection>
          <SectionHeading eyebrow="Retours" title="Témoignages" />
        </AnimatedSection>
        <AnimatedSection delay={0.08} className="mt-10">
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 md:p-12">
            <Quote size={28} className="text-primary" />
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-foreground">Cette offre est récente : aucun témoignage réel n’est publié pour l’instant.</p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">Les premiers retours apparaîtront ici uniquement avec l’accord des clients concernés. Aucun avis fictif n’est utilisé.</p>
          </div>
        </AnimatedSection>
      </section>

      <section className="border-t border-border/60 bg-card py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-6 md:flex-row md:items-center md:justify-between">
          <div><p className="font-display text-2xl font-extrabold text-foreground">Prêt à me confier une partie de vos échanges clients ?</p><p className="mt-2 text-sm text-muted-foreground">Commençons par choisir les moyens de contact, les horaires et les tâches dont vous avez besoin.</p></div>
          <Link to="/contact" className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:gap-3">Demander une mise en place <ArrowRight size={16} /></Link>
        </div>
      </section>
    </div>
  );
}
