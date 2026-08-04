import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, PackageCheck, RefreshCw, Truck, Undo2, Webhook } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  listShopOrders,
  refundShopOrder,
  syncPrintfulOrder,
  configurePrintfulWebhook,
} from "@/lib/shop.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/shop";

const STATUS_LABEL: Record<string, string> = {
  paid: "Payée",
  in_production: "En production",
  shipped: "Expédiée",
  canceled: "Annulée",
  failed: "Échec",
  refunded: "Remboursée",
  partially_refunded: "Remb. partiel",
};

const PRINTFUL_LABEL: Record<string, string> = {
  draft: "Brouillon",
  pending: "En attente",
  inprocess: "En production",
  onhold: "En pause",
  fulfilled: "Expédiée",
  canceled: "Annulée",
  failed: "Échec",
  skipped: "Non envoyée",
  package_returned: "Colis retourné",
};

export function ShopAdmin() {
  const queryClient = useQueryClient();
  const fetchOrders = useServerFn(listShopOrders);
  const refund = useServerFn(refundShopOrder);
  const sync = useServerFn(syncPrintfulOrder);
  const setWebhook = useServerFn(configurePrintfulWebhook);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [busyOrder, setBusyOrder] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-shop-orders"],
    queryFn: () => fetchOrders(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-shop-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_products")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleActive = async (id: string, active: boolean) => {
    setSavingId(id);
    await supabase.from("shop_products").update({ active }).eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["admin-shop-products"] });
    setSavingId(null);
  };

  const runRefund = async (order: any) => {
    const remaining = (order.amount_cents ?? 0) - (order.refunded_amount_cents ?? 0);
    if (remaining <= 0) return;
    if (
      !window.confirm(
        `Rembourser ${formatPrice(remaining, order.currency)} à ${order.customer_email ?? "ce client"} ? La production Printful sera annulée si possible.`,
      )
    ) {
      return;
    }
    setBusyOrder(order.id);
    const result = await refund({ data: { orderId: order.id } });
    setBusyOrder(null);
    if ("error" in result) toast.error(result.error);
    else {
      toast.success("Remboursement effectué");
      queryClient.invalidateQueries({ queryKey: ["admin-shop-orders"] });
    }
  };

  const runSync = async (orderId: string) => {
    setBusyOrder(orderId);
    const result = await sync({ data: { orderId } });
    setBusyOrder(null);
    if ("error" in result) toast.error(result.error);
    else {
      toast.success("Statut Printful mis à jour");
      queryClient.invalidateQueries({ queryKey: ["admin-shop-orders"] });
    }
  };

  const registerWebhook = async () => {
    const result = await setWebhook({ data: { baseUrl: window.location.origin } });
    if ("error" in result) toast.error(result.error);
    else toast.success("Webhook Printful activé pour ce domaine");
  };

  return (
    <div className="mt-8 space-y-10">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-foreground">Commandes</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={registerWebhook}>
              <Webhook className="mr-2 h-4 w-4" /> Activer le suivi Printful
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["admin-shop-orders"] })
              }
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Actualiser
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={16} /> Chargement…
          </p>
        ) : orders.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Aucune commande pour le moment.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {(orders as any[]).map((order) => {
              const remaining =
                (order.amount_cents ?? 0) - (order.refunded_amount_cents ?? 0);
              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-border bg-card p-4 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      {order.customer_name || "Client"} ·{" "}
                      {formatPrice(order.amount_cents, order.currency)}
                    </p>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.customer_email} ·{" "}
                    {new Date(order.created_at).toLocaleString("fr-FR")} ·{" "}
                    {order.environment === "live" ? "réel" : "test"}
                  </p>
                  <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    {(order.items ?? []).map((item: any, index: number) => (
                      <li key={index}>
                        {item.quantity} × {item.name}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-2 inline-flex flex-wrap items-center gap-2 text-xs">
                    <PackageCheck size={14} className="text-primary" />
                    Printful :{" "}
                    {PRINTFUL_LABEL[order.printful_status] ?? order.printful_status ?? "—"}
                    {order.printful_order_id ? ` (#${order.printful_order_id})` : ""}
                    {order.printful_updated_at && (
                      <span className="text-muted-foreground">
                        · maj {new Date(order.printful_updated_at).toLocaleString("fr-FR")}
                      </span>
                    )}
                  </p>

                  {order.tracking_number && (
                    <p className="mt-1 inline-flex items-center gap-2 text-xs">
                      <Truck size={14} className="text-primary" />
                      {order.carrier ?? "Transporteur"} · {order.tracking_number}
                      {order.tracking_url && (
                        <a
                          href={order.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          suivre
                        </a>
                      )}
                    </p>
                  )}

                  {order.refunded_amount_cents > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Remboursé : {formatPrice(order.refunded_amount_cents, order.currency)}
                      {order.refunded_at
                        ? ` le ${new Date(order.refunded_at).toLocaleDateString("fr-FR")}`
                        : ""}
                    </p>
                  )}

                  {Array.isArray(order.events) && order.events.length > 0 && (
                    <ol className="mt-3 space-y-1 border-l border-border pl-3 text-xs text-muted-foreground">
                      {order.events.map((event: any, index: number) => (
                        <li key={index}>
                          <span className="text-foreground">{event.label}</span> ·{" "}
                          {new Date(event.at).toLocaleString("fr-FR")}
                          {event.detail ? ` · ${event.detail}` : ""}
                        </li>
                      ))}
                    </ol>
                  )}

                  {order.error_message && (
                    <p className="mt-1 text-xs text-destructive">{order.error_message}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyOrder === order.id || !order.printful_order_id}
                      onClick={() => runSync(order.id)}
                    >
                      <RefreshCw className="mr-2 h-3.5 w-3.5" /> Statut Printful
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyOrder === order.id || remaining <= 0}
                      onClick={() => runRefund(order)}
                    >
                      <Undo2 className="mr-2 h-3.5 w-3.5" /> Rembourser
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-foreground">Produits</h2>
        <div className="mt-4 space-y-3">
          {(products as any[]).map((product) => (
            <div
              key={product.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-sm"
            >
              <div>
                <p className="font-semibold text-foreground">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(product.price_cents, product.currency)} · /boutique/
                  {product.slug} · variante Printful :{" "}
                  {product.printful_variant_id ?? "non définie"}
                </p>
              </div>
              <Button
                size="sm"
                variant={product.active ? "outline" : "default"}
                disabled={savingId === product.id}
                onClick={() => toggleActive(product.id, !product.active)}
              >
                {product.active ? "Masquer" : "Publier"}
              </Button>
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun produit enregistré.</p>
          )}
        </div>
      </section>
    </div>
  );
}
