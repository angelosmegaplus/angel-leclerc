/**
 * Passerelle connecteurs Lovable.
 *
 * Les connexions Google (Gmail, Agenda, Drive) autorisées par Angel au niveau
 * de l'espace de travail sont reliées à ce projet. Les appels passent par la
 * passerelle Lovable : aucun client OAuth Google à héberger, aucun jeton à
 * stocker, et le renouvellement est géré par la passerelle.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev";

export type GatewayConnectorId = "google_mail" | "google_calendar" | "google_drive";

const CONNECTION_KEY_ENV: Record<GatewayConnectorId, string> = {
  google_mail: "GOOGLE_MAIL_API_KEY",
  google_calendar: "GOOGLE_CALENDAR_API_KEY",
  google_drive: "GOOGLE_DRIVE_API_KEY",
};

function lovableKey(): string | null {
  return process.env["LOVABLE_API_KEY"]?.trim() || null;
}

function connectionKey(connector: GatewayConnectorId): string | null {
  return process.env[CONNECTION_KEY_ENV[connector]]?.trim() || null;
}

export function gatewayConfigured(connector: GatewayConnectorId): boolean {
  return Boolean(lovableKey() && connectionKey(connector));
}

export function gatewayMissingEnv(connector: GatewayConnectorId): string[] {
  const missing: string[] = [];
  if (!lovableKey()) missing.push("LOVABLE_API_KEY");
  if (!connectionKey(connector)) missing.push(CONNECTION_KEY_ENV[connector]);
  return missing;
}

export type GatewayInit = {
  method?: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
};

export async function gatewayRequest(
  connector: GatewayConnectorId,
  path: string,
  init: GatewayInit = {},
): Promise<any> {
  const apiKey = lovableKey();
  const connKey = connectionKey(connector);
  if (!apiKey || !connKey) {
    throw new Error(
      `Connecteur ${connector} non relié à ce projet (variables manquantes : ${gatewayMissingEnv(connector).join(", ")}).`,
    );
  }

  const url = new URL(`${GATEWAY_URL}/${connector}${path}`);
  for (const [key, value] of Object.entries(init.query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Connection-Api-Key": connKey,
      Accept: "application/json",
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`[connector-gateway] ${connector} ${response.status}: ${text.slice(0, 600)}`);
    throw new Error(`${connector} a refusé la requête (${response.status}) : ${text.slice(0, 200)}`);
  }
  return text ? (JSON.parse(text) as any) : {};
}

export type GatewayProbe = { ok: boolean; detail: string; checkedAt: string };

/** Test réel : un appel lecture minimal sur le service, jamais un faux vert. */
export async function probeGatewayConnector(connector: GatewayConnectorId): Promise<GatewayProbe> {
  const checkedAt = new Date().toISOString();
  if (!gatewayConfigured(connector)) {
    return { ok: false, detail: `Connecteur non relié (${gatewayMissingEnv(connector).join(", ")}).`, checkedAt };
  }
  try {
    if (connector === "google_mail") {
      const profile = await gatewayRequest(connector, "/gmail/v1/users/me/profile");
      return { ok: true, detail: `Boîte ${profile.emailAddress} — ${profile.messagesTotal ?? 0} messages.`, checkedAt };
    }
    if (connector === "google_calendar") {
      const list = await gatewayRequest(connector, "/calendar/v3/users/me/calendarList", { query: { maxResults: 10 } });
      const count = (list.items ?? []).length;
      return { ok: true, detail: `${count} agenda${count > 1 ? "x" : ""} accessible${count > 1 ? "s" : ""}.`, checkedAt };
    }
    const files = await gatewayRequest(connector, "/drive/v3/files", {
      query: { pageSize: 1, fields: "files(id,name)" },
    });
    const first = files.files?.[0]?.name as string | undefined;
    return { ok: true, detail: first ? `Drive lisible (ex. « ${first} »).` : "Drive lisible, aucun fichier retourné.", checkedAt };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message.slice(0, 240) : "Erreur inconnue.", checkedAt };
  }
}
