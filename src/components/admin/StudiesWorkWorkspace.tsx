import { useEffect } from "react";
import { ADMIN_NAVIGATE_EVENT } from "@/lib/admin-navigation";
import { AgendaPanel } from "./AgendaPanel";

/**
 * Route de compatibilité uniquement.
 * L'ancien espace Études / BTS n'existe plus dans Flamme OS : toute ancienne
 * URL ou navigation vers ce module est immédiatement renvoyée vers l'Agenda.
 */
export function StudiesWorkWorkspace() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(ADMIN_NAVIGATE_EVENT, { detail: "agenda" }));
  }, []);

  return <AgendaPanel />;
}
