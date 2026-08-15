import { getToken } from "@vercel/connect";

const CONNECTORS = {
  tmdb: "tmdb_api_key/tmdb-angel-os",
  openai: "api.openai.com/canary-xylophone",
} as const;

async function connectToken(connector: string) {
  try {
    const token = await getToken(connector, { subject: { type: "app" } });
    return typeof token === "string" && token.trim() ? token.trim() : null;
  } catch (error) {
    console.warn("[vercel-connect] credential unavailable", { connector, error });
    return null;
  }
}

export async function getTmdbCredential() {
  // Secrets TMDB must remain server-side. Prefer the API Read Access Token,
  // while retaining TMDB_API_KEY for an older v3 key if one is already configured.
  const readToken = process.env["TMDB_READ_ACCESS_TOKEN"];
  if (readToken?.trim()) return { value: readToken.trim(), source: "env-read-token" as const };

  const apiKey = process.env["TMDB_API_KEY"];
  if (apiKey?.trim()) return { value: apiKey.trim(), source: "env-api-key" as const };

  const connected = await connectToken(CONNECTORS.tmdb);
  return connected ? { value: connected, source: "vercel-connect" as const } : null;
}

export async function getOpenAiCredential() {
  const legacy = process.env["OPENAI_API_KEY"];
  if (legacy?.trim()) return { value: legacy.trim(), source: "env" as const };

  const connected = await connectToken(CONNECTORS.openai);
  return connected ? { value: connected, source: "vercel-connect" as const } : null;
}

export const VERCEL_CONNECTOR_IDS = CONNECTORS;
