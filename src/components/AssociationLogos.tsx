import { useEffect } from "react";

const replacements = [
  { match: "fraternité du scoutisme", src: "/logos/scoutisme/fraternite-officiel.webp", alt: "Fraternité du Scoutisme" },
  { match: "chef scout", src: "/logos/scoutisme/scoutisme-francais.jpg", alt: "Scoutisme Français" },
  { match: "réseau baden-powell", src: "/logos/scoutisme/reseau-baden-powell.png", alt: "Réseau Baden-Powell" },
];

export function AssociationLogos() {
  useEffect(() => {
    const replaceIcons = () => {
      const cards = Array.from(document.querySelectorAll<HTMLElement>("section article, section [class*='rounded']"));
      let done = 0;
      for (const item of replacements) {
        const card = cards.find((candidate) => (candidate.textContent?.toLowerCase() ?? "").includes(item.match));
        if (!card || card.dataset.associationLogoReplaced === item.match) continue;
        const iconContainer = Array.from(card.querySelectorAll<HTMLElement>("div")).find((div) => {
          const svg = div.querySelector(":scope > svg");
          if (!svg) return false;
          const rect = div.getBoundingClientRect();
          return rect.width > 40 && rect.width < 130 && rect.height > 40 && rect.height < 130;
        });
        if (!iconContainer) continue;
        iconContainer.innerHTML = "";
        iconContainer.className = "flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white p-1 shadow-sm sm:h-24 sm:w-24";
        const image = document.createElement("img");
        image.src = item.src;
        image.alt = item.alt;
        image.loading = "lazy";
        image.className = "h-full w-full object-contain";
        iconContainer.appendChild(image);
        card.dataset.associationLogoReplaced = item.match;
        done += 1;
      }
      return done === replacements.length;
    };
    if (replaceIcons()) return;
    const observer = new MutationObserver(() => { if (replaceIcons()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => observer.disconnect(), 5000);
    return () => { observer.disconnect(); window.clearTimeout(timeout); };
  }, []);
  return null;
}
