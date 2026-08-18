/**
 * Source unique de vérité pour le thème clair/sombre de l'espace administrateur.
 * Avant, deux systèmes (AdminShell et AdminBootIntro) écrivaient dans des clés
 * différentes : les deux boutons se désynchronisaient et le mode clair ne
 * s'appliquait jamais complètement.
 */
export type AdminTheme = "light" | "dark";

export const ADMIN_THEME_KEY = "angel-os:admin-theme";

const listeners = new Set<(theme: AdminTheme) => void>();

export function readAdminTheme(): AdminTheme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(ADMIN_THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* stockage indisponible */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyAdminTheme(theme: AdminTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const dark = theme === "dark";
  root.classList.toggle("dark", dark);
  root.classList.toggle("admin-light", !dark);
  root.dataset.angelOsUi = "core";
  root.dataset.adminTheme = theme;
  root.style.colorScheme = dark ? "dark" : "light";
}

/** Rend le site public à son thème d'origine en quittant l'administration. */
export function clearAdminTheme() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "admin-light");
  root.style.colorScheme = "";
  delete root.dataset.angelOsUi;
  delete root.dataset.adminTheme;
}

export function setAdminTheme(theme: AdminTheme) {
  try {
    window.localStorage.setItem(ADMIN_THEME_KEY, theme);
  } catch {
    /* le choix reste actif pour la session */
  }
  applyAdminTheme(theme);
  listeners.forEach((listener) => listener(theme));
}

export function subscribeAdminTheme(listener: (theme: AdminTheme) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
