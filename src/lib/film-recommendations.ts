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
  negativeGenres: Record<number, number>;
  negativeKeywords: Record<string, number>;
  negativePeople: Record<string, number>;
  seenIds: Set<string>;
  likedIds: Set<string>;
  rejectedIds: Set<string>;
};

export type RankedRecommendation = {
  candidate: RecommendationCandidate;
  score: number;
  reasons: string[];
};

/*
 * Angel OS IA recommendation engine.
 * Architecture inspired by MovixOpenSource's personalized recommendation
 * pipeline (taste profile + completion weighting + TMDB-style signals), but
 * implemented independently for Angel's private profile and local catalogue.
 */
const BASE_PROFILE = {
  genres: { 27: 4.4, 53: 4.0, 80: 3.1, 9648: 2.8, 28: 1.6 } as Record<number, number>,
  keywords: {
    suspense: 4.0,
    murder: 3.4,
    investigation: 3.0,
    supernatural: 3.0,
    serial_killer: 3.0,
    possession: 2.8,
    mystery: 2.8,
    crime: 2.6,
    survival: 2.4,
    twist: 2.4,
    slasher: 2.4,
    gore: 2.0,
    curse: 2.0,
  } as Record<string, number>,
  people: {} as Record<string, number>,
  decades: { "2000s": 1.2, "2010s": 2.2, "2020s": 3.0 } as Record<string, number>,
  formats: { movie: 5.5, tv: 1.6 } as Record<MediaKind, number>,
};

function completionWeight(completion: number) {
  if (completion >= 0.9) return 3;
  if (completion >= 0.5) return 1.5;
  if (completion >= 0.2) return 1;
  return 0.3;
}

function decadeFor(year: number) {
  return `${Math.floor(year / 10) * 10}s`;
}

function add<K extends string | number>(target: Record<K, number>, key: K, value: number) {
  target[key] = (target[key] || 0) + value;
}

export function buildTasteProfile(signals: ViewingSignal[]): TasteProfile {
  const profile: TasteProfile = {
    genres: { ...BASE_PROFILE.genres },
    keywords: { ...BASE_PROFILE.keywords },
    people: { ...BASE_PROFILE.people },
    decades: { ...BASE_PROFILE.decades },
    formats: { ...BASE_PROFILE.formats },
    negativeGenres: {},
    negativeKeywords: {},
    negativePeople: {},
    seenIds: new Set<string>(),
    likedIds: new Set<string>(),
    rejectedIds: new Set<string>(),
  };

  for (const signal of signals) {
    const completed = Math.max(0, Math.min(signal.completion, 1));
    const weight = completionWeight(completed);

    if (completed >= 0.9) profile.seenIds.add(signal.candidateId);
    if (signal.liked) profile.likedIds.add(signal.candidateId);
    if (signal.rejected) profile.rejectedIds.add(signal.candidateId);

    if (signal.rejected || signal.liked === false) {
      const negativeWeight = weight * (signal.rejected ? 1.5 : 1.0);
      signal.genreIds.forEach((id) => add(profile.negativeGenres, id, negativeWeight));
      signal.keywords.forEach((keyword) => add(profile.negativeKeywords, keyword, negativeWeight));
      signal.people.slice(0, 5).forEach((person) => add(profile.negativePeople, person, negativeWeight));
      if (signal.director) add(profile.negativePeople, signal.director, negativeWeight * 1.35);
      continue;
    }

    const positiveWeight = weight * (signal.liked ? 1.45 : 1);
    signal.genreIds.forEach((id) => add(profile.genres, id, positiveWeight));
    signal.keywords.forEach((keyword) => add(profile.keywords, keyword, positiveWeight));
    signal.people.slice(0, 5).forEach((person) => add(profile.people, person, positiveWeight));
    if (signal.director) add(profile.people, signal.director, positiveWeight * 1.5);
    add(profile.decades, decadeFor(signal.year), positiveWeight);
    add(profile.formats, signal.mediaType, positiveWeight);
  }

  return profile;
}

function maxValue(values: number[]) {
  return Math.max(...values, 1);
}

function averagePreference<T extends string | number>(keys: T[], positive: Record<T, number>) {
  if (!keys.length) return 0;
  const max = maxValue(Object.values(positive));
  return Math.min(keys.reduce((sum, key) => sum + ((positive[key] || 0) / max), 0) / keys.length, 1);
}

function negativePenalty<T extends string | number>(keys: T[], negative: Record<T, number>) {
  if (!keys.length) return 0;
  const max = maxValue(Object.values(negative));
  return Math.min(keys.reduce((sum, key) => sum + ((negative[key] || 0) / max), 0) / keys.length, 1);
}

function deterministicDailyJitter(id: string, date = new Date()) {
  const seed = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}:${id}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
  return ((hash >>> 0) % 1000) / 1000;
}

export function scoreCandidate(
  candidate: RecommendationCandidate,
  profile: TasteProfile,
  nowYear = new Date().getFullYear(),
): RankedRecommendation {
  const genreScore = averagePreference(candidate.genreIds, profile.genres);
  const keywordScore = averagePreference(candidate.keywords, profile.keywords);
  const relevantPeople = [...candidate.people.slice(0, 5), ...(candidate.director ? [candidate.director] : [])];
  const peopleScore = averagePreference(relevantPeople, profile.people);
  const decadeScore = Math.min((profile.decades[decadeFor(candidate.year)] || 0) / maxValue(Object.values(profile.decades)), 1);

  const popularityNorm = Math.min(Math.log10(Math.max(candidate.popularity, 0) + 1) / 3, 1);
  const ratingNorm = Math.min(Math.max((candidate.rating || 0) / 10, 0), 1);
  const recencyScore = Math.max(1 - Math.max(nowYear - candidate.year, 0) / 35, 0);
  const totalFormat = profile.formats.movie + profile.formats.tv || 1;
  const formatMatch = profile.formats[candidate.mediaType] / totalFormat;

  const negative =
    negativePenalty(candidate.genreIds, profile.negativeGenres) * 0.55 +
    negativePenalty(candidate.keywords, profile.negativeKeywords) * 0.30 +
    negativePenalty(relevantPeople, profile.negativePeople) * 0.15;

  const exploration = deterministicDailyJitter(candidate.id) * 0.035;

  const raw =
    genreScore * 0.30 +
    keywordScore * 0.24 +
    peopleScore * 0.12 +
    decadeScore * 0.07 +
    popularityNorm * 0.08 +
    ratingNorm * 0.08 +
    recencyScore * 0.05 +
    formatMatch * 0.06 +
    exploration -
    negative * 0.28;

  const score = Math.max(0, Math.min(raw, 1));
  const reasons: string[] = [];
  if (genreScore >= 0.55) reasons.push("genres très proches de tes goûts");
  if (keywordScore >= 0.5) reasons.push("thèmes compatibles avec ton historique");
  if (peopleScore >= 0.4) reasons.push("casting ou réalisation familière");
  if (ratingNorm >= 0.72) reasons.push("très bien noté");
  if (recencyScore >= 0.9) reasons.push("récent");
  if (negative >= 0.45) reasons.push("signal négatif détecté");

  return { candidate, score, reasons };
}

function diversify(items: RankedRecommendation[], max: number) {
  const selected: RankedRecommendation[] = [];
  const genreUse = new Map<number, number>();

  for (const item of items) {
    if (selected.length >= max) break;
    const dominant = [...item.candidate.genreIds].sort(
      (a, b) => (BASE_PROFILE.genres[b] || 0) - (BASE_PROFILE.genres[a] || 0),
    )[0];
    if (dominant != null && (genreUse.get(dominant) || 0) >= 2) continue;
    selected.push(item);
    if (dominant != null) genreUse.set(dominant, (genreUse.get(dominant) || 0) + 1);
  }

  if (selected.length < max) {
    for (const item of items) {
      if (selected.length >= max) break;
      if (!selected.some((selectedItem) => selectedItem.candidate.id === item.candidate.id)) selected.push(item);
    }
  }
  return selected;
}

export function selectDailyRecommendations(candidates: RecommendationCandidate[], signals: ViewingSignal[]) {
  const profile = buildTasteProfile(signals);
  const ranked = candidates
    .filter((candidate) => !profile.seenIds.has(candidate.id) && !profile.rejectedIds.has(candidate.id))
    .map((candidate) => scoreCandidate(candidate, profile))
    .sort((a, b) => b.score - a.score);

  const movies = diversify(ranked.filter((item) => item.candidate.mediaType === "movie"), 3);
  const series = diversify(ranked.filter((item) => item.candidate.mediaType === "tv"), 1);
  return [...movies, ...series].sort((a, b) => b.score - a.score);
}
