import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { fetchPublishedArticles, formatDate, type Article } from "@/lib/articles";

export const Route = createFileRoute("/articles/")({
  head: () => ({
    meta: [
      { title: "Articles | Angel Leclerc Communication" },
      {
        name: "description",
        content:
          "Articles publiés par Angel Leclerc Communication : projets, coulisses et prises de parole.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:title",
        content: "Articles | Angel Leclerc Communication",
      },
      {
        property: "og:description",
        content:
          "Articles publiés par Angel Leclerc Communication.",
      },
      {
        name: "twitter:title",
        content: "Articles | Angel Leclerc Communication",
      },
      {
        name: "twitter:description",
        content:
          "Articles publiés par Angel Leclerc Communication.",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/articles" }],
  }),
  component: ArticlesPage,
});

function ArticlesPage() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: fetchPublishedArticles,
  });

  return (
    <section className="bg-background py-14 md:py-20">
      <div className="container-tight">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Articles
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Articles
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Les publications d'Angel Leclerc Communication : projets accompagnés, prises de
          parole et coulisses des missions.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {!isLoading && articles.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucune publication pour le moment.
            </p>
          )}
          {articles.map((a: Article) => (
            <Link
              key={a.id}
              to="/articles/$slug"
              params={{ slug: a.slug }}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/50"
            >
              {a.cover_url && (
                <img
                  src={a.cover_url}
                  alt={a.title}
                  loading="lazy"
                  className="h-44 w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col p-5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  {a.category}
                </span>
                <h2 className="mt-2 font-display text-lg font-bold leading-snug text-foreground">
                  {a.title}
                </h2>
                {a.excerpt && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {a.excerpt}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between pt-2 text-xs text-muted-foreground">
                  <span>{formatDate(a.published_at ?? a.created_at)}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}