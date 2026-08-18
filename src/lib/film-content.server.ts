import { getTmdbCredential } from "./runtime-credentials.server";

const BASE = "https://api.themoviedb.org/3";
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_LANGUAGE = "fr-FR";
const CACHE_TTL_MS = 10 * 60 * 1000;

type CacheEntry = { expiresAt: number; value: unknown };
const cache = new Map<string, CacheEntry>();

export type FilmMediaType = "movie" | "tv";

export type ContentSearchParams = {
  q?: string;
  type?: "multi" | FilmMediaType;
  page?: number;
  with_genres?: string;
  sort_by?: string;
  vote_average_gte?: number;
  year_gte?: string;
  year_lte?: string;
};

export type ContentDiscoverParams = {
  with_genres?: string;
  sort_by?: string;
  page?: number;
  vote_average_gte?: number;
  vote_count_gte?: number;
  year_gte?: string;
  year_lte?: string;
  include_adult?: boolean;
};

function cacheKey(path: string, params: Record<string, string>) {
  return `${path}?${Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("&")}`;
}

function readCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function writeCache<T>(key: string, value: T, ttlMs = CACHE_TTL_MS) {
  cache.set(key, { expiresAt: Date.now() + ttlMs, value });
  if (cache.size > 250) {
    const first = cache.keys().next().value as string | undefined;
    if (first) cache.delete(first);
  }
}

async function request<T>(path: string, params: Record<string, string> = {}, options?: { cacheMs?: number; noCache?: boolean }): Promise<T> {
  const credential = await getTmdbCredential();
  if (!credential) throw new Error("TMDB_CREDENTIAL_MISSING");

  const normalized = { language: DEFAULT_LANGUAGE, ...params };
  const key = cacheKey(path, normalized);
  if (!options?.noCache) {
    const cached = readCache<T>(key);
    if (cached) return cached;
  }

  const url = new URL(BASE + path);
  for (const [name, value] of Object.entries(normalized)) url.searchParams.set(name, value);
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
    if (!response.ok) throw new Error(`TMDB_REQUEST_FAILED_${response.status}`);
    const data = await response.json() as T;
    if (!options?.noCache) writeCache(key, data, options?.cacheMs);
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("TMDB_TIMEOUT");
    throw error instanceof Error ? error : new Error("TMDB_UNKNOWN_ERROR");
  } finally {
    clearTimeout(timer);
  }
}

function numberParam(value: number | undefined) {
  return value == null || Number.isNaN(value) ? undefined : String(value);
}

function cleanParams(input: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(input).filter((entry): entry is [string, string] => Boolean(entry[1])));
}

export const filmContent = {
  health: () => request<{ images?: unknown }>("/configuration", {}, { noCache: true }),

  home: async () => {
    const [trendingMovies, trendingTV, popularMovies, popularTV] = await Promise.all([
      request("/trending/movie/week", { page: "1" }),
      request("/trending/tv/week", { page: "1" }),
      request("/movie/popular", { page: "1" }),
      request("/tv/popular", { page: "1" }),
    ]);
    return { trendingMovies, trendingTV, popularMovies, popularTV };
  },

  movies: () => request("/movie/popular", { page: "1" }),
  tv: () => request("/tv/popular", { page: "1" }),

  movieDetails: (id: number | string) => request(`/movie/${id}`, { append_to_response: "credits,videos,images,recommendations,similar,watch/providers" }),
  tvDetails: (id: number | string) => request(`/tv/${id}`, { append_to_response: "credits,videos,images,recommendations,similar,watch/providers" }),
  season: (id: number | string, season: number) => request(`/tv/${id}/season/${season}`),
  episode: (id: number | string, season: number, episode: number) => request(`/tv/${id}/season/${season}/episode/${episode}`),

  search: (params: ContentSearchParams) => {
    const type = params.type ?? "multi";
    const path = type === "multi" ? "/search/multi" : `/search/${type}`;
    return request(path, cleanParams({
      query: params.q?.trim(),
      page: numberParam(params.page ?? 1),
      include_adult: "false",
    }));
  },

  discover: (mediaType: FilmMediaType, params: ContentDiscoverParams = {}) => request(`/discover/${mediaType}`, cleanParams({
    page: numberParam(params.page ?? 1),
    with_genres: params.with_genres,
    sort_by: params.sort_by ?? "popularity.desc",
    "vote_average.gte": numberParam(params.vote_average_gte),
    "vote_count.gte": numberParam(params.vote_count_gte),
    "primary_release_date.gte": mediaType === "movie" ? params.year_gte : undefined,
    "primary_release_date.lte": mediaType === "movie" ? params.year_lte : undefined,
    "first_air_date.gte": mediaType === "tv" ? params.year_gte : undefined,
    "first_air_date.lte": mediaType === "tv" ? params.year_lte : undefined,
    include_adult: String(params.include_adult ?? false),
  })),

  trending: (mediaType: FilmMediaType | "all", timeWindow: "day" | "week" = "week", page = 1) => request(`/trending/${mediaType}/${timeWindow}`, { page: String(page) }),
  recommendations: (mediaType: FilmMediaType, id: number | string, page = 1) => request(`/${mediaType}/${id}/recommendations`, { page: String(page) }),
  similar: (mediaType: FilmMediaType, id: number | string, page = 1) => request(`/${mediaType}/${id}/similar`, { page: String(page) }),
  genres: (mediaType: FilmMediaType) => request(`/genre/${mediaType}/list`),
};

export function tmdbImage(path: string | null | undefined, size: "w342" | "w500" | "w780" | "w1280" | "original" = "w500") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;
}
