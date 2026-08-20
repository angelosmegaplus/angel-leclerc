import { StudiesWorkDashboard } from "./StudiesWorkDashboard";

type Props = {
  mode?: "stats" | "mail" | "messages" | "publications" | string;
};

/**
 * Résumé Études & Travail réservé à l'accueil de l'administration.
 * Les anciens appels avec `mode` restent tolérés pendant la découpe de admin.tsx,
 * mais n'injectent plus ce tableau de bord dans des modules sans rapport.
 */
export function AdminAutomationSummary({ mode }: Props = {}) {
  if (mode) return null;
  return <StudiesWorkDashboard />;
}
