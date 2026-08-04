import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PackageCheck,
  RefreshCw,
  Stethoscope,
  Truck,
  Undo2,
  Webhook,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  listShopOrders,
  refundShopOrder,
  syncPrintfulOrder,
  syncPendingPrintfulOrders,
  configurePrintfulWebhook,
  checkPrintfulSetup,
  type PrintfulDiagnostics,
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
  return <ShopAdminInner />;
}

function DiagRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      )}
      <span>
        <span className="font-medium text-foreground">{label}</span>{" "}
        <span className="text-muted-foreground">— {detail}</span>
      </span>
    </li>
  );
}

function ShopAdminInner() {
  const queryClient = useQueryClient();
  const fetchOrders = useServerFn(listShopOrders);
  const refund = useServerFn(refundShopOrder);
  const sync = useServerFn(syncPrintfulOrder);
  const syncAll = useServerFn(syncPendingPrintfulOrders);
  const setWebhook = useServerFn(configurePrintfulWebhook);
  const runDiagnostics = useServerFn(checkPrintfulSetup);
  const [diagnostics, setDiagnostics] = useState<PrintfulDiagnostics | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [busyOrder, setBusyOrder] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-shop-orders"],
    queryFn: () => fetchOrders(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  // Récupération automatique des statuts Printful (brouillon, confirmé,
  // expédié, retour, échec) : aucune action manuelle nécessaire.
  const { data: autoSync } = useQuery({
    queryKey: ["admin-shop-auto-sync"],
    queryFn: async () => {
      const result = await syncAll({ data: undefined });
      if (result.updated > 0) {
        await queryClient.invalidateQueries({ queryKey: ["admin-shop-orders"] });
      }
      return { ...result, at: new Date().toISOString() };
    },
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
    staleTime: 60_000,
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

  const emptyForm = {
    id: "" as string,
    name: "",
    slug: "",
    price: "",
    description: "",
    image_url: "",
    printful_variant_id: "",
    printful_sync_variant_id: "",
    printful_print_file_url: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [savingProduct, setSavingProduct] = useState(false);

  const slugify = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);

  const editProduct = (product: any) => {
    setForm({
      id: product.id,
      name: product.name ?? "",
      slug: product.slug ?? "",
      price: ((product.price_cents ?? 0) / 100).toString(),
      description: product.description ?? "",
      image_url: product.image_url ?? "",
      printful_variant_id: product.printful_variant_id?.toString() ?? "",
      printful_sync_variant_id: product.printful_sync_variant_id?.toString() ?? "",
      printful_print_file_url: product.printful_print_file_url ?? "",
    });
  };

  const saveProduct = async () => {
    const slug = slugify(form.slug || form.name);
    const priceCents = Math.round(Number(form.price.replace(",", ".")) * 100);
    if (!form.name.trim() || !slug) {
      toast.error("Nom et référence obligatoires");
      return;
    }
    if (!Number.isInteger(priceCents) || priceCents < 100) {
      toast.error("Prix invalide (minimum 1,00 €)");
      return;
    }
    setSavingProduct(true);
    const payload = {
      name: form.name.trim(),
      slug,
      price_cents: priceCents,
      description: form.description.trim(),
      image_url: form.image_url.trim() || null,
      printful_variant_id: form.printful_variant_id
        ? Number(form.printful_variant_id)
        : null,
      printful_sync_variant_id: form.printful_sync_variant_id
        ? Number(form.printful_sync_variant_id)
        : null,
      printful_print_file_url: form.printful_print_file_url.trim() || null,
    };
    const { error } = form.id
      ? await supabase.from("shop_products").update(payload).eq("id", form.id)
      : await supabase.from("shop_products").insert({ ...payload, active: true });
    setSavingProduct(false);
    if (error) {
      toast.error("Enregistrement impossible", { description: error.message });
      return;
    }
    toast.success(form.id ? "Produit mis à jour" : "Produit ajouté");
    setForm(emptyForm);
    await queryClient.invalidateQueries({ queryKey: ["admin-shop-products"] });
  };

  const deleteProduct = async (product: any) => {
    if (!window.confirm(`Supprimer définitivement « ${product.name} » ?`)) return;
    const { error } = await supabase.from("shop_products").delete().eq("id", product.id);
    if (error) {
      toast.error("Suppression impossible", { description: error.message });
      return;
    }
    if (form.id === product.id) setForm(emptyForm);
    await queryClient.invalidateQueries({ queryKey: ["admin-shop-products"] });
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

  const checkSetup = async () => {
    setDiagLoading(true);
    try {
      setDiagnostics(await runDiagnostics({ data: undefined }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Diagnostic impossible");
    } finally {
      setDiagLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-10">
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-foreground">
            Diagnostic Stripe → Printful
          </h2>
          <Button size="sm" variant="outline" onClick={checkSetup} disabled={diagLoading}>
            {diagLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Stethoscope className="mr-2 h-4 w-4" />
            )}
            Vérifier la connexion
          </Button>
        </div>

        {diagnostics && (
          <ul className="mt-4 space-y-2 text-sm">
            <DiagRow
              ok={diagnostics.tokenConfigured}
              label="Jeton API Printful"
              detail={diagnostics.tokenConfigured ? "Configuré (serveur uniquement)" : "Absent"}
            />
            <DiagRow
              ok={Boolean(diagnostics.storeName)}
              label="Boutique Printful"
              detail={
                diagnostics.storeName
                  ? `${diagnostics.storeName} (#${diagnostics.storeId})`
                  : "Aucune boutique sélectionnée"
              }
            />
            <DiagRow
              ok={Boolean(diagnostics.webhookUrl)}
              label="Webhook Printful"
              detail={diagnostics.webhookUrl ?? "Non enregistré — cliquez sur « Activer le suivi Printful »"}
            />
            {diagnostics.variants.map((v) => (
              <DiagRow
                key={v.slug}
                ok={v.valid}
                label={`Variante — ${v.name}`}
                detail={v.variantId ? `#${v.variantId} · ${v.detail}` : v.detail}
              />
            ))}
            {diagnostics.errors.map((error) => (
              <DiagRow key={error} ok={false} label="Erreur" detail={error} />
            ))}
          </ul>
        )}
      </section>

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
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">
            {form.id ? "Modifier le produit" : "Ajouter un produit"}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Nom du produit"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Référence URL (auto si vide)"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            <input
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Prix TTC en € (ex. 19,00)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <input
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="ID variante Printful (ex. 1320)"
              value={form.printful_variant_id}
              onChange={(e) =>
                setForm({ ...form, printful_variant_id: e.target.value })
              }
            />
            <input
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="ID produit synchronisé Printful (facultatif)"
              value={form.printful_sync_variant_id}
              onChange={(e) =>
                setForm({ ...form, printful_sync_variant_id: e.target.value })
              }
            />
            <input
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
              placeholder="URL du fichier d'impression (visuel PNG haute résolution)"
              value={form.printful_print_file_url}
              onChange={(e) =>
                setForm({ ...form, printful_print_file_url: e.target.value })
              }
            />
            <input
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
              placeholder="URL de l'image principale"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
            <textarea
              className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
              placeholder="Description affichée sur la fiche produit"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={saveProduct} disabled={savingProduct}>
              {savingProduct && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {form.id ? "Enregistrer" : "Ajouter au catalogue"}
            </Button>
            {form.id && (
              <Button size="sm" variant="outline" onClick={() => setForm(emptyForm)}>
                Annuler
              </Button>
            )}
          </div>
        </div>
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
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => editProduct(product)}>
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant={product.active ? "outline" : "default"}
                  disabled={savingId === product.id}
                  onClick={() => toggleActive(product.id, !product.active)}
                >
                  {product.active ? "Masquer" : "Publier"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => deleteProduct(product)}
                >
                  Supprimer
                </Button>
              </div>
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
