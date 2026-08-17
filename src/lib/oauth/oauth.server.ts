import { createCipheriv, createDecipheriv, createHmac, randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { PROVIDERS, type ProviderConfig, type ProviderId } from "./providers";
import { GOOGLE_IDENTITY_SCOPES } from "./google-services";
import { deriveVaultKeySync, getVaultSecretSync } from "../angel-vault.server";

export type TokenPayload = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  code_verifier?: string;
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

const PRODUCTION_OAUTH_ORIGIN = "https://www.angel-leclerc.fr";

function keyFrom(secretName: string): Buffer {
  const raw = getVaultSecretSync(secretName);
  if (raw) return createHash("sha256").update(raw).digest();
  if (secretName === "OAUTH_TOKEN_SECRET" || secretName === "OAUTH_STATE_SECRET") return deriveVaultKeySync(secretName);
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

type StatePayload = { p: ProviderId; u: string; n: string; exp: number; v?: string; o?: string; s?: string[] };
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

function providerPair(config: ProviderConfig) {
  const clientId = process.env[config.clientIdEnv]?.trim();
  const clientSecret = process.env[config.clientSecretEnv]?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function providerCredentials(config: ProviderConfig) {
  const pair = providerPair(config);
  return { clientId: pair?.clientId ?? null, clientSecret: pair?.clientSecret ?? null, configured: Boolean(pair) };
}

function endpoint(url: string): string {
  return url.replace("{tenant}", process.env.MS_TENANT_ID?.trim() || "common");
}

export function canonicalOAuthOrigin(inputOrigin: string): string {
  const configured = process.env.OAUTH_CANONICAL_ORIGIN?.trim();
  const candidate = configured || inputOrigin;
  try {
    const url = new URL(candidate);
    if (url.hostname === "angel-leclerc.fr" || url.hostname === "www.angel-leclerc.fr" || url.hostname.endsWith(".vercel.app")) {
      return PRODUCTION_OAUTH_ORIGIN;
    }
    return url.origin.replace(/\/$/, "");
  } catch {
    return PRODUCTION_OAUTH_ORIGIN;
  }
}

export function redirectUri(origin: string, provider: ProviderId): string {
  return `${canonicalOAuthOrigin(origin)}/oauth/${provider}/callback`;
}

export function buildAuthorizeUrl(provider: ProviderId, origin: string, userId: string, requestedScopes?: string[]) {
  const config = PROVIDERS[provider];
  const pair = providerPair(config);
  if (!pair) throw new Error(`Activation serveur requise pour ${config.name}.`);

  const canonicalOrigin = canonicalOAuthOrigin(origin);
  const verifier = config.usePkce ? b64url(randomBytes(48)) : undefined;
  const scopes = provider === "google" && requestedScopes?.length
    ? Array.from(new Set([...GOOGLE_IDENTITY_SCOPES, ...requestedScopes]))
    : [...config.scopes, ...(config.optionalScopes ?? [])];
  const state = signState({
    p: provider,
    u: userId,
    n: b64url(randomBytes(12)),
    exp: Date.now() + 10 * 60 * 1000,
    o: canonicalOrigin,
    s: scopes,
    ...(verifier ? { v: verifier } : {}),
  });

  const url = new URL(endpoint(config.authorizeUrl));
  url.searchParams.set("client_id", pair.clientId);
  url.searchParams.set("redirect_uri", redirectUri(canonicalOrigin, provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("state", state);
  for (const [k, v] of Object.entries(config.extraAuthParams ?? {})) url.searchParams.set(k, v);
  if (provider === "google") url.searchParams.set("include_granted_scopes", "true");
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
    throw new Error(`Échec de l'échange de jeton (${config.name}) : ${response.status}`);
  }
  return json;
}

export async function exchangeCode(provider: ProviderId, code: string, origin: string, codeVerifier?: string) {
  const config = PROVIDERS[provider];
  const pair = providerPair(config);
  if (!pair) throw new Error(`Identifiants OAuth indisponibles pour ${config.name}.`);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(origin, provider),
    client_id: pair.clientId,
    client_secret: pair.clientSecret,
  });
  if (codeVerifier) body.set("code_verifier", codeVerifier);
  return postToken(config, body);
}

export async function refreshAccessToken(provider: ProviderId, refreshToken: string) {
  const config = PROVIDERS[provider];
  const pair = providerPair(config);
  if (!pair) throw new Error(`Identifiants OAuth indisponibles pour ${config.name}.`);
  return postToken(config, new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: pair.clientId,
    client_secret: pair.clientSecret,
  }));
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
  } catch {}
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
  const { data: existing } = await db.from("oauth_connections")
    .select("token_ciphertext, scopes, account_label")
    .eq("user_id", params.userId)
    .eq("provider", params.provider)
    .maybeSingle();

  let previousTokens: TokenPayload | null = null;
  if (existing && (existing as Record<string, unknown>)["token_ciphertext"]) {
    try { previousTokens = decryptTokens((existing as Record<string, unknown>)["token_ciphertext"] as string); } catch {}
  }
  const previousScopes = existing ? (((existing as Record<string, unknown>)["scopes"] as string[] | null) ?? []) : [];
  const mergedScopes = Array.from(new Set([...previousScopes, ...params.scopes]));
  const mergedTokens: TokenPayload = {
    ...params.tokens,
    refresh_token: params.tokens.refresh_token ?? previousTokens?.refresh_token,
  };
  const existingLabel = existing ? ((existing as Record<string, unknown>)["account_label"] as string | null) : null;

  const { error } = await db.from("oauth_connections").upsert({
    provider: params.provider,
    user_id: params.userId,
    account_label: params.accountLabel ?? existingLabel,
    token_ciphertext: encryptTokens(mergedTokens),
    scopes: mergedScopes,
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
    const refreshed = await refreshAccessToken(provider, tokens.refresh_token);
    const accessToken = refreshed["access_token"] as string;
    const expiresIn = Number(refreshed["expires_in"] ?? 0);
    await saveConnection({
      provider,
      userId,
      tokens: {
        access_token: accessToken,
        refresh_token: (refreshed["refresh_token"] as string) ?? tokens.refresh_token,
        token_type: refreshed["token_type"] as string | undefined,
        scope: refreshed["scope"] as string | undefined,
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
