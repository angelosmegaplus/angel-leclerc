import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  BriefcaseBusiness,
  Download,
  GraduationCap,
  Headphones,
  Mic2,
  Radio,
  Route as RouteIcon,
  School,
  Target,
} from "lucide-react";

export const Route = createFileRoute("/mes-objectifs")({
  head: () => ({
    meta: [
      { title: "Mes objectifs — Angel Leclerc" },
      {
        name: "description",
        content: "Projet d'études et objectifs professionnels d'Angel Leclerc dans la communication, le journalisme et la radio.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MesObjectifsPage,
});

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card p-5 md:p-6">{children}</div>
);

function MesObjectifsPage() {
  return (
    <main className="pb-24 md:pb-16">
      <section className="section-padding bg-muted/40">
        <div className="container-tight">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Target size={16} /> Projet d'avenir
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold text-foreground md:text-6xl">Mes objectifs</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Construire un parcours cohérent entre communication, information et radio, avec un objectif professionnel clair : évoluer vers le journalisme radio ou l'animation radio.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-tight">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-primary" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Étape 1</p>
              <h2 className="font-display text-3xl font-bold text-foreground">BTS Communication</h2>
            </div>
          </div>

          <p className="mt-5 max-w-3xl leading-relaxed text-muted-foreground">
            À partir de septembre 2026, mon projet principal est de préparer un BTS Communication en alternance avec Talis, campus de Périgueux. Cette formation me permet de consolider des compétences directement utiles pour la suite : stratégie de communication, création de contenus, rédaction, médias, numérique et gestion de projets.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card><BookOpen className="text-primary" size={22} /><p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Durée</p><p className="mt-1 font-semibold text-foreground">24 mois</p></Card>
            <Card><School className="text-primary" size={22} /><p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Établissement</p><p className="mt-1 font-semibold text-foreground">Talis · Périgueux</p></Card>
            <Card><BriefcaseBusiness className="text-primary" size={22} /><p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Format privilégié</p><p className="mt-1 font-semibold text-foreground">Alternance</p></Card>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Documents de formation</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-foreground">BTS Communication · Talis</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href="/bts/programme-bts-com-talis.pdf" download className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/10"><Download size={14} /> Programme PDF</a>
                <a href="/bts/calendrier-bts-com-talis.pdf" download className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/10"><Download size={14} /> Calendrier PDF</a>
              </div>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Compétences travaillées</p><ul className="mt-3 space-y-2 text-sm text-foreground/90"><li>• Élaboration et pilotage d'une stratégie de communication</li><li>• Conception de solutions de communication</li><li>• Médias, numérique et contenus innovants</li><li>• Culture de la communication, langue vivante et CEJM</li></ul></div>
              <div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Calendrier prévisionnel</p><ul className="mt-3 space-y-2 text-sm text-foreground/90"><li>• Rentrée : septembre 2026</li><li>• Promotion : 2026–2028</li><li>• 1re année : 676 h de formation</li><li>• 2e année : 675 h de formation</li></ul></div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <RouteIcon className="mt-1 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Parcours alternatif</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-foreground">Le même BTS à distance avec le CNED</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Si le format en alternance ne peut pas être concrétisé dans les conditions adaptées à mon projet, je souhaite conserver le même cap en préparant le BTS Communication à distance avec le CNED. Il s'agit d'une solution de continuité : formation en ligne, tutorat, classes virtuelles et périodes de stage, tout en gardant le même objectif de diplôme et de poursuite d'études.
                </p>
                <a href="https://www.cned.fr/bts/bts-communication" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">Découvrir le BTS Communication du CNED →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/40">
        <div className="container-tight">
          <div className="flex items-center gap-3"><Radio className="text-primary" /><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Objectif professionnel</p><h2 className="font-display text-3xl font-bold text-foreground">Travailler à la radio</h2></div></div>
          <p className="mt-5 max-w-3xl leading-relaxed text-muted-foreground">Deux métiers m'intéressent particulièrement. Ils partagent le micro, la préparation éditoriale, la maîtrise de l'oral et le travail en équipe, mais ne répondent pas exactement au même objectif.</p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Card><Mic2 className="text-primary" size={26} /><h3 className="mt-4 font-display text-2xl font-semibold text-foreground">Journaliste radio</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Rechercher, vérifier et hiérarchiser l'information, préparer des sujets, réaliser des interviews et reportages, écrire pour l'oral et présenter l'information avec clarté et rythme.</p><p className="mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Voie envisagée</p><p className="mt-2 text-sm text-foreground">Après le BTS : BUT Information-Communication parcours journalisme, puis école ou master de journalisme selon les admissions et les opportunités.</p><a href="https://www.onisep.fr/ressources/univers-metier/metiers/journaliste-radio-et-tv" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">Fiche métier Onisep →</a></Card>
            <Card><Headphones className="text-primary" size={26} /><h3 className="mt-4 font-display text-2xl font-semibold text-foreground">Animateur radio</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Concevoir et préparer une émission, créer un ton et un rythme, mener des interviews, interagir avec les auditeurs, improviser en direct et participer à l'identité d'une antenne.</p><p className="mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Voie envisagée</p><p className="mt-2 text-sm text-foreground">Le BTS Communication constitue une base utile. La suite peut passer par une école spécialisée ou une formation radio, mais surtout par une pratique régulière : radio locale, web-radio, stages, chroniques, podcasts et expériences d'antenne.</p><a href="https://www.onisep.fr/ressources/univers-metier/metiers/animateur-animatrice-de-radio-et-de-television" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">Fiche métier Onisep →</a></Card>
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Trajectoire</p>
            <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-foreground md:flex-row md:items-center">
              <span className="rounded-xl bg-muted px-4 py-3">BTS Communication</span><span className="text-muted-foreground">→</span><span className="rounded-xl bg-muted px-4 py-3">Expériences radio + poursuite d'études</span><span className="text-muted-foreground">→</span><span className="rounded-xl bg-primary/10 px-4 py-3 text-primary">Journalisme radio ou animation radio</span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">L'objectif n'est pas de figer aujourd'hui un seul intitulé de poste, mais de construire progressivement un profil polyvalent : communication, rédaction, culture générale, production de contenus, technique audio et aisance au micro.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
