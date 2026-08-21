import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  BriefcaseBusiness,
  Download,
  ExternalLink,
  GraduationCap,
  Headphones,
  Mic2,
  Radio,
  Route as RouteIcon,
  School,
  Sparkles,
  Target,
} from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import talisLogo from "@/assets/talis-logo.png";

export const Route = createFileRoute("/mes-objectifs")({
  head: () => ({
    meta: [
      { title: "Mes objectifs — Angel Leclerc" },
      {
        name: "description",
        content:
          "Projet d'études et objectifs professionnels d'Angel Leclerc dans la communication, le journalisme et la radio.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MesObjectifsPage,
});

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md md:p-6 ${className}`}
  >
    {children}
  </div>
);

const institutions = [
  {
    name: "Talis",
    place: "Périgueux",
    type: "BTS Communication · alternance",
    href: "https://www.talis.community/campus/perigueux/",
    logo: talisLogo,
  },
  {
    name: "IBSAC",
    place: "Brive-la-Gaillarde",
    type: "BTS Communication · voie en alternance envisageable",
    href: "https://www.ibsac.fr/",
    initials: "IBSAC",
  },
  {
    name: "CNED",
    place: "À distance",
    type: "BTS Communication · formation à distance",
    href: "https://www.cned.fr/bts/bts-communication",
    initials: "CNED",
  },
];

function MesObjectifsPage() {
  return (
    <main className="overflow-hidden pb-24 md:pb-16">
      <AnimatedSection>
        <section className="section-padding relative bg-muted/40">
          <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="container-tight relative">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                <Target size={16} /> Projet d'avenir
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold text-foreground md:text-6xl">
                Mes objectifs
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Construire un parcours stable et cohérent entre communication, information et radio. La formation reste un objectif important, mais elle s'inscrit dans une trajectoire souple : elle peut être engagée au bon moment, tout en laissant la place à une expérience professionnelle stable si une opportunité intéressante se présente.
              </p>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="section-padding">
          <div className="container-tight">
            <div className="flex items-center gap-3">
              <GraduationCap className="text-primary" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Projet de formation</p>
                <h2 className="font-display text-3xl font-bold text-foreground">BTS Communication</h2>
              </div>
            </div>

            <p className="mt-5 max-w-3xl leading-relaxed text-muted-foreground">
              Le BTS Communication reste la formation centrale envisagée pour renforcer mes compétences en stratégie de communication, rédaction, création de contenus, médias, numérique et gestion de projets. Le calendrier n'est volontairement pas figé : l'objectif est de choisir la formule la plus cohérente avec ma situation professionnelle et personnelle au moment de l'inscription.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Card>
                <BookOpen className="text-primary" size={22} />
                <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Diplôme visé</p>
                <p className="mt-1 font-semibold text-foreground">BTS Communication</p>
              </Card>
              <Card>
                <School className="text-primary" size={22} />
                <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Formats possibles</p>
                <p className="mt-1 font-semibold text-foreground">Alternance ou formation à distance</p>
              </Card>
              <Card>
                <BriefcaseBusiness className="text-primary" size={22} />
                <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Priorité</p>
                <p className="mt-1 font-semibold text-foreground">Construire une situation stable</p>
              </Card>
            </div>

            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Établissements envisagés</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {institutions.map((institution) => (
                  <a
                    key={institution.name}
                    href={institution.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex h-14 items-center justify-between gap-4">
                      {institution.logo ? (
                        <img
                          src={institution.logo}
                          alt={`Logo officiel ${institution.name}`}
                          className="max-h-10 max-w-32 object-contain"
                        />
                      ) : (
                        <div className="flex h-11 min-w-20 items-center justify-center rounded-xl border border-border bg-background px-3 font-display text-sm font-bold tracking-wide text-foreground">
                          {institution.initials}
                        </div>
                      )}
                      <ExternalLink size={16} className="text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                    <h3 className="mt-4 font-display text-xl font-semibold text-foreground group-hover:text-primary">
                      {institution.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">{institution.place}</p>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/85">{institution.type}</p>
                  </a>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Les logos officiels sont utilisés lorsqu'un fichier fiable est déjà intégré au site. Pour les autres établissements, la carte conserve volontairement une identité neutre afin d'éviter d'utiliser une version non officielle ou obsolète du logo.
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">Documents conservés</p>
                  <h3 className="mt-2 font-display text-xl font-semibold text-foreground">BTS Communication · Talis</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/bts/programme-bts-com-talis.pdf"
                    download
                    className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                  >
                    <Download size={14} /> Programme PDF
                  </a>
                  <a
                    href="/bts/calendrier-bts-com-talis.pdf"
                    download
                    className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                  >
                    <Download size={14} /> Calendrier indicatif
                  </a>
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Compétences travaillées</p>
                  <ul className="mt-3 space-y-2 text-sm text-foreground/90">
                    <li>• Élaboration et pilotage d'une stratégie de communication</li>
                    <li>• Conception de solutions de communication</li>
                    <li>• Médias, numérique et contenus innovants</li>
                    <li>• Culture de la communication, langue vivante et CEJM</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Logique du projet</p>
                  <ul className="mt-3 space-y-2 text-sm text-foreground/90">
                    <li>• Consolider les bases en communication</li>
                    <li>• Développer une expérience professionnelle concrète</li>
                    <li>• Renforcer la rédaction, l'oral et la culture média</li>
                    <li>• Préparer ensuite une spécialisation vers la radio ou le journalisme</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8">
              <div className="flex items-start gap-4">
                <RouteIcon className="mt-1 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">Une trajectoire flexible</p>
                  <h3 className="mt-2 font-display text-xl font-semibold text-foreground">La stabilité avant le calendrier</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Le projet n'est pas construit autour d'une date limite. Si une opportunité professionnelle stable et cohérente se présente, elle peut devenir une étape du parcours avant la reprise d'études. Le BTS pourra ensuite être préparé en alternance à Périgueux ou à Brive, ou à distance avec le CNED selon la solution la plus adaptée.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="section-padding bg-muted/40">
          <div className="container-tight">
            <div className="flex items-center gap-3">
              <Radio className="text-primary" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Objectif professionnel</p>
                <h2 className="font-display text-3xl font-bold text-foreground">Travailler à la radio</h2>
              </div>
            </div>

            <p className="mt-5 max-w-3xl leading-relaxed text-muted-foreground">
              Deux métiers m'intéressent particulièrement. Ils partagent le micro, la préparation éditoriale, la maîtrise de l'oral et le travail en équipe, mais correspondent à deux façons différentes de faire de la radio.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <Card>
                <Mic2 className="text-primary" size={26} />
                <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">Journaliste radio</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Rechercher, vérifier et hiérarchiser l'information, préparer des sujets, réaliser des interviews et reportages, écrire pour l'oral et présenter l'information avec clarté et rythme.
                </p>
                <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Voies possibles</p>
                <p className="mt-2 text-sm text-foreground">
                  Après le BTS : BUT Information-Communication parcours journalisme, licence ou formation spécialisée, puis école ou master de journalisme selon les admissions, les expériences et les opportunités.
                </p>
                <a href="https://www.onisep.fr/ressources/univers-metier/metiers/journaliste-radio-et-tv" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">
                  Fiche métier Onisep →
                </a>
              </Card>

              <Card>
                <Headphones className="text-primary" size={26} />
                <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">Animateur radio</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Concevoir et préparer une émission, créer un ton et un rythme, mener des interviews, interagir avec les auditeurs, improviser en direct et participer à l'identité d'une antenne.
                </p>
                <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Voies possibles</p>
                <p className="mt-2 text-sm text-foreground">
                  Le BTS Communication constitue une base utile. La suite peut passer par une formation radio spécialisée, mais surtout par la pratique : radio locale, web-radio, stages, chroniques, podcasts et expériences régulières à l'antenne.
                </p>
                <a href="https://www.onisep.fr/ressources/univers-metier/metiers/animateur-animatrice-de-radio-et-de-television" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">
                  Fiche métier Onisep →
                </a>
              </Card>
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles size={18} />
                <p className="text-xs font-semibold uppercase tracking-widest">Trajectoire</p>
              </div>
              <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-foreground md:flex-row md:flex-wrap md:items-center">
                <span className="rounded-xl bg-muted px-4 py-3">Stabilité professionnelle</span>
                <span className="text-muted-foreground">→</span>
                <span className="rounded-xl bg-muted px-4 py-3">BTS Communication au bon moment</span>
                <span className="text-muted-foreground">→</span>
                <span className="rounded-xl bg-muted px-4 py-3">Expériences radio + spécialisation</span>
                <span className="text-muted-foreground">→</span>
                <span className="rounded-xl bg-primary/10 px-4 py-3 text-primary">Journalisme radio ou animation radio</span>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                L'objectif n'est pas de figer tout le parcours à l'avance, mais de construire progressivement un profil solide : communication, rédaction, culture générale, production de contenus, technique audio et aisance au micro.
              </p>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
}
