import { StudiesWorkDashboard } from "./StudiesWorkDashboard";

/**
 * Résumé Études & Travail affiché sur l'accueil.
 * Les libellés sont désormais définis à la source dans la navigation :
 * aucun parcours/mutation du DOM n'est nécessaire.
 */
export function AdminAutomationSummary() {
  return <StudiesWorkDashboard />;
}
