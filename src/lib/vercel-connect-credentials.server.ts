export const TMDB_READ_TOKEN_COOKIE = "disabled";
export const TMDB_API_KEY_COOKIE = "disabled";
export const OPENAI_API_KEY_COOKIE = "disabled";

export type OpenAiCredential = { value: string; source: string };
type TmdbCredential = { value: string; source: string; kind: "bearer" | "api-key" };
type LegacyAiGatewayCredential = { value: string; source: string };

type CredentialHealth = {
  failures: number;
  blockedUntil: number;
  lastFailureAt: number | null;
  lastSuccessAt: number | null;
};

const credentialHealth = new Map<string, CredentialHealth>();

function env(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

function credentialId(credential: OpenAiCredential) {
  return credential.source;
}

function stateFor(credential: OpenAiCredential): CredentialHealth {
  const id = credentialId(credential);
  const current = credentialHealth.get(id);
  if (current) return current;
  const initial = { failures: 0, blockedUntil: 0, lastFailureAt: null, lastSuccessAt: null };
  credentialHealth.set(id, initial);
  return initial;
}

function collectOpenAiCredentials(): OpenAiCredential[] {
  const candidates: OpenAiCredential[] = [];
  const primary = env("OPENAI_API_KEY");
  if (primary) candidates.push({ value: primary, source: "env:OPENAI_API_KEY" });

  for (let index = 2; index <= 10; index += 1) {
    const value = env(`OPENAI_API_KEY_${index}`);
    if (value) candidates.push({ value, source: `env:OPENAI_API_KEY_${index}` });
  }

  const pooled = env("OPENAI_API_KEYS");
  if (pooled) {
    pooled
      .split(/[\n,;]+/)
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((value, index) => candidates.push({ value, source: `env:OPENAI_API_KEYS#${index + 1}` }));
  }

  const seen = new Set<string>();
  return candidates.filter((credential) => {
    if (seen.has(credential.value)) return false;
    seen.add(credential.value);
    return true;
  });
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
  const now = Date.now();
  const credentials = collectOpenAiCredentials();
  return [...credentials].sort((a, b) => {
    const aState = stateFor(a);
    const bState = stateFor(b);
    const aBlocked = aState.blockedUntil > now ? 1 : 0;
    const bBlocked = bState.blockedUntil > now ? 1 : 0;
    if (aBlocked !== bBlocked) return aBlocked - bBlocked;
    if (aState.failures !== bState.failures) return aState.failures - bState.failures;
    return (bState.lastSuccessAt ?? 0) - (aState.lastSuccessAt ?? 0);
  });
}

export async function getOpenAiCredential(): Promise<OpenAiCredential | null> {
  const credentials = await getOpenAiCredentials();
  const now = Date.now();
  return credentials.find((credential) => stateFor(credential).blockedUntil <= now) ?? credentials[0] ?? null;
}

export function markApiCredentialFailure(credential: OpenAiCredential, cooldownMs = 60_000) {
  const state = stateFor(credential);
  state.failures += 1;
  state.lastFailureAt = Date.now();
  const multiplier = Math.min(6, Math.max(1, state.failures));
  state.blockedUntil = Date.now() + Math.min(15 * 60_000, cooldownMs * multiplier);
}

export function markApiCredentialHealthy(credential: OpenAiCredential) {
  const state = stateFor(credential);
  state.failures = 0;
  state.blockedUntil = 0;
  state.lastSuccessAt = Date.now();
}

export function getOpenAiCredentialHealthSnapshot() {
  const now = Date.now();
  const credentials = collectOpenAiCredentials();
  return {
    configured: credentials.length,
    available: credentials.filter((credential) => stateFor(credential).blockedUntil <= now).length,
    credentials: credentials.map((credential) => {
      const state = stateFor(credential);
      return {
        source: credential.source,
        failures: state.failures,
        blockedUntil: state.blockedUntil || null,
        healthy: state.blockedUntil <= now,
        lastFailureAt: state.lastFailureAt,
        lastSuccessAt: state.lastSuccessAt,
      };
    }),
  };
}

export async function getTmdbCredentials(): Promise<TmdbCredential[]> {
  const credential = tmdbCredential();
  return credential ? [credential] : [];
}

export async function getTmdbCredential(): Promise<TmdbCredential | null> {
  return tmdbCredential();
}

// Compatibility only. Angel OS IA uses OpenAI directly and never returns a gateway credential.
export function getAiGatewayCredential(): LegacyAiGatewayCredential | null {
  return null;
}

export const VERCEL_CONNECTOR_IDS = { tmdb: "disabled", openai: "disabled" } as const;
