import { useLayoutEffect } from "react";

const textReplacements: Array<[string, string]> = [
  ["Programme politique personnel", "Point de vue politique personnel"],
  ["programme politique personnel", "point de vue politique personnel"],
  [
    "Cette page présente cependant un programme personnel distinct.",
    "Cette page présente mes positions personnelles ; elles ne constituent pas un programme politique.",
  ],
  ["Découvrir le programme complet", "Découvrir mes positions détaillées"],
  [
    "Le programme politique reste une proposition personnelle.",
    "Ces positions reflètent un point de vue personnel ; elles ne constituent pas un programme politique.",
  ],
];

function replacePoliticsWording(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    let value = node.nodeValue ?? "";
    for (const [before, after] of textReplacements) {
      if (value.includes(before)) value = value.replaceAll(before, after);
    }
    if (value !== node.nodeValue) node.nodeValue = value;
    node = walker.nextNode();
  }

  root.querySelectorAll<HTMLElement>("nav[aria-label='Sommaire du programme']").forEach((element) => {
    element.setAttribute("aria-label", "Sommaire de mes positions");
  });
}

export function PoliticalWordingNormalizer({ enabled }: { enabled: boolean }) {
  useLayoutEffect(() => {
    if (!enabled) return;

    replacePoliticsWording(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            replacePoliticsWording(node as ParentNode);
          } else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
            replacePoliticsWording(node.parentElement);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [enabled]);

  return null;
}
