import { StudiesWorkDashboard } from "./StudiesWorkDashboard";

type Props = {
  mode?: "stats" | "mail" | "messages" | "publications" | string;
};

/**
 * Résumé Études & Travail affiché dans l'administration.
 * `mode` reste accepté pour compatibilité avec les anciens emplacements pendant
 * la découpe progressive de admin.tsx, mais aucun hack DOM n'est utilisé.
 */
export function AdminAutomationSummary({ mode: _mode }: Props = {}) {
  return <StudiesWorkDashboard />;
}
