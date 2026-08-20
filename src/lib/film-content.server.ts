import { getTmdbCredential } from "./runtime-credentials.server";

const BASE = "https://api.themoviedb.org/3";
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_LANGUAGE = "fr-FR";
const CACHE_TTL_MS = 10 * 60 * 1000;
const STALE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_RETRIES = 2;

type CacheEntry = { expiresAt: number; staleUntil: number; value: unknown };
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

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
  return `${path}?${Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&")}`;
}

function readFreshCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) return null;
  return entry.value as T;
}

function readStaleCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.staleUntil < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function writeCache<T>(key: string, value: T, ttlMs = CACHE_TTL_MS) {
  cache.set(key, {
    expiresAt: Date.now() + ttlMs,
    staleUntil: Date.now() + Math.max(ttlMs, STALE_TTL_MS),
    value,
  });

  if (cache.size > 300) {
    const first = cache.keys().next().value as string | undefined;
    if (first) cache.delete(first);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryable(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function fetchTmdb<T>(url: URL, headers: Record<string, string>): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers,
      });

      if (response.ok) return await response.json() as T;

      const error = new Error(`TMDB_REQUEST_FAILED_${response.status}`);
      if (!retryable(response.status) || attempt === MAX_RETRIES) throw error;
      lastError = error;
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error("TMDB_UNKNOWN_ERROR");
      if (normalized.name === "AbortError") {
        lastError = new Error("TMDB_TIMEOUT");
      } else {
        lastError = normalized;
      }
      if (attempt === MAX_RETRIES) throw lastError;
    } finally {
      clearTimeout(timer);
    }

    await sleep(250 * 2 ** attempt);
  }

  throw lastError ?? new Error("TMDB_UNKNOWN_ERROR");
}

async function request<T>(
  path: string,
  params: Record<string, string> = {},
  options?: { cacheMs?: number; noCache?: boolean },
): Promise<T> {
  const normalized = { language: DEFAULT_LANGUAGE, ...params };
  const key = cacheKey(path, normalized);

  if (!options?.noCache) {
    const cached = readFreshCache<T>(key);
    if (cached) return cached;

    const pending = inFlight.get(key);
    if (pending) return pending as Promise<T>;
  }

  const work = (async () => {
    const credential = await getTmdbCredential();
    if (!credential) {
      const stale = !options?.noCache ? readStaleCache<T>(key) : null;
      if (stale) return stale;
      throw new Error("TMDB_CREDENTIAL_MISSING");
    }

    const url = new URL(BASE + path);
    for (const [name, value] of Object.entries(normalized)) url.searchParams.set(name, value);
    if (credential.kind === "api-key") url.searchParams.set("api_key", credential.value);

    const headers: Record<string, string> = credential.kind === "bearer"
      ? { Authorization: `Bearer ${credential.value}`, Accept: "application/json" }
      : { Accept: "application/json" };

    try {
      const data = await fetchTmdb<T>(url, headers);
      if (!options?.noCache) writeCache(key, data, options?.cacheMs);
      return data;
    } catch (error) {
      const stale = !options?.noCache ? readStaleCache<T>(key) : null;
      if (stale) return stale;
      throw error instanceof Error ? error : new Error("TMDB_UNKNOWN_ERROR");
    }
  })();

  if (!options?.noCache) inFlight.set(key, work);

  try {
    return await work;
  } finally {
    if (!options?.noCache) inFlight.delete(key);
  }
}

function numberParam(value: number | undefined) {
  return value == null || Number.isNaN(value) ? undefined : String(value);
}

function cleanParams(input: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(input).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
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

  movies: (page = 1) => request("/movie/popular", { page: String(page) }),
  tv: (page = 1) => request("/tv/popular", { page: String(page) }),

  movieDetails: (id: number | string) => request(`/movie/${id}`, {
    append_to_response: "credits,videos,images,recommendations,similar,watch/providers",
  }),
  tvDetails: (id: number | string) => request(`/tv/${id}`, {
    append_to_response: "credits,videos,images,recommendations,similar,watch/providers",
  }),
  season: (id: number | string, season: number) => request(`/tv/${id}/season/${season}`),
  episode: (id: number | string, season: number, episode: number) => request(`/tv/${id}/season/${season}/episode/${episode}`),

  search: (params: ContentSearchParams) => {
    const type = params.type ?? "multi";
    const path = type === "multi" ? "/search/multi" : `/search/${type}`;
    return request(path, cleanParams({
      query: params.q?.trim(),
      page: numberParam(params.page ?? 1),
      include_adult: "false",
    }), { cacheMs: 5 * 60 * 1000 });
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

  trending: (mediaType: FilmMediaType | "all", timeWindow: "day" | "week" = "week", page = 1) =>
    request(`/trending/${mediaType}/${timeWindow}`, { page: String(page) }),
  recommendations: (mediaType: FilmMediaType, id: number | string, page = 1) =>
    request(`/${mediaType}/${id}/recommendations`, { page: String(page) }),
  similar: (mediaType: FilmMediaType, id: number | string, page = 1) =>
    request(`/${mediaType}/${id}/similar`, { page: String(page) }),
  genres: (mediaType: FilmMediaType) => request(`/genre/${mediaType}/list`),
};

export function tmdbImage(
  path: string | null | undefined,
  size: "w342" | "w500" | "w780" | "w1280" | "original" = "w500",
) {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;
}
