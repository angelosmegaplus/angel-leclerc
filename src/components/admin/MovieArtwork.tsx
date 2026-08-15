import { useEffect, useState } from "react";
import type { RecommendationCandidate } from "@/lib/film-recommendations";

const CACHE_KEY = "angel-os-movie-art-v1";

function readCache(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}"); } catch { return {}; }
}

function writeCache(cache: Record<string, string>) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* optional cache */ }
}

async function wikipediaArtwork(candidate: RecommendationCandidate) {
  const cache = readCache();
  if (cache[candidate.id]) return cache[candidate.id];

  const type = candidate.mediaType === "tv" ? "TV series" : "film";
  const query = `${candidate.title} ${candidate.year} ${type}`;
  const endpoint = new URL("https://en.wikipedia.org/w/api.php");
  endpoint.searchParams.set("action", "query");
  endpoint.searchParams.set("generator", "search");
  endpoint.searchParams.set("gsrsearch", query);
  endpoint.searchParams.set("gsrlimit", "3");
  endpoint.searchParams.set("prop", "pageimages");
  endpoint.searchParams.set("piprop", "thumbnail");
  endpoint.searchParams.set("pithumbsize", "700");
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
  cache[candidate.id] = source;
  writeCache(cache);
  return source;
}

export function useMovieArtwork(candidate: RecommendationCandidate) {
  const [src, setSrc] = useState(candidate.posterUrl ?? "");

  useEffect(() => {
    let cancelled = false;
    setSrc(candidate.posterUrl ?? "");
    if (candidate.posterUrl) return () => { cancelled = true; };
    void wikipediaArtwork(candidate).then((value) => { if (!cancelled && value) setSrc(value); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [candidate.id, candidate.posterUrl, candidate.title, candidate.year, candidate.mediaType]);

  return src;
}

export function MoviePoster({ candidate, className, eager = false }: { candidate: RecommendationCandidate; className?: string; eager?: boolean }) {
  const src = useMovieArtwork(candidate);
  return src ? <img src={src} alt={`Affiche de ${candidate.title}`} loading={eager ? "eager" : "lazy"} className={className} referrerPolicy="no-referrer" /> : <div className={`grid place-items-center bg-gradient-to-br from-[#181b22] via-[#0f1116] to-black p-4 text-center ${className ?? ""}`}><div><p className="text-xs uppercase tracking-[.18em] text-white/30">{candidate.mediaType === "movie" ? "Film" : "Série"}</p><p className="mt-3 text-lg font-semibold text-white/80">{candidate.title}</p><p className="mt-1 text-xs text-white/35">{candidate.year}</p></div></div>;
}
