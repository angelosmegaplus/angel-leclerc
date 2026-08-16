import { createServerFn } from "@tanstack/react-start";

export type DirectTmdbDetail = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  originalTitle: string;
  overview: string;
  tagline: string;
  year: string;
  rating: number;
  runtime: string;
  poster: string | null;
  backdrop: string | null;
  genres: string[];
  trailerKey: string | null;
  cast: { id: number; name: string; character: string; photo: string | null }[];
  providers: { link: string | null; flatrate: { id: number; name: string; logo: string | null }[]; rent: { id: number; name: string; logo: string | null }[]; buy: { id: number; name: string; logo: string | null }[] };
};

type RawDetail = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  tagline?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  runtime?: number;
  number_of_seasons?: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: { name: string }[];
  credits?: { cast?: { id: number; name: string; character?: string; profile_path: string | null }[] };
  videos?: { results?: { key: string; site: string; type: string }[] };
  "watch/providers"?: { results?: Record<string, { link?: string; flatrate?: { provider_id: number; provider_name: string; logo_path: string | null }[]; rent?: { provider_id: number; provider_name: string; logo_path: string | null }[]; buy?: { provider_id: number; provider_name: string; logo_path: string | null }[] }> };
};

export const getDirectTmdbDetail = createServerFn({ method: "GET" })
  .validator((data: { tmdbId: string | number; mediaType: "movie" | "tv" }) => ({
    tmdbId: Math.max(1, Number(data.tmdbId) || 0),
    mediaType: data.mediaType === "tv" ? "tv" as const : "movie" as const,
  }))
  .handler(async ({ data }): Promise<DirectTmdbDetail | null> => {
    if (!data.tmdbId) return null;
    const { tmdb } = await import("./tmdb.server");
    const raw = await tmdb<RawDetail>(`/${data.mediaType}/${data.tmdbId}`, {
      append_to_response: "credits,videos,watch/providers",
      include_video_language: "fr,en,null",
    });

    let videos = raw.videos?.results ?? [];
    if (!videos.some((video) => video.site === "YouTube" && video.type === "Trailer")) {
      const en = await tmdb<{ results?: { key: string; site: string; type: string }[] }>(`/${data.mediaType}/${data.tmdbId}/videos`, { language: "en-US" }).catch(() => ({ results: [] }));
      videos = [...videos, ...(en.results ?? [])];
    }
    const trailer = videos.find((video) => video.site === "YouTube" && video.type === "Trailer") ?? videos.find((video) => video.site === "YouTube");
    const fr = raw["watch/providers"]?.results?.FR ?? {};
    const map = (items?: { provider_id: number; provider_name: string; logo_path: string | null }[]) => (items ?? []).map((provider) => ({ id: provider.provider_id, name: provider.provider_name, logo: provider.logo_path }));
    const date = raw.release_date || raw.first_air_date || "";
    const runtime = raw.runtime ? `${Math.floor(raw.runtime / 60)} h ${String(raw.runtime % 60).padStart(2, "0")} min` : raw.number_of_seasons ? `${raw.number_of_seasons} saison${raw.number_of_seasons > 1 ? "s" : ""}` : "";

    return {
      tmdbId: raw.id,
      mediaType: data.mediaType,
      title: raw.title || raw.name || "Sans titre",
      originalTitle: raw.original_title || raw.original_name || raw.title || raw.name || "Sans titre",
      overview: raw.overview ?? "",
      tagline: raw.tagline ?? "",
      year: date.slice(0, 4),
      rating: Math.round((raw.vote_average ?? 0) * 10) / 10,
      runtime,
      poster: raw.poster_path ?? null,
      backdrop: raw.backdrop_path ?? null,
      genres: (raw.genres ?? []).map((genre) => genre.name),
      trailerKey: trailer?.key ?? null,
      cast: (raw.credits?.cast ?? []).slice(0, 14).map((person) => ({ id: person.id, name: person.name, character: person.character ?? "", photo: person.profile_path })),
      providers: { link: fr.link ?? null, flatrate: map(fr.flatrate), rent: map(fr.rent), buy: map(fr.buy) },
    };
  });

export function directTmdbImage(path?: string | null, size = "w780") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}
