import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, PackageCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listShopOrders } from "@/lib/shop.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/shop";

const STATUS_LABEL: Record<string, string> = {
  paid: "Payée",
  in_production: "En production",
  shipped: "Expédiée",
};

export function ShopAdmin() {
  const queryClient = useQueryClient();
  const fetchOrders = useServerFn(listShopOrders);
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-shop-orders"],
    queryFn: () => fetchOrders(),
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

  return (
    <div className="mt-8 space-y-10">
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Commandes</h2>
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
            {(orders as any[]).map((order) => (
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
                <p className="mt-2 inline-flex items-center gap-2 text-xs">
                  <PackageCheck size={14} className="text-primary" />
                  Printful : {order.printful_order_id || order.printful_status || "—"}
                </p>
                {order.error_message && (
                  <p className="mt-1 text-xs text-destructive">{order.error_message}</p>
                )}
              </div>
            ))}
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