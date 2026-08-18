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

export async function getOpenAiCredential(): Promise<OpenAiCredential | null> {
  const value = env("LOVABLE_API_KEY");
  return value ? { value, source: "env:LOVABLE_API_KEY" } : null;
}

export async function getOpenAiCredentials(): Promise<OpenAiCredential[]> {
  const credential = await getOpenAiCredential();
  return credential ? [credential] : [];
}

export function resolveTmdbCredential(): TmdbCredential | null {
  const token = env("TMDB_READ_TOKEN") || env("TMDB_READ_ACCESS_TOKEN");
  if (token) {
    const value = normalizeBearerToken(token);
    if (value) return { value, source: "env:TMDB_READ_TOKEN", kind: "bearer" };
  }
  const apiKey = env("TMDB_API_KEY");
  return apiKey ? { value: apiKey, source: "env:TMDB_API_KEY", kind: "api-key" } : null;
}

export async function getTmdbCredential(): Promise<TmdbCredential | null> {
  return resolveTmdbCredential();
}

export async function getTmdbCredentials(): Promise<TmdbCredential[]> {
  const credential = resolveTmdbCredential();
  return credential ? [credential] : [];
}

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
  const credential = resolveTmdbCredential();
  return {
    configured: credential ? 1 : 0,
    available: credential ? 1 : 0,
    credentials: credential ? [{ source: credential.source, kind: credential.kind, failures: 0, blockedUntil: null, healthy: true, lastFailureAt: null, lastSuccessAt: null }] : [],
  };
}

export function getAiGatewayCredential(): LegacyAiGatewayCredential | null {
  return null;
}
