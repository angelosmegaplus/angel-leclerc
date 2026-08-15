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
  liked?: boolean;
  rejected?: boolean;
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
  keywords: {
    suspense: 3,
    murder: 2.6,
    investigation: 2.4,
    supernatural: 2.3,
    serial_killer: 2.3,
    possession: 2.1,
    mystery: 2.1,
    crime: 2,
    survival: 1.8,
    twist: 1.8,
  },
  people: {},
  decades: { "2010s": 2, "2020s": 2.5 },
  formats: { movie: 4, tv: 1 },
};

function cloneProfile(profile: TasteProfile): TasteProfile {
  return {
    genres: { ...profile.genres },
    keywords: { ...profile.keywords },
    people: { ...profile.people },
    decades: { ...profile.decades },
    formats: { ...profile.formats },
  };
}

function completionWeight(completion: number) {
  if (completion >= 0.9) return 3;
  if (completion >= 0.5) return 1.5;
  if (completion >= 0.2) return 1;
  return 0.3;
}

function decadeFor(year: number) {
  return `${Math.floor(year / 10) * 10}s`;
}

export function buildTasteProfile(signals: ViewingSignal[]): TasteProfile {
  const profile = cloneProfile(BASE_PROFILE);
  for (const signal of signals) {
    if (signal.rejected) continue;
    let weight = completionWeight(signal.completion);
    if (signal.liked) weight *= 1.35;

    for (const id of signal.genreIds) profile.genres[id] = (profile.genres[id] || 0) + weight;
    for (const keyword of signal.keywords) profile.keywords[keyword] = (profile.keywords[keyword] || 0) + weight;
    for (const person of signal.people.slice(0, 5)) profile.people[person] = (profile.people[person] || 0) + weight;
    if (signal.director) profile.people[signal.director] = (profile.people[signal.director] || 0) + weight * 1.5;

    const decade = decadeFor(signal.year);
    profile.decades[decade] = (profile.decades[decade] || 0) + weight;
    profile.formats[signal.mediaType] += weight;
  }
  return profile;
}

function maxValue(values: number[]) {
  return Math.max(...values, 1);
}

export function scoreCandidate(candidate: RecommendationCandidate, profile: TasteProfile, nowYear = new Date().getFullYear()) {
  const maxGenre = maxValue(Object.values(profile.genres));
  const genreScore = candidate.genreIds.length
    ? Math.min(candidate.genreIds.reduce((sum, id) => sum + ((profile.genres[id] || 0) / maxGenre), 0) / candidate.genreIds.length, 1)
    : 0;

  const maxKeyword = maxValue(Object.values(profile.keywords));
  const keywordScore = candidate.keywords.length
    ? Math.min(candidate.keywords.reduce((sum, keyword) => sum + ((profile.keywords[keyword] || 0) / maxKeyword), 0) / candidate.keywords.length, 1)
    : 0;

  const maxPerson = maxValue(Object.values(profile.people));
  const relevantPeople = [...candidate.people.slice(0, 5), ...(candidate.director ? [candidate.director] : [])];
  const peopleScore = relevantPeople.length
    ? Math.min(relevantPeople.reduce((sum, person) => sum + ((profile.people[person] || 0) / maxPerson), 0) / Math.min(relevantPeople.length, 3), 1)
    : 0;

  const popularityNorm = Math.min(Math.log10(Math.max(candidate.popularity, 0) + 1) / 3, 1);
  const recencyScore = Math.max(1 - ((nowYear - candidate.year) / 30), 0);
  const totalFormat = profile.formats.movie + profile.formats.tv || 1;
  const formatMatch = profile.formats[candidate.mediaType] / totalFormat;

  return (genreScore * 0.35) +
    (keywordScore * 0.25) +
    (peopleScore * 0.15) +
    (popularityNorm * 0.10) +
    (recencyScore * 0.10) +
    (formatMatch * 0.05);
}

export function selectDailyRecommendations(candidates: RecommendationCandidate[], signals: ViewingSignal[]) {
  const excluded = new Set(signals.filter((signal) => signal.rejected || signal.completion >= 0.9).map((signal) => signal.candidateId));
  const profile = buildTasteProfile(signals);
  const ranked = candidates
    .filter((candidate) => !excluded.has(candidate.id))
    .map((candidate) => ({ candidate, score: scoreCandidate(candidate, profile) }))
    .sort((a, b) => b.score - a.score);

  const movies = ranked.filter((item) => item.candidate.mediaType === "movie").slice(0, 3);
  const series = ranked.filter((item) => item.candidate.mediaType === "tv").slice(0, 1);
  return [...movies, ...series];
}
