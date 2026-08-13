import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookMarked } from "lucide-react";
import { horrorArticle } from "@/content/horrorArticle";
import { TopicBadges } from "@/components/TopicBadges";
import { ShareArticle } from "@/components/ShareArticle";
import { AiTransparency } from "@/components/AiTransparency";

const SITE_URL = "https://www.angel-leclerc.fr";

export const Route = createFileRoute("/articles/meilleurs-films-horreur-classement-allocine-avis")({
  head: () => ({
    meta: [
      { title: `${horrorArticle.title} | Angel Leclerc Communication` },
      { name: "description", content: horrorArticle.excerpt },
      { property: "og:type", content: "article" },
      { property: "og:title", content: horrorArticle.title },
      { property: "og:description", content: horrorArticle.excerpt },
      { property: "og:url", content: `${SITE_URL}/articles/${horrorArticle.slug}` },
      { property: "og:image", content: horrorArticle.cover_url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: horrorArticle.title },
      { name: "twitter:description", content: horrorArticle.excerpt },
      { name: "twitter:image", content: horrorArticle.cover_url },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/articles/${horrorArticle.slug}` }],
  }),
  component: HorrorArticlePage,
});

function HorrorArticlePage() {
  return (
    <article className="bg-background py-14 md:py-20">
      <div className="mx-auto w-full max-w-[850px] px-5 sm:px-6">
        <Link to="/articles" className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" /> Tous les articles
        </Link>

        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Article</p>
        <h1 className="mt-4 font-display text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {horrorArticle.title}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">Publié le 13 août 2026</p>
        <TopicBadges topics={horrorArticle.topics} linkToFilter className="mt-4" />
        <ShareArticle slug={horrorArticle.slug} title={horrorArticle.title} className="mt-6" />

        <figure className="mt-8">
          <img src={horrorArticle.cover_url} alt={horrorArticle.cover_meta.alt} loading="lazy" className="w-full rounded-xl object-cover" />
          <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Image : Felix Mooneeram · Wikimedia Commons / Unsplash · CC0 1.0 ·{" "}
            <a href={horrorArticle.cover_meta.pageUrl} target="_blank" rel="noreferrer nofollow" className="text-primary hover:underline">source de l’image</a>
          </figcaption>
        </figure>

        <p className="mt-8 text-base font-medium leading-relaxed text-foreground">{horrorArticle.excerpt}</p>
        <hr className="mt-8 border-border" />
        <div className="article-content mt-8 text-left text-[15px] leading-[1.8] text-foreground/90 md:text-base" dangerouslySetInnerHTML={{ __html: horrorArticle.content }} />

        <div className="mt-12 rounded-xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><BookMarked className="h-4 w-4 text-primary" /> Sources et crédits</p>
          <ul className="mt-3 space-y-2 text-sm">
            {horrorArticle.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer nofollow" className="text-primary hover:underline">{source.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <AiTransparency disclosure={horrorArticle.ai_disclosure} className="mt-10" />
      </div>
    </article>
  );
}
