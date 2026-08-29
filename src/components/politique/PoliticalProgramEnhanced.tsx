import {
  ArrowDown,
  Building2,
  ExternalLink,
  Factory,
  Flag,
  Landmark,
  MapPinned,
  Scale,
  ShieldCheck,
  Sparkles,
  Vote,
} from "lucide-react";
import { PoliticalProgramMobile } from "./PoliticalProgramMobile";

const rsUrl = "https://www.republique-souveraine.fr/nosidees/";
const rpsUrl = "https://www.federation-rps.org/";

const quickPositions = [
  { icon: ShieldCheck, label: "France souveraine et État national fort" },
  { icon: Landmark, label: "France fédérale avec de véritables lois régionales" },
  { icon: Factory, label: "Économie sociale, productive et protectionniste" },
  { icon: Building2, label: "Services publics stratégiques puissants" },
  { icon: Vote, label: "RIC national et régional" },
  { icon: Flag, label: "Coopération européenne, mais pas de fédéralisme européen" },
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

function EngagementCard({
  title,
  children,
  href,
  logo,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  href: string;
  logo?: string;
  icon?: typeof Landmark;
}) {
  return (
    <article className="min-w-0 overflow-hidden rounded-[22px] border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white p-2 sm:h-16 sm:w-16">
          {logo ? (
            <img src={logo} alt="" className="h-full w-full object-contain" loading="eager" />
          ) : Icon ? (
            <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[1rem] font-bold leading-snug text-foreground sm:text-lg">{title}</h3>
          <div className="mt-2 text-[13px] leading-6 text-muted-foreground sm:text-sm sm:leading-7">{children}</div>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-[12px] font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Site officiel <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        </div>
      </div>
    </article>
  );
}

export function PoliticalProgramEnhanced() {
  return (
    <div className="political-program-enhanced min-w-0 overflow-x-clip bg-background">
      <style>{`
        .political-program-enhanced [data-politique-mobile-first="true"] > section:first-child {
          display: none;
        }
        .political-program-enhanced [data-politique-mobile-first="true"] {
          min-width: 0;
          overflow-x: clip;
        }
      `}</style>

      <section className="relative overflow-hidden border-b border-border bg-background px-3 py-7 sm:px-6 sm:py-12 md:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl sm:h-80 sm:w-80" />
          <div className="absolute -right-24 top-32 h-52 w-52 rounded-full bg-secondary/15 blur-3xl sm:h-72 sm:w-72" />
        </div>

        <div className="container-tight relative min-w-0 px-0">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary sm:text-[11px]">
              <Sparkles className="h-3.5 w-3.5 shrink-0" /> Programme politique personnel
            </span>
            <h1 className="mx-auto mt-4 max-w-4xl font-display text-[2rem] font-bold leading-[1.04] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Une France unie, sociale, souveraine et <span className="italic text-primary">fédérale</span>.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-6 text-muted-foreground sm:text-lg sm:leading-8">
              Une seule nation et une seule citoyenneté, avec des régions capables de voter réellement leurs lois, de disposer de leurs institutions et d'assumer leurs décisions.
            </p>
          </div>

          <div className="mx-auto mt-9 max-w-5xl">
            <div className="mb-4 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">Engagements et influences</p>
              <h2 className="mt-1.5 font-display text-[1.45rem] font-bold leading-tight text-foreground sm:text-3xl">Les organisations qui nourrissent cette ligne politique</h2>
            </div>

            <div className="grid min-w-0 gap-3 lg:grid-cols-2">
              <EngagementCard
                title="Adhérent à République Souveraine"
                href={rsUrl}
                logo="/logos/republique-souveraine.png"
              >
                Une grande partie de son programme est appréciée, notamment sur la souveraineté populaire, le RIC, la réindustrialisation et les services publics stratégiques. Cette page présente cependant un programme personnel distinct.
              </EngagementCard>

              <EngagementCard
                title="Proche de Régions et Peuples Solidaires sur la question territoriale"
                href={rpsUrl}
                icon={MapPinned}
              >
                Je partage avec Régions et Peuples Solidaires l’objectif d’une France beaucoup plus décentralisée, dans laquelle les régions disposent de véritables pouvoirs politiques, législatifs et culturels, ainsi que la défense des identités et langues régionales. En revanche, je ne partage pas leur projet de fédéralisme européen : je défends une coopération entre nations souveraines et refuse qu’une France fédérale intérieure implique davantage de transferts de souveraineté à l’échelle européenne.
              </EngagementCard>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-5xl rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-6">
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">Lecture rapide</p>
              <h2 className="mt-1.5 font-display text-[1.45rem] font-bold leading-tight text-foreground sm:text-3xl">Mon positionnement en 30 secondes</h2>
            </div>
            <div className="mt-5 grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {quickPositions.map(({ icon: Icon, label }) => (
                <div key={label} className="flex min-h-14 min-w-0 items-center gap-3 rounded-2xl border border-border bg-background p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0 text-[13px] font-bold leading-5 text-foreground sm:text-sm">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-center">
              <a
                href="#institutions"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-center text-[13px] font-extrabold text-primary-foreground shadow-sm sm:w-auto sm:min-w-64 sm:text-sm"
              >
                Découvrir le programme complet <ArrowDown className="h-4 w-4 shrink-0" />
              </a>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-5xl">
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">Organisation de la France</p>
              <h2 className="mx-auto mt-1.5 max-w-3xl font-display text-[1.55rem] font-bold leading-tight text-foreground sm:text-3xl md:text-4xl">Qui décide de quoi ?</h2>
              <p className="mx-auto mt-2 max-w-2xl text-[13px] leading-6 text-muted-foreground sm:text-base sm:leading-7">Le principe doit pouvoir se comprendre en quelques secondes sur un téléphone.</p>
            </div>

            <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-3">
              {powerCards.map(({ icon: Icon, eyebrow, title, items }) => (
                <article key={eyebrow} className="min-w-0 rounded-[22px] border border-border bg-card p-4 shadow-sm sm:p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-primary">{eyebrow}</p>
                      <h3 className="mt-0.5 font-display text-base font-bold leading-tight text-foreground sm:text-lg">{title}</h3>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {items.map((item) => (
                      <span key={item} className="inline-flex min-h-9 items-center rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-bold text-foreground">
                        {item}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PoliticalProgramMobile />
    </div>
  );
}
