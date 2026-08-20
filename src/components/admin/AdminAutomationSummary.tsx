import { useEffect } from "react";
import { StudiesWorkDashboard } from "./StudiesWorkDashboard";

function replaceLegacyAdminLabels() {
  const replacements: Record<string, string> = {
    "Candidatures": "Études & Travail",
    "Nouvelle candidature": "Études & Travail",
    "Bilan candidatures": "Études & Travail",
  };

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const targets: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const value = node.textContent?.trim();
    if (value && replacements[value]) targets.push(node);
  }

  for (const node of targets) {
    const value = node.textContent?.trim();
    if (value && replacements[value]) node.textContent = replacements[value];
  }
}

export function AdminAutomationSummary() {
  useEffect(() => {
    replaceLegacyAdminLabels();
    const first = window.setTimeout(replaceLegacyAdminLabels, 80);
    const second = window.setTimeout(replaceLegacyAdminLabels, 350);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, []);

  return <StudiesWorkDashboard />;
}
