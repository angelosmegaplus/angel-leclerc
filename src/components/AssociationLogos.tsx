import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const logos = [
  { src: "/logos/scoutisme/fraternite.jpg", alt: "Fraternité du Scoutisme" },
  { src: "/logos/scoutisme/scoutisme-francais.jpg", alt: "Chef scout" },
  { src: "/logos/scoutisme/reseau-baden-powell.png", alt: "Réseau Baden-Powell" },
];

export function AssociationLogos() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const findSection = () => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>("h2,h3,p,span"));
      const heading = nodes.find((node) => {
        const text = node.textContent?.toLowerCase() ?? "";
        return (text.includes("engagement") && text.includes("associ")) || text.trim() === "association";
      });
      const section = heading?.closest<HTMLElement>("section");
      const container = section?.querySelector<HTMLElement>(".container-tight") ?? section;
      if (!container || container.querySelector("[data-association-logos]")) return false;
      const mount = document.createElement("div");
      mount.dataset.associationLogos = "true";
      container.appendChild(mount);
      setTarget(mount);
      return true;
    };

    if (findSection()) return;
    const observer = new MutationObserver(() => {
      if (findSection()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => observer.disconnect(), 5000);
    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, []);

  if (!target) return null;

  return createPortal(
    <div className="mx-auto mt-7 max-w-2xl border-t border-border pt-6">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {logos.map((logo) => (
          <div key={logo.alt} className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-sm sm:p-3">
            <img src={logo.src} alt={logo.alt} className="h-full w-full object-contain" loading="lazy" />
          </div>
        ))}
      </div>
    </div>,
    target,
  );
}
