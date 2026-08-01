import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { fetchArticleBySlug, formatDate } from "@/lib/articles";

export const Route = createFileRoute("/actualites/$slug")({
  head: () => ({
    meta: [
      { title: "Publication | Angel Leclerc Communication" },
      {
        name: "description",
        content:
          "Article publié par Angel Leclerc Communication : actualités, communiqués et retours d'expérience.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Publication | Angel Leclerc Communication" },
      {
        property: "og:description",
        content: "Article publié par Angel Leclerc Communication.",
      },
      { name: "twitter:title", content: "Publication | Angel Leclerc Communication" },
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
          Publication introuvable
        </h1>
        <Link
          to="/actualites"
          className="mt-6 inline-flex items-center text-sm text-primary hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Toutes les actualités
        </Link>
      </div>
    );
  }

  const paragraphs = article.content.split(/\n{2,}/).filter(Boolean);

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

        <div className="mt-8 space-y-6 text-left text-[15px] leading-[1.8] text-foreground/90 md:text-base">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>

        <div className="mt-12">
          <Link
            to="/actualites"
            className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Toutes les actualités
          </Link>
        </div>
      </div>
    </article>
  );
}