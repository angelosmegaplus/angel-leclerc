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
// supprimer les services déjà présents dans Flamme.
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
  { id: "franceinfo", name: "franceinfo", description: "Actualités France et monde", url: "https://www.franceinfo.fr/", glyph: "●", accent: "#facc15" },
  { id: "cnews", name: "CNEWS", description: "Actualités CNEWS", url: "https://www.cnews.fr/", glyph: "C", accent: "#dc2626" },
  { id: "tf1-info", name: "TF1 Info", description: "Actualités TF1 et LCI", url: "https://www.tf1info.fr/", glyph: "1", accent: "#2563eb" },
  { id: "actu-fr", name: "Actu.fr", description: "Actualités nationales et locales", url: "https://actu.fr/", glyph: "A", accent: "#dc2626" },
];

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
  anchor.className = "flex w-[68px] shrink-0 flex-col items-center gap-2 text-center";

  const icon = document.createElement("span");
  icon.className = "flex h-12 w-12 items-center justify-center rounded-full border border-[#dfe1e5] bg-white text-[19px] font-semibold shadow-sm transition-transform hover:scale-105";
  icon.style.color = shortcut.accent;
  icon.textContent = shortcut.glyph;
  icon.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "max-w-[68px] truncate text-[11px] leading-4 text-[#3c4043]";
  label.textContent = shortcut.name;

  anchor.append(icon, label);
  return anchor;
}

function enhanceCarousel() {
  const nav = document.querySelector<HTMLElement>('nav[aria-label="Services Flamme"]');
  const rail = nav?.firstElementChild as HTMLElement | null;
  if (!rail) return;

  const children = Array.from(rail.children);
  const radio = children.find((node) => serviceName(node).startsWith("Radio"));
  const tv = children.find((node) => serviceName(node).startsWith("TV"));
  const good = children.find((node) => serviceName(node).startsWith("Bonne action"));

  // Radio et TV restent accessibles mais deviennent des raccourcis secondaires,
  // juste avant Bonne action qui demeure systématiquement en dernière position.
  if (good && radio && radio.nextElementSibling !== tv) rail.insertBefore(radio, good);
  if (good && tv && tv.nextElementSibling !== good) rail.insertBefore(tv, good);

  const secondaryAnchor = radio ?? tv ?? good ?? null;
  for (const shortcut of EXTRA_SHORTCUTS) {
    if (rail.querySelector(`[data-flamme-extra-shortcut="${shortcut.id}"]`)) continue;
    rail.insertBefore(createShortcut(shortcut), secondaryAnchor);
  }
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
  olvid.style.background = "transparent";

  const dialog = skred.closest('[role="dialog"]');
  const intro = dialog?.querySelector("p.text-\\[13px\\]") as HTMLParagraphElement | null;
  if (intro && !intro.textContent?.includes("Skred est le choix recommandé")) {
    intro.textContent = "Des messageries instantanées qui mettent la confidentialité en avant. Skred est le choix recommandé par Flamme.";
  }
}

function fixHelpCopy() {
  document.querySelectorAll("p").forEach((node) => {
    if (node.textContent?.includes("Ces quatre premiers raccourcis du carrousel ouvrent un panneau de choix")) {
      node.textContent = node.textContent.replace(
        "Ces quatre premiers raccourcis du carrousel ouvrent un panneau de choix",
        "Ces raccourcis ouvrent un panneau de choix",
      );
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

    let queued = false;
    const applyEnhancements = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        enhanceCarousel();
        enhanceMessagingPanel();
        fixHelpCopy();
      });
    };

    applyEnhancements();
    const observer = new MutationObserver(applyEnhancements);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
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
