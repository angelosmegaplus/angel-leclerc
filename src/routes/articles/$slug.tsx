import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookMarked, Download, Lock, Paperclip } from "lucide-react";
import {
  fetchArticleBySlug,
  formatDate,
  getAiDisclosure,
  getAttachments,
  getSources,
} from "@/lib/articles";
import { getTopics } from "@/lib/articles";
import { TopicBadges } from "@/components/TopicBadges";
import { ShareArticle } from "@/components/ShareArticle";
import { AiTransparency } from "@/components/AiTransparency";
import { FeedbackBlock } from "@/components/FeedbackBlock";
export const SITE_URL = "https://www.angel-leclerc.fr";

function absoluteUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("https://")) return value;
  if (value.startsWith("http://")) return value.replace("http://", "https://");
  if (value.startsWith("/")) return `${SITE_URL}${value}`;
  return null;
}

function firstImageFromContent(content: string): string | null {
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? absoluteUrl(match[1]) : null;
}

type CoverMeta = {
  source?: string;
  pageUrl?: string;
  credit?: string;
  license?: string;
  alt?: string;
};

function getCoverMeta(article: { cover_meta?: unknown }): CoverMeta | null {
  const raw = article.cover_meta;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  return {
    source: typeof value.source === "string" ? value.source : undefined,
    pageUrl: typeof value.pageUrl === "string" ? value.pageUrl : undefined,
    credit: typeof value.credit === "string" ? value.credit : undefined,
    license: typeof value.license === "string" ? value.license : undefined,
    alt: typeof value.alt === "string" ? value.alt : undefined,
  };
}

export const Route = createFileRoute("/articles/$slug")({
  loader: ({ params }) => fetchArticleBySlug(params.slug),
  head: ({ params, loaderData }) => {
    const article = loaderData ?? null;
    const url = `${SITE_URL}/articles/${params.slug}`;
    const title = article
      ? `${article.title} | Angel Leclerc Communication`
      : "Article | Angel Leclerc Communication";
    const description =
      article?.excerpt?.trim() ||
      (article
        ? article.content
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 155)
        : "Article publié par Angel Leclerc Communication.");
    const image = article
      ? (absoluteUrl(article.cover_url) ?? firstImageFromContent(article.content))
      : null;

    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:site_name", content: "Angel Leclerc Communication" },
      { property: "og:title", content: article?.title ?? title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { name: "twitter:title", content: article?.title ?? title },
      { name: "twitter:description", content: description },
    ];

    if (image) {
      meta.push(
        { name: "twitter:card", content: "summary_large_image" },
        { property: "og:image", content: image },
        { property: "og:image:secure_url", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: article?.title ?? "Article" },
        { name: "twitter:image", content: image },
      );
    } else {
      meta.push({ name: "twitter:card", content: "summary" });
    }

    return {
      meta,
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: ArticlePage,
});

function ArticlePage() {
  const article = Route.useLoaderData();
  const { slug } = Route.useParams();

  if (!article) {
    return (
      <div className="container-tight py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Article introuvable
        </h1>
        <Link
          to="/articles"
          className="mt-6 inline-flex items-center text-sm text-primary hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Tous les articles
        </Link>
      </div>
    );
  }

  const isHtml = /<\/?[a-z][\s\S]*>/i.test(article.content);
  const paragraphs = article.content.split(/\n{2,}/).filter(Boolean);
  const attachments = getAttachments(article);
  const sources = getSources(article);
  const disclosure = getAiDisclosure(article);
  const coverMeta = getCoverMeta(article);

  return (
    <article className="bg-background py-14 md:py-20">
      <div className="mx-auto w-full max-w-[850px] px-5 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          {article.category}
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {article.title}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Publié le {formatDate(article.published_at ?? article.created_at)}
        </p>

        <TopicBadges topics={getTopics(article)} linkToFilter className="mt-4" />

        {article.is_private && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Article masqué du site public
          </p>
        )}

        {!article.is_private && (
          <ShareArticle slug={slug} title={article.title} className="mt-6" />
        )}

        {article.cover_url && (
          <figure className="mt-8">
            <img
              src={article.cover_url}
              alt={coverMeta?.alt || article.title}
              loading="lazy"
              className="w-full rounded-xl object-cover"
            />
            {(coverMeta?.credit || coverMeta?.source || coverMeta?.license) && (
              <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Image : {coverMeta?.credit || "auteur non précisé"}
                {coverMeta?.source ? ` · ${coverMeta.source}` : ""}
                {coverMeta?.license ? ` · ${coverMeta.license}` : ""}
                {coverMeta?.pageUrl && (
                  <>
                    {" · "}
                    <a
                      href={coverMeta.pageUrl}
                      target="_blank"
                      rel="noreferrer nofollow"
                      className="text-primary hover:underline"
                    >
                      source de l’image
                    </a>
                  </>
                )}
              </figcaption>
            )}
          </figure>
        )}

        {article.excerpt && (
          <p className="mt-8 text-base font-medium leading-relaxed text-foreground">
            {article.excerpt}
          </p>
        )}

        <hr className="mt-8 border-border" />

        {isHtml ? (
          <div
            className="article-content mt-8 text-left text-[15px] leading-[1.8] text-foreground/90 md:text-base"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        ) : (
          <div className="mt-8 space-y-6 text-left text-[15px] leading-[1.8] text-foreground/90 md:text-base">
            {paragraphs.map((p: string, i: number) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        )}

        {attachments.length > 0 && (
          <div className="mt-10 rounded-xl border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Paperclip className="h-4 w-4 text-primary" /> Documents joints
            </p>
            <ul className="mt-3 space-y-2">
              {attachments.map((f) => (
                <li key={f.url}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Download className="h-4 w-4" /> {f.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!article.is_private && (
          <div className="mt-12 border-t border-border pt-6">
            <ShareArticle slug={slug} title={article.title} />
          </div>
        )}

        {sources.length > 0 && (
          <div className="mt-10 rounded-xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BookMarked className="h-4 w-4 text-primary" /> Sources et crédits
            </h2>
            <ul className="mt-3 space-y-2">
              {sources.map((s, i) => (
                <li key={`${s.url}-${i}`} className="text-sm text-muted-foreground">
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer nofollow"
                      className="text-primary hover:underline"
                    >
                      {s.label}
                    </a>
                  ) : (
                    s.label
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <FeedbackBlock
          contentType="article"
          contentKey={`/articles/${slug}`}
          contentTitle={article.title}
          className="mt-8"
        />

        <AiTransparency disclosure={disclosure} className="mt-8" />

        <div className="mt-10">
          <Link
            to="/articles"
            className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Tous les articles
          </Link>
        </div>
      </div>
    </article>
  );
}
