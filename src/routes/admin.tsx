import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  LogOut,
  Plus,
  Trash2,
  Eye,
  Pencil,
  ArrowLeft,
  Paperclip,
  Lock,
  Star,
  X,
  Bell,
  Mail,
  Users,
  FileEdit,
  CalendarClock,
  AlertCircle,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ARTICLE_CATEGORIES,
  fetchAllArticles,
  formatDate,
  formatDateTime,
  getArticleStatus,
  getAttachments,
  slugify,
  type Article,
  type ArticleAttachment,
  type ArticleStatus,
} from "@/lib/articles";
import { describeDbError } from "@/lib/db-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { notifySubscribersOfArticle } from "@/lib/subscribers.functions";

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
  status: ArticleStatus;
  scheduled_at: string;
  is_private: boolean;
  featured: boolean;
  attachments: ArticleAttachment[];
};

const emptyDraft: Draft = {
  id: null,
  title: "",
  slug: "",
  category: "Article",
  excerpt: "",
  content: "",
  cover_url: "",
  status: "publie",
  scheduled_at: "",
  is_private: false,
  featured: false,
  attachments: [],
};

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** ISO -> valeur d'un <input type="datetime-local"> en heure locale. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultSchedule(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return toLocalInput(d.toISOString());
}

async function uploadAttachment(file: File): Promise<ArticleAttachment> {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const path = `${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage
    .from("article-files")
    .upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("article-files")
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data) throw signErr ?? new Error("URL indisponible");
  return { name: file.name, url: data.signedUrl, size: file.size };
}

function AdminPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading, user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [tab, setTab] = useState<"articles" | "messages" | "abonnes">("articles");
  const notifyFn = useServerFn(notifySubscribersOfArticle);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: fetchAllArticles,
    enabled: Boolean(session) && isAdmin,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["admin-contact-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(session) && isAdmin,
  });

  const { data: subscribers = [] } = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(session) && isAdmin,
  });

  const unreadCount = messages.filter((m) => !m.is_read).length;

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const slug = d.slug ? slugify(d.slug) : slugify(d.title);
      const scheduledIso =
        d.status === "programme" && d.scheduled_at
          ? new Date(d.scheduled_at).toISOString()
          : null;
      const isPublished = d.status !== "brouillon";
      const payload = {
        title: d.title.trim(),
        slug,
        category: d.category,
        excerpt: d.excerpt.trim() || null,
        content: d.content,
        cover_url: d.cover_url.trim() || null,
        published: isPublished,
        scheduled_at: scheduledIso,
        is_private: d.is_private,
        featured: d.featured,
        attachments: d.attachments,
        published_at: isPublished ? (scheduledIso ?? new Date().toISOString()) : null,
        author_id: user?.id ?? null,
      };
      if (d.id) {
        if (d.featured) {
          await supabase
            .from("articles")
            .update({ featured: false })
            .neq("id", d.id)
            .eq("featured", true);
        }
        const { error } = await supabase
          .from("articles")
          .update({
            ...payload,
            // la date de parution existante est préservée, sauf programmation
            published_at: scheduledIso ?? undefined,
          })
          .eq("id", d.id);
        if (error) throw error;
        if (isPublished && !scheduledIso) {
          await supabase
            .from("articles")
            .update({ published_at: new Date().toISOString() })
            .eq("id", d.id)
            .is("published_at", null);
        }
        if (!isPublished) {
          await supabase
            .from("articles")
            .update({ published_at: null })
            .eq("id", d.id);
        }
      } else {
        if (d.featured) {
          await supabase
            .from("articles")
            .update({ featured: false })
            .eq("featured", true);
        }
        const { error } = await supabase.from("articles").insert(payload);
        if (error) throw error;
      }
      return slug;
    },
    onSuccess: () => {
      toast.success("Article enregistré");
      setSaveError(null);
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setDraft(null);
    },
    onError: (err: unknown) => {
      const detail = describeDbError(err);
      setSaveError(detail);
      toast.error("Enregistrement impossible", {
        description: detail,
        duration: 12000,
      });
      console.error("[admin] échec d'enregistrement de l'article", err);
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
              setSaveError(null);
              const text = draft.content.replace(/<[^>]*>/g, "").trim();
              if (!text && !draft.content.includes("<img")) {
                toast.error("Le contenu de l'article est vide.");
                return;
              }
              if (draft.status === "programme") {
                if (!draft.scheduled_at) {
                  toast.error("Choisissez une date de publication différée.");
                  return;
                }
                if (new Date(draft.scheduled_at) <= new Date()) {
                  toast.error("La date de publication doit être dans le futur.");
                  return;
                }
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

            {saveError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-destructive">
                    L'article n'a pas pu être enregistré
                  </p>
                  <p className="text-xs leading-relaxed text-foreground/80 break-words">
                    {saveError}
                  </p>
                </div>
              </div>
            )}

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

            <div className="space-y-2">
              <Label>Fichiers joints (PDF, images, documents…)</Label>
              <div className="space-y-2">
                {draft.attachments.map((f, i) => (
                  <div
                    key={f.url}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{f.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          attachments: draft.attachments.filter((_, j) => j !== i),
                        })
                      }
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Retirer ${f.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <input
                id="attachments"
                type="file"
                multiple
                disabled={uploadingFile}
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  if (files.length === 0) return;
                  setUploadingFile(true);
                  try {
                    const uploaded = await Promise.all(files.map(uploadAttachment));
                    setDraft((d) =>
                      d ? { ...d, attachments: [...d.attachments, ...uploaded] } : d,
                    );
                    toast.success("Fichier(s) ajouté(s)");
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : "Échec de l'import",
                    );
                  } finally {
                    setUploadingFile(false);
                  }
                }}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
              />
              {uploadingFile && (
                <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Import en cours…
                </p>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-background p-4">
              <p className="text-sm font-medium text-foreground">Statut de publication</p>
              <div className="space-y-2">
                {(
                  [
                    ["brouillon", "Brouillon — non visible sur le site"],
                    ["publie", "Publier immédiatement"],
                    ["programme", "Publication différée (à une date et heure)"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={draft.status === value}
                      onChange={() =>
                        setDraft({
                          ...draft,
                          status: value,
                          scheduled_at:
                            value === "programme"
                              ? draft.scheduled_at || defaultSchedule()
                              : "",
                        })
                      }
                      className="h-4 w-4 accent-[var(--color-primary)]"
                    />
                    {value === "brouillon" && (
                      <FileEdit className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {value === "programme" && (
                      <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {label}
                  </label>
                ))}
              </div>
              {draft.status === "programme" && (
                <div className="space-y-1 pl-6">
                  <Label htmlFor="scheduled_at" className="text-xs">
                    Date et heure de mise en ligne
                  </Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    required
                    value={draft.scheduled_at}
                    min={toLocalInput(new Date().toISOString())}
                    onChange={(e) =>
                      setDraft({ ...draft, scheduled_at: e.target.value })
                    }
                    className="max-w-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    L'article apparaîtra automatiquement sur le site à cette date.
                  </p>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={draft.is_private}
                  onChange={(e) =>
                    setDraft({ ...draft, is_private: e.target.checked })
                  }
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Article privé (visible uniquement depuis cet espace)
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                <Star className="h-3.5 w-3.5 text-muted-foreground" />
                Mettre en avant en première page
              </label>
            </div>

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
            <div className="mt-8 flex flex-wrap gap-2">
              {(
                [
                  ["articles", `Articles (${articles.length})`],
                  ["messages", `Messages${unreadCount ? ` (${unreadCount})` : ""}`],
                  ["abonnes", `Abonnés (${subscribers.length})`],
                ] as const
              ).map(([key, label]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={tab === key ? "default" : "outline"}
                  onClick={() => setTab(key)}
                >
                  {key === "messages" && <Mail className="mr-2 h-4 w-4" />}
                  {key === "abonnes" && <Users className="mr-2 h-4 w-4" />}
                  {label}
                </Button>
              ))}
            </div>

            {tab === "messages" && (
              <div className="mt-8 space-y-3">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucun message reçu pour le moment.
                  </p>
                )}
                {messages.map((m) => (
                  <details
                    key={m.id}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <summary className="cursor-pointer list-none">
                      <span className="flex flex-wrap items-center gap-2">
                        {!m.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                        <span className="font-medium text-foreground">
                          {m.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {m.project_type} · {formatDate(m.created_at)}
                        </span>
                      </span>
                    </summary>
                    <div className="mt-3 space-y-2 text-sm text-foreground">
                      <p className="text-muted-foreground">
                        {m.email}
                        {m.phone ? ` · ${m.phone}` : ""}
                        {m.structure ? ` · ${m.structure}` : ""}
                      </p>
                      {(m.budget || m.deadline) && (
                        <p className="text-xs text-muted-foreground">
                          Budget : {m.budget || "—"} · Délai : {m.deadline || "—"}
                        </p>
                      )}
                      <p className="whitespace-pre-line">{m.description}</p>
                      {m.attachment_name && (
                        <p className="text-xs text-muted-foreground">
                          Fichier joint : {m.attachment_name}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button asChild size="sm" variant="outline">
                          <a href={`mailto:${m.email}`}>Répondre</a>
                        </Button>
                        {!m.is_read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await supabase
                                .from("contact_requests")
                                .update({ is_read: true })
                                .eq("id", m.id);
                              queryClient.invalidateQueries({
                                queryKey: ["admin-contact-requests"],
                              });
                            }}
                          >
                            Marquer comme lu
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            if (!confirm("Supprimer ce message ?")) return;
                            await supabase
                              .from("contact_requests")
                              .delete()
                              .eq("id", m.id);
                            queryClient.invalidateQueries({
                              queryKey: ["admin-contact-requests"],
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}

            {tab === "abonnes" && (
              <div className="mt-8 space-y-2">
                {subscribers.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucun abonné pour le moment.
                  </p>
                )}
                {subscribers.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {s.email}
                      {!s.active && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          désabonné
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(s.created_at)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          if (!confirm(`Supprimer ${s.email} ?`)) return;
                          await supabase
                            .from("blog_subscribers")
                            .delete()
                            .eq("id", s.id);
                          queryClient.invalidateQueries({
                            queryKey: ["admin-subscribers"],
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {tab === "articles" && (
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
                      {getArticleStatus(a) === "brouillon" && "brouillon"}
                      {getArticleStatus(a) === "programme" &&
                        `programmé pour le ${formatDateTime(a.scheduled_at)}`}
                      {getArticleStatus(a) === "publie" &&
                        `publié ${formatDate(a.published_at ?? a.created_at)}`}
                      {a.is_private && " · privé"}
                      {a.featured && " · à la une"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getArticleStatus(a) === "publie" && (
                      <Button asChild size="sm" variant="ghost">
                        <a href={`/articles/${a.slug}`} target="_blank" rel="noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {getArticleStatus(a) === "publie" && !a.is_private && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Notifier les abonnés"
                        disabled={notifyingId === a.id}
                        onClick={async () => {
                          if (
                            !confirm(
                              `Envoyer une notification aux abonnés pour « ${a.title} » ?`,
                            )
                          )
                            return;
                          setNotifyingId(a.id);
                          try {
                            const res = await notifyFn({
                              data: { articleId: a.id },
                            });
                            toast.success(
                              `Notification envoyée à ${res.sent} abonné(s).`,
                            );
                          } catch (err) {
                            toast.error(
                              err instanceof Error ? err.message : "Envoi impossible",
                            );
                          } finally {
                            setNotifyingId(null);
                          }
                        }}
                      >
                        {notifyingId === a.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
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
                          status: getArticleStatus(a),
                          scheduled_at: toLocalInput(a.scheduled_at),
                          is_private: a.is_private,
                          featured: a.featured,
                          attachments: getAttachments(a),
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
          </>
        )}
      </div>
    </section>
  );
}