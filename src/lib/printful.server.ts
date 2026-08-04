/** Intégration Printful (impression à la demande) — serveur uniquement. */

const PRINTFUL_API = "https://api.printful.com";

/** Pays où Printful exige un code d'état/province. */
const STATE_REQUIRED = new Set(["US", "CA", "AU", "JP"]);

export interface PrintfulRecipient {
  name: string;
  address1: string;
  address2?: string | null;
  city: string;
  state_code?: string | null;
  country_code: string;
  zip: string;
  email?: string | null;
}

export interface PrintfulLine {
  variant_id?: number;
  sync_variant_id?: number;
  quantity: number;
  name?: string;
  files?: Array<{ url: string }>;
}

/** Normalise une adresse Stripe vers le format attendu par Printful. */
export function toPrintfulRecipient(input: {
  name?: string | null;
  email?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
}): { ok: true; recipient: PrintfulRecipient } | { ok: false; error: string } {
  const a = input.address;
  const clean = (value?: string | null) => (value ?? "").toString().trim();

  const country = clean(a?.country).toUpperCase();
  const address1 = clean(a?.line1);
  const city = clean(a?.city);
  const zip = clean(a?.postal_code);
  const name = clean(input.name) || "Client ALC!";

  const missing: string[] = [];
  if (!address1) missing.push("adresse");
  if (!city) missing.push("ville");
  if (!zip) missing.push("code postal");
  if (!/^[A-Z]{2}$/.test(country)) missing.push("pays");

  const rawState = clean(a?.state).toUpperCase();
  const stateCode = STATE_REQUIRED.has(country) ? rawState || null : null;
  if (STATE_REQUIRED.has(country) && !stateCode) missing.push("état/province");

  if (missing.length > 0) {
    return { ok: false, error: `Adresse incomplète : ${missing.join(", ")}` };
  }

  return {
    ok: true,
    recipient: {
      name,
      address1,
      address2: clean(a?.line2) || null,
      city,
      state_code: stateCode,
      country_code: country,
      zip,
      email: clean(input.email) || null,
    },
  };
}

async function printfulRequest(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; result: any } | { ok: false; error: string }> {
  const apiKey = process.env["PRINTFUL_API_KEY"];
  if (!apiKey) return { ok: false, error: "PRINTFUL_API_KEY manquante" };
  const storeId = process.env["PRINTFUL_STORE_ID"];
  try {
    const response = await fetch(`${PRINTFUL_API}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // Jeton de compte : Printful exige la boutique cible sur chaque appel.
        ...(storeId ? { "X-PF-Store-Id": storeId } : {}),
        ...(init?.headers ?? {}),
      },
    });
    const body = await response.text();
    if (!response.ok) {
      console.error(`Printful ${path} failed [${response.status}]: ${body}`);
      return { ok: false, error: `Printful ${response.status}: ${body.slice(0, 500)}` };
    }
    return { ok: true, result: body ? (JSON.parse(body) as any).result : null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error(`Printful ${path} error:`, message);
    return { ok: false, error: message };
  }
}

export async function createPrintfulOrder(input: {
  externalId: string;
  recipient: PrintfulRecipient;
  items: PrintfulLine[];
  confirm: boolean;
}): Promise<{ ok: true; id: string; status: string } | { ok: false; error: string }> {
  if (input.items.length === 0) return { ok: false, error: "Aucun article imprimable" };

  const response = await printfulRequest(`/orders?confirm=${input.confirm ? 1 : 0}`, {
    method: "POST",
    body: JSON.stringify({
      external_id: input.externalId,
      recipient: input.recipient,
      items: input.items,
    }),
  });
  if (!response.ok) return response;
  return {
    ok: true,
    id: String(response.result?.id ?? ""),
    status: response.result?.status ?? "draft",
  };
}

/** Récupère une commande Printful déjà créée à partir de notre identifiant interne. */
export async function findPrintfulOrderByExternalId(
  externalId: string,
): Promise<{ ok: true; id: string; status: string } | { ok: false; error: string }> {
  const response = await printfulRequest(
    `/orders/@${encodeURIComponent(externalId)}`,
  );
  if (!response.ok) return response;
  return {
    ok: true,
    id: String(response.result?.id ?? ""),
    status: response.result?.status ?? "draft",
  };
}

/** Liste les boutiques Printful accessibles avec le jeton configuré. */
export async function listPrintfulStores(): Promise<
  { ok: true; stores: Array<{ id: number; name: string; type: string }> } | { ok: false; error: string }
> {
  const response = await printfulRequest("/stores");
  if (!response.ok) return response;
  const stores = Array.isArray(response.result)
    ? response.result.map((s: any) => ({
        id: Number(s.id),
        name: String(s.name ?? ""),
        type: String(s.type ?? ""),
      }))
    : [];
  return { ok: true, stores };
}

/** Vérifie qu'un identifiant de variante Printful existe réellement. */
export async function checkPrintfulVariant(
  variantId: number,
): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const response = await printfulRequest(`/products/variant/${variantId}`);
  if (!response.ok) return response;
  return { ok: true, name: String(response.result?.variant?.name ?? `#${variantId}`) };
}

/** Lit l'URL de webhook actuellement enregistrée chez Printful. */
export async function getPrintfulWebhook(): Promise<
  { ok: true; url: string | null; types: string[] } | { ok: false; error: string }
> {
  const response = await printfulRequest("/webhooks");
  if (!response.ok) return response;
  return {
    ok: true,
    url: response.result?.url ?? null,
    types: Array.isArray(response.result?.types) ? response.result.types : [],
  };
}

export interface PrintfulOrderState {
  status: string;
  shipments: Array<{
    carrier: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    shippedAt: string | null;
  }>;
}

export async function getPrintfulOrder(
  orderId: string,
): Promise<{ ok: true; order: PrintfulOrderState } | { ok: false; error: string }> {
  const response = await printfulRequest(`/orders/${encodeURIComponent(orderId)}`);
  if (!response.ok) return response;
  const shipments = Array.isArray(response.result?.shipments)
    ? response.result.shipments.map((s: any) => ({
        carrier: s.carrier ?? s.service ?? null,
        trackingNumber: s.tracking_number ?? null,
        trackingUrl: s.tracking_url ?? null,
        shippedAt: s.ship_date
          ? new Date(s.ship_date).toISOString()
          : s.shipped_at
            ? new Date(s.shipped_at * 1000).toISOString()
            : null,
      }))
    : [];
  return {
    ok: true,
    order: { status: response.result?.status ?? "unknown", shipments },
  };
}

/** Annule une commande Printful (possible tant qu'elle n'est pas expédiée). */
export async function cancelPrintfulOrder(
  orderId: string,
): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  const response = await printfulRequest(`/orders/${encodeURIComponent(orderId)}`, {
    method: "DELETE",
  });
  if (!response.ok) return response;
  return { ok: true, status: response.result?.status ?? "canceled" };
}

/** (Ré)enregistre l'URL de webhook Printful pour recevoir les mises à jour. */
export async function setPrintfulWebhook(
  url: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await printfulRequest("/webhooks", {
    method: "POST",
    body: JSON.stringify({
      url,
      types: [
        "package_shipped",
        "package_returned",
        "order_created",
        "order_updated",
        "order_failed",
        "order_canceled",
        "order_put_hold",
        "order_remove_hold",
      ],
    }),
  });
  if (!response.ok) return response;
  return { ok: true };
}
