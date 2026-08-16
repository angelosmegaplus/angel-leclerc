import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { TMDB_API_KEY_COOKIE, TMDB_READ_TOKEN_COOKIE } from "./vercel-connect-credentials.server";
import { hasVaultSecretSync } from "./angel-vault.server";

const BASE = "https://api.themoviedb.org/3";
const COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  maxAge: 60 * 60 * 24 * 180,
};

type CredentialInput = { apiKey?: string; readToken?: string };

async function validateCredential(value: string, kind: "api-key" | "read-token") {
  const url = new URL(`${BASE}/configuration`);
  if (kind === "api-key") url.searchParams.set("api_key", value);
  const response = await fetch(url.toString(), {
    headers: kind === "read-token"
      ? { Authorization: `Bearer ${value}`, Accept: "application/json" }
      : { Accept: "application/json" },
  });
  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json() as { status_message?: string };
      detail = body.status_message ? ` — ${body.status_message}` : "";
    } catch {
      // no-op
    }
    throw new Error(`TMDB_${kind === "read-token" ? "READ_TOKEN" : "API_KEY"}_INVALID_${response.status}${detail}`);
  }
  return true;
}

export const getTmdbCredentialStatus = createServerFn({ method: "GET" }).handler(async () => {
  const envReadToken = Boolean(process.env["TMDB_READ_ACCESS_TOKEN"]?.trim());
  const envApiKey = Boolean(process.env["TMDB_API_KEY"]?.trim());
  const vaultReadToken = !envReadToken && hasVaultSecretSync("TMDB_READ_TOKEN");
  const vaultApiKey = !envApiKey && hasVaultSecretSync("TMDB_API_KEY");
  const cookieReadToken = Boolean(getCookie(TMDB_READ_TOKEN_COOKIE));
  const cookieApiKey = Boolean(getCookie(TMDB_API_KEY_COOKIE));

  let activeSource: string | null = null;
  try {
    const { getTmdbCredential } = await import("./vercel-connect-credentials.server");
    activeSource = (await getTmdbCredential())?.source ?? null;
  } catch {
    activeSource = null;
  }

  return { envReadToken, envApiKey, vaultReadToken, vaultApiKey, cookieReadToken, cookieApiKey, activeSource };
});

export const saveTmdbCredentials = createServerFn({ method: "POST" })
  .validator((input: CredentialInput) => ({
    apiKey: String(input?.apiKey ?? "").trim().slice(0, 256),
    readToken: String(input?.readToken ?? "").trim().slice(0, 4096),
  }))
  .handler(async ({ data }) => {
    if (!data.apiKey && !data.readToken) throw new Error("Renseigne au moins une clé TMDB.");

    if (data.readToken) await validateCredential(data.readToken, "read-token");
    if (data.apiKey) await validateCredential(data.apiKey, "api-key");

    if (data.readToken) setCookie(TMDB_READ_TOKEN_COOKIE, data.readToken, COOKIE_OPTIONS);
    if (data.apiKey) setCookie(TMDB_API_KEY_COOKIE, data.apiKey, COOKIE_OPTIONS);

    return {
      ok: true as const,
      readTokenSaved: Boolean(data.readToken),
      apiKeySaved: Boolean(data.apiKey),
      message: "Identifiants TMDB vérifiés et enregistrés côté serveur pour ce navigateur.",
    };
  });

export const clearTmdbCredentials = createServerFn({ method: "POST" }).handler(async () => {
  setCookie(TMDB_READ_TOKEN_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  setCookie(TMDB_API_KEY_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return { ok: true as const };
});

export const testActiveTmdbCredential = createServerFn({ method: "GET" }).handler(async () => {
  const { getTmdbCredential } = await import("./vercel-connect-credentials.server");
  const credential = await getTmdbCredential();
  if (!credential) return { ok: false as const, source: null, error: "Aucun identifiant TMDB disponible." };

  try {
    const isBearer = credential.value.length > 60;
    await validateCredential(credential.value, isBearer ? "read-token" : "api-key");
    return { ok: true as const, source: credential.source, error: null };
  } catch (error) {
    return {
      ok: false as const,
      source: credential.source,
      error: error instanceof Error ? error.message : "Erreur TMDB inconnue.",
    };
  }
});
