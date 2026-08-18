import type { RecommendationCandidate, ViewingSignal } from "./film-recommendations";

const STORAGE_KEY = "angel-film-taste-profile-v1";

export function loadTasteSignals(): ViewingSignal[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.slice(0, 1000) : [];
  } catch {
    return [];
  }
}

export function saveTasteSignals(signals: ViewingSignal[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signals.slice(-1000)));
  } catch {
    // Le profil de goût est une amélioration progressive : l'UI continue sans stockage local.
  }
}

export function signalForCandidate(candidate: RecommendationCandidate, previous?: ViewingSignal): ViewingSignal {
  return {
    candidateId: candidate.id,
    mediaType: candidate.mediaType,
    genreIds: [...candidate.genreIds],
    keywords: [...candidate.keywords],
    people: [...candidate.people],
    director: candidate.director,
    year: candidate.year,
    completion: previous?.completion ?? 0,
    seen: previous?.seen,
    liked: previous?.liked,
    rejected: previous?.rejected,
    rating: previous?.rating,
    styleFit: previous?.styleFit,
    updatedAt: Date.now(),
  };
}

export function upsertTasteSignal(signals: ViewingSignal[], next: ViewingSignal) {
  const index = signals.findIndex((signal) => signal.candidateId === next.candidateId);
  const updated = index >= 0
    ? signals.map((signal, i) => i === index ? next : signal)
    : [...signals, next];
  saveTasteSignals(updated);
  return updated;
}
