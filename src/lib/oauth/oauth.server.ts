import { createCipheriv, createDecipheriv, createHmac, randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { PROVIDERS, type ProviderConfig, type ProviderId } from "./providers";
import { deriveVaultKeySync, getVaultSecretSync } from "../angel-vault.server";
import {
  getCredentialPairPoolSync,
  markCredentialHealthy,
  quarantineCredential,
  type CredentialPairCandidate,
} from "../credential-pool.server";

export type TokenPayload = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  code_verifier?: string;
  client_slot?: number;
};

export type ConnectionStatus = "connected" | "reconnect_required" | "disconnected";
export type ConnectionInfo = {
  provider: ProviderId;
  accountLabel: string | null;
  scopes: string[];
  status: ConnectionStatus;
  expiresAt: string | null;
  lastSyncAt: string | null;
};

function keyFrom(secretName: string): Buffer {
  const raw = getVaultSecretSync(secretName);
  if (raw) return createHash("sha256").update(raw).digest();
  if (secretName === "OAUTH_TOKEN_SECRET" || secretName === "OAUTH_STATE_SECRET") {
    return deriveVaultKeySync(secretName);
  }
  throw new Error(`${secretName} is not configured`);
}

function stateHmacKey(): Buffer {
  return createHmac("sha256", keyFrom("OAUTH_STATE_SECRET"))
    .update("angel-os:oauth-state-hmac:v1")
    .digest();
}

export function encryptTokens(payload: TokenPayload): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFrom("OAUTH_TOKEN_SECRET"), iv);
  const ct = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function decryptTokens(stored: string): TokenPayload {
  const buf = Buffer.from(stored, "base64");
  const decipher = createDecipheriv("aes-256-gcm", keyFrom("OAUTH_TOKEN_SECRET"), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  const out = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
  return JSON.parse(out) as TokenPayload;
}

type StatePayload = { p: ProviderId; u: string; n: string; exp: number; v?: string; c?: number };
function b64url(input: Buffer | string): string { return Buffer.from(input).toString("base64url"); }

function sealState(payload: StatePayload): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFrom("OAUTH_STATE_SECRET"), iv);
  const ct = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64url");
}

function openState(sealed: string): StatePayload {
  const buf = Buffer.from(sealed, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", keyFrom("OAUTH_STATE_SECRET"), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8")) as StatePayload;
}

export function signState(payload: StatePayload): string {
  const body = sealState(payload);
  const sig = createHmac("sha256", stateHmacKey()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyState(state: string): StatePayload | null {
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", stateHmacKey()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = openState(body);
    return payload.exp < Date.now() ? null : payload;
  } catch { return null; }
}

function providerPool(config: ProviderConfig) {
  return getCredentialPairPoolSync(`oauth:${config.id}`, config.clientIdEnv, config.clientSecretEnv, 5);
}

function pairFor(config: ProviderConfig, slot?: number): CredentialPairCandidate | null {
  const pool = providerPool(config);
  if (!pool.length) return null;
  return (slot ? pool.find((item) => item.slot === slot) : null) ?? pool[0] ?? null;
}

export function providerCredentials(config: ProviderConfig, slot?: number) {
  const pair = pairFor(config, slot);
  return {
    clientId: pair?.first.value ?? null,
    clientSecret: pair?.second.value ?? null,
    configured: Boolean(pair),
    slot: pair?.slot ?? null,
  };
}

function endpoint(url: string): string {
  return url.replace("{tenant}", getVaultSecretSync("MS_TENANT_ID") ?? "common");
}

export function redirectUri(origin: string, provider: ProviderId): string {
  return `${origin}/oauth/${provider}/callback`;
}

export function buildAuthorizeUrl(provider: ProviderId, origin: string, userId: string) {
  const config = PROVIDERS[provider];
  const pair = pairFor(config);
  if (!pair) throw new Error(`Activation serveur requise pour ${config.name}.`);

  const verifier = config.usePkce ? b64url(randomBytes(48)) : undefined;
  const state = signState({
    p: provider,
    u: userId,
    n: b64url(randomBytes(12)),
    exp: Date.now() + 10 * 60 * 1000,
    c: pair.slot,
    ...(verifier ? { v: verifier } : {}),
  });

  const url = new URL(endpoint(config.authorizeUrl));
  url.searchParams.set("client_id", pair.first.value);
  url.searchParams.set("redirect_uri", redirectUri(origin, provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes.join(" "));
  url.searchParams.set("state", state);
  for (const [k, v] of Object.entries(config.extraAuthParams ?? {})) url.searchParams.set(k, v);
  if (verifier) {
    url.searchParams.set("code_challenge", createHash("sha256").update(verifier).digest("base64url"));
    url.searchParams.set("code_challenge_method", "S256");
  }
  return url.toString();
}

async function postToken(config: ProviderConfig, body: URLSearchParams) {
  const response = await fetch(endpoint(config.tokenUrl), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body,
  });
  const text = await response.text();
  let json: Record<string, unknown>;
  try { json = JSON.parse(text) as Record<string, unknown>; }
  catch { json = Object.fromEntries(new URLSearchParams(text)); }
  if (!response.ok || typeof json["access_token"] !== "string") {
    throw new Error(`Échec de l'échange de jeton (${config.name}) : ${text.slice(0, 200)}`);
  }
  return json;
}

export async function exchangeCode(provider: ProviderId, code: string, origin: string, codeVerifier?: string, slot?: number) {
  const config = PROVIDERS[provider];
  const pair = pairFor(config, slot);
  if (!pair) throw new Error(`Identifiants OAuth indisponibles pour ${config.name}.`);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(origin, provider),
    client_id: pair.first.value,
    client_secret: pair.second.value,
  });
  if (codeVerifier) body.set("code_verifier", codeVerifier);
  try {
    const json = await postToken(config, body);
    markCredentialHealthy(`oauth:${config.id}`, pair);
    json["_angel_client_slot"] = pair.slot;
    return json;
  } catch (error) {
    quarantineCredential(pair);
    throw error;
  }
}

export async function refreshAccessToken(provider: ProviderId, refreshToken: string, slot?: number) {
  const config = PROVIDERS[provider];
  const requested = pairFor(config, slot);
  const pool = providerPool(config);
  const ordered = requested
    ? [requested, ...pool.filter((item) => item.slot !== requested.slot)]
    : pool;
  let lastError: unknown = null;

  for (const pair of ordered) {
    try {
      const json = await postToken(config, new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: pair.first.value,
        client_secret: pair.second.value,
      }));
      markCredentialHealthy(`oauth:${config.id}`, pair);
      json["_angel_client_slot"] = pair.slot;
      return json;
    } catch (error) {
      lastError = error;
      quarantineCredential(pair);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Aucun client OAuth valide pour ${config.name}.`);
}

function pick(source: unknown, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((acc, key) => acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined, source);
  return typeof value === "string" ? value : undefined;
}

export async function fetchAccountLabel(provider: ProviderId, accessToken: string) {
  const config = PROVIDERS[provider];
  if (!config.identity) return null;
  try {
    const response = await fetch(config.identity.url, { headers: { Authorization: `Bearer ${accessToken}`, accept: "application/json" } });
    if (!response.ok) return null;
    const json = (await response.json()) as unknown;
    for (const field of config.identity.field) {
      const value = pick(json, field);
      if (value) return value;
    }
  } catch { /* best effort */ }
  return null;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function saveConnection(params: {
  provider: ProviderId;
  userId: string;
  tokens: TokenPayload;
  scopes: string[];
  accountLabel: string | null;
  expiresAt: string | null;
}) {
  const db = await admin();
  const { error } = await db.from("oauth_connections").upsert({
    provider: params.provider,
    user_id: params.userId,
    ...(params.accountLabel ? { account_label: params.accountLabel } : {}),
    token_ciphertext: encryptTokens(params.tokens),
    scopes: params.scopes,
    status: "connected",
    expires_at: params.expiresAt,
    last_sync_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as never, { onConflict: "user_id,provider" });
  if (error) throw error;
}

export async function listConnections(userId: string): Promise<ConnectionInfo[]> {
  const db = await admin();
  const { data, error } = await db.from("oauth_connections")
    .select("provider, account_label, scopes, status, expires_at, last_sync_at")
    .eq("user_id", userId);
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    provider: row["provider"] as ProviderId,
    accountLabel: (row["account_label"] as string | null) ?? null,
    scopes: (row["scopes"] as string[] | null) ?? [],
    status: (row["status"] as ConnectionStatus) ?? "connected",
    expiresAt: (row["expires_at"] as string | null) ?? null,
    lastSyncAt: (row["last_sync_at"] as string | null) ?? null,
  }));
}

export async function deleteConnection(userId: string, provider: ProviderId) {
  const db = await admin();
  const { error } = await db.from("oauth_connections").delete().eq("user_id", userId).eq("provider", provider);
  if (error) throw error;
}

async function markReconnectRequired(userId: string, provider: ProviderId) {
  const db = await admin();
  await db.from("oauth_connections")
    .update({ status: "reconnect_required", updated_at: new Date().toISOString() } as never)
    .eq("user_id", userId).eq("provider", provider);
}

export async function getAccessToken(userId: string, provider: ProviderId): Promise<string | null> {
  const db = await admin();
  const { data } = await db.from("oauth_connections")
    .select("token_ciphertext, expires_at, scopes")
    .eq("user_id", userId).eq("provider", provider).maybeSingle();
  if (!data) return null;

  const row = data as Record<string, unknown>;
  const tokens = decryptTokens(row["token_ciphertext"] as string);
  const expiresAt = row["expires_at"] as string | null;
  const stillValid = !expiresAt || new Date(expiresAt).getTime() - 60_000 > Date.now();
  if (stillValid) return tokens.access_token;

  if (!tokens.refresh_token || !PROVIDERS[provider].supportsRefresh) {
    await markReconnectRequired(userId, provider);
    return null;
  }

  try {
    const refreshed = await refreshAccessToken(provider, tokens.refresh_token, tokens.client_slot);
    const accessToken = refreshed["access_token"] as string;
    const expiresIn = Number(refreshed["expires_in"] ?? 0);
    const clientSlot = Number(refreshed["_angel_client_slot"] ?? tokens.client_slot ?? 1);
    await saveConnection({
      provider,
      userId,
      tokens: {
        access_token: accessToken,
        refresh_token: (refreshed["refresh_token"] as string) ?? tokens.refresh_token,
        token_type: refreshed["token_type"] as string | undefined,
        scope: refreshed["scope"] as string | undefined,
        client_slot: clientSlot,
      },
      scopes: (row["scopes"] as string[] | null) ?? [],
      accountLabel: null,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
    });
    return accessToken;
  } catch {
    await markReconnectRequired(userId, provider);
    return null;
  }
}
