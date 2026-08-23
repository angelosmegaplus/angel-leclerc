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

type CustomShortcut = {
  id: string;
  name: string;
  url: string;
};

const CUSTOM_SHORTCUTS_KEY = "flamme-custom-shortcuts";
const CUSTOM_SHORTCUTS_EVENT = "flamme-custom-shortcuts-changed";
const MAX_CUSTOM_SHORTCUTS = 20;

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

function normalizeCustomUrl(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function readCustomShortcuts(): CustomShortcut[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_SHORTCUTS_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .flatMap((item): CustomShortcut[] => {
        if (!item || typeof item !== "object") return [];
        const name = typeof item.name === "string" ? item.name.trim().slice(0, 24) : "";
        const url = typeof item.url === "string" ? normalizeCustomUrl(item.url) : null;
        const id = typeof item.id === "string" ? item.id : "";
        return name && url && id ? [{ id, name, url }] : [];
      })
      .slice(0, MAX_CUSTOM_SHORTCUTS);
  } catch {
    return [];
  }
}

function writeCustomShortcuts(items: CustomShortcut[]) {
  try {
    localStorage.setItem(CUSTOM_SHORTCUTS_KEY, JSON.stringify(items.slice(0, MAX_CUSTOM_SHORTCUTS)));
  } catch {
    // Le stockage local peut être indisponible en navigation privée stricte.
  }
  window.dispatchEvent(new CustomEvent(CUSTOM_SHORTCUTS_EVENT));
}

function customGlyph(name: string) {
  const first = Array.from(name.trim())[0];
  return first ? first.toLocaleUpperCase("fr-FR") : "↗";
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

function createCustomShortcut(shortcut: CustomShortcut): HTMLAnchorElement {
  const anchor = createShortcut({
    id: `custom-${shortcut.id}`,
    name: shortcut.name,
    description: `Raccourci personnel — ${shortcut.name}`,
    url: shortcut.url,
    glyph: customGlyph(shortcut.name),
    accent: "#1a73e8",
  });
  anchor.dataset.flammeCustomShortcut = shortcut.id;
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

function syncCustomShortcuts(rail: HTMLElement, secondaryAnchor: Element | null) {
  const current = readCustomShortcuts();
  const validIds = new Set(current.map((item) => item.id));

  rail.querySelectorAll<HTMLElement>("[data-flamme-custom-shortcut]").forEach((node) => {
    const id = node.dataset.flammeCustomShortcut;
    if (!id || !validIds.has(id)) node.remove();
  });

  for (const shortcut of current) {
    if (rail.querySelector(`[data-flamme-custom-shortcut="${CSS.escape(shortcut.id)}"]`)) continue;
    rail.insertBefore(createCustomShortcut(shortcut), secondaryAnchor);
  }
}

function enhanceCarousel() {
  const nav = document.querySelector<HTMLElement>('nav[aria-label="Services Flamme"]');
  const rail = nav?.firstElementChild as HTMLElement | null;
  if (!rail) return;

  ["franceinfo", "cnews", "tf1-info", "actu-fr"].forEach((id) => {
    rail.querySelector(`[data-flamme-extra-shortcut="${id}"]`)?.remove();
  });

  const children = Array.from(rail.children);
  const radio = children.find((node) => serviceName(node).startsWith("Radio"));
  const tv = children.find((node) => serviceName(node).startsWith("TV"));
  const good = children.find((node) => serviceName(node).startsWith("Bonne action"));

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

  syncCustomShortcuts(rail, secondaryAnchor);
  syncShortcutTheme(rail);
}

function settingsField(label: string, placeholder: string, type: "text" | "url") {
  const wrapper = document.createElement("label");
  wrapper.className = "block text-[12px] font-medium";
  wrapper.textContent = label;

  const input = document.createElement("input");
  input.type = type;
  input.placeholder = placeholder;
  input.className = "mt-1 min-h-11 w-full rounded-xl border px-3 text-[14px] outline-none";
  input.dataset.flammeCustomField = type === "url" ? "url" : "name";
  wrapper.appendChild(input);
  return wrapper;
}

function renderCustomShortcutList(section: HTMLElement) {
  const list = section.querySelector<HTMLElement>("[data-flamme-custom-list]");
  if (!list) return;
  list.replaceChildren();
  const items = readCustomShortcuts();

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "text-[12px] leading-4 opacity-70";
    empty.textContent = "Aucun raccourci personnel pour le moment.";
    list.appendChild(empty);
    return;
  }

  for (const item of items) {
    const row = document.createElement("div");
    row.className = "flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2";

    const icon = document.createElement("span");
    icon.className = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a73e8]/10 text-[13px] font-semibold text-[#1a73e8]";
    icon.textContent = customGlyph(item.name);

    const text = document.createElement("div");
    text.className = "min-w-0 flex-1";
    const name = document.createElement("div");
    name.className = "truncate text-[13px] font-medium";
    name.textContent = item.name;
    const host = document.createElement("div");
    host.className = "truncate text-[11px] opacity-65";
    try {
      host.textContent = new URL(item.url).hostname.replace(/^www\./, "");
    } catch {
      host.textContent = item.url;
    }
    text.append(name, host);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px] hover:bg-black/5 dark:hover:bg-white/10";
    remove.title = `Supprimer ${item.name}`;
    remove.setAttribute("aria-label", `Supprimer ${item.name}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      writeCustomShortcuts(readCustomShortcuts().filter((shortcut) => shortcut.id !== item.id));
      renderCustomShortcutList(section);
    });

    row.append(icon, text, remove);
    list.appendChild(row);
  }
}

function enhanceSettingsPanel() {
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
  const title = dialog?.querySelector<HTMLElement>("#flamme-panel-title");
  if (!dialog || title?.textContent?.trim() !== "Paramètres") return;
  if (dialog.querySelector("[data-flamme-custom-shortcuts-settings]")) return;

  const surface = title.parentElement?.parentElement;
  if (!surface) return;

  const appearanceButton = Array.from(surface.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
    button.textContent?.includes("Apparence"),
  );

  const section = document.createElement("section");
  section.dataset.flammeCustomShortcutsSettings = "true";
  section.className = "rounded-2xl border px-4 py-3";

  const heading = document.createElement("div");
  heading.className = "flex items-center justify-between gap-3";
  const headingText = document.createElement("div");
  headingText.className = "text-[14px] font-medium";
  headingText.textContent = "Mes raccourcis";
  const count = document.createElement("span");
  count.className = "text-[11px] opacity-60";
  count.textContent = `jusqu’à ${MAX_CUSTOM_SHORTCUTS}`;
  heading.append(headingText, count);

  const intro = document.createElement("p");
  intro.className = "mt-1 text-[12px] leading-4 opacity-70";
  intro.textContent = "Ajoutez vos sites préférés au carrousel. Ils restent uniquement sur cet appareil.";

  const form = document.createElement("form");
  form.className = "mt-3 grid gap-2";
  const nameField = settingsField("Nom", "Ex. Mon site", "text");
  const urlField = settingsField("Adresse", "exemple.fr", "url");
  const error = document.createElement("p");
  error.className = "hidden text-[12px] leading-4 text-[#d93025]";
  error.dataset.flammeCustomError = "true";
  const add = document.createElement("button");
  add.type = "submit";
  add.className = "min-h-11 rounded-xl bg-[#1a73e8] px-4 text-[13px] font-semibold text-white hover:brightness-95";
  add.textContent = "+ Ajouter au carrousel";
  form.append(nameField, urlField, error, add);

  const list = document.createElement("div");
  list.dataset.flammeCustomList = "true";
  list.className = "mt-3 space-y-2";

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const nameInput = form.querySelector<HTMLInputElement>('[data-flamme-custom-field="name"]');
    const urlInput = form.querySelector<HTMLInputElement>('[data-flamme-custom-field="url"]');
    const name = nameInput?.value.trim().slice(0, 24) ?? "";
    const url = normalizeCustomUrl(urlInput?.value ?? "");
    const current = readCustomShortcuts();

    if (!name || !url) {
      error.textContent = "Indiquez un nom et une adresse de site valide.";
      error.classList.remove("hidden");
      return;
    }
    if (current.length >= MAX_CUSTOM_SHORTCUTS) {
      error.textContent = `Maximum ${MAX_CUSTOM_SHORTCUTS} raccourcis personnels.`;
      error.classList.remove("hidden");
      return;
    }

    const shortcut: CustomShortcut = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      url,
    };
    writeCustomShortcuts([...current, shortcut]);
    if (nameInput) nameInput.value = "";
    if (urlInput) urlInput.value = "";
    error.classList.add("hidden");
    renderCustomShortcutList(section);
  });

  section.append(heading, intro, form, list);
  if (appearanceButton?.parentElement === surface) surface.insertBefore(section, appearanceButton);
  else surface.appendChild(section);

  const dark = isDarkTheme();
  section.style.borderColor = dark ? "#5f6368" : "#dfe1e5";
  section.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
    input.style.borderColor = dark ? "#5f6368" : "#dfe1e5";
    input.style.background = dark ? "#303134" : "#ffffff";
    input.style.color = dark ? "#e8eaed" : "#202124";
  });
  renderCustomShortcutList(section);
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
 * Suggère très rarement que le carrousel se fait défiler horizontalement.
 * Le mouvement est volontairement minuscule, jamais continu et désactivé avec
 * prefers-reduced-motion. Les interactions utilisateur repoussent encore le rappel.
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

    const refresh = () => {
      enhanceCarousel();
      enhanceSettingsPanel();
    };

    document.addEventListener("click", onAiClickCapture, true);
    window.addEventListener(CUSTOM_SHORTCUTS_EVENT, refresh);
    window.addEventListener("storage", refresh);

    let queued = false;
    const applyEnhancements = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        enhanceCarousel();
        enhanceMessagingPanel();
        enhanceAiSearchButton();
        enhanceSettingsPanel();
        fixHelpCopy();
      });
    };

    applyEnhancements();
    const observer = new MutationObserver(applyEnhancements);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      document.removeEventListener("click", onAiClickCapture, true);
      window.removeEventListener(CUSTOM_SHORTCUTS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
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
      const idle = Date.now() - lastInteraction.current > 45000;
      if (!interacted.current || idle) {
        void controls.start({
          x: [0, direction * 8, 0],
          transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1], times: [0, 0.45, 1] },
        });
        direction = direction === -1 ? 1 : -1;
      }
      timers.push(setTimeout(play, 180000));
    };

    // Une seule petite indication après quelques secondes, puis au maximum toutes les 3 minutes.
    timers.push(setTimeout(play, 7000));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [controls]);

  return { controls, markInteraction };
}
