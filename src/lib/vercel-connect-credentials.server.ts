import { getToken } from "@vercel/connect";
import { getCookie } from "@tanstack/react-start/server";
import { getVaultSecret } from "./angel-vault.server";

const CONNECTORS = {
  tmdb: "tmdb_api_key/tmdb-angel-os",
  openai: "api.openai.com/canary-xylophone",
} as const;

export const TMDB_READ_TOKEN_COOKIE = "angel_tmdb_read_token";
export const TMDB_API_KEY_COOKIE = "angel_tmdb_api_key";
export const OPENAI_API_KEY_COOKIE = "angel_openai_api_key";

async function connectToken(connector: string) {
  try {
    const token = await getToken(connector, { subject: { type: "app" } });
    return typeof token === "string" && token.trim() ? token.trim() : null;
  } catch (error) {
    console.warn("[vercel-connect] credential unavailable", { connector, error });
    return null;
  }
}

function requestCookie(name: string) {
  try {
    const value = getCookie(name);
    return typeof value === "string" && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export async function getTmdbCredential() {
  const readToken = process.env["TMDB_READ_ACCESS_TOKEN"]?.trim() || (await getVaultSecret("TMDB_READ_TOKEN"))?.trim();
  if (readToken) return { value: readToken, source: process.env["TMDB_READ_ACCESS_TOKEN"] ? "env-read-token" as const : "angel-vault-read-token" as const, kind: "bearer" as const };

  const apiKey = process.env["TMDB_API_KEY"]?.trim() || (await getVaultSecret("TMDB_API_KEY"))?.trim();
  if (apiKey) return { value: apiKey, source: process.env["TMDB_API_KEY"] ? "env-api-key" as const : "angel-vault-api-key" as const, kind: "api-key" as const };

  const connected = await connectToken(CONNECTORS.tmdb);
  if (connected) return { value: connected, source: "vercel-connect-api-key" as const, kind: "api-key" as const };

  const browserReadToken = requestCookie(TMDB_READ_TOKEN_COOKIE);
  if (browserReadToken) return { value: browserReadToken, source: "admin-site-read-token" as const, kind: "bearer" as const };

  const browserApiKey = requestCookie(TMDB_API_KEY_COOKIE);
  if (browserApiKey) return { value: browserApiKey, source: "admin-site-api-key" as const, kind: "api-key" as const };

  return null;
}

export async function getOpenAiCredential() {
  const serverKey = process.env["OPENAI_API_KEY"]?.trim() || (await getVaultSecret("OPENAI_API_KEY"))?.trim();
  if (serverKey) return { value: serverKey, source: process.env["OPENAI_API_KEY"] ? "env" as const : "angel-vault" as const };

  const connected = await connectToken(CONNECTORS.openai);
  if (connected) return { value: connected, source: "vercel-connect" as const };

  const browserKey = requestCookie(OPENAI_API_KEY_COOKIE);
  if (browserKey) return { value: browserKey, source: "admin-site-api-key" as const };

  return null;
}

export function getAiGatewayCredential() {
  const gatewayKey = process.env["AI_GATEWAY_API_KEY"];
  if (gatewayKey?.trim()) return { value: gatewayKey.trim(), source: "ai-gateway-key" as const };

  const oidc = process.env["VERCEL_OIDC_TOKEN"];
  if (oidc?.trim()) return { value: oidc.trim(), source: "vercel-oidc" as const };

  return null;
}

export const VERCEL_CONNECTOR_IDS = CONNECTORS;
