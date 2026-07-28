import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  LoaderCircle,
  Newspaper,
} from "lucide-react";

type SubstackArticle = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  thumbnail?: string;
  enclosure?: {
    link?: string;
  };
};

type RSSResponse = {
  status: string;
  items?: SubstackArticle[];
};

const SUBSTACK_PROFILE_URL = "https://substack.com/@angelofcom";

/*
 * Si tu retrouves l'adresse exacte de ta newsletter, remplace cette adresse.
 * Exemple : https://nomdelapublication.substack.com/feed
 */
const POSSIBLE_FEEDS = [
  "https://angelofcom.substack.com/feed",
  "https://substack.com/@angelofcom/feed",
  "https://substack.com/@angelofcom/rss",
];

const MAX_ARTICLES = 6;

function removeHtml(html: string): string {
  if (!html) return "";
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.textContent?.trim() || "";
}

function shortenText(text: string, maximumLength = 170): string {
  if (text.length <= maximumLength) return text;
  return `${text.slice(0, maximumLength).trim()}…`;
}

function formatDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function findImage(article: SubstackArticle): string | null {
  if (article.thumbnail) return article.thumbnail;
  if (article.enclosure?.link) return article.enclosure.link;
  const match = article.description?.match(
    /<img[^>]+src=["']([^"']+)["']/i,
  );
  return match?.[1] || null;
}

async function getArticlesFromFeed(
  feedUrl: string,
): Promise<SubstackArticle[]> {
  const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
    feedUrl,
  )}`;
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
  const result: RSSResponse = await response.json();
  if (result.status !== "ok" || !result.items?.length) {
    throw new Error("Aucun article trouvé dans ce flux.");
  }
  return result.items;
}

export default function LatestSubstackArticles() {
  const [articles, setArticles] = useState<SubstackArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadArticles() {
      setLoading(true);
      setHasError(false);

      for (const feedUrl of POSSIBLE_FEEDS) {
        try {
          const result = await getArticlesFromFeed(feedUrl);
          if (mounted) {
            setArticles(result.slice(0, MAX_ARTICLES));
            setLoading(false);
          }
          return;
        } catch (error) {
          console.warn(`Flux Substack indisponible : ${feedUrl}`, error);
        }
      }

      if (mounted) {
        setHasError(true);
        setLoading(false);
      }
    }

    loadArticles();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="blog" className="section-padding bg-background">
      <div className="container-tight">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Newspaper size={14} />
              Analyses et réflexions
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
              Mes derniers articles
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Communication, politique, société et idées pour comprendre ce qui
              change.
            </p>
          </div>
          <a
            href={SUBSTACK_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary md:self-auto"
          >
            Voir tous les articles
            <ArrowRight size={14} />
          </a>
        </div>

        {loading && (
          <div className="mt-12 flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm text-muted-foreground">
              <LoaderCircle size={16} className="animate-spin text-primary" />
              Chargement des articles…
            </div>
          </div>
        )}

        {!loading && hasError && (
          <div className="mt-12 text-center">
            <a
              href={SUBSTACK_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Voir tous mes articles sur Substack
              <ArrowRight size={14} />
            </a>
          </div>
        )}

        {!loading && !hasError && articles.length > 0 && (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const image = findImage(article);
              const cleanDescription = shortenText(
                removeHtml(article.description),
              );

              return (
                <a
                  key={article.link}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Newspaper size={32} className="text-primary/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    {article.pubDate && (
                      <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                        <CalendarDays size={12} />
                        {formatDate(article.pubDate)}
                      </p>
                    )}
                    <h3 className="mt-2 font-display text-lg font-semibold text-foreground group-hover:text-primary">
                      {article.title}
                    </h3>
                    {cleanDescription && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                        {cleanDescription}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                      Lire l'article
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}