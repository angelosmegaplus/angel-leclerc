import type { RecommendationCandidate, ViewingSignal } from "./film-recommendations";

const STORAGE_KEY = "angel-film-taste-profile-v2";
const LEGACY_KEY = "angel-film-taste-profile-v1";

function safeProfileKey(profileKey?: string | null) {
  const raw = String(profileKey || "guest").trim().toLowerCase();
  return raw.replace(/[^a-z0-9._-]+/g, "-").slice(0, 120) || "guest";
}

function storageKey(profileKey?: string | null) {
  return `${STORAGE_KEY}:${safeProfileKey(profileKey)}`;
}

export function loadTasteSignals(profileKey?: string | null): ViewingSignal[] {
  if (typeof window === "undefined") return [];
  try {
    const key = storageKey(profileKey);
    let raw = localStorage.getItem(key);
    if (!raw && safeProfileKey(profileKey) === "guest") {
      raw = localStorage.getItem(LEGACY_KEY);
      if (raw) localStorage.setItem(key, raw);
    }
    const value = JSON.parse(raw || "[]");
    return Array.isArray(value) ? value.slice(0, 1000) : [];
  } catch {
    return [];
  }
}

export function saveTasteSignals(signals: ViewingSignal[], profileKey?: string | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(profileKey), JSON.stringify(signals.slice(-1000)));
  } catch {
    // Le profil de goût reste optionnel : l'UI continue sans stockage local.
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

export function upsertTasteSignal(signals: ViewingSignal[], next: ViewingSignal, profileKey?: string | null) {
  const index = signals.findIndex((signal) => signal.candidateId === next.candidateId);
  const updated = index >= 0
    ? signals.map((signal, i) => i === index ? next : signal)
    : [...signals, next];
  saveTasteSignals(updated, profileKey);
  return updated;
}
