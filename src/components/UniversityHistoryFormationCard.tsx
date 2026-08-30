import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/Logo";

export function UniversityHistoryFormationCard() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const section = document.getElementById("formation");
    if (!section) return;

    const headings = Array.from(section.querySelectorAll<HTMLElement>("h3"));
    const bacProHeading = headings.find((heading) =>
      /baccalauréat professionnel|métiers de l'accueil/i.test(heading.textContent ?? ""),
    );
    const bacProCard = bacProHeading?.closest<HTMLElement>(".rounded-2xl");
    const list = section.querySelector<HTMLElement>(".mt-12.space-y-6");
    if (!bacProCard && !list) return;

    const mount = document.createElement("div");
    mount.dataset.universityHistoryFormation = "true";

    // Le Bac Pro reste toujours la formation principale et en première position.
    if (bacProCard) {
      bacProCard.insertAdjacentElement("afterend", mount);
    } else {
      list?.appendChild(mount);
    }

    setTarget(mount);
    return () => mount.remove();
  }, []);

  if (!target) return null;

  return createPortal(
    <div className="rounded-xl border border-border/70 bg-background/65 px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="flex items-start gap-3.5">
        <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg border border-border bg-white p-1.5">
          <Logo
            domain="uca.fr"
            alt="Université Clermont Auvergne"
            size={44}
            bare
            link={false}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Complément de parcours
              </p>
              <h3 className="mt-1 font-display text-base font-semibold text-foreground">
                Études universitaires en histoire
              </h3>
            </div>
            <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Sept. – oct. 2025
            </span>
          </div>

          <p className="mt-0.5 text-sm font-medium text-foreground/75">
            Université Clermont Auvergne · Clermont-Ferrand
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Analyse critique de sources, méthodologie universitaire, recherche documentaire et argumentation.
          </p>
        </div>
      </div>
    </div>,
    target,
  );
}
