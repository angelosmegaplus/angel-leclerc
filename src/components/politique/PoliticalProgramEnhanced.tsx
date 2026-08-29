import {
  ArrowDown,
  Building2,
  Factory,
  Flag,
  Landmark,
  MapPinned,
  Scale,
  ShieldCheck,
  Sparkles,
  Vote,
} from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import { PoliticalProgramMobile } from "./PoliticalProgramMobile";

const rsUrl = "https://www.republique-souveraine.fr/nosidees/";

const quickPositions = [
  { icon: ShieldCheck, label: "France souveraine et État national fort" },
  { icon: Landmark, label: "Régionalisme fort avec de véritables lois régionales" },
  { icon: Factory, label: "Économie sociale, productive et protectionniste" },
  { icon: Building2, label: "Services publics stratégiques puissants" },
  { icon: Vote, label: "RIC national et régional" },
  { icon: Flag, label: "Coopération européenne entre nations souveraines" },
] as const;

const powerCards = [
  {
    icon: Flag,
    eyebrow: "FRANCE",
    title: "Compétences nationales",
    items: ["Défense", "Diplomatie", "Nationalité", "Grands réseaux", "Socle social"],
  },
  {
    icon: MapPinned,
    eyebrow: "RÉGIONS",
    title: "Compétences régionales",
    items: ["Lois", "Transports", "Culture", "Économie", "Police territoriale", "Organisation sanitaire"],
  },
  {
    icon: Scale,
    eyebrow: "LES DEUX",
    title: "Compétences partagées",
    items: ["École", "Santé", "Environnement", "Infrastructures", "Solidarité"],
  },
] as const;

function SectionHeader({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        <Sparkles size={12} /> {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-[1.65rem] font-bold leading-tight text-foreground sm:text-3xl md:text-4xl">{title}</h2>
      {intro ? <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground md:mt-4 md:text-base">{intro}</p> : null}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

function EngagementCard({
  title,
  children,
  logo,
  icon: Icon,
  href,
}: {
  title: string;
  children: React.ReactNode;
  logo?: string;
  icon?: typeof Landmark;
  href?: string;
}) {
  const content = (
    <Card className="h-full">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 p-2 text-primary sm:h-14 sm:w-14">
          {logo ? <img src={logo} alt="" className="h-full w-full object-contain" loading="eager" /> : Icon ? <Icon size={24} aria-hidden="true" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold leading-snug text-foreground">{title}</h3>
          <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
        </div>
      </div>
    </Card>
  );

  return href ? <a href={href} target="_blank" rel="noopener noreferrer" className="block h-full">{content}</a> : content;
}

export function PoliticalProgramEnhanced() {
  return (
    <div className="political-parcours pb-24 md:pb-0" data-politique-parcours>
      <style>{`
        .political-parcours [data-politique-mobile-first="true"] > section:first-child {
          display: none;
        }
        .political-parcours [data-politique-mobile-first="true"] {
          min-width: 0;
          overflow-x: clip;
        }
        .political-parcours [data-politique-mobile-first="true"] > section {
          padding-top: 3.25rem !important;
          padding-bottom: 3.25rem !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        .political-parcours [data-politique-mobile-first="true"] .container-tight {
          width: 100% !important;
          max-width: 72rem !important;
          margin-left: auto !important;
          margin-right: auto !important;
          padding-left: 1.15rem !important;
          padding-right: 1.15rem !important;
        }
        .political-parcours [data-politique-mobile-first="true"] > section:nth-of-type(even) {
          background: color-mix(in oklab, var(--muted) 40%, transparent) !important;
        }
        .political-parcours [data-politique-mobile-first="true"] > section:nth-of-type(odd) {
          background: var(--background) !important;
        }
        .political-parcours [data-politique-mobile-first="true"] details,
        .political-parcours [data-politique-mobile-first="true"] article {
          border-radius: var(--radius-2xl) !important;
        }
        @media (min-width: 768px) {
          .political-parcours [data-politique-mobile-first="true"] > section {
            padding-top: 5rem !important;
            padding-bottom: 5rem !important;
          }
          .political-parcours [data-politique-mobile-first="true"] .container-tight {
            padding-left: 1.5rem !important;
            padding-right: 1.5rem !important;
          }
        }
        @media (max-width: 767px) {
          .political-parcours * {
            max-width: 100%;
          }
          .political-parcours [data-politique-mobile-first="true"] .grid {
            min-width: 0;
          }
        }
      `}</style>

      <section className="relative overflow-hidden bg-background">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-32 h-[480px] w-[480px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-1/3 -right-32 h-[420px] w-[420px] rounded-full bg-secondary/20 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
        </div>

        <div className="container-tight relative py-10 md:py-24">
          <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr] md:gap-10">
            <div className="order-2 md:order-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Flag size={12} /> Point de vue politique personnel
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Une France sociale, souveraine et <span className="italic text-primary">régionaliste</span>
              </h1>
              <p className="mt-3 font-display text-base text-foreground/80 sm:text-lg md:text-xl">Une nation commune, des régions qui décident réellement.</p>
              <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground md:mt-6 md:text-base">
                Cette page rassemble mes positions personnelles : un État national fort sur les fonctions communes, de véritables pouvoirs politiques pour les régions, une protection sociale solide et davantage de démocratie directe.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap sm:gap-3 md:mt-8">
                <a href="#institutions" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:justify-start">
                  <ArrowDown size={16} /> Découvrir mes positions
                </a>
                <a href="#engagements-politiques" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary sm:justify-start">
                  <Landmark size={16} /> Engagements et influences
                </a>
              </div>
            </div>

            <div className="order-1 mx-auto w-full max-w-sm md:order-2 md:mx-0">
              <Card>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">En quelques mots</p>
                <div className="mt-4 space-y-3">
                  {quickPositions.slice(0, 4).map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-start gap-3">
                      <span className="inline-flex rounded-xl bg-primary/10 p-2.5 text-primary"><Icon size={18} /></span>
                      <p className="pt-1 text-sm font-medium leading-relaxed text-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <AnimatedSection>
        <section id="engagements-politiques" className="section-padding scroll-mt-24 bg-muted/40">
          <div className="container-tight">
            <SectionHeader
              eyebrow="Engagements et influences"
              title="Des proximités assumées, sans confondre mes positions avec celles d'une organisation"
              intro="Ces références permettent de situer certaines de mes idées. Elles ne transforment pas cette page en plateforme électorale : il s'agit uniquement de mon point de vue personnel."
            />
            <div className="mt-8 grid gap-6 md:mt-12 md:grid-cols-2">
              <EngagementCard title="Adhérent à République Souveraine" logo="/logos/republique-souveraine.png" href={rsUrl}>
                Je me retrouve dans plusieurs de ses orientations sur la souveraineté populaire, le RIC, la réindustrialisation et les services publics stratégiques. Mes positions restent cependant personnelles et peuvent s'en écarter.
              </EngagementCard>
              <EngagementCard title="Proche de Régions et Peuples Solidaires sur la question territoriale" icon={MapPinned}>
                Je partage leur volonté de donner beaucoup plus de pouvoirs politiques, législatifs et culturels aux régions, ainsi que la défense des identités et langues régionales. Sur l'Europe, je préfère une coopération entre nations souveraines et je refuse de transférer davantage de souveraineté française à l'échelle européenne.
              </EngagementCard>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="section-padding bg-background">
          <div className="container-tight">
            <SectionHeader eyebrow="Lecture rapide" title="Mon positionnement en 30 secondes" intro="Les grandes lignes avant d'entrer dans le détail." />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 md:mt-12 lg:grid-cols-3">
              {quickPositions.map(({ icon: Icon, label }) => (
                <Card key={label} className="flex items-center gap-4">
                  <div className="inline-flex shrink-0 rounded-xl bg-primary/10 p-3 text-primary"><Icon size={21} /></div>
                  <p className="text-sm font-semibold leading-relaxed text-foreground">{label}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="section-padding bg-muted/40">
          <div className="container-tight">
            <SectionHeader eyebrow="Organisation de la France" title="Qui décide de quoi ?" intro="La répartition des responsabilités doit être compréhensible immédiatement, y compris sur téléphone." />
            <div className="mt-8 grid gap-6 md:mt-12 md:grid-cols-3">
              {powerCards.map(({ icon: Icon, eyebrow, title, items }) => (
                <Card key={eyebrow}>
                  <div className="flex items-center gap-4">
                    <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary"><Icon size={22} /></div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
                      <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{title}</h3>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-2 text-sm leading-relaxed text-foreground/90">
                    {items.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" /><span>{item}</span></li>)}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <PoliticalProgramMobile />

      <a href="#institutions" className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg md:hidden">
        Voir mes positions
      </a>
    </div>
  );
}
