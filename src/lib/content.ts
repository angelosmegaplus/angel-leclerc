import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  Archive,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  ClipboardList,
  Compass,
  FileImage,
  FileText,
  Globe,
  GraduationCap,
  Hammer,
  Heart,
  HeartHandshake,
  Landmark,
  Layers,
  Lightbulb,
  Music,
  Network,
  Palette,
  PenLine,
  Radio,
  Smartphone,
  Sparkles,
  Tent,
  TreePine,
  Users,
  Video,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type ContentItem = Database["public"]["Tables"]["content_items"]["Row"];

export type ContentSection =
  | "experience"
  | "formation"
  | "certification"
  | "engagement"
  | "projet"
  | "service"
  | "service_extra";

export const CONTENT_SECTIONS: { value: ContentSection; label: string; page: string }[] = [
  { value: "experience", label: "Expériences professionnelles", page: "Parcours" },
  { value: "formation", label: "Formations et diplômes", page: "Parcours" },
  { value: "certification", label: "Certifications", page: "Parcours" },
  { value: "engagement", label: "Engagements associatifs", page: "Parcours" },
  { value: "projet", label: "Projets / réalisations", page: "Parcours" },
  { value: "service", label: "Services principaux", page: "Entreprise" },
  { value: "service_extra", label: "Services complémentaires", page: "Entreprise" },
];

export const CONTENT_ICONS: Record<string, LucideIcon> = {
  Archive,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  ClipboardList,
  Compass,
  FileImage,
  FileText,
  Globe,
  GraduationCap,
  Hammer,
  Heart,
  HeartHandshake,
  Landmark,
  Layers,
  Lightbulb,
  Music,
  Network,
  Palette,
  PenLine,
  Radio,
  Smartphone,
  Sparkles,
  Tent,
  TreePine,
  Users,
  Video,
  Wrench,
};

export const CONTENT_ICON_NAMES = Object.keys(CONTENT_ICONS).sort();

export function iconFor(name: string | null, fallback: LucideIcon = Sparkles): LucideIcon {
  if (!name) return fallback;
  return CONTENT_ICONS[name] ?? fallback;
}

export function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export type ContentVideo = { id: string; title?: string };

export function toVideoList(value: unknown): ContentVideo[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is ContentVideo =>
      typeof v === "object" && v !== null && typeof (v as ContentVideo).id === "string",
  );
}

function isRadioBocageContent(item: ContentItem): boolean {
  const text = `${item.title ?? ""} ${item.subtitle ?? ""}`.toLowerCase();
  return text.includes("radio bocage");
}

function normalizePublicContent(item: ContentItem): ContentItem {
  if (
    item.section === "experience" &&
    item.title === "Agent de propreté urbaine (emploi saisonnier)" &&
    item.subtitle === "Mairie de Sarlat-la-Canéda"
  ) {
    return { ...item, period: "Juillet – août 2026 · 2 mois" };
  }

  if (isRadioBocageContent(item)) {
    if (item.section === "experience") {
      return {
        ...item,
        title: "Découverte de la production radiophonique",
        subtitle: "Radio Bocage",
        period: "2026",
        bullets: [],
      };
    }

    if (item.section === "projet") {
      return {
        ...item,
        title: "Radio Bocage",
        description: "Découverte de la production radiophonique.",
        bullets: [],
        extra_label: null,
        extra_value: null,
        url: null,
        link_label: null,
      };
    }
  }

  return item;
}

export async function fetchContentSection(section: ContentSection): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("section", section)
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normalizePublicContent);
}

export async function fetchAllContent(): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normalizePublicContent);
}

/** Hook-friendly query options for a public content section. */
export function contentQuery(section: ContentSection) {
  return {
    queryKey: ["content", section] as const,
    queryFn: () => fetchContentSection(section),
    staleTime: 60_000,
  };
}
