import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const BUCKET = "article-images";

export type PortfolioItem = {
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
  published: boolean;
  sort_order: number;
};

type Draft = Omit<PortfolioItem, "id"> & { id?: string };

const emptyDraft: Draft = {
  title: "",
  client: "",
  category: "Création",
  year: new Date().getFullYear(),
  description: "",
  images: [],
  cover_url: null,
  link_url: "",
  tags: [],
  published: false,
  sort_order: 0,
};

function toItem(row: Record<string, unknown>): PortfolioItem {
  return {
    id: String(row["id"]),
    title: String(row["title"] ?? ""),
    client: (row["client"] as string | null) ?? null,
    category: String(row["category"] ?? "Création"),
    year: (row["year"] as number | null) ?? null,
    description: String(row["description"] ?? ""),
    images: Array.isArray(row["images"]) ? (row["images"] as string[]) : [],
    cover_url: (row["cover_url"] as string | null) ?? null,
    link_url: (row["link_url"] as string | null) ?? null,
    tags: Array.isArray(row["tags"]) ? (row["tags"] as string[]) : [],
    published: Boolean(row["published"]),
    sort_order: Number(row["sort_order"] ?? 0),
  };
}

async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `portfolio/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, TEN_YEARS);
  if (signErr || !data) throw signErr ?? new Error("URL indisponible");
  return data.signedUrl;
}

export function PortfolioPanel() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-portfolio"],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("portfolio_items")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (err) throw err;
      return (data ?? []).map((row) => toItem(row as Record<string, unknown>));
    },
  });

  const save = useMutation({
    mutationFn: async (value: Draft) => {
      const payload = {
        title: value.title.trim(),
        client: value.client?.trim() || null,
        category: value.category.trim() || "Création",
        year: value.year ?? null,
        description: value.description,
        images: value.images,
        cover_url: value.cover_url ?? value.images[0] ?? null,
        link_url: value.link_url?.trim() || null,
        tags: value.tags,
        published: value.published,
        sort_order: value.sort_order,
      };
      if (value.id) {
        const { error: err } = await supabase.from("portfolio_items").update(payload).eq("id", value.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from("portfolio_items").insert(payload);
        if (err) throw err;
      }
    },
    onSuccess: () => {
      setDraft(null);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] });
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : "Enregistrement impossible."),
  });

  const toggle = useMutation({
    mutationFn: async (item: PortfolioItem) => {
      const { error: err } = await supabase
        .from("portfolio_items")
        .update({ published: !item.published })
        .eq("id", item.id);
      if (err) throw err;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error: err } = await supabase.from("portfolio_items").delete().eq("id", id);
      if (err) throw err;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] }),
  });

  const onFiles = async (files: FileList | null) => {
    if (!files?.length || !draft) return;
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) urls.push(await uploadImage(file));
      setDraft({ ...draft, images: [...draft.images, ...urls] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import impossible.");
    } finally {
      setUploading(false);
    }
  };

  if (draft) {
    return (
      <form
        className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.title.trim()) {
            setError("Le titre est obligatoire.");
            return;
          }
          save.mutate(draft);
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-lg font-bold text-foreground">
            {draft.id ? "Modifier la réalisation" : "Nouvelle réalisation"}
          </h3>
          <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="pf-title">Titre</Label>
            <Input id="pf-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="pf-client">Client (facultatif)</Label>
            <Input
              id="pf-client"
              value={draft.client ?? ""}
              onChange={(e) => setDraft({ ...draft, client: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="pf-cat">Catégorie</Label>
            <Input id="pf-cat" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="pf-year">Année</Label>
            <Input
              id="pf-year"
              type="number"
              value={draft.year ?? ""}
              onChange={(e) => setDraft({ ...draft, year: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="pf-desc">Description</Label>
          <Textarea
            id="pf-desc"
            rows={5}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="pf-link">Lien (facultatif)</Label>
            <Input
              id="pf-link"
              value={draft.link_url ?? ""}
              onChange={(e) => setDraft({ ...draft, link_url: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="pf-tags">Étiquettes (séparées par une virgule)</Label>
            <Input
              id="pf-tags"
              value={draft.tags.join(", ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                })
              }
            />
          </div>
        </div>

        <div>
          <Label>Photos</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {draft.images.map((url) => (
              <div key={url} className="relative">
                <img src={url} alt="" className="h-24 w-24 rounded-lg border border-border object-cover" />
                <button
                  type="button"
                  aria-label="Retirer la photo"
                  className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-destructive text-destructive-foreground"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      images: draft.images.filter((u) => u !== url),
                      cover_url: draft.cover_url === url ? null : draft.cover_url,
                    })
                  }
                >
                  <X className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  className="mt-1 block w-24 truncate rounded border border-border px-1 text-[10px] text-muted-foreground"
                  onClick={() => setDraft({ ...draft, cover_url: url })}
                >
                  {draft.cover_url === url ? "Image principale" : "Définir"}
                </button>
              </div>
            ))}
            <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-lg border border-dashed border-border text-muted-foreground">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void onFiles(e.target.files)}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
            />
            Visible sur le site
          </label>
          <div className="flex items-center gap-2 text-sm">
            <Label htmlFor="pf-order" className="text-muted-foreground">Ordre</Label>
            <Input
              id="pf-order"
              type="number"
              className="w-24"
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
            />
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enregistrer
          </Button>
          <Button type="button" variant="outline" onClick={() => setDraft(null)}>
            Annuler
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Vos réalisations terminées, affichées sur la page publique « Réalisations ».
        </p>
        <Button size="sm" onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          Aucune réalisation pour le moment. Ajoutez votre première création.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              {item.cover_url ? (
                <img src={item.cover_url} alt="" className="h-36 w-full object-cover" />
              ) : null}
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[item.category, item.client, item.year].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                      item.published ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.published ? "En ligne" : "Brouillon"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setDraft({ ...item })}>
                    <Pencil className="mr-2 h-3.5 w-3.5" /> Modifier
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggle.mutate(item)}>
                    {item.published ? <EyeOff className="mr-2 h-3.5 w-3.5" /> : <Eye className="mr-2 h-3.5 w-3.5" />}
                    {item.published ? "Masquer" : "Publier"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => {
                      if (window.confirm(`Supprimer définitivement « ${item.title} » ?`)) remove.mutate(item.id);
                    }}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
