import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TITLE = "Réalisations — Angel Leclerc Communication";
const DESCRIPTION =
  "Quelques créations terminées réalisées par Angel Leclerc Communication : identité visuelle, supports, contenus et projets web.";

export const Route = createFileRoute("/realisations")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/realisations" }],
  }),
  component: RealisationsPage,
});

type Item = {
  id: string;
  title: string;
  client: string | null;
  category: string;
  year: number | null;
  description: string;
  images: string[];
  cover_url: string | null;
  link_url: string | null;
  tags: string[];
};

function RealisationsPage() {
  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ["public-portfolio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("id,title,client,category,year,description,images,cover_url,link_url,tags")
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: String(r["id"]),
          title: String(r["title"] ?? ""),
          client: (r["client"] as string | null) ?? null,
          category: String(r["category"] ?? ""),
          year: (r["year"] as number | null) ?? null,
          description: String(r["description"] ?? ""),
          images: Array.isArray(r["images"]) ? (r["images"] as string[]) : [],
          cover_url: (r["cover_url"] as string | null) ?? null,
          link_url: (r["link_url"] as string | null) ?? null,
          tags: Array.isArray(r["tags"]) ? (r["tags"] as string[]) : [],
        } satisfies Item;
      });
    },
  });

  return (
    <main className="bg-background">
      <div className="container-tight py-12 md:py-16">
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">Réalisations</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
          Quelques travaux terminés, présentés simplement. Cette page se remplit au fil des projets.
        </p>

        {isLoading ? (
          <p className="mt-10 text-sm text-muted-foreground">Chargement…</p>
        ) : isError ? (
          <p className="mt-10 text-sm text-muted-foreground">
            Les réalisations ne sont pas consultables pour le moment. Merci de réessayer plus tard.
          </p>
        ) : items.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Aucune réalisation publiée pour l’instant.
          </p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-sm">
                {item.cover_url ? (
                  <img
                    src={item.cover_url}
                    alt={item.title}
                    loading="lazy"
                    className="h-48 w-full object-cover"
                  />
                ) : null}
                <div className="space-y-2 p-5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {[item.category, item.client, item.year].filter(Boolean).join(" · ")}
                  </p>
                  <h2 className="font-display text-lg font-bold text-foreground">{item.title}</h2>
                  {item.description ? (
                    <p className="whitespace-pre-line text-sm text-muted-foreground">{item.description}</p>
                  ) : null}
                  {item.images.length > 1 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.images.slice(0, 4).map((url) => (
                        <img
                          key={url}
                          src={url}
                          alt=""
                          loading="lazy"
                          className="h-16 w-16 rounded-lg border border-border object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                  {item.tags.length ? (
                    <ul className="flex flex-wrap gap-1.5 pt-1">
                      {item.tags.map((tag) => (
                        <li key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {item.link_url ? (
                    <a
                      href={item.link_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-block pt-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Voir le projet
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
