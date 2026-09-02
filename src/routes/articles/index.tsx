import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, Search } from "lucide-react";
import {
  fetchPublishedArticles,
  formatDate,
  getTopics,
  type Article,
} from "@/lib/articles";
import { TopicBadges } from "@/components/TopicBadges";
import { BlogSubscribe } from "@/components/BlogSubscribe";
import { ShareArticle } from "@/components/ShareArticle";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/articles/")({
  validateSearch: (search: Record<string, unknown>): { topic?: string } => ({
    topic:
      typeof search.topic === "string" && search.topic ? search.topic : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Blog | Angel Leclerc Communication" },
      {
        name: "description",
        content:
          "Le blog d'Angel Leclerc Communication : analyses, projets, terrain, coulisses et prises de parole.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:title",
        content: "Blog | Angel Leclerc Communication",
      },
      {
        property: "og:description",
        content: "Analyses, projets, terrain et prises de parole.",
      },
      {
        name: "twitter:title",
        content: "Blog | Angel Leclerc Communication",
      },
      {
        name: "twitter:description",
        content: "Analyses, projets, terrain et prises de parole.",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/articles" }],
  }),
  component: ArticlesPage,
});

function articleTimestamp(article: Article) {
  return new Date(article.published_at ?? article.created_at).getTime();
}

function ArticleVisual({ article, featured = false }: { article: Article; featured?: boolean }) {
  if (article.cover_url) {
    return (
      <div
        className={`relative overflow-hidden bg-muted ${
          featured ? "min-h-[270px] lg:min-h-[390px]" : "aspect-[16/9]"
        }`}
      >
        <img
          src={article.cover_url}
          alt={article.title}
          loading={featured ? "eager" : "lazy"}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`relative isolate overflow-hidden bg-gradient-to-br from-primary/20 via-muted to-card ${
        featured ? "min-h-[270px] lg:min-h-[390px]" : "aspect-[16/9]"
      }`}
    >
      <div className="absolute -right-8 -top-12 h-44 w-44 rounded-full border border-primary/20" />
      <div className="absolute -bottom-14 -left-10 h-48 w-48 rounded-full border border-foreground/10" />
      <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            Angel Leclerc Communication
          </p>
          <p className="mt-2 max-w-xs font-display text-xl font-bold leading-tight text-foreground/90">
            Notes · analyses · terrain
          </p>
        </div>
        <span className="font-display text-5xl font-extrabold text-foreground/10">ALC!</span>
      </div>
    </div>
  );
}

function ArticlesPage() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: fetchPublishedArticles,
  });
  const { topic } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState("");

  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const orderedArticles = useMemo(
    () => [...(articles as Article[])].sort((a, b) => articleTimestamp(b) - articleTimestamp(a)),
    [articles],
  );

  const usedTopics = useMemo(() => {
    const topics: string[] = [];
    const seen = new Set<string>();
    orderedArticles.forEach((article) => {
      getTopics(article).forEach((value) => {
        if (!seen.has(value)) {
          seen.add(value);
          topics.push(value);
        }
      });
    });
    return topics;
  }, [orderedArticles]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    let list = orderedArticles;
    if (topic) list = list.filter((article) => getTopics(article).includes(topic));
    if (!q) return list;

    return list.filter((article) =>
      normalize(
        `${article.title} ${article.excerpt ?? ""} ${article.category} ${getTopics(article).join(" ")} ${(
          article.content ?? ""
        ).replace(/<[^>]*>/g, " ")}`,
      ).includes(q),
    );
  }, [orderedArticles, query, topic]);

  const filtering = Boolean(topic || query.trim());
  const featuredArticle = !filtering ? orderedArticles[0] : undefined;
  const gridArticles = featuredArticle
    ? filtered.filter((article) => article.id !== featuredArticle.id)
    : filtered;
  const resultCount = filtering ? filtered.length : orderedArticles.length;

  return (
    <section className="overflow-hidden bg-background">
      <div className="border-b border-border/70 bg-gradient-to-b from-muted/55 to-background">
        <div className="container-tight py-12 sm:py-16 md:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Blog
              </span>
            </div>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] text-foreground sm:text-5xl md:text-6xl">
              Idées, analyses <span className="text-primary">& terrain.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Des articles pour décrypter, raconter et questionner la communication, la société,
              les projets et ce qui se passe derrière les idées.
            </p>
          </div>
        </div>
      </div>

      <div className="container-tight py-10 sm:py-12 md:py-16">
        {isLoading && (
          <div className="space-y-8" aria-live="polite">
            <div className="h-[360px] animate-pulse rounded-[1.75rem] bg-muted" />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-80 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          </div>
        )}

        {!isLoading && orderedArticles.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
            Aucune publication pour le moment.
          </div>
        )}

        {!isLoading && featuredArticle && (
          <section aria-labelledby="featured-article-heading">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">À la une</p>
                <h2 id="featured-article-heading" className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
                  Le dernier article
                </h2>
              </div>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {formatDate(featuredArticle.published_at ?? featuredArticle.created_at)}
              </p>
            </div>

            <div className="group overflow-hidden rounded-[1.75rem] border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg">
              <Link
                to="/articles/$slug"
                params={{ slug: featuredArticle.slug }}
                className="grid lg:grid-cols-[1.15fr_0.85fr]"
              >
                <ArticleVisual article={featuredArticle} featured />
                <div className="flex min-h-full flex-col p-6 sm:p-8 lg:p-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-primary-foreground">
                      {featuredArticle.category}
                    </span>
                    <span className="text-xs text-muted-foreground sm:hidden">
                      {formatDate(featuredArticle.published_at ?? featuredArticle.created_at)}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-2xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                    {featuredArticle.title}
                  </h3>
                  <TopicBadges topics={getTopics(featuredArticle)} className="mt-4" />
                  {featuredArticle.excerpt && (
                    <p className="mt-5 line-clamp-4 text-sm leading-7 text-muted-foreground sm:text-base">
                      {featuredArticle.excerpt}
                    </p>
                  )}
                  <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-foreground">
                    Lire l’article
                    <ArrowUpRight className="h-4 w-4 text-primary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </Link>
              <div className="border-t border-border/70 px-6 py-3 sm:px-8">
                <ShareArticle slug={featuredArticle.slug} title={featuredArticle.title} />
              </div>
            </div>
          </section>
        )}

        {!isLoading && orderedArticles.length > 0 && (
          <section className={featuredArticle ? "mt-14 md:mt-20" : ""} aria-labelledby="all-articles-heading">
            <div className="border-y border-border/70 py-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Archives</p>
                  <div className="mt-1 flex items-baseline gap-3">
                    <h2 id="all-articles-heading" className="font-display text-2xl font-bold tracking-tight text-foreground">
                      Tous les articles
                    </h2>
                    <span className="text-xs font-medium text-muted-foreground">
                      {resultCount} {resultCount > 1 ? "articles" : "article"}
                    </span>
                  </div>
                </div>

                <div className="w-full lg:max-w-md">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Rechercher dans le blog…"
                      aria-label="Rechercher un article"
                      className="h-11 rounded-full border-border bg-card pl-11 pr-4 shadow-sm focus-visible:ring-primary/30"
                    />
                  </div>
                </div>
              </div>

              {usedTopics.length > 0 && (
                <div
                  className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  role="group"
                  aria-label="Filtrer par thème"
                >
                  {[{ key: "", label: "Tous" }, ...usedTopics.map((value) => ({ key: value, label: value }))].map(
                    (item) => {
                      const active = (topic ?? "") === item.key;
                      return (
                        <button
                          key={item.key || "all"}
                          type="button"
                          aria-pressed={active}
                          onClick={() => navigate({ search: { topic: item.key }, replace: true })}
                          className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                            active
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
                <p className="font-display text-lg font-semibold text-foreground">Rien dans ce filtre.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Essayez un autre mot-clé ou revenez à tous les articles.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    navigate({ search: { topic: "" }, replace: true });
                  }}
                  className="mt-5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : gridArticles.length > 0 ? (
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {gridArticles.map((article) => (
                  <article
                    key={article.id}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg"
                  >
                    <Link
                      to="/articles/$slug"
                      params={{ slug: article.slug }}
                      className="flex flex-1 flex-col"
                    >
                      <ArticleVisual article={article} />
                      <div className="flex flex-1 flex-col p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                            {article.category}
                          </span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {formatDate(article.published_at ?? article.created_at)}
                          </span>
                        </div>
                        <h3 className="mt-3 font-display text-xl font-bold leading-snug tracking-tight text-foreground">
                          {article.title}
                        </h3>
                        <TopicBadges topics={getTopics(article)} className="mt-3" />
                        {article.excerpt && (
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                            {article.excerpt}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-6 text-sm font-semibold text-foreground">
                          <span>Lire</span>
                          <ArrowRight className="h-4 w-4 text-primary transition-transform duration-200 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                    <div className="border-t border-border/70 px-5 py-3 sm:px-6">
                      <ShareArticle slug={article.slug} title={article.title} />
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        )}

        {!isLoading && orderedArticles.length > 0 && (
          <section className="mt-16 border-t border-border/70 pt-12 md:mt-24 md:pt-16" aria-label="Newsletter du blog">
            <div className="overflow-hidden rounded-[1.75rem] border border-border bg-foreground p-5 text-background shadow-lg sm:p-8 lg:p-10 dark:bg-card dark:text-foreground">
              <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">La lettre du dimanche</p>
                  <h2 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">
                    Les nouveaux articles, sans courir après l’algorithme.
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-background/70 dark:text-muted-foreground">
                    Un récapitulatif hebdomadaire, directement par e-mail. Pas de flux infini, pas de notification toutes les dix minutes.
                  </p>
                </div>
                <div className="[&>form]:border-background/10 [&>form]:shadow-xl dark:[&>form]:border-border">
                  <BlogSubscribe />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
