import { getToken } from "@vercel/connect";
import { getCookie } from "@tanstack/react-start/server";

const CONNECTORS = {
  tmdb: "tmdb_api_key/tmdb-angel-os",
  openai: "api.openai.com/canary-xylophone",
} as const;

export const TMDB_READ_TOKEN_COOKIE = "angel_tmdb_read_token";
export const TMDB_API_KEY_COOKIE = "angel_tmdb_api_key";
export const OPENAI_API_KEY_COOKIE = "angel_openai_api_key";

type OpenAiCredential = { value: string; source: string };
type TmdbCredential = { value: string; source: string; kind: "bearer" | "api-key" };
type PoolService = "openai" | "tmdb";

type HealthyCache = {
  credential: OpenAiCredential | TmdbCredential;
  expiresAt: number;
};

const HEALTHY_TTL_MS = 5 * 60 * 1000;
const FAILED_TTL_MS = 45 * 1000;
const PROBE_TIMEOUT_MS = 1400;
const healthy = new Map<PoolService, HealthyCache>();
const failedUntil = new Map<string, number>();

function credentialId(service: PoolService, credential: OpenAiCredential | TmdbCredential) {
  return `${service}:${credential.source}:${"kind" in credential ? credential.kind : "key"}`;
}

function uniqueByValue<T extends { value: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.value || seen.has(item.value)) return false;
    seen.add(item.value);
    return true;
  });
}

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

function namedSecrets(names: string[]) {
  const values: Array<{ name: string; value: string; source: "env" }> = [];
  for (const name of names) {
    const env = process.env[name]?.trim();
    if (env) values.push({ name, value: env, source: "env" });
  }
  return values;
}

async function openAiCandidates(): Promise<OpenAiCredential[]> {
  const slots = namedSecrets([
    "OPENAI_API_KEY",
    "OPENAI_API_KEY_2",
    "OPENAI_API_KEY_3",
    "OPENAI_API_KEY_4",
    "OPENAI_API_KEY_5",
    "OPENAI_SECONDARY_KEY",
  ]);
  const out: OpenAiCredential[] = slots.map((item) => ({
    value: item.value,
    source: `${item.source}:${item.name}`,
  }));

  const connected = await connectToken(CONNECTORS.openai);
  if (connected) out.push({ value: connected, source: "vercel-connect" });

  const browserKey = requestCookie(OPENAI_API_KEY_COOKIE);
  if (browserKey) out.push({ value: browserKey, source: "admin-site-api-key" });
  return uniqueByValue(out);
}

async function tmdbCandidates(): Promise<TmdbCredential[]> {
  const readSlots = namedSecrets([
    "TMDB_READ_ACCESS_TOKEN",
    "TMDB_READ_TOKEN",
    "TMDB_READ_TOKEN_2",
    "TMDB_READ_TOKEN_3",
    "TMDB_READ_TOKEN_4",
    "TMDB_READ_TOKEN_5",
  ]);
  const apiSlots = namedSecrets([
    "TMDB_API_KEY",
    "TMDB_API_KEY_2",
    "TMDB_API_KEY_3",
    "TMDB_API_KEY_4",
    "TMDB_API_KEY_5",
  ]);
  const out: TmdbCredential[] = [
    ...readSlots.map((item) => ({ value: item.value, source: `${item.source}:${item.name}`, kind: "bearer" as const })),
    ...apiSlots.map((item) => ({ value: item.value, source: `${item.source}:${item.name}`, kind: "api-key" as const })),
  ];

  const connected = await connectToken(CONNECTORS.tmdb);
  if (connected) out.push({ value: connected, source: "vercel-connect-api-key", kind: "api-key" });

  const browserReadToken = requestCookie(TMDB_READ_TOKEN_COOKIE);
  if (browserReadToken) out.push({ value: browserReadToken, source: "admin-site-read-token", kind: "bearer" });
  const browserApiKey = requestCookie(TMDB_API_KEY_COOKIE);
  if (browserApiKey) out.push({ value: browserApiKey, source: "admin-site-api-key", kind: "api-key" });
  return uniqueByValue(out);
}

async function probe(service: PoolService, credential: OpenAiCredential | TmdbCredential): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    if (service === "openai") {
      const response = await fetch("https://api.openai.com/v1/models", {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${credential.value}`, Accept: "application/json" },
      });
      return response.ok;
    }

    const tmdb = credential as TmdbCredential;
    const url = new URL("https://api.themoviedb.org/3/configuration");
    if (tmdb.kind === "api-key") url.searchParams.set("api_key", tmdb.value);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: tmdb.kind === "bearer"
        ? { Authorization: `Bearer ${tmdb.value}`, Accept: "application/json" }
        : { Accept: "application/json" },
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function selectHealthy<T extends OpenAiCredential | TmdbCredential>(service: PoolService, candidates: T[]): Promise<T | null> {
  const cached = healthy.get(service);
  if (cached && cached.expiresAt > Date.now()) return cached.credential as T;

  for (const candidate of candidates) {
    const id = credentialId(service, candidate);
    if ((failedUntil.get(id) ?? 0) > Date.now()) continue;
    const ok = await probe(service, candidate);
    if (ok) {
      healthy.set(service, { credential: candidate, expiresAt: Date.now() + HEALTHY_TTL_MS });
      failedUntil.delete(id);
      return candidate;
    }
    failedUntil.set(id, Date.now() + FAILED_TTL_MS);
  }
  healthy.delete(service);
  return null;
}

export function markApiCredentialFailure(service: PoolService, credential: OpenAiCredential | TmdbCredential) {
  failedUntil.set(credentialId(service, credential), Date.now() + FAILED_TTL_MS);
  const cached = healthy.get(service);
  if (cached && cached.credential.source === credential.source) healthy.delete(service);
}

export function markApiCredentialHealthy(service: PoolService, credential: OpenAiCredential | TmdbCredential) {
  failedUntil.delete(credentialId(service, credential));
  healthy.set(service, { credential, expiresAt: Date.now() + HEALTHY_TTL_MS });
}

export async function getTmdbCredentials() {
  return tmdbCandidates();
}

export async function getTmdbCredential() {
  return selectHealthy("tmdb", await tmdbCandidates());
}

export async function getOpenAiCredentials() {
  return openAiCandidates();
}

export async function getOpenAiCredential() {
  return selectHealthy("openai", await openAiCandidates());
}

export function getAiGatewayCredential() {
  const gatewayKey = process.env["AI_GATEWAY_API_KEY"];
  if (gatewayKey?.trim()) return { value: gatewayKey.trim(), source: "ai-gateway-key" as const };

  const oidc = process.env["VERCEL_OIDC_TOKEN"];
  if (oidc?.trim()) return { value: oidc.trim(), source: "vercel-oidc" as const };

  return null;
}

export const VERCEL_CONNECTOR_IDS = CONNECTORS;
