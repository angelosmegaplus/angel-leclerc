export type MediaKind = "movie" | "tv";

export type RecommendationCandidate = {
  id: string;
  title: string;
  year: number;
  mediaType: MediaKind;
  genreIds: number[];
  keywords: string[];
  people: string[];
  director?: string;
  popularity: number;
  pitch: string;
  genreLabel: string;
  posterUrl?: string;
  backdropUrl?: string;
  runtime?: string;
  rating?: number;
  certification?: string;
  originalTitle?: string;
};

export type ViewingSignal = {
  candidateId: string;
  mediaType: MediaKind;
  genreIds: number[];
  keywords: string[];
  people: string[];
  director?: string;
  year: number;
  completion: number;
  seen?: boolean;
  liked?: boolean;
  rejected?: boolean;
  rating?: number;
  styleFit?: "yes" | "mixed" | "no";
  updatedAt?: number;
};

export type TasteProfile = {
  genres: Record<number, number>;
  keywords: Record<string, number>;
  people: Record<string, number>;
  decades: Record<string, number>;
  formats: Record<MediaKind, number>;
};

const BASE_PROFILE: TasteProfile = {
  genres: { 27: 3.2, 53: 3, 80: 2.6, 9648: 2.2, 28: 1.4 },
  keywords: { suspense: 3, murder: 2.6, investigation: 2.4, supernatural: 2.3, serial_killer: 2.3, possession: 2.1, mystery: 2.1, crime: 2, survival: 1.8, twist: 1.8 },
  people: {},
  decades: { "2010s": 2, "2020s": 2.5 },
  formats: { movie: 4, tv: 1 },
};

function cloneProfile(profile: TasteProfile): TasteProfile {
  return { genres: { ...profile.genres }, keywords: { ...profile.keywords }, people: { ...profile.people }, decades: { ...profile.decades }, formats: { ...profile.formats } };
}
function completionWeight(completion: number) { if (completion >= 0.9) return 3; if (completion >= 0.5) return 1.5; if (completion >= 0.2) return 1; return 0.3; }
function decadeFor(year: number) { return `${Math.floor(year / 10) * 10}s`; }
function clampWeight(value: number) { return Math.max(-10, Math.min(20, value)); }

function signalWeight(signal: ViewingSignal) {
  let weight = completionWeight(signal.completion);
  if (signal.seen) weight += 0.5;
  if (signal.liked === true) weight += 2.25;
  if (signal.liked === false || signal.rejected) weight -= 3.25;
  if (signal.rating != null) weight += (Math.max(0, Math.min(5, signal.rating)) - 2.5) * 1.25;
  if (signal.styleFit === "yes") weight += 1.5;
  if (signal.styleFit === "mixed") weight += 0.15;
  if (signal.styleFit === "no") weight -= 2;
  return weight;
}

export function buildTasteProfile(signals: ViewingSignal[]): TasteProfile {
  const profile = cloneProfile(BASE_PROFILE);
  for (const signal of signals) {
    const weight = signalWeight(signal);
    for (const id of signal.genreIds) profile.genres[id] = clampWeight((profile.genres[id] || 0) + weight);
    for (const keyword of signal.keywords) profile.keywords[keyword] = clampWeight((profile.keywords[keyword] || 0) + weight);
    for (const person of signal.people.slice(0, 5)) profile.people[person] = clampWeight((profile.people[person] || 0) + weight * 0.8);
    if (signal.director) profile.people[signal.director] = clampWeight((profile.people[signal.director] || 0) + weight * 1.15);
    const decade = decadeFor(signal.year);
    profile.decades[decade] = clampWeight((profile.decades[decade] || 0) + weight * 0.8);
    profile.formats[signal.mediaType] = clampWeight(profile.formats[signal.mediaType] + weight * 0.75);
  }
  return profile;
}

function positiveMax(values: number[]) { return Math.max(...values.map((value) => Math.max(value, 0)), 1); }
function normalizedPreference(value: number | undefined, max: number) { return Math.max(-1, Math.min(1, (value || 0) / max)); }

export function scoreCandidate(candidate: RecommendationCandidate, profile: TasteProfile, nowYear = new Date().getFullYear()) {
  const maxGenre = positiveMax(Object.values(profile.genres));
  const genreScore = candidate.genreIds.length ? candidate.genreIds.reduce((sum, id) => sum + normalizedPreference(profile.genres[id], maxGenre), 0) / candidate.genreIds.length : 0;
  const maxKeyword = positiveMax(Object.values(profile.keywords));
  const keywordScore = candidate.keywords.length ? candidate.keywords.reduce((sum, keyword) => sum + normalizedPreference(profile.keywords[keyword], maxKeyword), 0) / candidate.keywords.length : 0;
  const maxPerson = positiveMax(Object.values(profile.people));
  const relevantPeople = [...candidate.people.slice(0, 5), ...(candidate.director ? [candidate.director] : [])];
  const peopleScore = relevantPeople.length ? relevantPeople.reduce((sum, person) => sum + normalizedPreference(profile.people[person], maxPerson), 0) / Math.min(relevantPeople.length, 3) : 0;
  const decadeScore = normalizedPreference(profile.decades[decadeFor(candidate.year)], positiveMax(Object.values(profile.decades)));
  const popularityNorm = Math.min(Math.log10(Math.max(candidate.popularity, 0) + 1) / 3, 1);
  const communityRating = Math.min(Math.max((candidate.rating || 0) / 10, 0), 1);
  const recencyScore = Math.max(1 - ((nowYear - candidate.year) / 35), 0);
  const totalFormat = Math.max(Math.abs(profile.formats.movie) + Math.abs(profile.formats.tv), 1);
  const formatMatch = profile.formats[candidate.mediaType] / totalFormat;

  const raw = (genreScore * 0.34)
    + (keywordScore * 0.20)
    + (peopleScore * 0.13)
    + (decadeScore * 0.08)
    + (communityRating * 0.09)
    + (popularityNorm * 0.07)
    + (recencyScore * 0.05)
    + (formatMatch * 0.04);
  return Math.max(0, Math.min(1, (raw + 1) / 2));
}

function daySeed() { const now = new Date(); return Number(`${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`); }
function stableDailyJitter(id: string) { let h = daySeed(); for (let i = 0; i < id.length; i += 1) h = Math.imul(h ^ id.charCodeAt(i), 16777619); return ((h >>> 0) % 1000) / 1000; }

export function selectDailyRecommendations(candidates: RecommendationCandidate[], signals: ViewingSignal[], limit = 12) {
  const seen = new Set(signals.filter((signal) => signal.seen || signal.completion >= 0.9).map((signal) => signal.candidateId));
  const rejected = new Set(signals.filter((signal) => signal.rejected || signal.liked === false).map((signal) => signal.candidateId));
  const profile = buildTasteProfile(signals);
  const ranked = candidates
    .filter((candidate) => !seen.has(candidate.id) && !rejected.has(candidate.id))
    .map((candidate) => {
      const base = scoreCandidate(candidate, profile);
      return { candidate, score: Math.min(1, base + stableDailyJitter(candidate.id) * 0.018) };
    })
    .sort((a, b) => b.score - a.score);

  const selected: typeof ranked = [];
  const primaryGenreCounts = new Map<number, number>();
  for (const item of ranked) {
    if (selected.length >= limit) break;
    const primaryGenre = item.candidate.genreIds[0];
    const count = primaryGenre ? (primaryGenreCounts.get(primaryGenre) || 0) : 0;
    if (primaryGenre && count >= Math.max(2, Math.ceil(limit / 4))) continue;
    selected.push(item);
    if (primaryGenre) primaryGenreCounts.set(primaryGenre, count + 1);
  }
  if (selected.length < limit) {
    for (const item of ranked) {
      if (selected.length >= limit) break;
      if (!selected.some((picked) => picked.candidate.id === item.candidate.id)) selected.push(item);
    }
  }
  return selected.slice(0, limit);
}

export function confidenceFor(signals: ViewingSignal[]) {
  const meaningful = signals.filter((signal) => signal.seen || signal.liked != null || signal.rating != null || signal.styleFit != null).length;
  if (meaningful >= 30) return { level: "très élevée", percent: 96 };
  if (meaningful >= 15) return { level: "élevée", percent: 88 };
  if (meaningful >= 7) return { level: "bonne", percent: 74 };
  if (meaningful >= 3) return { level: "en apprentissage", percent: 55 };
  return { level: "démarrage", percent: 35 };
}
