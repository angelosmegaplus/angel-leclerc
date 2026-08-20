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
  genres: { 27: 2.6, 53: 2.5, 80: 2.1, 9648: 1.9, 28: 1.3, 99: 0.65 },
  keywords: { suspense: 2.5, murder: 2.2, investigation: 2.1, supernatural: 2, serial_killer: 2, possession: 1.8, mystery: 1.9, crime: 1.8, survival: 1.6, twist: 1.6 },
  people: {},
  decades: { "2010s": 1.6, "2020s": 2 },
  formats: { movie: 3.2, tv: 1.2 },
};

function cloneProfile(profile: TasteProfile): TasteProfile {
  return { genres: { ...profile.genres }, keywords: { ...profile.keywords }, people: { ...profile.people }, decades: { ...profile.decades }, formats: { ...profile.formats } };
}
function completionWeight(completion: number) { if (completion >= 0.9) return 3; if (completion >= 0.5) return 1.5; if (completion >= 0.2) return 1; return 0.3; }
function decadeFor(year: number) { return `${Math.floor(year / 10) * 10}s`; }
function clampWeight(value: number) { return Math.max(-12, Math.min(24, value)); }

function freshnessMultiplier(updatedAt?: number) {
  if (!updatedAt) return 1;
  const ageDays = Math.max(0, (Date.now() - updatedAt) / 86_400_000);
  if (ageDays <= 1) return 1.45;
  if (ageDays <= 7) return 1.3;
  if (ageDays <= 30) return 1.15;
  if (ageDays <= 120) return 1.05;
  return 1;
}

function signalWeight(signal: ViewingSignal) {
  let weight = completionWeight(signal.completion);
  if (signal.seen) weight += 0.65;
  if (signal.liked === true) weight += 2.8;
  if (signal.liked === false || signal.rejected) weight -= 4.2;
  if (signal.rating != null) weight += (Math.max(0, Math.min(5, signal.rating)) - 2.5) * 1.45;
  if (signal.styleFit === "yes") weight += 1.8;
  if (signal.styleFit === "mixed") weight += 0.1;
  if (signal.styleFit === "no") weight -= 2.6;
  return weight * freshnessMultiplier(signal.updatedAt);
}

export function buildTasteProfile(signals: ViewingSignal[]): TasteProfile {
  const profile = cloneProfile(BASE_PROFILE);
  const ordered = [...signals].sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));
  for (const signal of ordered) {
    const weight = signalWeight(signal);
    for (const id of signal.genreIds) profile.genres[id] = clampWeight((profile.genres[id] || 0) + weight);
    for (const keyword of signal.keywords) profile.keywords[keyword] = clampWeight((profile.keywords[keyword] || 0) + weight);
    for (const person of signal.people.slice(0, 5)) profile.people[person] = clampWeight((profile.people[person] || 0) + weight * 0.85);
    if (signal.director) profile.people[signal.director] = clampWeight((profile.people[signal.director] || 0) + weight * 1.2);
    const decade = decadeFor(signal.year);
    profile.decades[decade] = clampWeight((profile.decades[decade] || 0) + weight * 0.85);
    profile.formats[signal.mediaType] = clampWeight(profile.formats[signal.mediaType] + weight * 0.8);
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

  const raw = (genreScore * 0.38)
    + (keywordScore * 0.20)
    + (peopleScore * 0.12)
    + (decadeScore * 0.07)
    + (communityRating * 0.10)
    + (popularityNorm * 0.05)
    + (recencyScore * 0.04)
    + (formatMatch * 0.04);
  return Math.max(0, Math.min(1, (raw + 1) / 2));
}

function tasteSeed(signals: ViewingSignal[]) {
  let h = 2166136261;
  const meaningful = [...signals]
    .filter((signal) => signal.seen || signal.liked != null || signal.rating != null || signal.styleFit != null)
    .sort((a, b) => a.candidateId.localeCompare(b.candidateId));
  for (const signal of meaningful) {
    const token = `${signal.candidateId}:${signal.liked}:${signal.rejected}:${signal.seen}:${signal.rating}:${signal.styleFit}:${Math.floor((signal.updatedAt || 0) / 60_000)}`;
    for (let i = 0; i < token.length; i += 1) h = Math.imul(h ^ token.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function adaptiveJitter(id: string, seed: number) {
  let h = seed || 1;
  for (let i = 0; i < id.length; i += 1) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

function similarityPenalty(candidate: RecommendationCandidate, negativeSignals: ViewingSignal[]) {
  if (!negativeSignals.length) return 0;
  let worst = 0;
  for (const signal of negativeSignals.slice(-20)) {
    const sharedGenres = candidate.genreIds.filter((id) => signal.genreIds.includes(id)).length;
    const genreRatio = sharedGenres / Math.max(candidate.genreIds.length, signal.genreIds.length, 1);
    const sameFormat = candidate.mediaType === signal.mediaType ? 0.15 : 0;
    worst = Math.max(worst, genreRatio * 0.22 + sameFormat);
  }
  return Math.min(worst, 0.3);
}

export function selectDailyRecommendations(candidates: RecommendationCandidate[], signals: ViewingSignal[], limit = 12) {
  const seen = new Set(signals.filter((signal) => signal.seen || signal.completion >= 0.9).map((signal) => signal.candidateId));
  const rejected = new Set(signals.filter((signal) => signal.rejected || signal.liked === false).map((signal) => signal.candidateId));
  const negativeSignals = signals.filter((signal) => signal.rejected || signal.liked === false || signal.styleFit === "no");
  const profile = buildTasteProfile(signals);
  const seed = tasteSeed(signals);
  const ranked = candidates
    .filter((candidate) => !seen.has(candidate.id) && !rejected.has(candidate.id))
    .map((candidate) => {
      const base = scoreCandidate(candidate, profile);
      const dynamic = adaptiveJitter(candidate.id, seed) * 0.035;
      const penalty = similarityPenalty(candidate, negativeSignals);
      return { candidate, score: Math.max(0, Math.min(1, base + dynamic - penalty)) };
    })
    .sort((a, b) => b.score - a.score);

  const selected: typeof ranked = [];
  const primaryGenreCounts = new Map<number, number>();
  const formatCounts: Record<MediaKind, number> = { movie: 0, tv: 0 };

  for (const item of ranked) {
    if (selected.length >= limit) break;
    const primaryGenre = item.candidate.genreIds[0];
    const genreCount = primaryGenre ? (primaryGenreCounts.get(primaryGenre) || 0) : 0;
    const formatCount = formatCounts[item.candidate.mediaType];
    const formatCap = Math.max(3, Math.ceil(limit * 0.75));
    if (primaryGenre && genreCount >= Math.max(2, Math.ceil(limit / 4))) continue;
    if (formatCount >= formatCap) continue;
    selected.push(item);
    formatCounts[item.candidate.mediaType] += 1;
    if (primaryGenre) primaryGenreCounts.set(primaryGenre, genreCount + 1);
  }

  // Si le catalogue contient des documentaires bien classés, en injecter au moins un
  // dans une grande sélection afin que Films / Séries / Documentaires soient réellement représentés.
  if (limit >= 8 && !selected.some((item) => item.candidate.genreIds.includes(99))) {
    const documentary = ranked.find((item) => item.candidate.genreIds.includes(99));
    if (documentary) {
      if (selected.length >= limit) selected[selected.length - 1] = documentary;
      else selected.push(documentary);
    }
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
