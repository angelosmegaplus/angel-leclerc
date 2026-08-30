import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GraduationCap } from "lucide-react";

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
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="inline-flex h-[64px] w-[120px] shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary">
          <GraduationCap size={30} />
        </span>
        <div className="flex-1">
          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Études universitaires en histoire
            </h3>
            <span className="text-xs font-medium uppercase tracking-widest text-primary">
              Septembre – octobre 2025
            </span>
          </div>
          <p className="text-sm font-medium text-foreground/80">
            Université Clermont Auvergne · Clermont-Ferrand
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Analyse critique de sources, méthodologie universitaire, recherche documentaire et argumentation.
          </p>
        </div>
      </div>
    </div>,
    target,
  );
}
