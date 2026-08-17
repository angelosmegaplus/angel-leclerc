export const TMDB_READ_TOKEN_COOKIE = "disabled";
export const TMDB_API_KEY_COOKIE = "disabled";
export const OPENAI_API_KEY_COOKIE = "disabled";

export type OpenAiCredential = { value: string; source: string };
export type TmdbCredential = { value: string; source: string; kind: "bearer" | "api-key" };
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

function normalizeBearerToken(value: string) {
  return value.replace(/^Bearer\s+/i, "").trim();
}

function stateFor(credential: { source: string }): CredentialHealth {
  const current = credentialHealth.get(credential.source);
  if (current) return current;
  const initial = { failures: 0, blockedUntil: 0, lastFailureAt: null, lastSuccessAt: null };
  credentialHealth.set(credential.source, initial);
  return initial;
}

function sortByHealth<T extends { source: string }>(credentials: T[]): T[] {
  const now = Date.now();
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

function collectTmdbCredentials(): TmdbCredential[] {
  const candidates: TmdbCredential[] = [];

  const addBearer = (raw: string | null, source: string) => {
    if (!raw) return;
    const value = normalizeBearerToken(raw);
    if (value) candidates.push({ value, source, kind: "bearer" });
  };
  const addApiKey = (value: string | null, source: string) => {
    if (value) candidates.push({ value, source, kind: "api-key" });
  };

  addBearer(env("TMDB_READ_TOKEN") || env("TMDB_READ_ACCESS_TOKEN"), "env:TMDB_READ_TOKEN");
  addApiKey(env("TMDB_API_KEY"), "env:TMDB_API_KEY");

  for (let index = 2; index <= 10; index += 1) {
    addBearer(env(`TMDB_READ_TOKEN_${index}`), `env:TMDB_READ_TOKEN_${index}`);
    addApiKey(env(`TMDB_API_KEY_${index}`), `env:TMDB_API_KEY_${index}`);
  }

  const pooledTokens = env("TMDB_READ_TOKENS");
  if (pooledTokens) {
    pooledTokens
      .split(/[\n,;]+/)
      .map((value) => normalizeBearerToken(value))
      .filter(Boolean)
      .forEach((value, index) => candidates.push({ value, source: `env:TMDB_READ_TOKENS#${index + 1}`, kind: "bearer" }));
  }

  const pooledKeys = env("TMDB_API_KEYS");
  if (pooledKeys) {
    pooledKeys
      .split(/[\n,;]+/)
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((value, index) => candidates.push({ value, source: `env:TMDB_API_KEYS#${index + 1}`, kind: "api-key" }));
  }

  const seen = new Set<string>();
  return candidates.filter((credential) => {
    const id = `${credential.kind}:${credential.value}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export async function getOpenAiCredentials(): Promise<OpenAiCredential[]> {
  return sortByHealth(collectOpenAiCredentials());
}

export async function getOpenAiCredential(): Promise<OpenAiCredential | null> {
  const credentials = await getOpenAiCredentials();
  const now = Date.now();
  return credentials.find((credential) => stateFor(credential).blockedUntil <= now) ?? credentials[0] ?? null;
}

export function markApiCredentialFailure(credential: { source: string }, cooldownMs = 60_000) {
  const state = stateFor(credential);
  state.failures += 1;
  state.lastFailureAt = Date.now();
  const multiplier = Math.min(6, Math.max(1, state.failures));
  state.blockedUntil = Date.now() + Math.min(15 * 60_000, cooldownMs * multiplier);
}

export function markApiCredentialHealthy(credential: { source: string }) {
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
  return sortByHealth(collectTmdbCredentials());
}

export async function getTmdbCredential(): Promise<TmdbCredential | null> {
  const credentials = await getTmdbCredentials();
  const now = Date.now();
  return credentials.find((credential) => stateFor(credential).blockedUntil <= now) ?? credentials[0] ?? null;
}

export function getTmdbCredentialHealthSnapshot() {
  const now = Date.now();
  const credentials = collectTmdbCredentials();
  return {
    configured: credentials.length,
    available: credentials.filter((credential) => stateFor(credential).blockedUntil <= now).length,
    credentials: credentials.map((credential) => {
      const state = stateFor(credential);
      return {
        source: credential.source,
        kind: credential.kind,
        failures: state.failures,
        blockedUntil: state.blockedUntil || null,
        healthy: state.blockedUntil <= now,
        lastFailureAt: state.lastFailureAt,
        lastSuccessAt: state.lastSuccessAt,
      };
    }),
  };
}

// Compatibility only. Angel OS IA uses OpenAI directly and never returns a gateway credential.
export function getAiGatewayCredential(): LegacyAiGatewayCredential | null {
  return null;
}

export const VERCEL_CONNECTOR_IDS = { tmdb: "disabled", openai: "disabled" } as const;
