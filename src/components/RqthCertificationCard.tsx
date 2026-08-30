import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Accessibility,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
} from "lucide-react";

export function RqthCertificationCard() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const certificationsSection = document.getElementById("certifications");
    const grid = certificationsSection?.querySelector<HTMLElement>(".grid");
    if (!grid) return;

    const mount = document.createElement("div");
    mount.dataset.rqthCertification = "true";
    grid.prepend(mount);
    setTarget(mount);

    return () => mount.remove();
  }, []);

  if (!target) return null;

  return createPortal(
    <div className="h-full rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md sm:p-6">
      <div className="flex items-start gap-4">
        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary">
          <Accessibility size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold text-foreground">RQTH</p>
          <p className="text-sm text-muted-foreground">
            Reconnaissance de la qualité de travailleur handicapé
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              Obtenue en 2023
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              Échéance estimée : 2028
            </span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Reconnaissance administrative pouvant être présentée à un employeur si elle est utile pour l'accompagnement, le maintien dans l'emploi ou certains aménagements.
          </p>
        </div>
      </div>

      <details className="group mt-4 rounded-xl border border-border bg-background">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
          <FileText size={16} className="shrink-0 text-primary" />
          <span className="flex-1">Voir le détail</span>
          <ChevronDown size={15} className="text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>

        <div className="border-t border-border px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">À quoi sert la RQTH ?</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              La RQTH est une reconnaissance administrative destinée à faciliter l'accès à l'emploi, le maintien dans l'emploi et, lorsque cela est nécessaire, la mise en place d'aménagements ou de dispositifs d'accompagnement.
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-muted/25 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Situation actuelle</p>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li><strong className="text-foreground">Épilepsie :</strong> aujourd'hui contrôlée et stabilisée.</li>
              <li><strong className="text-foreground">TDAH :</strong> pris en compte dans la reconnaissance.</li>
              <li><strong className="text-foreground">Vision :</strong> antécédent de trouble visuel à l'œil gauche ; la vision est aujourd'hui correcte au quotidien.</li>
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Ces informations sont communiquées volontairement pour donner un contexte simple à la reconnaissance. Elles ne remplacent pas un avis médical et n'ont pas vocation à détailler un dossier de santé.
            </p>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Documents utiles</p>
            <div className="mt-2 grid gap-2">
              <a
                href="https://www.agefiph.fr/sites/default/files/medias/fichiers/2026-01/Agefiph-Metodia_2026-01.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/40"
              >
                <span>Guide Agefiph 2026 — services et aides</span>
                <Download size={14} className="shrink-0 text-primary" />
              </a>

              <a
                href="https://www.agefiph.fr/sites/default/files/medias/fichiers/2026-01/Agefiph-Aide-apprentissage_2026-01.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/40"
              >
                <span>Aide Agefiph à l'apprentissage 2026</span>
                <Download size={14} className="shrink-0 text-primary" />
              </a>

              <a
                href="https://www.service-public.fr/particuliers/vosdroits/R19993"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/40"
              >
                <span>Dossier MDPH / demande ou renouvellement</span>
                <ExternalLink size={14} className="shrink-0 text-primary" />
              </a>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-dashed border-border px-3 py-3 text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Justificatif personnel RQTH :</strong> disponible sur demande. La décision MDPH complète n'est pas publiée en ligne afin de protéger les données personnelles qu'elle contient.
          </div>
        </div>
      </details>
    </div>,
    target,
  );
}
