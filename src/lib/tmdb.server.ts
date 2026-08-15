const BASE = "https://api.themoviedb.org/3";

export async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = process.env["TMDB_API_KEY"] || process.env["VITE_TMDB_API_KEY"];
  if (!key) throw new Error("TMDB_API_KEY_MISSING");

  const url = new URL(BASE + path);
  if (!params.language) url.searchParams.set("language", "fr-FR");
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  const isBearer = key.length > 60;
  if (!isBearer) url.searchParams.set("api_key", key);

  const response = await fetch(url.toString(), {
    headers: isBearer ? { Authorization: `Bearer ${key}`, Accept: "application/json" } : { Accept: "application/json" },
  });

  if (!response.ok) throw new Error(`TMDB_REQUEST_FAILED_${response.status}`);
  return await response.json() as T;
}
