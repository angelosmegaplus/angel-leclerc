export const TMDB_READ_TOKEN_COOKIE = "disabled";
export const TMDB_API_KEY_COOKIE = "disabled";
export const OPENAI_API_KEY_COOKIE = "disabled";

type OpenAiCredential = { value: string; source: string };
type TmdbCredential = { value: string; source: string; kind: "bearer" | "api-key" };

function env(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

function openAiCredential(): OpenAiCredential | null {
  const value = env("OPENAI_API_KEY");
  return value ? { value, source: "env:OPENAI_API_KEY" } : null;
}

function tmdbCredential(): TmdbCredential | null {
  const readToken = env("TMDB_READ_TOKEN") || env("TMDB_READ_ACCESS_TOKEN");
  if (readToken) return { value: readToken, source: "env:TMDB_READ_TOKEN", kind: "bearer" };

  const apiKey = env("TMDB_API_KEY");
  if (apiKey) return { value: apiKey, source: "env:TMDB_API_KEY", kind: "api-key" };

  const bundledApiKey = import.meta.env.VITE_TMDB_API_KEY?.trim();
  if (bundledApiKey) return { value: bundledApiKey, source: "build:VITE_TMDB_API_KEY", kind: "api-key" };

  return null;
}

export async function getOpenAiCredentials(): Promise<OpenAiCredential[]> {
  const credential = openAiCredential();
  return credential ? [credential] : [];
}

export async function getOpenAiCredential(): Promise<OpenAiCredential | null> {
  return openAiCredential();
}

export async function getTmdbCredentials(): Promise<TmdbCredential[]> {
  const credential = tmdbCredential();
  return credential ? [credential] : [];
}

export async function getTmdbCredential(): Promise<TmdbCredential | null> {
  return tmdbCredential();
}

export function markApiCredentialFailure() {}
export function markApiCredentialHealthy() {}

// Kept only for old imports. Angel OS IA no longer uses AI Gateway/OIDC fallback.
export function getAiGatewayCredential() { return null; }

export const VERCEL_CONNECTOR_IDS = { tmdb: "disabled", openai: "disabled" } as const;
