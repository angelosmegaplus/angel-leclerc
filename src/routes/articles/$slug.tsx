import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Lock, Paperclip } from "lucide-react";
import { fetchArticleBySlug, formatDate, getAttachments } from "@/lib/articles";

export const Route = createFileRoute("/articles/$slug")({
  head: () => ({
    meta: [
      { title: "Article | Angel Leclerc Communication" },
      {
        name: "description",
        content:
          "Article publié par Angel Leclerc Communication : projets, prises de parole et retours d'expérience.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Article | Angel Leclerc Communication" },
      {
        property: "og:description",
        content: "Article publié par Angel Leclerc Communication.",
      },
      { name: "twitter:title", content: "Article | Angel Leclerc Communication" },
      {
        name: "twitter:description",
        content: "Article publié par Angel Leclerc Communication.",
      },
    ],
  }),
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data: article, isLoading } = useQuery({
    queryKey: ["article", slug],
    queryFn: () => fetchArticleBySlug(slug),
  });

  if (isLoading) {
    return (
      <div className="container-tight py-20 text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

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

        {article.is_private && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Article privé — non listé sur le site
          </p>
        )}

        {article.cover_url && (
          <img
            src={article.cover_url}
            alt={article.title}
            loading="lazy"
            className="mt-8 w-full rounded-xl object-cover"
          />
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
            {paragraphs.map((p, i) => (
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

        <div className="mt-12">
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