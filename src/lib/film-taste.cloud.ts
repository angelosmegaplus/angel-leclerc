import { supabase } from "@/integrations/supabase/client";
import { saveTasteSignals } from "./film-taste.client";
import type { ViewingSignal } from "./film-recommendations";

type TasteRow = {
  user_id: string;
  candidate_id: string;
  media_type: "movie" | "tv";
  genre_ids: number[] | null;
  keywords: string[] | null;
  people: string[] | null;
  director: string | null;
  release_year: number;
  completion: number;
  seen: boolean | null;
  liked: boolean | null;
  rejected: boolean | null;
  rating: number | null;
  style_fit: "yes" | "mixed" | "no" | null;
  updated_at: string;
};

const db = supabase as any;

function fromRow(row: TasteRow): ViewingSignal {
  return {
    candidateId: row.candidate_id,
    mediaType: row.media_type,
    genreIds: Array.isArray(row.genre_ids) ? row.genre_ids : [],
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    people: Array.isArray(row.people) ? row.people : [],
    director: row.director || undefined,
    year: Number(row.release_year) || new Date().getFullYear(),
    completion: Number(row.completion) || 0,
    seen: row.seen ?? undefined,
    liked: row.liked ?? undefined,
    rejected: row.rejected ?? undefined,
    rating: row.rating ?? undefined,
    styleFit: row.style_fit ?? undefined,
    updatedAt: Date.parse(row.updated_at) || Date.now(),
  };
}

function toRow(userId: string, signal: ViewingSignal) {
  return {
    user_id: userId,
    candidate_id: signal.candidateId,
    media_type: signal.mediaType,
    genre_ids: signal.genreIds,
    keywords: signal.keywords,
    people: signal.people,
    director: signal.director ?? null,
    release_year: signal.year,
    completion: signal.completion,
    seen: signal.seen ?? null,
    liked: signal.liked ?? null,
    rejected: signal.rejected ?? null,
    rating: signal.rating ?? null,
    style_fit: signal.styleFit ?? null,
    updated_at: new Date(signal.updatedAt ?? Date.now()).toISOString(),
  };
}

export async function loadCloudTasteSignals(userId: string): Promise<ViewingSignal[]> {
  if (!userId) return [];
  const { data, error } = await db
    .from("film_taste_signals")
    .select("user_id,candidate_id,media_type,genre_ids,keywords,people,director,release_year,completion,seen,liked,rejected,rating,style_fit,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []).map((row: TasteRow) => fromRow(row));
}

export async function saveCloudTasteSignal(userId: string, signal: ViewingSignal) {
  if (!userId) return;
  const { error } = await db
    .from("film_taste_signals")
    .upsert(toRow(userId, signal), { onConflict: "user_id,candidate_id" });
  if (error) throw error;
}

export function mergeTasteSignals(local: ViewingSignal[], cloud: ViewingSignal[]) {
  const merged = new Map<string, ViewingSignal>();
  for (const signal of [...local, ...cloud]) {
    const current = merged.get(signal.candidateId);
    if (!current || (signal.updatedAt ?? 0) >= (current.updatedAt ?? 0)) merged.set(signal.candidateId, signal);
  }
  return [...merged.values()].sort((a, b) => (a.updatedAt ?? 0) - (b.updatedAt ?? 0)).slice(-1000);
}

export async function hydrateTasteProfile(userId: string, local: ViewingSignal[]) {
  const cloud = await loadCloudTasteSignals(userId);
  const merged = mergeTasteSignals(local, cloud);
  saveTasteSignals(merged, userId);
  return merged;
}
