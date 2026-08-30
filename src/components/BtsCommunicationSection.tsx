import {
  Accessibility,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  Download,
  FileText,
  School,
} from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import talisLogo from "@/assets/talis-logo.png";

const LOGO_VERSION = "20260822-1";
const local = (name: string) => `/logos/objectives/${name}.svg?v=${LOGO_VERSION}`;

const institutions = [
  {
    name: "Talis",
    place: "Périgueux",
    detail: "BTS Communication · piste de formation",
    href: "https://www.talis.community/campus/perigueux/",
    logo: talisLogo,
  },
  {
    name: "IBSAC",
    place: "Brive-la-Gaillarde",
    detail: "BTS Communication · piste de formation",
    href: "https://www.ibsac.fr/",
    logo: local("ibsac"),
  },
  {
    name: "CNED",
    place: "À distance",
    detail: "BTS Communication · possibilité à distance",
    href: "https://www.cned.fr/bts/bts-communication",
    logo: local("cned"),
  },
];

export function BtsCommunicationSection() {
  return (
    <AnimatedSection>
      <section className="bg-background py-5 md:py-7">
        <div className="container-tight">
          <details className="group mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5 [&::-webkit-details-marker]:hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                <BookOpen size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Informations BTS Communication</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Documents, rythme et informations utiles aux employeurs</p>
              </div>
              <ChevronDown size={16} className="shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
            </summary>

            <div className="border-t border-border px-4 py-4 sm:px-5 sm:py-5">
              <div className="rounded-xl border border-border bg-muted/25 p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Cette rubrique conserve des informations pratiques sur une possibilité de BTS Communication. Elle est volontairement secondaire et ne présente pas cette formation comme un choix définitif ou comme l'axe principal du projet professionnel.
                </p>
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <a
                  href="/bts/programme-bts-com-talis.pdf"
                  download
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span>Programme de formation</span>
                  <Download size={16} className="shrink-0 text-primary" />
                </a>
                <a
                  href="/bts/calendrier-bts-com-talis.pdf"
                  download
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span>Calendrier & rythme</span>
                  <Download size={16} className="shrink-0 text-primary" />
                </a>
              </div>

              <details className="group/more mt-4 rounded-xl border border-dashed border-border bg-background">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  <FileText size={16} className="shrink-0 text-primary" />
                  <span className="flex-1">Voir les informations détaillées</span>
                  <ChevronDown size={15} className="text-muted-foreground transition-transform group-open/more:rotate-180" />
                </summary>

                <div className="border-t border-dashed border-border px-4 pb-4 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <BookOpen size={19} className="text-primary" />
                      <p className="mt-3 text-sm font-semibold text-foreground">BTS Communication</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Programme, matières et organisation générale de la formation.</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <School size={19} className="text-primary" />
                      <p className="mt-3 text-sm font-semibold text-foreground">Plusieurs formats</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Présentiel à Brive ou Périgueux, avec possibilité à distance selon la situation.</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <BriefcaseBusiness size={19} className="text-primary" />
                      <p className="mt-3 text-sm font-semibold text-foreground">Informations employeur</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Le calendrier permet de consulter les périodes de formation et les périodes en entreprise.</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <Accessibility size={19} className="text-primary" />
                      <p className="mt-3 text-sm font-semibold text-foreground">RQTH</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Reconnaissance disponible si utile à l'employeur, avec des dispositifs d'accompagnement possibles selon la situation.</p>
                    </div>
                  </div>

                  <p className="mt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Établissements et solutions étudiés</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {institutions.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                      >
                        <div className="flex h-12 w-20 items-center justify-center rounded-lg border border-border bg-white p-2">
                          <img src={item.logo} alt={`Logo ${item.name}`} className="h-full w-full object-contain" loading="lazy" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-foreground">{item.name}</p>
                        <p className="mt-1 text-xs font-medium text-primary">{item.place}</p>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                      </a>
                    ))}
                  </div>

                  <details className="group/employer mt-4 rounded-xl border border-border bg-card">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                      <BriefcaseBusiness size={16} className="shrink-0 text-primary" />
                      <span className="flex-1">Aides et documents employeur</span>
                      <ChevronDown size={15} className="text-muted-foreground transition-transform group-open/employer:rotate-180" />
                    </summary>
                    <div className="border-t border-border px-4 py-4">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Selon le type de contrat et la situation, des dispositifs d'accompagnement ou des aides à l'embauche peuvent exister. Les conditions doivent être vérifiées au moment de la signature du contrat.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href="https://www.agefiph.fr/sites/default/files/medias/fichiers/2026-01/Agefiph-Aide-apprentissage_2026-01.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary"
                        >
                          <FileText size={13} /> Aides employeur Agefiph
                        </a>
                        <a
                          href="https://www.agefiph.fr/sites/default/files/medias/fichiers/2026-06/APF-Agefiph_Guide-Emploi-Jeune_2026-05.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold text-foreground"
                        >
                          <FileText size={13} /> Guide emploi & handicap
                        </a>
                      </div>
                    </div>
                  </details>
                </div>
              </details>
            </div>
          </details>
        </div>
      </section>
    </AnimatedSection>
  );
}
