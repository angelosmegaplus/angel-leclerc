/** Helpers de mise à jour des commandes boutique — serveur uniquement. */
import type { PrintfulOrderState } from "@/lib/printful.server";

export interface OrderEvent {
  at: string;
  label: string;
  detail?: string;
}

/** Statuts Printful traduits en statut interne de commande. */
export function internalStatusFromPrintful(status: string): string | null {
  switch (status) {
    case "draft":
    case "pending":
      return "paid";
    case "inprocess":
    case "onhold":
      return "in_production";
    case "fulfilled":
      return "shipped";
    case "canceled":
      return "canceled";
    case "failed":
      return "failed";
    default:
      return null;
  }
}

export const PRINTFUL_STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  pending: "En attente",
  inprocess: "En production",
  onhold: "En pause",
  fulfilled: "Expédiée",
  canceled: "Annulée",
  failed: "Échec",
  package_shipped: "Colis expédié",
  package_returned: "Colis retourné",
};

export function appendEvent(
  existing: unknown,
  event: OrderEvent,
): OrderEvent[] {
  const list = Array.isArray(existing) ? (existing as OrderEvent[]) : [];
  return [...list, event].slice(-50);
}

/** Construit le patch de commande à partir de l'état Printful. */
export function orderPatchFromPrintful(state: PrintfulOrderState) {
  const shipment = state.shipments[0];
  const internal = internalStatusFromPrintful(state.status);
  return {
    printful_status: state.status,
    printful_updated_at: new Date().toISOString(),
    ...(internal ? { status: internal } : {}),
    ...(shipment
      ? {
          carrier: shipment.carrier,
          tracking_number: shipment.trackingNumber,
          tracking_url: shipment.trackingUrl,
          printful_shipped_at: shipment.shippedAt ?? new Date().toISOString(),
        }
      : {}),
  };
}
