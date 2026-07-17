import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ServiceCard } from "@/components/ServiceCard";
import { BlogCard } from "@/components/BlogCard";
import { services } from "@/data/services";
import { blogPosts } from "@/data/blog";
import heroImage from "@/assets/hero-illustration.jpg";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Conseil & Création — Accompagnement sur mesure" },
      {
        name: "description",
        content:
          "Auto-entrepreneure freelance en conseil, design et web. Accompagnement sur mesure pour faire grandir vos projets.",
      },
      {
        property: "og:title",
        content: "Conseil & Création — Accompagnement sur mesure",
      },
      {
        property: "og:description",
        content:
          "Auto-entrepreneure freelance en conseil, design et web. Accompagnement sur mesure pour faire grandir vos projets.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  const latestPosts = blogPosts.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container-tight grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-sand px-4 py-1.5 text-xs font-medium text-ink">
              <Sparkles size={14} className="text-terracotta" />
              Auto-entrepreneure disponible pour vos projets
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              Vos projets méritent un accompagnement{" "}
              <span className="text-primary">humain et efficace</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Conseil stratégique, design d'identité et création de sites web pour les entrepreneurs
              qui veulent avancer avec clarté et sérénité.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/services">
                  Découvrir les services
                  <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Link to="/contact">Me contacter</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand">
              <img
                src={heroImage}
                alt="Illustration abstraite terracotta et sauge pour un accompagnement professionnel"
                width={1200}
                height={800}
                className="h-full w-full object-cover"
                fetchPriority="high"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services preview */}
      <section className="section-padding bg-muted/30">
        <div className="container-tight">
          <AnimatedSection className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Des services pensés pour avancer sereinement
            </h2>
            <p className="mt-4 text-muted-foreground">
              Que vous ayez besoin d'un coup de pouce stratégique, d'une identité visuelle ou d'un
              site web, chaque prestation s'adapte à vos objectifs.
            </p>
          </AnimatedSection>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => (
              <AnimatedSection key={service.id} delay={index * 0.1}>
                <ServiceCard service={service} />
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={0.4} className="mt-10 text-center">
            <Button
              asChild
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Link to="/services">Voir tous les services et tarifs</Link>
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA band */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-tight text-center">
          <AnimatedSection>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Prêt à donner vie à votre projet ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Discutons de votre besoin et voyons ensemble comment avancer. Le premier échange est
              sans engagement.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-background text-foreground hover:bg-background/90"
            >
              <Link to="/contact">Prendre rendez-vous</Link>
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* Latest blog posts */}
      <section className="section-padding bg-background">
        <div className="container-tight">
          <AnimatedSection className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                Derniers articles du blog
              </h2>
              <p className="mt-2 text-muted-foreground">
                Conseils, retours d'expérience et astices pour les entrepreneurs.
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              className="text-primary hover:bg-primary/10 hover:text-primary"
            >
              <Link to="/blog">Tous les articles</Link>
            </Button>
          </AnimatedSection>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((post, index) => (
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
