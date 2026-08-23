export type FlammeAvatarId =
  | "user"
  | "flame"
  | "star"
  | "heart"
  | "leaf"
  | "smile"
  | "cat"
  | "sparkles";

export type FlammeProfile = {
  key: string;
  name: string;
  avatar: FlammeAvatarId;
};

export const FLAMME_AVATAR_IDS: FlammeAvatarId[] = [
  "user",
  "flame",
  "star",
  "heart",
  "leaf",
  "smile",
  "cat",
  "sparkles",
];

const PROFILES_KEY = "flamme-local-profiles";
const ACTIVE_KEY = "flamme-active-profile";

export const MAX_PROFILE_NAME = 24;

export function normalizeProfileName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function sanitizeProfileName(value: string) {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trimStart().slice(0, MAX_PROFILE_NAME);
}

function isAvatar(value: unknown): value is FlammeAvatarId {
  return typeof value === "string" && (FLAMME_AVATAR_IDS as string[]).includes(value);
}

export function readProfiles(): Record<string, FlammeProfile> {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILES_KEY) || "{}");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const result: Record<string, FlammeProfile> = {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      const entry = value as { name?: unknown; avatar?: unknown };
      if (!entry || typeof entry !== "object") continue;
      const name = typeof entry.name === "string" ? sanitizeProfileName(entry.name) : "";
      if (!name) continue;
      result[key] = { key, name, avatar: isAvatar(entry.avatar) ? entry.avatar : "user" };
    }
    return result;
  } catch {
    return {};
  }
}

export function writeProfiles(profiles: Record<string, FlammeProfile>) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    // Stockage local indisponible (navigation privée stricte).
  }
}

export function readActiveKey(): string | null {
  try {
    const value = localStorage.getItem(ACTIVE_KEY);
    return value && value.trim() ? value : null;
  } catch {
    return null;
  }
}

export function writeActiveKey(key: string | null) {
  try {
    if (key) localStorage.setItem(ACTIVE_KEY, key);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // Ignoré volontairement.
  }
}
