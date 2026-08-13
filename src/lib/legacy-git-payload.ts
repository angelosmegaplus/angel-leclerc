import type { Article } from "@/lib/articles-types";

export function toCmsArticlePayload(article: Article) {
  return {
    slug: article.slug,
    title: article.title,
    category: article.category,
    excerpt: article.excerpt,
    content: article.content,
    cover_url: article.cover_url,
    published: article.published,
    published_at: article.published_at,
    author_id: article.author_id,
    created_at: article.created_at,
    updated_at: article.updated_at,
    is_private: article.is_private,
    featured: article.featured,
    attachments: article.attachments,
    scheduled_at: article.scheduled_at,
    sources: article.sources,
    ai_disclosure: article.ai_disclosure,
    topics: article.topics,
  };
}
