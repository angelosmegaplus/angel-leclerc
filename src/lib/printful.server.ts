/** Intégration Printful (impression à la demande) — serveur uniquement. */

const PRINTFUL_API = "https://api.printful.com";

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
  variant_id: number;
  quantity: number;
  name?: string;
}

export async function createPrintfulOrder(input: {
  externalId: string;
  recipient: PrintfulRecipient;
  items: PrintfulLine[];
  confirm: boolean;
}): Promise<{ ok: true; id: string; status: string } | { ok: false; error: string }> {
  const apiKey = process.env["PRINTFUL_API_KEY"];
  if (!apiKey) return { ok: false, error: "PRINTFUL_API_KEY manquante" };
  if (input.items.length === 0) return { ok: false, error: "Aucun article imprimable" };

  try {
    const response = await fetch(`${PRINTFUL_API}/orders?confirm=${input.confirm ? 1 : 0}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        external_id: input.externalId,
        recipient: input.recipient,
        items: input.items,
      }),
    });

    const body = await response.text();
    if (!response.ok) {
      console.error(`Printful order failed [${response.status}]: ${body}`);
      return { ok: false, error: `Printful ${response.status}: ${body.slice(0, 500)}` };
    }
    const json = JSON.parse(body) as { result?: { id?: number; status?: string } };
    return {
      ok: true,
      id: String(json.result?.id ?? ""),
      status: json.result?.status ?? "draft",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Printful request error:", message);
    return { ok: false, error: message };
  }
}