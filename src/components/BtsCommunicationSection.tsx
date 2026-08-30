import { BookOpen, ChevronDown, Download, FileText } from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";

export function BtsCommunicationSection() {
  return (
    <AnimatedSection>
      <section className="bg-background py-5 md:py-7">
        <div className="container-tight">
          <details className="group mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:px-5 [&::-webkit-details-marker]:hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">BTS Communication</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Informations et documents de formation</p>
              </div>
              <ChevronDown size={17} className="shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
            </summary>

            <div className="border-t border-border px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex items-start gap-3">
                <FileText size={17} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Le BTS Communication fait partie de mon parcours. Cette rubrique rassemble simplement les documents utiles aux employeurs et aux structures souhaitant consulter le programme ou le rythme de formation.
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

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Le calendrier détaille notamment l'organisation entre les périodes de formation et les périodes en entreprise.
              </p>
            </div>
          </details>
        </div>
      </section>
    </AnimatedSection>
  );
}
