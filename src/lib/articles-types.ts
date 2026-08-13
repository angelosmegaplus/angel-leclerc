import type { Database } from "@/integrations/supabase/types";

export type Article = Database["public"]["Tables"]["articles"]["Row"];
export type ArticleAttachment = { name: string; url: string; size?: number };
export type ArticleSource = { label: string; url: string };
export type AiDisclosure = {
  personal: boolean;
  chatgpt: boolean;
  otherAi: boolean;
  otherAiName: string;
  images: boolean;
  imagesTool: string;
};

export const emptyAiDisclosure: AiDisclosure = {
  personal: false,
  chatgpt: false,
  otherAi: false,
  otherAiName: "",
  images: false,
  imagesTool: "",
};

export const ARTICLE_CATEGORIES = ["Article", "Annonce", "Presse", "Coulisses", "Projet"] as const;
export const ARTICLE_TOPICS = [
  "Politique",
  "Société",
  "Emploi & formation",
  "Entreprise & économie",
  "Communication & médias",
  "International & géopolitique",
  "Religion",
  "Scoutisme",
  "Technologie & numérique",
  "Culture & idées",
] as const;
export type ArticleTopic = (typeof ARTICLE_TOPICS)[number];
export type ArticleStatus = "brouillon" | "programme" | "publie";
