import {
  getTmdbCredential,
  getTmdbCredentials,
  markApiCredentialFailure,
  markApiCredentialHealthy,
} from "./vercel-connect-credentials.server";

const BASE = "https://api.themoviedb.org/3";
const REQUEST_TIMEOUT_MS = 2800;

export async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const preferred = await getTmdbCredential();
  const pool = await getTmdbCredentials();
  const credentials = [preferred, ...pool]
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item, index, list) => list.findIndex((other) => other.value === item.value) === index);

  if (!credentials.length) throw new Error("TMDB_CREDENTIAL_MISSING");

  let lastStatus: number | null = null;
  for (const credential of credentials) {
    const url = new URL(BASE + path);
    if (!params.language) url.searchParams.set("language", "fr-FR");
    for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
    if (credential.kind === "api-key") url.searchParams.set("api_key", credential.value);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: credential.kind === "bearer"
          ? { Authorization: `Bearer ${credential.value}`, Accept: "application/json" }
          : { Accept: "application/json" },
      });
      lastStatus = response.status;

      if (response.ok) {
        markApiCredentialHealthy("tmdb", credential);
        return await response.json() as T;
      }

      // 4xx d'auth/quota et 5xx peuvent être liés à la clé ou au fournisseur :
      // on bascule immédiatement sur le slot suivant. Un 404 métier, lui, ne
      // justifie pas de brûler tout le pool.
      if ([401, 403, 429].includes(response.status) || response.status >= 500) {
        markApiCredentialFailure("tmdb", credential);
        console.warn("[tmdb] credential failed, trying next", {
          status: response.status,
          credentialSource: credential.source,
          path,
        });
        continue;
      }

      throw new Error(`TMDB_REQUEST_FAILED_${response.status}`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("TMDB_REQUEST_FAILED_")) throw error;
      markApiCredentialFailure("tmdb", credential);
      console.warn("[tmdb] request transport failed, trying next", {
        credentialSource: credential.source,
        path,
        reason: error instanceof Error ? error.name : "request_failed",
      });
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(`TMDB_REQUEST_FAILED_${lastStatus ?? "ALL_CREDENTIALS"}`);
}
