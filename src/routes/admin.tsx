import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut, Plus, Trash2, Eye, Pencil, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ARTICLE_CATEGORIES,
  fetchAllArticles,
  formatDate,
  slugify,
  type Article,
} from "@/lib/articles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Mes publications | Espace personnel" },
      {
        name: "description",
        content:
          "Espace de rédaction privé : création, modification et publication des actualités du site Angel Leclerc Communication.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Mes publications | Espace personnel" },
      {
        property: "og:description",
        content: "Rédaction et publication des actualités du site.",
      },
      { name: "twitter:title", content: "Mes publications | Espace personnel" },
      {
        name: "twitter:description",
        content: "Rédaction et publication des actualités du site.",
      },
    ],
  }),
  component: AdminPage,
});

type Draft = {
  id: string | null;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  cover_url: string;
  published: boolean;
};

const emptyDraft: Draft = {
  id: null,
  title: "",
  slug: "",
  category: "Article",
  excerpt: "",
  content: "",
  cover_url: "",
  published: true,
};

function AdminPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading, user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: fetchAllArticles,
    enabled: Boolean(session) && isAdmin,
  });

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const slug = d.slug ? slugify(d.slug) : slugify(d.title);
      const payload = {
        title: d.title.trim(),
        slug,
        category: d.category,
        excerpt: d.excerpt.trim() || null,
        content: d.content,
        cover_url: d.cover_url.trim() || null,
        published: d.published,
        published_at: d.published ? new Date().toISOString() : null,
        author_id: user?.id ?? null,
      };
      if (d.id) {
        const { error } = await supabase
          .from("articles")
          .update({ ...payload, published_at: undefined })
          .eq("id", d.id);
        if (error) throw error;
        if (d.published) {
          await supabase
            .from("articles")
            .update({ published_at: new Date().toISOString() })
            .eq("id", d.id)
            .is("published_at", null);
        }
      } else {
        const { error } = await supabase.from("articles").insert(payload);
        if (error) throw error;
      }
      return slug;
    },
    onSuccess: () => {
      toast.success("Article enregistré");
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setDraft(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(
        message.includes("duplicate key")
          ? "Un article utilise déjà ce lien (slug). Modifiez-le."
          : message,
      );
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Article supprimé");
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });

  const previewSlug = useMemo(
    () => (draft ? slugify(draft.slug || draft.title) : ""),
    [draft],
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (session && !isAdmin) {
    return (
      <section className="bg-background py-20">
        <div className="mx-auto max-w-md px-5 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Accès non autorisé
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Ce compte n'a pas les droits de publication.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background py-12 md:py-16">
      <div className="container-tight">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Espace personnel
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Mes publications
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/articles">
                <Eye className="mr-2 h-4 w-4" /> Voir le site
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Déconnexion
            </Button>
          </div>
        </div>

        {draft ? (
          <form
            className="mt-10 space-y-5 rounded-xl border border-border bg-card p-6"
            onSubmit={(e) => {
              e.preventDefault();
              const text = draft.content.replace(/<[^>]*>/g, "").trim();
              if (!text && !draft.content.includes("<img")) {
                toast.error("Le contenu de l'article est vide.");
                return;
              }
              save.mutate(draft);
            }}
          >
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Retour à la liste
            </button>

            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                required
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <select
                  id="category"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {ARTICLE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Lien de la page (optionnel)</Label>
                <Input
                  id="slug"
                  placeholder="généré à partir du titre"
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">
                  /articles/{previewSlug || "…"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Chapô / résumé</Label>
              <Textarea
                id="excerpt"
                rows={2}
                value={draft.excerpt}
                onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover">Image de couverture (URL, optionnel)</Label>
              <Input
                id="cover"
                type="url"
                placeholder="https://…"
                value={draft.cover_url}
                onChange={(e) => setDraft({ ...draft, cover_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenu *</Label>
              <RichTextEditor
                value={draft.content}
                onChange={(html) => setDraft({ ...draft, content: html })}
              />
              <p className="text-[11px] text-muted-foreground">
                Gras, italique, titres, listes, liens et images : utilisez la barre
                d'outils ci-dessus.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Publier immédiatement sur le site
            </label>

            <div className="flex gap-2">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Valider et enregistrer
              </Button>
              <Button type="button" variant="outline" onClick={() => setDraft(null)}>
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <>
            <Button className="mt-8" onClick={() => setDraft({ ...emptyDraft })}>
              <Plus className="mr-2 h-4 w-4" /> Nouvel article
            </Button>

            <div className="mt-8 space-y-3">
              {isLoading && (
                <p className="text-sm text-muted-foreground">Chargement…</p>
              )}
              {!isLoading && articles.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucun article pour le moment. Cliquez sur « Nouvel article ».
                </p>
              )}
              {articles.map((a: Article) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{a.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.category} ·{" "}
                      {a.published
                        ? `publié ${formatDate(a.published_at ?? a.created_at)}`
                        : "brouillon"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {a.published && (
                      <Button asChild size="sm" variant="ghost">
                        <a href={`/articles/${a.slug}`} target="_blank" rel="noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setDraft({
                          id: a.id,
                          title: a.title,
                          slug: a.slug,
                          category: a.category,
                          excerpt: a.excerpt ?? "",
                          content: a.content,
                          cover_url: a.cover_url ?? "",
                          published: a.published,
                        })
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Supprimer « ${a.title} » ?`)) remove.mutate(a.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}