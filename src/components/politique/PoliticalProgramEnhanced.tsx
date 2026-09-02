import { useState } from "react";
import {
  ArrowDown,
  Building2,
  Factory,
  Flag,
  Image as ImageIcon,
  Landmark,
  MapPinned,
  PlayCircle,
  Scale,
  ShieldCheck,
  Sparkles,
  Vote,
} from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
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

const mediaImages = [
  {
    title: "Le pouvoir national",
    text: "L'hémicycle de l'Assemblée nationale, symbole du niveau commun à toute la France.",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/L%27h%C3%A9micycle_de_l%27Assembl%C3%A9e_nationale_%282025%29.jpg?width=1200",
    href: "https://commons.wikimedia.org/wiki/File:L%27h%C3%A9micycle_de_l%27Assembl%C3%A9e_nationale_%282025%29.jpg",
    credit: "Wikimedia Commons · Louis Barret",
  },
  {
    title: "Le pouvoir régional",
    text: "Le Conseil régional de Bretagne : l'échelon régional comme institution politique à part entière.",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Conseil_r%C3%A9gional_de_Bretagne_Rennes_Patton.jpg?width=1200",
    href: "https://commons.wikimedia.org/wiki/File:Conseil_r%C3%A9gional_de_Bretagne_Rennes_Patton.jpg",
    credit: "Wikimedia Commons · Lektz",
  },
  {
    title: "Les grands réseaux publics",
    text: "Le rail illustre les infrastructures qui doivent rester cohérentes à l'échelle nationale tout en desservant les territoires.",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/TGV_pour_Paris_dans_sa_gare_d%27origine_Annecy_%28ao%C3%BBt_2026%29.JPG?width=1200",
    href: "https://commons.wikimedia.org/wiki/File:TGV_pour_Paris_dans_sa_gare_d%27origine_Annecy_%28ao%C3%BBt_2026%29.JPG",
    credit: "Wikimedia Commons · Florian Pépellin",
  },
  {
    title: "La souveraineté énergétique",
    text: "L'énergie fait partie des secteurs où une stratégie française de long terme reste indispensable.",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Centrale_nucl%C3%A9aire_de_Cruas_depuis_la_rive_oppos%C3%A9e_%282018%29.JPG?width=1200",
    href: "https://commons.wikimedia.org/wiki/File:Centrale_nucl%C3%A9aire_de_Cruas_depuis_la_rive_oppos%C3%A9e_%282018%29.JPG",
    credit: "Wikimedia Commons",
  },
] as const;

const mediaVideos = [
  {
    id: "h6l9P9jOu-U",
    title: "Décentralisation : le rôle des régions dans l'emploi",
    source: "Public Sénat",
  },
  {
    id: "NM03cUVKrMw",
    title: "Le référendum d'initiative citoyenne en débat",
    source: "Public Sénat",
  },
  {
    id: "mlIAq4ATGME",
    title: "Souveraineté économique : redevenir un pays industriel ?",
    source: "Public Sénat",
  },
  {
    id: "xcE5ye25isk",
    title: "Nucléaire : une énergie à la française",
    source: "France 24",
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

function MediaSection() {
  const [mode, setMode] = useState<"images" | "videos">("images");
  const [activeImage, setActiveImage] = useState(0);
  const [activeVideo, setActiveVideo] = useState(0);
  const image = mediaImages[activeImage];
  const video = mediaVideos[activeVideo];

  return (
    <AnimatedSection>
      <section id="medias-politiques" className="section-padding bg-background scroll-mt-24">
        <div className="container-tight">
          <SectionHeader
            eyebrow="À voir"
            title="Des images et des débats pour rendre la page plus vivante"
            intro="Les visuels donnent un repère concret. Les vidéos permettent d'entendre les arguments et les désaccords autour des sujets abordés sur cette page."
          />

          <div className="mx-auto mt-8 flex max-w-sm rounded-full border border-border bg-card p-1 md:mt-10">
            <button
              type="button"
              onClick={() => setMode("images")}
              aria-pressed={mode === "images"}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${mode === "images" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ImageIcon size={16} /> Images
            </button>
            <button
              type="button"
              onClick={() => setMode("videos")}
              aria-pressed={mode === "videos"}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${mode === "videos" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <PlayCircle size={16} /> Vidéos
            </button>
          </div>

          {mode === "images" ? (
            <div className="mx-auto mt-6 max-w-5xl">
              <figure className="overflow-hidden rounded-2xl border border-border bg-card">
                <a href={image.href} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={image.src} alt={image.title} loading="lazy" className="aspect-[16/9] w-full object-cover" />
                </a>
                <figcaption className="p-4 sm:p-5">
                  <p className="font-display text-lg font-semibold text-foreground">{image.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{image.text}</p>
                  <p className="mt-2 text-[11px] font-medium text-muted-foreground">{image.credit}</p>
                </figcaption>
              </figure>

              <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:overflow-visible">
                {mediaImages.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-pressed={activeImage === index}
                    className={`min-w-[72%] snap-start overflow-hidden rounded-2xl border text-left transition-colors sm:min-w-[46%] md:min-w-0 ${activeImage === index ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"}`}
                  >
                    <img src={item.src} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" />
                    <span className="block p-3 text-sm font-semibold leading-snug text-foreground">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-6 max-w-5xl">
              <div className="overflow-hidden rounded-2xl border border-border bg-card p-1.5 sm:p-2">
                <YouTubeEmbed videoId={video.id} title={video.title} />
                <div className="px-3 pb-3 pt-3 sm:px-4">
                  <p className="font-display text-lg font-semibold text-foreground">{video.title}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-primary">{video.source}</p>
                </div>
              </div>

              <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:overflow-visible">
                {mediaVideos.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveVideo(index)}
                    aria-pressed={activeVideo === index}
                    className={`min-w-[72%] snap-start overflow-hidden rounded-2xl border text-left transition-colors sm:min-w-[46%] md:min-w-0 ${activeVideo === index ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"}`}
                  >
                    <div className="relative">
                      <img src={`https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/15"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-background/95 text-primary"><PlayCircle size={22} /></span></span>
                    </div>
                    <span className="block p-3">
                      <span className="block text-sm font-semibold leading-snug text-foreground">{item.title}</span>
                      <span className="mt-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{item.source}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </AnimatedSection>
  );
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
              <EngagementCard title="Adhérent à République Souveraine" icon={Landmark} href={rsUrl}>
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

      <MediaSection />

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
