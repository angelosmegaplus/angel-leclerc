import { getTmdbCredential } from "./vercel-connect-credentials.server";

const BASE = "https://api.themoviedb.org/3";

export async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const credential = await getTmdbCredential();
  if (!credential) throw new Error("TMDB_CREDENTIAL_MISSING");

  const url = new URL(BASE + path);
  if (!params.language) url.searchParams.set("language", "fr-FR");
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  if (credential.kind === "api-key") url.searchParams.set("api_key", credential.value);

  const response = await fetch(url.toString(), {
    headers: credential.kind === "bearer"
      ? { Authorization: `Bearer ${credential.value}`, Accept: "application/json" }
      : { Accept: "application/json" },
  });

  if (!response.ok) {
    console.error("[tmdb] request failed", { status: response.status, credentialSource: credential.source, path });
    throw new Error(`TMDB_REQUEST_FAILED_${response.status}`);
  }
  return await response.json() as T;
}
