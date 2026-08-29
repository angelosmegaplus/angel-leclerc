import { useLayoutEffect } from "react";

const textReplacements: Array<[string, string]> = [
  ["Fédéralisme", "Régionalisme"],
  ["fédéralisme", "régionalisme"],
  ["Une France unie, fédérale, sociale et souveraine.", "Une France unie, régionaliste, sociale et souveraine."],
  ["une organisation beaucoup plus fédérale de la France", "une organisation donnant beaucoup plus d'autonomie politique aux régions"],
  ["Une Ve République fédérale sans changer tous les repères", "Une Ve République régionaliste sans changer tous les repères"],
  ["chaque région fédérée envoie le même nombre de sénateurs", "chaque région envoie le même nombre de sénateurs"],
  ["Pas d'Europe fédérale imposée à la France", "Pas de transfert automatique de souveraineté à l'échelle européenne"],
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

  root.querySelectorAll<HTMLElement>("[id='federalisme-actuel']").forEach((element) => {
    element.id = "regionalisme-actuel";
  });
  root.querySelectorAll<HTMLAnchorElement>("a[href='#federalisme-actuel']").forEach((anchor) => {
    anchor.href = "#regionalisme-actuel";
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
