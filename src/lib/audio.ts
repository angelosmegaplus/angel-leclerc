import { supabase } from "@/integrations/supabase/client";

export const AUDIO_KINDS = [
  { value: "musique", label: "Musique" },
  { value: "podcast", label: "Podcast" },
  { value: "emission", label: "Émission" },
  { value: "jingle", label: "Jingle" },
] as const;

export type AudioKind = (typeof AUDIO_KINDS)[number]["value"];

export type AudioItem = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  kind: string;
  audio_url: string;
  image_url: string | null;
  duration_seconds: number | null;
  source_label: string | null;
  source_url: string | null;
  published: boolean;
  in_radio: boolean;
  sort_order: number;
  published_at: string | null;
  created_at: string;
};

export function kindLabel(kind: string): string {
  return AUDIO_KINDS.find((k) => k.value === kind)?.label ?? kind;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "--:--";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

const SELECT =
  "id,title,author,description,kind,audio_url,image_url,duration_seconds,source_label,source_url,published,in_radio,sort_order,published_at,created_at";

/** Playlist SKINGOMZ : contenus publiés et diffusés dans la radio. */
export async function fetchRadioPlaylist(): Promise<AudioItem[]> {
  const { data, error } = await supabase
    .from("audio_items")
    .select(SELECT)
    .eq("published", true)
    .eq("in_radio", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AudioItem[];
}

/** Podcasts publiés, affichés dans « Mes podcasts ». */
export async function fetchPodcasts(): Promise<AudioItem[]> {
  const { data, error } = await supabase
    .from("audio_items")
    .select(SELECT)
    .eq("published", true)
    .eq("kind", "podcast")
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AudioItem[];
}

/** Tous les contenus audio (administration). */
export async function fetchAllAudioItems(): Promise<AudioItem[]> {
  const { data, error } = await supabase
    .from("audio_items")
    .select(SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AudioItem[];
}
