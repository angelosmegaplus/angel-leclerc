import {
  emptyAiDisclosure,
  type AiDisclosure,
  type Article,
  type ArticleAttachment,
  type ArticleSource,
  type ArticleStatus,
} from "@/lib/articles-types";

export function getAiDisclosure(article: { ai_disclosure?: unknown }): AiDisclosure {
  const raw = article.ai_disclosure;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return emptyAiDisclosure;
  const r = raw as Record<string, unknown>;
  return {
    personal: r.personal === true,
    chatgpt: r.chatgpt === true,
    otherAi: r.otherAi === true,
    otherAiName: typeof r.otherAiName === "string" ? r.otherAiName : "",
    images: r.images === true,
    imagesTool: typeof r.imagesTool === "string" ? r.imagesTool : "",
  };
}

export function hasAiDisclosure(d: AiDisclosure): boolean {
  return d.personal || d.chatgpt || d.otherAi || d.images;
}

export function getSources(article: { sources?: unknown }): ArticleSource[] {
  const raw = article.sources;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (s): s is ArticleSource =>
      typeof s === "object" &&
      s !== null &&
      typeof (s as ArticleSource).label === "string" &&
      (s as ArticleSource).label.trim().length > 0,
  );
}

export function getAttachments(article: Article): ArticleAttachment[] {
  const raw = article.attachments;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (a): a is ArticleAttachment =>
      typeof a === "object" && a !== null && "url" in a && "name" in a,
  );
}

export function getTopics(article: { topics?: unknown }): string[] {
  const raw = article.topics;
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
}

export function getArticleStatus(article: {
  published: boolean;
  scheduled_at: string | null;
}): ArticleStatus {
  if (!article.published) return "brouillon";
  if (article.scheduled_at && new Date(article.scheduled_at) > new Date()) return "programme";
  return "publie";
}
