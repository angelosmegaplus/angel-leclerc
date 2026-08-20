import { createServerFn } from "@tanstack/react-start";
import { filmContent, tmdbImage, type FilmMediaType } from "./film-content.server";
import type { RecommendationCandidate } from "./film-recommendations";

type RawMedia = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  popularity?: number;
  vote_average?: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
};

type Page = { results?: RawMedia[] };

export type LiveFilmCatalogResult = {
  items: RecommendationCandidate[];
  source: "tmdb" | "unavailable";
  diagnostic: string | null;
};

const GENRES: Record<number, string> = {
  12: "Aventure", 14: "Fantastique", 16: "Animation", 18: "Drame", 27: "Horreur", 28: "Action",
  35: "Comédie", 36: "Histoire", 37: "Western", 53: "Thriller", 80: "Crime", 99: "Documentaire",
  878: "Science-fiction", 9648: "Mystère", 10749: "Romance", 10751: "Famille", 10752: "Guerre",
  10759: "Action & aventure", 10765: "Science-fiction & fantastique",
};

function normalize(raw: RawMedia, mediaType: FilmMediaType): RecommendationCandidate | null {
  const title = (mediaType === "movie" ? raw.title : raw.name) || raw.title || raw.name;
  if (!title || !raw.id) return null;
  const date = mediaType === "movie" ? raw.release_date : raw.first_air_date;
  const year = Number((date ?? "").slice(0, 4)) || new Date().getFullYear();
  const genreIds = Array.isArray(raw.genre_ids) ? raw.genre_ids : [];
  return {
    id: `tmdb-${mediaType}-${raw.id}`,
    title,
    year,
    mediaType,
    genreIds,
    keywords: [],
    people: [],
    popularity: Number(raw.popularity) || 0,
    pitch: raw.overview?.trim() || "Synopsis non disponible en français.",
    genreLabel: genreIds.slice(0, 3).map((id) => GENRES[id]).filter(Boolean).join(" · ") || (mediaType === "movie" ? "Film" : "Série"),
    posterUrl: tmdbImage(raw.poster_path, "w500"),
    backdropUrl: tmdbImage(raw.backdrop_path, "w1280"),
    rating: Math.round((Number(raw.vote_average) || 0) * 10) / 10,
    originalTitle: (mediaType === "movie" ? raw.original_title : raw.original_name) || title,
  };
}

function dedupe(items: RecommendationCandidate[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function mediaTypeFor(raw: RawMedia, fallback: FilmMediaType): FilmMediaType {
  return raw.media_type === "tv" ? "tv" : raw.media_type === "movie" ? "movie" : fallback;
}

export const getLiveFilmCatalog = createServerFn({ method: "GET" })
  .validator((input: { query?: string; page?: number; mediaType?: "all" | FilmMediaType } | undefined) => ({
    query: String(input?.query ?? "").trim().slice(0, 100),
    page: Math.max(1, Math.min(5, Number(input?.page) || 1)),
    mediaType: input?.mediaType === "movie" || input?.mediaType === "tv" ? input.mediaType : "all" as const,
  }))
  .handler(async ({ data }): Promise<LiveFilmCatalogResult> => {
    try {
      if (data.query.length >= 2) {
        const response = await filmContent.search({ q: data.query, type: data.mediaType === "all" ? "multi" : data.mediaType, page: data.page }) as Page;
        const fallbackType: FilmMediaType = data.mediaType === "tv" ? "tv" : "movie";
        const items = (response.results ?? [])
          .filter((raw) => raw.media_type !== "person")
          .map((raw) => normalize(raw, mediaTypeFor(raw, fallbackType)))
          .filter((item): item is RecommendationCandidate => Boolean(item));
        return { items: dedupe(items).slice(0, 60), source: "tmdb", diagnostic: null };
      }

      const requests: Array<Promise<{ mediaType: FilmMediaType; page: Page }>> = [];
      if (data.mediaType !== "tv") {
        requests.push(Promise.resolve(filmContent.trending("movie", "week", data.page) as Promise<Page>).then((page) => ({ mediaType: "movie", page })));
        requests.push(Promise.resolve(filmContent.movies() as Promise<Page>).then((page) => ({ mediaType: "movie", page })));
        requests.push(Promise.resolve(filmContent.discover("movie", { page: data.page, with_genres: "27|53|80|9648", sort_by: "popularity.desc", vote_count_gte: 50 }) as Promise<Page>).then((page) => ({ mediaType: "movie", page })));
        requests.push(Promise.resolve(filmContent.discover("movie", { page: data.page, with_genres: "99", sort_by: "popularity.desc", vote_count_gte: 20 }) as Promise<Page>).then((page) => ({ mediaType: "movie", page })));
        requests.push(Promise.resolve(filmContent.discover("movie", { page: Math.min(5, data.page + 1), sort_by: "vote_average.desc", vote_count_gte: 250 }) as Promise<Page>).then((page) => ({ mediaType: "movie", page })));
      }
      if (data.mediaType !== "movie") {
        requests.push(Promise.resolve(filmContent.trending("tv", "week", data.page) as Promise<Page>).then((page) => ({ mediaType: "tv", page })));
        requests.push(Promise.resolve(filmContent.tv() as Promise<Page>).then((page) => ({ mediaType: "tv", page })));
        requests.push(Promise.resolve(filmContent.discover("tv", { page: data.page, with_genres: "99", sort_by: "popularity.desc", vote_count_gte: 10 }) as Promise<Page>).then((page) => ({ mediaType: "tv", page })));
        requests.push(Promise.resolve(filmContent.discover("tv", { page: Math.min(5, data.page + 1), sort_by: "vote_average.desc", vote_count_gte: 100 }) as Promise<Page>).then((page) => ({ mediaType: "tv", page })));
      }

      const settled = await Promise.allSettled(requests);
      const fulfilled = settled.filter((entry): entry is PromiseFulfilledResult<{ mediaType: FilmMediaType; page: Page }> => entry.status === "fulfilled");
      const items = dedupe(fulfilled.flatMap((entry) =>
        (entry.value.page.results ?? [])
          .map((raw) => normalize(raw, entry.value.mediaType))
          .filter((item): item is RecommendationCandidate => Boolean(item)),
      )).slice(0, 180);

      if (fulfilled.length > 0) return { items, source: "tmdb", diagnostic: null };

      const failure = settled.find((entry): entry is PromiseRejectedResult => entry.status === "rejected");
      return {
        items: [],
        source: "unavailable",
        diagnostic: failure ? (failure.reason instanceof Error ? failure.reason.message : String(failure.reason)) : "TMDB_NO_RESPONSE",
      };
    } catch (error) {
      return {
        items: [],
        source: "unavailable",
        diagnostic: error instanceof Error ? error.message : "TMDB_UNKNOWN_ERROR",
      };
    }
  });
