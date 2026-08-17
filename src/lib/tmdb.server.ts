import {
  getTmdbCredentials,
  markApiCredentialFailure,
  markApiCredentialHealthy,
} from "./vercel-connect-credentials.server";

const BASE = "https://api.themoviedb.org/3";
const REQUEST_TIMEOUT_MS = 3500;

export async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const credentials = await getTmdbCredentials();
  if (!credentials.length) throw new Error("TMDB_CREDENTIAL_MISSING");

  let lastError: Error | null = null;

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

      if (!response.ok) {
        const error = new Error(`TMDB_REQUEST_FAILED_${response.status}`);
        lastError = error;

        if ([401, 403, 408, 429].includes(response.status) || response.status >= 500) {
          markApiCredentialFailure(credential, response.status === 429 ? 120_000 : 60_000);
          continue;
        }

        throw error;
      }

      markApiCredentialHealthy(credential);
      return await response.json() as T;
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error("TMDB_UNKNOWN_ERROR");
      lastError = normalized;

      if (normalized.name === "AbortError") {
        markApiCredentialFailure(credential, 30_000);
        continue;
      }

      if (normalized.message.startsWith("TMDB_REQUEST_FAILED_")) throw normalized;

      markApiCredentialFailure(credential, 30_000);
      continue;
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastError?.name === "AbortError") throw new Error("TMDB_TIMEOUT");
  throw lastError ?? new Error("TMDB_ALL_CREDENTIALS_FAILED");
}
