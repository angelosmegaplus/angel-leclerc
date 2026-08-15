import { getToken } from "@vercel/connect";
import { getCookie } from "@tanstack/react-start/server";

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
    // Background jobs and build-time execution do not necessarily have a request context.
    return null;
  }
}

export async function getTmdbCredential() {
  // 1) Persistent server configuration remains the preferred source.
  const readToken = process.env["TMDB_READ_ACCESS_TOKEN"];
  if (readToken?.trim()) return { value: readToken.trim(), source: "env-read-token" as const };

  const apiKey = process.env["TMDB_API_KEY"];
  if (apiKey?.trim()) return { value: apiKey.trim(), source: "env-api-key" as const };

  // 2) Vercel Connect remains supported when configured.
  const connected = await connectToken(CONNECTORS.tmdb);
  if (connected) return { value: connected, source: "vercel-connect" as const };

  // 3) Admin-site fallback: credentials entered from Angel OS are kept in
  // HttpOnly/Secure cookies and therefore never exposed to client JavaScript.
  const browserReadToken = requestCookie(TMDB_READ_TOKEN_COOKIE);
  if (browserReadToken) return { value: browserReadToken, source: "admin-site-read-token" as const };

  const browserApiKey = requestCookie(TMDB_API_KEY_COOKIE);
  if (browserApiKey) return { value: browserApiKey, source: "admin-site-api-key" as const };

  return null;
}

export async function getOpenAiCredential() {
  // 1) Persistent server secret remains the preferred source.
  const serverKey = process.env["OPENAI_API_KEY"];
  if (serverKey?.trim()) return { value: serverKey.trim(), source: "env" as const };

  // 2) Vercel Connect connector shown in the Vercel project remains supported.
  const connected = await connectToken(CONNECTORS.openai);
  if (connected) return { value: connected, source: "vercel-connect" as const };

  // 3) Emergency admin-site fallback. The key is server-readable only.
  const browserKey = requestCookie(OPENAI_API_KEY_COOKIE);
  if (browserKey) return { value: browserKey, source: "admin-site-api-key" as const };

  return null;
}

export function getAiGatewayCredential() {
  // Vercel AI Gateway supports a dedicated API key and, on Vercel deployments,
  // the automatically issued OIDC token. This gives Angel OS IA a second,
  // independent route when the direct OpenAI account is out of quota or a
  // connector credential is temporarily unusable.
  const gatewayKey = process.env["AI_GATEWAY_API_KEY"];
  if (gatewayKey?.trim()) return { value: gatewayKey.trim(), source: "ai-gateway-key" as const };

  const oidc = process.env["VERCEL_OIDC_TOKEN"];
  if (oidc?.trim()) return { value: oidc.trim(), source: "vercel-oidc" as const };

  return null;
}

export const VERCEL_CONNECTOR_IDS = CONNECTORS;
