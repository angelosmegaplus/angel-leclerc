import { useEffect, useRef } from "react";
import { useAnimationControls } from "framer-motion";

type ExtraShortcut = {
  id: string;
  name: string;
  description: string;
  url: string;
  glyph: string;
  accent: string;
};

// Raccourcis directs supplémentaires : ils complètent les panneaux existants sans
// supprimer les services déjà présents dans Flamme. Les médias d’actualité restent
// dans le fil Découvrir et ne sont volontairement pas ajoutés au carrousel principal.
const EXTRA_SHORTCUTS: ExtraShortcut[] = [
  { id: "service-public", name: "Service-Public", description: "Droits et démarches administratives", url: "https://www.service-public.gouv.fr/", glyph: "🏛", accent: "#1d4ed8" },
  { id: "france-identite", name: "France Identité", description: "Identité numérique officielle", url: "https://france-identite.gouv.fr/", glyph: "🪪", accent: "#2563eb" },
  { id: "ameli", name: "Ameli", description: "Assurance Maladie", url: "https://www.ameli.fr/", glyph: "✚", accent: "#0ea5e9" },
  { id: "france-travail", name: "France Travail", description: "Emploi et démarches", url: "https://www.francetravail.fr/accueil/", glyph: "💼", accent: "#2563eb" },
  { id: "impots", name: "Impôts", description: "Impôts et espace fiscal", url: "https://www.impots.gouv.fr/", glyph: "€", accent: "#166534" },
  { id: "doctolib", name: "Doctolib", description: "Rendez-vous de santé", url: "https://www.doctolib.fr/", glyph: "♡", accent: "#0f766e" },
  { id: "sncf", name: "SNCF", description: "Billets et trajets", url: "https://www.sncf-connect.com/", glyph: "🚆", accent: "#7c3aed" },
  { id: "leboncoin", name: "leboncoin", description: "Petites annonces", url: "https://www.leboncoin.fr/", glyph: "🏷", accent: "#f97316" },
  { id: "blablacar", name: "BlaBlaCar", description: "Covoiturage, bus et train", url: "https://www.blablacar.fr/", glyph: "🚗", accent: "#0284c7" },
  { id: "gallica", name: "Gallica", description: "Bibliothèque numérique de la BnF", url: "https://gallica.bnf.fr/", glyph: "📚", accent: "#7c3aed" },
  { id: "legifrance", name: "Légifrance", description: "Droit français officiel", url: "https://www.legifrance.gouv.fr/", glyph: "⚖", accent: "#1e3a8a" },
  { id: "caf", name: "CAF", description: "Allocations et démarches CAF", url: "https://www.caf.fr/", glyph: "◇", accent: "#2563eb" },
];

function isDarkTheme() {
  return window.localStorage.getItem("flamme-theme") === "dark";
}

function serviceName(node: Element): string {
  return (node.textContent ?? "").replace(/\s+/g, " ").trim();
}

function createShortcut(shortcut: ExtraShortcut): HTMLAnchorElement {
  const anchor = document.createElement("a");
  anchor.href = shortcut.url;
  anchor.target = "_blank";
  anchor.rel = "noreferrer";
  anchor.title = shortcut.description;
  anchor.setAttribute("aria-label", `${shortcut.name} — ${shortcut.description}`);
  anchor.dataset.flammeExtraShortcut = shortcut.id;
  anchor.dataset.flammeAccent = shortcut.accent;
  anchor.className = "flex w-[68px] shrink-0 flex-col items-center gap-2 text-center";

  const icon = document.createElement("span");
  icon.dataset.flammeShortcutIcon = "true";
  icon.className = "flex h-12 w-12 items-center justify-center rounded-full border text-[19px] font-semibold shadow-sm transition-transform hover:scale-105";
  icon.textContent = shortcut.glyph;
  icon.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.dataset.flammeShortcutLabel = "true";
  label.className = "max-w-[68px] truncate text-[11px] leading-4";
  label.textContent = shortcut.name;

  anchor.append(icon, label);
  return anchor;
}

function syncShortcutTheme(rail: HTMLElement) {
  const dark = isDarkTheme();
  rail.querySelectorAll<HTMLAnchorElement>("[data-flamme-extra-shortcut]").forEach((anchor) => {
    const icon = anchor.querySelector<HTMLElement>("[data-flamme-shortcut-icon]");
    const label = anchor.querySelector<HTMLElement>("[data-flamme-shortcut-label]");
    if (icon) {
      icon.style.color = anchor.dataset.flammeAccent ?? "#1a73e8";
      icon.style.backgroundColor = dark ? "#303134" : "#ffffff";
      icon.style.borderColor = dark ? "#5f6368" : "#dfe1e5";
    }
    if (label) label.style.color = dark ? "#e8eaed" : "#3c4043";
  });
}

function enhanceCarousel() {
  const nav = document.querySelector<HTMLElement>('nav[aria-label="Services Flamme"]');
  const rail = nav?.firstElementChild as HTMLElement | null;
  if (!rail) return;

  // Nettoyage des quatre médias ajoutés dans une passe précédente : ils doivent
  // alimenter Découvrir, pas apparaître comme raccourcis principaux.
  ["franceinfo", "cnews", "tf1-info", "actu-fr"].forEach((id) => {
    rail.querySelector(`[data-flamme-extra-shortcut="${id}"]`)?.remove();
  });

  const children = Array.from(rail.children);
  const radio = children.find((node) => serviceName(node).startsWith("Radio"));
  const tv = children.find((node) => serviceName(node).startsWith("TV"));
  const good = children.find((node) => serviceName(node).startsWith("Bonne action"));

  // Radio et TV restent accessibles mais deviennent les deux raccourcis secondaires
  // placés juste avant Bonne action, qui demeure systématiquement en dernier.
  const alreadySecondary = Boolean(radio && tv && good && radio.nextElementSibling === tv && tv.nextElementSibling === good);
  if (!alreadySecondary && good) {
    if (radio) rail.insertBefore(radio, good);
    if (tv) rail.insertBefore(tv, good);
  }

  const secondaryAnchor = radio ?? tv ?? good ?? null;
  for (const shortcut of EXTRA_SHORTCUTS) {
    if (rail.querySelector(`[data-flamme-extra-shortcut="${shortcut.id}"]`)) continue;
    rail.insertBefore(createShortcut(shortcut), secondaryAnchor);
  }
  syncShortcutTheme(rail);
}

function firstRow(anchor: HTMLAnchorElement): HTMLElement | null {
  return anchor.children.item(1)?.children.item(0) as HTMLElement | null;
}

function setOriginBadge(anchor: HTMLAnchorElement, text: string) {
  const row = firstRow(anchor);
  if (!row) return;
  const spans = Array.from(row.children).filter((node): node is HTMLSpanElement => node instanceof HTMLSpanElement);
  const badge = spans[1];
  if (badge && badge.textContent !== text) badge.textContent = text;
}

function removeRecommendedPill(anchor: HTMLAnchorElement) {
  const row = firstRow(anchor);
  if (!row) return;
  Array.from(row.children).forEach((node) => {
    if (node instanceof HTMLElement && /Recommandé/i.test(node.textContent ?? "")) node.remove();
  });
}

function addRecommendedPill(anchor: HTMLAnchorElement) {
  const row = firstRow(anchor);
  if (!row || row.querySelector("[data-flamme-runtime-recommended]")) return;
  const pill = document.createElement("span");
  pill.dataset.flammeRuntimeRecommended = "true";
  pill.className = "inline-flex items-center rounded-full bg-[#1a73e8] px-2 py-0.5 text-[10px] font-semibold text-white";
  pill.textContent = "✓ Recommandé";
  row.appendChild(pill);
}

function enhanceMessagingPanel() {
  const skred = document.querySelector<HTMLAnchorElement>('a[href="https://skred.mobi/"]');
  const olvid = document.querySelector<HTMLAnchorElement>('a[href="https://www.olvid.io/fr/"]');
  if (!skred || !olvid || skred.parentElement !== olvid.parentElement) return;

  const parent = skred.parentElement;
  if (parent.firstElementChild !== skred) parent.insertBefore(skred, parent.firstElementChild);

  setOriginBadge(skred, "🇫🇷 Recommandé");
  setOriginBadge(olvid, "🇫🇷 Sans numéro");
  removeRecommendedPill(olvid);
  addRecommendedPill(skred);

  skred.style.borderColor = "rgba(26,115,232,.6)";
  skred.style.background = "rgba(26,115,232,.05)";
  olvid.style.borderColor = isDarkTheme() ? "#5f6368" : "#dfe1e5";
  olvid.style.background = "transparent";

  const dialog = skred.closest('[role="dialog"]');
  const intro = dialog?.querySelector("p.text-\\[13px\\]") as HTMLParagraphElement | null;
  if (intro && !intro.textContent?.includes("Skred est le choix recommandé")) {
    intro.textContent = "Des messageries instantanées qui mettent la confidentialité en avant. Skred est le choix recommandé par Flamme.";
  }
}

function enhanceAiSearchButton() {
  const button = document.querySelector<HTMLButtonElement>(
    'button[aria-label="Rechercher avec l’IA de Qwant"], button[title="Rechercher avec l’IA de Qwant"], button[data-flamme-mistral-trigger="true"]',
  );
  if (!button) return;
  button.dataset.flammeMistralTrigger = "true";
  button.title = "Ouvrir l’IA Mistral dans Flamme";
  button.setAttribute("aria-label", "Ouvrir l’IA Mistral dans Flamme");
}

function openInternalMistral() {
  const nav = document.querySelector<HTMLElement>('nav[aria-label="Services Flamme"]');
  const serviceButton = Array.from(nav?.querySelectorAll<HTMLButtonElement>("button") ?? []).find(
    (button) => serviceName(button) === "IA",
  );
  if (serviceButton) {
    serviceButton.click();
    return;
  }

  const desktopButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
    (button) => button.textContent?.trim() === "IA" && button.dataset.flammeMistralTrigger !== "true",
  );
  desktopButton?.click();
}

function fixHelpCopy() {
  document.querySelectorAll("p").forEach((node) => {
    if (node.textContent?.includes("Ces quatre premiers raccourcis du carrousel ouvrent un panneau de choix")) {
      node.textContent = node.textContent.replace(
        "Ces quatre premiers raccourcis du carrousel ouvrent un panneau de choix",
        "Ces raccourcis ouvrent un panneau de choix",
      );
    }

    if (node.textContent?.includes("L’icône ✦ dans la barre de recherche ouvre le chat IA de Qwant")) {
      node.textContent =
        "IA Mistral — L’icône ✦ dans la barre de recherche ouvre l’assistant Mistral intégré à Flamme. Le raccourci « IA » du carrousel ouvre le même assistant.";
    }
  });
}

/**
 * Suggère discrètement que le carrousel de services se fait défiler
 * horizontalement : une micro-translation visuelle, jamais en boucle,
 * jamais si l'utilisateur vient d'interagir, jamais en reduced-motion.
 *
 * Le hook applique également les préférences de présentation demandées pour
 * Flamme sans toucher aux moteurs de recherche ni aux panneaux existants.
 */
export function useCarouselNudge() {
  const controls = useAnimationControls();
  const interacted = useRef(false);
  const lastInteraction = useRef(0);

  const markInteraction = () => {
    interacted.current = true;
    lastInteraction.current = Date.now();
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onAiClickCapture = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>('button[data-flamme-mistral-trigger="true"]');
      if (!button) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openInternalMistral();
    };

    document.addEventListener("click", onAiClickCapture, true);

    let queued = false;
    const applyEnhancements = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        enhanceCarousel();
        enhanceMessagingPanel();
        enhanceAiSearchButton();
        fixHelpCopy();
      });
    };

    applyEnhancements();
    const observer = new MutationObserver(applyEnhancements);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      document.removeEventListener("click", onAiClickCapture, true);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let cancelled = false;
    let direction = -1;
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    const play = () => {
      if (cancelled) return;
      const idle = Date.now() - lastInteraction.current > 15000;
      if (!interacted.current || idle) {
        void controls.start({
          x: [0, direction * 14, 0],
          transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1], times: [0, 0.45, 1] },
        });
        direction = direction === -1 ? 1 : -1;
      }
      timers.push(setTimeout(play, 28000));
    };

    timers.push(setTimeout(play, 2000));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [controls]);

  return { controls, markInteraction };
}
