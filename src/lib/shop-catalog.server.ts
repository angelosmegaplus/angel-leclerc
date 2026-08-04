/** Synchronisation du catalogue Printful vers la base locale — serveur uniquement. */
import {
  listPrintfulStores,
  listPrintfulSyncProducts,
  isApiStore,
  ensurePrintfulWebhook,
  type PrintfulCatalogItem,
} from "@/lib/printful.server";

export interface PrintfulSyncReport {
  source: "sync" | "none";
  created: number;
  updated: number;
  deactivated: number;
  productCount: number;
  variantCount: number;
  visibleCount: number;
  webhook: "inchangé" | "enregistré" | "non configuré";
  incomplete: Array<{ name: string; missing: string[] }>;
  syncedAt: string;
  errors: string[];
}

function slugifyName(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70) || "produit"
  );
}

function uniq(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v && v.trim())))];
}

/** Variante de référence : la moins chère réellement disponible. */
function pickVariant(item: PrintfulCatalogItem) {
  const usable = item.variants.filter((v) => v.priceCents > 0);
  const available = usable.filter((v) => v.available);
  const pool = available.length > 0 ? available : usable;
  return (
    pool.slice().sort((a, b) => a.priceCents - b.priceCents)[0] ??
    item.variants[0] ??
    null
  );
}

export async function syncPrintfulCatalogToDb(options: {
  baseUrl?: string;
}): Promise<PrintfulSyncReport> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const syncedAt = new Date().toISOString();
  const errors: string[] = [];
  const incomplete: PrintfulSyncReport["incomplete"] = [];
  const empty = {
    created: 0,
    updated: 0,
    deactivated: 0,
    productCount: 0,
    variantCount: 0,
    visibleCount: 0,
    webhook: "non configuré" as const,
    incomplete,
    syncedAt,
  };

  // Garde-fou : jamais de synchronisation depuis une boutique Squarespace,
  // Shopify ou « Personal orders ».
  const storeId = process.env["PRINTFUL_STORE_ID"] ?? null;
  const storeList = await listPrintfulStores();
  if (!storeList.ok) return { source: "none", ...empty, errors: [storeList.error] };

  const current = storeList.stores.find((s) => String(s.id) === storeId) ?? null;
  if (!current || !isApiStore(current)) {
    return {
      source: "none",
      ...empty,
      errors: [
        current
          ? `Synchronisation bloquée : « ${current.name} » (${current.type}) n'est pas une boutique API dédiée.`
          : "Aucune boutique API Printful valide n'est configurée.",
      ],
    };
  }

  const sync = await listPrintfulSyncProducts();
  if (!sync.ok) errors.push(sync.error);
  const items = sync.ok ? sync.items : [];
  const source: PrintfulSyncReport["source"] = items.length > 0 ? "sync" : "none";
  const variantCount = items.reduce((total, item) => total + item.variants.length, 0);

  // Webhook : enregistré automatiquement s'il manque ou pointe ailleurs.
  let webhook: PrintfulSyncReport["webhook"] = "non configuré";
  const webhookToken = process.env["PRINTFUL_WEBHOOK_TOKEN"];
  if (!webhookToken) {
    errors.push("PRINTFUL_WEBHOOK_TOKEN manquant : webhook non enregistré");
  } else if (options.baseUrl && /^https:\/\/[a-z0-9.-]+$/i.test(options.baseUrl)) {
    const hook = await ensurePrintfulWebhook(
      `${options.baseUrl}/api/public/printful/webhook?token=${encodeURIComponent(webhookToken)}`,
    );
    if (!hook.ok) errors.push(`Webhook : ${hook.error}`);
    else webhook = hook.changed ? "enregistré" : "inchangé";
  }

  const { data: existingRows } = await supabaseAdmin
    .from("shop_products")
    .select("id, slug, printful_external_id, price_cents, active, description");
  const existing = (existingRows ?? []) as any[];
  const byExternal = new Map(
    existing.filter((r) => r.printful_external_id).map((r) => [r.printful_external_id, r]),
  );

  let created = 0;
  let updated = 0;
  let visibleCount = 0;
  const seen = new Set<string>();

  for (const [index, item] of items.entries()) {
    const variant = pickVariant(item);
    const missing: string[] = [];
    if (!variant) missing.push("variante");
    if (!variant?.priceCents) missing.push("prix de vente");
    if (!item.thumbnail && !variant?.imageUrl) missing.push("image");
    if (!variant?.syncVariantId && !variant?.printFileUrl) missing.push("fichier d'impression");
    if (missing.length > 0) incomplete.push({ name: item.name, missing });
    const sellable = missing.length === 0;
    if (sellable) visibleCount += 1;

    seen.add(item.externalId);
    const row = byExternal.get(item.externalId);
    const payload: Record<string, unknown> = {
      name: item.name,
      image_url: item.thumbnail ?? variant?.imageUrl ?? null,
      images: uniq(item.variants.map((v) => v.imageUrl)).slice(0, 8),
      currency: variant?.currency || "EUR",
      printful_variant_id: variant?.variantId ?? null,
      printful_sync_variant_id: variant?.syncVariantId ?? null,
      printful_product_id: item.catalogProductId,
      printful_sync_product_id: item.syncProductId,
      printful_print_file_url: variant?.printFileUrl ?? null,
      printful_source: item.source,
      printful_external_id: item.externalId,
      printful_synced_at: syncedAt,
      variants: item.variants,
      sizes: uniq(item.variants.filter((v) => v.available).map((v) => v.size)),
      colors: uniq(item.variants.filter((v) => v.available).map((v) => v.color)),
      availability: item.variants.some((v) => v.available)
        ? "in_stock"
        : "out_of_stock",
      active: sellable,
    };

    if (row) {
      // Prix Printful prioritaire ; sinon on garde le prix saisi en admin.
      if (variant?.priceCents) payload["price_cents"] = variant.priceCents;
      // La description Printful ne remplace jamais un texte saisi en admin.
      if (item.description && !row.description) payload["description"] = item.description;
      const { error } = await supabaseAdmin
        .from("shop_products")
        .update(payload as any)
        .eq("id", row.id);
      if (error) errors.push(`${item.name} : ${error.message}`);
      else updated += 1;
    } else {
      let slug = slugifyName(item.name);
      if (existing.some((r) => r.slug === slug)) slug = `${slug}-${index + 1}`;
      const { error } = await supabaseAdmin.from("shop_products").insert({
        ...(payload as any),
        slug,
        description: item.description,
        price_cents: variant?.priceCents ?? 0,
        sort_order: index,
      });
      if (error) errors.push(`${item.name} : ${error.message}`);
      else created += 1;
    }
  }

  // Produits retirés de Printful : masqués, jamais supprimés.
  const stale = existing.filter(
    (r) => r.printful_external_id && !seen.has(r.printful_external_id) && r.active,
  );
  let deactivated = 0;
  for (const row of stale) {
    const { error } = await supabaseAdmin
      .from("shop_products")
      .update({ active: false, printful_synced_at: syncedAt })
      .eq("id", row.id);
    if (!error) deactivated += 1;
  }

  return {
    source,
    created,
    updated,
    deactivated,
    incomplete,
    syncedAt,
    errors,
    productCount: items.length,
    variantCount,
    visibleCount,
    webhook,
  };
}
