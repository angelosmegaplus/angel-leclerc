import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const UCA_LOGO =
  "https://www.uca.fr/medias/photo/logo-uca-long_1649253999977-png";

export function UniversityHistoryFormationCard() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const section = document.getElementById("formation");
    if (!section) return;

    // La rubrique doit rester simplement intitulée « Formation » :
    // on retire l'ancienne phrase orientée vers un projet de poursuite d'études.
    const intro = Array.from(section.querySelectorAll<HTMLParagraphElement>("p")).find(
      (paragraph) =>
        /mon parcours actuel et mon projet de poursuite d'études/i.test(
          paragraph.textContent ?? "",
        ),
    );
    const previousIntroDisplay = intro?.style.display;
    if (intro) intro.style.display = "none";

    const list = section.querySelector<HTMLElement>(".mt-12.space-y-6");
    if (!list) return;

    const mount = document.createElement("div");
    mount.dataset.universityHistoryFormation = "true";
    setTarget(mount);

    const placeAfterBacPro = () => {
      const headings = Array.from(section.querySelectorAll<HTMLElement>("h3"));
      const bacProHeading = headings.find((heading) =>
        /baccalauréat professionnel|métiers de l'accueil/i.test(
          heading.textContent ?? "",
        ),
      );
      const bacProCard = bacProHeading?.closest<HTMLElement>(".rounded-2xl");
      if (!bacProCard) return false;

      bacProCard.insertAdjacentElement("afterend", mount);
      return true;
    };

    // Les formations sont chargées depuis la base de données. On attend donc
    // réellement l'arrivée du Bac Pro avant d'afficher le complément Histoire.
    if (!placeAfterBacPro()) {
      const observer = new MutationObserver(() => {
        if (placeAfterBacPro()) observer.disconnect();
      });
      observer.observe(list, { childList: true, subtree: true });

      return () => {
        observer.disconnect();
        mount.remove();
        if (intro) intro.style.display = previousIntroDisplay ?? "";
      };
    }

    return () => {
      mount.remove();
      if (intro) intro.style.display = previousIntroDisplay ?? "";
    };
  }, []);

  if (!target) return null;

  return createPortal(
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md sm:p-5">
      <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl border border-border bg-white p-2 sm:w-24">
        <img
          src={UCA_LOGO}
          alt="Université Clermont Auvergne"
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
              Complément de parcours
            </p>
            <h3 className="mt-0.5 font-display text-base font-semibold text-foreground">
              Études universitaires en histoire
            </h3>
          </div>
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Sept. – oct. 2025
          </span>
        </div>

        <p className="mt-0.5 text-sm text-muted-foreground">
          Université Clermont Auvergne · Clermont-Ferrand
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Analyse critique de sources, méthodologie universitaire, recherche documentaire et argumentation.
        </p>
      </div>
    </div>,
    target,
  );
}
