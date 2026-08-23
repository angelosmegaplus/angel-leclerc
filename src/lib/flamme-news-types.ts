export const FLAMME_NEWS_CATEGORIES = [
  "general",
  "france",
  "world",
  "economy",
  "science-tech",
  "culture-history",
  "sport",
  "public-life",
] as const;

export type FlammeNewsCategory = (typeof FLAMME_NEWS_CATEGORIES)[number];

export const FLAMME_NEWS_CATEGORY_LABELS: Record<FlammeNewsCategory, string> = {
  general: "À la une / Général",
  france: "France & société",
  world: "Monde",
  economy: "Économie",
  "science-tech": "Sciences & tech",
  "culture-history": "Culture & histoire",
  sport: "Sport",
  "public-life": "Vie publique & démarches",
};

export type FlammeNewsItem = {
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
  description?: string;
  imageUrl?: string;
  categories: FlammeNewsCategory[];
  /** Article issu du flux régional choisi par l'utilisateur. */
  regional?: boolean;
};

export type FlammeNewsPayload = {
  items: FlammeNewsItem[];
  fetchedAt: string;
  sources: string[];
  region?: string | null;
};

