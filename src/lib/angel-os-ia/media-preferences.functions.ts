import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { rememberPersonalContext } from "./personal-context.server";

export type MediaPreferenceInput = {
  candidateId: string;
  title: string;
  mediaType: "movie" | "tv";
  year?: number | null;
  liked?: boolean;
  rejected?: boolean;
  completion?: number;
  genreIds?: number[];
  keywords?: string[];
  people?: string[];
  director?: string | null;
};

export const rememberMediaPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: MediaPreferenceInput) => input)
  .handler(async ({ data }) => {
    const state = data.rejected ? "rejected" : data.liked ? "liked" : (data.completion ?? 0) >= 0.9 ? "seen" : "interacted";
    await rememberPersonalContext({
      id: `media:${data.candidateId}`,
      domain: "media",
      title: `${data.title} · ${state}`,
      text: JSON.stringify(data),
      tags: [data.mediaType, state, ...(data.keywords ?? []).slice(0, 8)],
      metadata: {
        year: data.year ?? null,
        liked: Boolean(data.liked),
        rejected: Boolean(data.rejected),
        completion: data.completion ?? 0,
      },
    });
    return { ok: true };
  });
