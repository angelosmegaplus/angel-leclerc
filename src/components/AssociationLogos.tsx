import { useEffect } from "react";

const associations = [
  {
    match: ["ancien président d'association", "fraternité du scoutisme"],
    src: "/logos/scoutisme/fraternite.jpg",
    alt: "Fraternité du Scoutisme",
  },
  {
    match: ["chef scout"],
    src: "/logos/scoutisme/scoutisme-francais.jpg",
    alt: "Scoutisme Français",
  },
  {
    match: ["bénévole", "réseau baden-powell"],
    src: "/logos/scoutisme/reseau-baden-powell.png",
    alt: "Réseau Baden-Powell",
  },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function replaceAssociationIcons() {
  const cards = Array.from(
    document.querySelectorAll<HTMLElement>("section .rounded-2xl, section .rounded-3xl"),
  );

  let replaced = 0;

  for (const association of associations) {
    const card = cards.find((candidate) => {
      const text = normalize(candidate.textContent ?? "");
      return association.match.every((needle) => text.includes(normalize(needle)));
    });

    if (!card) continue;

    const iconBox = Array.from(card.querySelectorAll<HTMLElement>("div")).find((node) => {
      const classes = node.className;
      return (
        typeof classes === "string" &&
        classes.includes("rounded-xl") &&
        (classes.includes("bg-primary/10") || classes.includes("bg-primary/15")) &&
        node.querySelector("svg")
      );
    });

    if (!iconBox || iconBox.dataset.associationLogo === association.alt) {
      if (iconBox) replaced += 1;
      continue;
    }

    iconBox.replaceChildren();
    iconBox.dataset.associationLogo = association.alt;
    iconBox.classList.remove("bg-primary/10", "bg-primary/15", "text-primary", "p-3");
    iconBox.classList.add(
      "h-12",
      "w-12",
      "shrink-0",
      "overflow-hidden",
      "border",
      "border-border",
      "bg-white",
      "p-1.5",
      "sm:h-14",
      "sm:w-14",
    );

    const image = document.createElement("img");
    image.src = association.src;
    image.alt = association.alt;
    image.loading = "lazy";
    image.decoding = "async";
    image.className = "h-full w-full object-contain";
    iconBox.appendChild(image);
    replaced += 1;
  }

  return replaced === associations.length;
}

export function AssociationLogos() {
  useEffect(() => {
    if (replaceAssociationIcons()) return;

    const observer = new MutationObserver(() => {
      if (replaceAssociationIcons()) observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => observer.disconnect(), 5000);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, []);

  return null;
}
