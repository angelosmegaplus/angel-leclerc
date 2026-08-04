import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Newspaper, Star } from "lucide-react";
import { fetchLatestArticles, formatDate, type Article } from "@/lib/articles";

export function LatestArticles({
  title = "Blog",
  description,
  eyebrow = "Blog",
}: {
  title?: string;
  description?: string;
  eyebrow?: string;
}) {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["articles", "latest"],
    queryFn: () => fetchLatestArticles(3),
  });

  if (!isLoading && articles.length === 0) return null;

  return (
    <section className="border-t border-border bg-background py-14 md:py-20">
      <div className="container-tight">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              <Newspaper size={14} /> {eyebrow}
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {title}
            </h2>
            {description && (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <Link
            to="/articles"
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            Tous les articles <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {articles.map((a: Article) => (
            <Link
              key={a.id}
              to="/articles/$slug"
              params={{ slug: a.slug }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50"
            >
              {a.cover_url && (
                <img
                  src={a.cover_url}
                  alt={a.title}
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col p-5">
                <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  {a.featured && <Star size={12} className="fill-current" />}
                  {a.category}
                </span>
                <h3 className="mt-2 font-display text-base font-bold leading-snug text-foreground">
                  {a.title}
                </h3>
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
