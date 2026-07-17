import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { BlogPost } from "@/data/blog";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to="/blog/$slug" params={{ slug: post.slug }} className="block h-full">
        <Card className="h-full border-border bg-card transition-shadow hover:shadow-lg overflow-hidden">
          <CardHeader className="pb-3">
            <Badge variant="secondary" className="w-fit bg-sand text-ink hover:bg-sand">
              {post.category}
            </Badge>
            <CardTitle className="font-display text-lg font-semibold text-card-foreground leading-snug">
              {post.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {post.excerpt}
            </p>
            <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date(post.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {post.readTime}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
