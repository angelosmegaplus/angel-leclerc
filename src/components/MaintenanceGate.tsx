import type { ReactNode } from "react";

/**
 * Compatibilité temporaire avec l'ancien shell.
 *
 * Le mode maintenance automatique public a été supprimé : les déploiements et
 * modifications ne doivent plus masquer angel-leclerc.fr. Ce composant reste
 * volontairement transparent afin de ne pas casser les imports historiques du
 * shell pendant le nettoyage progressif du code.
 */
export function MaintenanceGate({ children }: { children: ReactNode; bypass?: boolean }) {
  return <>{children}</>;
}
