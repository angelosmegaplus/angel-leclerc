export type FlammeNewsItem = {
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
  description?: string;
  imageUrl?: string;
};

export type FlammeNewsPayload = {
  items: FlammeNewsItem[];
  fetchedAt: string;
  sources: string[];
};
