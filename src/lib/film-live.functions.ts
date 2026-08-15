import { createServerFn } from "@tanstack/react-start";
import type { RecommendationCandidate } from "./film-recommendations";

type MediaType = "movie" | "tv";
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
  12: "Aventure",
  14: "Fantastique",
  16: "Animation",
  18: "Drame",
  27: "Horreur",
  28: "Action",
  35: "Comédie",
  36: "Histoire",
  37: "Western",
  53: "Thriller",
  80: "Crime",
  99: "Documentaire",
  878: "Science-fiction",
  9648: "Mystère",
  10749: "Romance",
  10751: "Famille",
  10752: "Guerre",
  10759: "Action & aventure",
  10765: "Science-fiction & fantastique",
};

function image(path: string | null | undefined, size: "w500" | "w780") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;
}

function normalize(raw: RawMedia, mediaType: MediaType): RecommendationCandidate | null {
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
    posterUrl: image(raw.poster_path, "w500"),
    backdropUrl: image(raw.backdrop_path, "w780"),
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

export const getLiveFilmCatalog = createServerFn({ method: "GET" })
  .validator((input: { query?: string; page?: number; mediaType?: "all" | MediaType } | undefined) => ({
    query: String(input?.query ?? "").trim().slice(0, 100),
    page: Math.max(1, Math.min(5, Number(input?.page) || 1)),
    mediaType: input?.mediaType === "movie" || input?.mediaType === "tv" ? input.mediaType : "all" as const,
  }))
  .handler(async ({ data }): Promise<LiveFilmCatalogResult> => {
    try {
      const { tmdb } = await import("./tmdb.server");
      const pages: Array<Promise<{ mediaType: MediaType; page: Page }>> = [];
      const common = { page: String(data.page), include_adult: "false" };

      if (data.query.length >= 2) {
        if (data.mediaType !== "tv") pages.push(tmdb<Page>("/search/movie", { ...common, query: data.query }).then((page) => ({ mediaType: "movie", page })));
        if (data.mediaType !== "movie") pages.push(tmdb<Page>("/search/tv", { ...common, query: data.query }).then((page) => ({ mediaType: "tv", page })));
      } else {
        if (data.mediaType !== "tv") {
          pages.push(tmdb<Page>("/trending/movie/week", { page: String(data.page) }).then((page) => ({ mediaType: "movie", page })));
          pages.push(tmdb<Page>("/movie/popular", { page: String(data.page) }).then((page) => ({ mediaType: "movie", page })));
          pages.push(tmdb<Page>("/discover/movie", { ...common, sort_by: "popularity.desc", with_genres: "27|53|80|9648" }).then((page) => ({ mediaType: "movie", page })));
        }
        if (data.mediaType !== "movie") {
          pages.push(tmdb<Page>("/trending/tv/week", { page: String(data.page) }).then((page) => ({ mediaType: "tv", page })));
          pages.push(tmdb<Page>("/tv/popular", { page: String(data.page) }).then((page) => ({ mediaType: "tv", page })));
        }
      }

      const settled = await Promise.allSettled(pages);
      const normalized = settled.flatMap((entry) => {
        if (entry.status !== "fulfilled") return [];
        return (entry.value.page.results ?? [])
          .map((raw) => normalize(raw, entry.value.mediaType))
          .filter((item): item is RecommendationCandidate => Boolean(item));
      });
      const items = dedupe(normalized).slice(0, data.query ? 40 : 100);
      if (!items.length) {
        const failure = settled.find((entry): entry is PromiseRejectedResult => entry.status === "rejected");
        const diagnostic = failure ? (failure.reason instanceof Error ? failure.reason.message : String(failure.reason)) : "TMDB_EMPTY_RESULT";
        return { items: [], source: "unavailable", diagnostic };
      }
      return { items, source: "tmdb", diagnostic: null };
    } catch (error) {
      return {
        items: [],
        source: "unavailable",
        diagnostic: error instanceof Error ? error.message : "TMDB_UNKNOWN_ERROR",
      };
    }
  });
