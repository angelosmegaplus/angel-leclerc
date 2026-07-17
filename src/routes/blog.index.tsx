import { createFileRoute } from "@tanstack/react-router";
import { AnimatedSection } from "@/components/AnimatedSection";
import { BlogCard } from "@/components/BlogCard";
import { blogPosts } from "@/data/blog";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — Conseil & Création" },
      {
        name: "description",
        content:
          "Retrouvez conseils, astuces et réflexions autour de l'entrepreneuriat, du web et de la création de projet.",
      },
      {
        property: "og:title",
        content: "Blog — Conseil & Création",
      },
      {
        property: "og:description",
        content:
          "Retrouvez conseils, astuces et réflexions autour de l'entrepreneuriat, du web et de la création de projet.",
      },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-muted/30">
        <div className="container-tight py-20 text-center md:py-28">
          <AnimatedSection className="mx-auto max-w-2xl">
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">Blog</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Conseils, astuces et réflexions pour avancer sereinement dans vos projets.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-tight">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post, index) => (
              <AnimatedSection key={post.slug} delay={index * 0.1}>
                <BlogCard post={post} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
