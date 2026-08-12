import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search } from "lucide-react";
import {
  ARTICLE_TOPICS,
  fetchPublishedArticles,
  formatDate,
  getTopics,
  type Article,
} from "@/lib/articles";
import { TopicBadges } from "@/components/TopicBadges";
import { BlogSubscribe } from "@/components/BlogSubscribe";
import { ShareArticle } from "@/components/ShareArticle";
import { SITE_URL } from "@/routes/articles/$slug";
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
          "Le blog d'Angel Leclerc Communication : articles, projets, coulisses et prises de parole.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:title",
        content: "Blog | Angel Leclerc Communication",
      },
      {
        property: "og:description",
        content: "Le blog d'Angel Leclerc Communication.",
      },
      {
        name: "twitter:title",
        content: "Blog | Angel Leclerc Communication",
      },
      {
        name: "twitter:description",
        content: "Le blog d'Angel Leclerc Communication.",
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
  const { topic } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState("");

  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    let list = articles as Article[];
    if (topic) list = list.filter((a) => getTopics(a).includes(topic));
    if (!q) return list;
    return list.filter((a: Article) =>
      normalize(
        `${a.title} ${a.excerpt ?? ""} ${a.category} ${a.content.replace(/<[^>]*>/g, " ")}`,
      ).includes(q),
    );
  }, [articles, query, topic]);

  const usedTopics = useMemo(() => {
    const set = new Set<string>();
    (articles as Article[]).forEach((a) => getTopics(a).forEach((t) => set.add(t)));
    return ARTICLE_TOPICS.filter((t) => set.has(t));
  }, [articles]);

  return (
    <section className="bg-background py-14 md:py-20">
      <div className="container-tight">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Blog
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Mes articles
        </h1>
        <div className="mt-6 max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un article…"
              aria-label="Rechercher un article"
              className="pl-9"
            />
          </div>
        </div>

        {usedTopics.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filtrer par catégorie">
            {[{ key: "", label: "Tous" }, ...usedTopics.map((t) => ({ key: t, label: t }))].map(
              (t) => (
                <button
                  key={t.key || "all"}
                  type="button"
                  aria-pressed={topic === t.key}
                  onClick={() => navigate({ search: { topic: t.key }, replace: true })}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    topic === t.key
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-input text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {t.label}
                </button>
              ),
            )}
          </div>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {!isLoading && articles.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucune publication pour le moment.
            </p>
          )}
          {!isLoading && articles.length > 0 && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun article ne correspond à « {query} ».
            </p>
          )}
          {filtered.map((a: Article) => (
            <div
              key={a.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/50"
            >
            <Link
              to="/articles/$slug"
              params={{ slug: a.slug }}
              className="flex flex-1 flex-col"
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
                <TopicBadges topics={getTopics(a)} className="mt-2" />
                {a.excerpt && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {a.excerpt}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>{formatDate(a.published_at ?? a.created_at)}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
            <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-3">
              <ShareArticle url={`${SITE_URL}/articles/${a.slug}`} title={a.title} />
            </div>
            </div>
          ))}
        </div>

        <div className="mt-12 max-w-xl">
          <BlogSubscribe />
        </div>
      </div>
    </section>
  );
}