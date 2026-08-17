import { useCallback, useEffect, useState } from "react";
import type { RecommendationCandidate } from "@/lib/film-recommendations";

const SOURCE_CACHE_KEY = "angel-os-movie-art-source-v2";
const BINARY_CACHE_NAME = "angel-os-movie-art-v2";

function readSourceCache(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(SOURCE_CACHE_KEY) ?? "{}"); } catch { return {}; }
}

function writeSourceCache(cache: Record<string, string>) {
  try { localStorage.setItem(SOURCE_CACHE_KEY, JSON.stringify(cache)); } catch { /* optional cache */ }
}

function binaryCacheKey(id: string) {
  return `${window.location.origin}/__angel_os_movie_art_cache__/${encodeURIComponent(id)}`;
}

async function readBinaryCache(id: string) {
  if (!("caches" in window)) return null;
  try {
    const cache = await caches.open(BINARY_CACHE_NAME);
    const response = await cache.match(binaryCacheKey(id));
    if (!response) return null;
    return URL.createObjectURL(await response.blob());
  } catch {
    return null;
  }
}

async function downloadAndCache(id: string, source: string) {
  try {
    const response = await fetch(source, { cache: "force-cache", mode: "cors" });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;
    if ("caches" in window) {
      const cache = await caches.open(BINARY_CACHE_NAME);
      await cache.put(binaryCacheKey(id), response.clone());
    }
    return URL.createObjectURL(await response.blob());
  } catch {
    return null;
  }
}

async function wikipediaArtwork(candidate: RecommendationCandidate) {
  const sourceCache = readSourceCache();
  if (sourceCache[candidate.id]) return sourceCache[candidate.id];

  const type = candidate.mediaType === "tv" ? "TV series" : "film";
  const query = `${candidate.title} ${candidate.year} ${type}`;
  const endpoint = new URL("https://en.wikipedia.org/w/api.php");
  endpoint.searchParams.set("action", "query");
  endpoint.searchParams.set("generator", "search");
  endpoint.searchParams.set("gsrsearch", query);
  endpoint.searchParams.set("gsrlimit", "3");
  endpoint.searchParams.set("prop", "pageimages");
  endpoint.searchParams.set("piprop", "thumbnail");
  endpoint.searchParams.set("pithumbsize", "900");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("origin", "*");

  const response = await fetch(endpoint.toString(), { cache: "force-cache" });
  if (!response.ok) return null;
  const payload = await response.json() as { query?: { pages?: Record<string, { title?: string; thumbnail?: { source?: string } }> } };
  const pages = Object.values(payload.query?.pages ?? {});
  const title = candidate.title.toLowerCase();
  const best = pages.find((page) => page.thumbnail?.source && page.title?.toLowerCase().includes(title)) ?? pages.find((page) => page.thumbnail?.source);
  const source = best?.thumbnail?.source;
  if (!source) return null;
  sourceCache[candidate.id] = source;
  writeSourceCache(sourceCache);
  return source;
}

async function resolveArtwork(candidate: RecommendationCandidate, skipCandidatePoster = false) {
  const cached = await readBinaryCache(candidate.id);
  if (cached) return cached;

  if (!skipCandidatePoster && candidate.posterUrl) {
    const localOrRemote = await downloadAndCache(candidate.id, candidate.posterUrl);
    if (localOrRemote) return localOrRemote;
  }

  const wikipedia = await wikipediaArtwork(candidate);
  if (!wikipedia) return "";
  return (await downloadAndCache(candidate.id, wikipedia)) || wikipedia;
}

export function useMovieArtwork(candidate: RecommendationCandidate) {
  const [src, setSrc] = useState("");

  const retryWithoutCandidatePoster = useCallback(() => {
    void resolveArtwork(candidate, true).then(setSrc).catch(() => setSrc(""));
  }, [candidate]);

  useEffect(() => {
    let cancelled = false;
    void resolveArtwork(candidate).then((value) => { if (!cancelled) setSrc(value); }).catch(() => { if (!cancelled) setSrc(""); });
    return () => { cancelled = true; };
  }, [candidate]);

  return { src, retryWithoutCandidatePoster };
}

export function MoviePoster({ candidate, className, eager = false }: { candidate: RecommendationCandidate; className?: string; eager?: boolean }) {
  const { src, retryWithoutCandidatePoster } = useMovieArtwork(candidate);
  return src ? <img src={src} alt={`Affiche de ${candidate.title}`} loading={eager ? "eager" : "lazy"} decoding="async" className={className} referrerPolicy="no-referrer" onError={retryWithoutCandidatePoster} /> : <div className={`grid place-items-center bg-gradient-to-br from-[#181b22] via-[#0f1116] to-black p-4 text-center ${className ?? ""}`}><div><p className="text-xs uppercase tracking-[.18em] text-white/30">{candidate.mediaType === "movie" ? "Film" : "Série"}</p><p className="mt-3 text-lg font-semibold text-white/80">{candidate.title}</p><p className="mt-1 text-xs text-white/35">{candidate.year}</p></div></div>;
}
