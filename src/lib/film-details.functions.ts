import { createServerFn } from "@tanstack/react-start";
import { filmContent, tmdbImage, type FilmMediaType } from "./film-content.server";
import { getMovixOfficialSource } from "./movix-source.functions";

export type FilmWatchLink = {
  provider: "canal" | "netflix" | "movix" | "tmdb";
  label: string;
  url: string;
  available: boolean;
};

export type FilmDetails = {
  id: number;
  mediaType: FilmMediaType;
  title: string;
  originalTitle: string | null;
  overview: string;
  year: number | null;
  runtime: string | null;
  rating: number | null;
  genres: string[];
  posterUrl: string | null;
  backdropUrl: string | null;
  director: string | null;
  cast: string[];
  providers: string[];
  watchLinks: FilmWatchLink[];
};

type Provider = { provider_id?: number; provider_name?: string };
type RawDetails = {
  id?: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  vote_average?: number;
  genres?: Array<{ id?: number; name?: string }>;
  poster_path?: string | null;
  backdrop_path?: string | null;
  credits?: {
    cast?: Array<{ name?: string; order?: number }>;
    crew?: Array<{ name?: string; job?: string }>;
  };
  "watch/providers"?: {
    results?: Record<string, {
      link?: string;
      flatrate?: Provider[];
      rent?: Provider[];
      buy?: Provider[];
      ads?: Provider[];
      free?: Provider[];
    }>;
  };
};

function tmdbId(candidateId: string) {
  const match = candidateId.match(/^tmdb-(movie|tv)-(\d+)$/);
  if (!match) return null;
  return { mediaType: match[1] as FilmMediaType, id: Number(match[2]) };
}

function serviceSearch(provider: "canal" | "netflix", title: string) {
  const encoded = encodeURIComponent(title);
  return provider === "canal"
    ? `https://www.canalplus.com/recherche/${encoded}`
    : `https://www.netflix.com/search?q=${encoded}`;
}

function providerNames(details: RawDetails) {
  const region = details["watch/providers"]?.results?.FR;
  if (!region) return [];
  const all = [...(region.flatrate ?? []), ...(region.free ?? []), ...(region.ads ?? []), ...(region.rent ?? []), ...(region.buy ?? [])];
  return [...new Set(all.map((entry) => entry.provider_name?.trim()).filter((value): value is string => Boolean(value)))];
}

function hasProvider(names: string[], needles: string[]) {
  const haystack = names.join(" ").toLocaleLowerCase("fr");
  return needles.some((needle) => haystack.includes(needle));
}

export const getFilmDetails = createServerFn({ method: "GET" })
  .validator((input: { candidateId: string; fallbackTitle?: string }) => ({
    candidateId: String(input?.candidateId ?? "").slice(0, 100),
    fallbackTitle: String(input?.fallbackTitle ?? "").slice(0, 200),
  }))
  .handler(async ({ data }): Promise<FilmDetails | null> => {
    const parsed = tmdbId(data.candidateId);
    if (!parsed) return null;

    const raw = await (parsed.mediaType === "movie" ? filmContent.movieDetails(parsed.id) : filmContent.tvDetails(parsed.id)) as RawDetails;
    const title = raw.title || raw.name || data.fallbackTitle || "Sans titre";
    const originalTitle = raw.original_title || raw.original_name || null;
    const release = raw.release_date || raw.first_air_date || "";
    const year = Number(release.slice(0, 4)) || null;
    const runtimeMinutes = parsed.mediaType === "movie" ? raw.runtime : raw.episode_run_time?.[0];
    const names = providerNames(raw);
    const canal = hasProvider(names, ["canal+", "canal plus", "mycanal"]);
    const netflix = hasProvider(names, ["netflix"]);
    const tmdbProviderUrl = raw["watch/providers"]?.results?.FR?.link || `https://www.themoviedb.org/${parsed.mediaType}/${parsed.id}/watch`;

    let movixUrl = "https://movix.online/";
    try {
      const movix = await getMovixOfficialSource();
      const url = new URL(movix.url);
      url.pathname = "/search";
      url.searchParams.set("q", title);
      movixUrl = url.toString();
    } catch {
      movixUrl = `https://movix.online/search?q=${encodeURIComponent(title)}`;
    }

    const director = raw.credits?.crew?.find((person) => person.job === "Director")?.name ?? null;
    const cast = (raw.credits?.cast ?? [])
      .slice()
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      .map((person) => person.name)
      .filter((value): value is string => Boolean(value))
      .slice(0, 12);

    return {
      id: parsed.id,
      mediaType: parsed.mediaType,
      title,
      originalTitle,
      overview: raw.overview?.trim() || "Synopsis non disponible en français.",
      year,
      runtime: runtimeMinutes ? `${runtimeMinutes} min` : null,
      rating: Number.isFinite(raw.vote_average) ? Math.round(Number(raw.vote_average) * 10) / 10 : null,
      genres: (raw.genres ?? []).map((genre) => genre.name).filter((value): value is string => Boolean(value)),
      posterUrl: tmdbImage(raw.poster_path, "w500") ?? null,
      backdropUrl: tmdbImage(raw.backdrop_path, "w1280") ?? null,
      director,
      cast,
      providers: names,
      watchLinks: [
        { provider: "canal", label: "Voir sur CANAL+", url: serviceSearch("canal", title), available: canal },
        { provider: "netflix", label: "Voir sur Netflix", url: serviceSearch("netflix", title), available: netflix },
        { provider: "movix", label: "Regarder sur Movix", url: movixUrl, available: true },
        { provider: "tmdb", label: "Toutes les disponibilités", url: tmdbProviderUrl, available: true },
      ],
    };
  });
