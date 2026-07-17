import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AnimatedSection } from "@/components/AnimatedSection";
import { getPostBySlug, blogPosts } from "@/data/blog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPostBySlug(params.slug);
    if (!post) {
      throw notFound();
    }
    return post;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Article introuvable — Conseil & Création" }, { name: "robots", content: "noindex" }],
      };
    }
    return {
      meta: [
        { title: `${loaderData.title} — Conseil & Création` },
        { name: "description", content: loaderData.excerpt },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: loaderData.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/blog/${loaderData.slug}` },
      ],
      links: [{ rel: "canonical", href: `/blog/${loaderData.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: loaderData.title,
            description: loaderData.excerpt,
            datePublished: loaderData.date,
            author: { "@type": "Organization", name: "Conseil & Création" },
          }),
        },
      ],
    };
  },
  notFoundComponent: PostNotFound,
  component: BlogPostPage,
});

function PostNotFound() {
  return (
    <div className="container-tight py-20 text-center">
      <h1 className="font-display text-3xl font-bold text-foreground">Article introuvable</h1>
      <p className="mt-4 text-muted-foreground">
        L'article que vous recherchez n'existe pas ou a été déplacé.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/blog">Retour au blog</Link>
      </Button>
    </div>
  );
}

function BlogPostPage() {
  const post = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <article className="container-tight py-16 md:py-24">
        <AnimatedSection>
          <Button
            asChild
            variant="ghost"
            className="mb-8 pl-0 text-muted-foreground hover:text-foreground"
          >
            <Link to="/blog">
              <ArrowLeft size={16} className="mr-2" />
              Retour au blog
            </Link>
          </Button>

          <Badge variant="secondary" className="mb-4 bg-sand text-ink hover:bg-sand">
            {post.category}
          </Badge>
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(post.date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {post.readTime} de lecture
            </span>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2} className="mt-10">
          <div className="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80">
            {post.content.split("\n\n").map((paragraph: string, index: number) => {
              if (paragraph.startsWith("## ")) {
                return (
                  <h2 key={index} className="font-display text-2xl font-bold text-foreground mt-10 mb-4">
                    {paragraph.replace("## ", "")}
                  </h2>
                );
              }
              if (paragraph.startsWith("---")) {
                return <hr key={index} className="my-8 border-border" />;
              }
              if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
                return (
                  <p key={index} className="font-semibold text-foreground">
                    {paragraph.replace(/\*\*/g, "")}
                  </p>
                );
              }
              return (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.3} className="mt-16 rounded-2xl bg-primary p-8 text-center text-primary-foreground md:p-12">
          <h2 className="font-display text-2xl font-bold">Vous souhaitez aller plus loin ?</h2>
          <p className="mx-auto mt-2 max-w-md text-primary-foreground/80">
            Échangeons sur votre projet et voyons comment je peux vous accompagner.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-6 bg-background text-foreground hover:bg-background/90"
          >
            <Link to="/contact">Me contacter</Link>
          </Button>
        </AnimatedSection>
      </article>
    </div>
  );
}
