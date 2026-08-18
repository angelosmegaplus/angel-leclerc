/**
 * Navigation interne à Angel OS : les panneaux peuvent demander l'ouverture
 * d'un autre onglet de /admin sans connaître l'état local de la route.
 */
export const ADMIN_NAVIGATE_EVENT = "angel-os:navigate";

export function goToAdminTab(tab: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADMIN_NAVIGATE_EVENT, { detail: tab }));
}
