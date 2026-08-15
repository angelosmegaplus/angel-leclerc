import { createServerFn } from "@tanstack/react-start";

export type FilmLookupInput = { id: string; title: string; year: number; mediaType: "movie" | "tv" };
export type FilmMeta = { catalogId: string; tmdbId: number; mediaType: "movie" | "tv"; poster: string | null; backdrop: string | null; logo: string | null; overview: string; rating: number; year: string };
export type Provider = { id: number; name: string; logo: string | null };
export type FilmDetail = FilmMeta & {
  title: string;
  tagline: string;
  runtime: string;
  genres: string[];
  cast: { id: number; name: string; character: string; photo: string | null }[];
  trailerKey: string | null;
  providers: { link: string | null; flatrate: Provider[]; rent: Provider[]; buy: Provider[] };
  similar: { id: number; mediaType: "movie" | "tv"; title: string; poster: string | null; backdrop: string | null; overview: string; rating: number; year: string }[];
};

type SearchResult = { id: number; title?: string; name?: string; poster_path: string | null; backdrop_path: string | null; overview?: string; vote_average?: number; release_date?: string; first_air_date?: string };
type ImageAsset = { file_path?: string | null; iso_639_1?: string | null; vote_average?: number };
type ImagesPayload = { posters?: ImageAsset[]; backdrops?: ImageAsset[]; logos?: ImageAsset[] };

function slim(raw: SearchResult, mediaType: "movie" | "tv") {
  const date = raw.release_date || raw.first_air_date || "";
  return { id: raw.id, mediaType, title: raw.title || raw.name || "Sans titre", poster: raw.poster_path, backdrop: raw.backdrop_path, overview: raw.overview ?? "", rating: Math.round((raw.vote_average ?? 0) * 10) / 10, year: date.slice(0, 4) };
}

async function resolve(input: FilmLookupInput) {
  const { tmdb } = await import("./tmdb.server");
  const params: Record<string, string> = { query: input.title, include_adult: "false" };
  if (input.mediaType === "movie") params.year = String(input.year);
  else params.first_air_date_year = String(input.year);
  const result = await tmdb<{ results: SearchResult[] }>(`/search/${input.mediaType}`, params);
  return result.results[0] ?? null;
}

function bestLocalizedAsset(items: ImageAsset[] | undefined, preferred: string[], fallback?: string | null) {
  const valid = (items ?? []).filter((item) => item.file_path);
  for (const language of preferred) {
    const matching = valid
      .filter((item) => item.iso_639_1 === language)
      .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
    if (matching[0]?.file_path) return matching[0].file_path;
  }
  return valid.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))[0]?.file_path ?? fallback ?? null;
}

async function artwork(tmdbId: number, mediaType: "movie" | "tv", fallbackPoster: string | null, fallbackBackdrop: string | null) {
  const { tmdb } = await import("./tmdb.server");
  try {
    const images = await tmdb<ImagesPayload>(`/${mediaType}/${tmdbId}/images`, { include_image_language: "fr,en,null" });
    return {
      poster: bestLocalizedAsset(images.posters, ["fr", "en", null as unknown as string], fallbackPoster),
      backdrop: bestLocalizedAsset(images.backdrops, [null as unknown as string, "fr", "en"], fallbackBackdrop),
      logo: bestLocalizedAsset(images.logos, ["fr", "en", null as unknown as string], null),
    };
  } catch {
    return { poster: fallbackPoster, backdrop: fallbackBackdrop, logo: null };
  }
}

export const getFilmCatalogMetadata = createServerFn({ method: "GET" })
  .inputValidator((data: { items: FilmLookupInput[] }) => ({ items: (data.items ?? []).slice(0, 20).map((item) => ({ id: String(item.id), title: String(item.title).slice(0, 160), year: Number(item.year), mediaType: item.mediaType === "tv" ? "tv" as const : "movie" as const })) }))
  .handler(async ({ data }): Promise<FilmMeta[]> => {
    if (!(process.env["TMDB_API_KEY"] || process.env["VITE_TMDB_API_KEY"])) return [];
    const results = await Promise.all(data.items.map(async (item) => {
      try {
        const found = await resolve(item);
        if (!found) return null;
        const date = found.release_date || found.first_air_date || "";
        const art = await artwork(found.id, item.mediaType, found.poster_path, found.backdrop_path);
        return { catalogId: item.id, tmdbId: found.id, mediaType: item.mediaType, poster: art.poster, backdrop: art.backdrop, logo: art.logo, overview: found.overview ?? "", rating: Math.round((found.vote_average ?? 0) * 10) / 10, year: date.slice(0, 4) } satisfies FilmMeta;
      } catch { return null; }
    }));
    return results.filter((item): item is FilmMeta => Boolean(item));
  });

export const getFilmDetail = createServerFn({ method: "GET" })
  .inputValidator((data: FilmLookupInput) => ({ id: String(data.id), title: String(data.title).slice(0, 160), year: Number(data.year), mediaType: data.mediaType === "tv" ? "tv" as const : "movie" as const }))
  .handler(async ({ data }): Promise<FilmDetail | null> => {
    if (!(process.env["TMDB_API_KEY"] || process.env["VITE_TMDB_API_KEY"])) return null;
    const { tmdb } = await import("./tmdb.server");
    const found = await resolve(data);
    if (!found) return null;
    type Raw = SearchResult & { tagline?: string; runtime?: number; number_of_seasons?: number; genres?: { name: string }[]; credits?: { cast?: { id: number; name: string; character?: string; profile_path: string | null }[] }; videos?: { results?: { key: string; site: string; type: string }[] }; recommendations?: { results?: SearchResult[] }; "watch/providers"?: { results?: Record<string, { link?: string; flatrate?: { provider_id: number; provider_name: string; logo_path: string | null }[]; rent?: { provider_id: number; provider_name: string; logo_path: string | null }[]; buy?: { provider_id: number; provider_name: string; logo_path: string | null }[] }> } };
    const raw = await tmdb<Raw>(`/${data.mediaType}/${found.id}`, { append_to_response: "credits,videos,recommendations,watch/providers", include_video_language: "fr,en,null" });
    let videos = raw.videos?.results ?? [];
    if (!videos.some((video) => video.site === "YouTube" && video.type === "Trailer")) {
      const en = await tmdb<{ results?: { key: string; site: string; type: string }[] }>(`/${data.mediaType}/${found.id}/videos`, { language: "en-US" }).catch(() => ({ results: [] }));
      videos = [...videos, ...(en.results ?? [])];
    }
    const trailer = videos.find((video) => video.site === "YouTube" && video.type === "Trailer") ?? videos.find((video) => video.site === "YouTube");
    const fr = raw["watch/providers"]?.results?.FR ?? {};
    const map = (items?: { provider_id: number; provider_name: string; logo_path: string | null }[]) => (items ?? []).map((provider) => ({ id: provider.provider_id, name: provider.provider_name, logo: provider.logo_path }));
    const date = raw.release_date || raw.first_air_date || "";
    const runtime = raw.runtime ? `${Math.floor(raw.runtime / 60)} h ${raw.runtime % 60} min` : raw.number_of_seasons ? `${raw.number_of_seasons} saison${raw.number_of_seasons > 1 ? "s" : ""}` : "";
    const art = await artwork(raw.id, data.mediaType, raw.poster_path, raw.backdrop_path);
    return {
      catalogId: data.id,
      tmdbId: raw.id,
      mediaType: data.mediaType,
      title: raw.title || raw.name || data.title,
      tagline: raw.tagline ?? "",
      poster: art.poster,
      backdrop: art.backdrop,
      logo: art.logo,
      overview: raw.overview ?? "",
      rating: Math.round((raw.vote_average ?? 0) * 10) / 10,
      year: date.slice(0, 4),
      runtime,
      genres: (raw.genres ?? []).map((genre) => genre.name),
      cast: (raw.credits?.cast ?? []).slice(0, 12).map((person) => ({ id: person.id, name: person.name, character: person.character ?? "", photo: person.profile_path })),
      trailerKey: trailer?.key ?? null,
      providers: { link: fr.link ?? null, flatrate: map(fr.flatrate), rent: map(fr.rent), buy: map(fr.buy) },
      similar: (raw.recommendations?.results ?? []).slice(0, 12).map((item) => slim(item, data.mediaType)),
    };
  });

export function tmdbImage(path?: string | null, size = "w780") { return path ? `https://image.tmdb.org/t/p/${size}${path}` : null; }
