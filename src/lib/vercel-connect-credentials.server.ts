export const TMDB_READ_TOKEN_COOKIE = "disabled";
export const TMDB_API_KEY_COOKIE = "disabled";
export const OPENAI_API_KEY_COOKIE = "disabled";

export type OpenAiCredential = { value: string; source: string };
export type TmdbCredential = { value: string; source: string; kind: "bearer" | "api-key" };
type LegacyAiGatewayCredential = { value: string; source: string };

function env(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

function normalizeBearerToken(value: string) {
  return value.replace(/^Bearer\s+/i, "").trim();
}

// Compatibilité : Angel OS n'utilise plus OpenAI, seulement la passerelle IA Lovable.
export async function getOpenAiCredential(): Promise<OpenAiCredential | null> {
  const value = env("LOVABLE_API_KEY");
  return value ? { value, source: "env:LOVABLE_API_KEY" } : null;
}

// Compatibility export: there is deliberately never more than one OpenAI key.
export async function getOpenAiCredentials(): Promise<OpenAiCredential[]> {
  const credential = await getOpenAiCredential();
  return credential ? [credential] : [];
}

export async function getTmdbCredential(): Promise<TmdbCredential | null> {
  const token = env("TMDB_READ_TOKEN") || env("TMDB_READ_ACCESS_TOKEN");
  if (token) {
    const value = normalizeBearerToken(token);
    if (value) return { value, source: "env:TMDB_READ_TOKEN", kind: "bearer" };
  }

  const apiKey = env("TMDB_API_KEY");
  return apiKey ? { value: apiKey, source: "env:TMDB_API_KEY", kind: "api-key" } : null;
}

// Compatibility export: there is deliberately never more than one TMDB credential.
export async function getTmdbCredentials(): Promise<TmdbCredential[]> {
  const credential = await getTmdbCredential();
  return credential ? [credential] : [];
}

// Compatibility no-ops kept only so older imports cannot reintroduce runtime failover.
export function markApiCredentialFailure(_credential: { source: string }, _cooldownMs = 60_000) {}
export function markApiCredentialHealthy(_credential: { source: string }) {}

export function getOpenAiCredentialHealthSnapshot() {
  const configured = Boolean(env("LOVABLE_API_KEY"));
  return {
    configured: configured ? 1 : 0,
    available: configured ? 1 : 0,
    credentials: configured ? [{ source: "env:LOVABLE_API_KEY", failures: 0, blockedUntil: null, healthy: true, lastFailureAt: null, lastSuccessAt: null }] : [],
  };
}

export function getTmdbCredentialHealthSnapshot() {
  const token = env("TMDB_READ_TOKEN") || env("TMDB_READ_ACCESS_TOKEN");
  const apiKey = env("TMDB_API_KEY");
  const source = token ? "env:TMDB_READ_TOKEN" : apiKey ? "env:TMDB_API_KEY" : null;
  const kind = token ? "bearer" : apiKey ? "api-key" : null;
  return {
    configured: source ? 1 : 0,
    available: source ? 1 : 0,
    credentials: source && kind ? [{ source, kind, failures: 0, blockedUntil: null, healthy: true, lastFailureAt: null, lastSuccessAt: null }] : [],
  };
}

// Compatibility only. Angel OS IA passe exclusivement par la passerelle IA Lovable.
export function getAiGatewayCredential(): LegacyAiGatewayCredential | null {
  return null;
}

export const VERCEL_CONNECTOR_IDS = { tmdb: "disabled", openai: "disabled" } as const;
