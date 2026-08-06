import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { describeDbError } from "@/lib/db-error";
import {
  AUDIO_KINDS,
  fetchAllAudioItems,
  kindLabel,
  type AudioItem,
} from "@/lib/audio";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

type Draft = {
  id: string | null;
  title: string;
  author: string;
  description: string;
  kind: string;
  audio_url: string;
  image_url: string;
  duration_seconds: string;
  source_label: string;
  source_url: string;
  published: boolean;
  in_radio: boolean;
  sort_order: number;
};

function emptyDraft(sortOrder: number): Draft {
  return {
    id: null,
    title: "",
    author: "",
    description: "",
    kind: "musique",
    audio_url: "",
    image_url: "",
    duration_seconds: "",
    source_label: "",
    source_url: "",
    published: false,
    in_radio: true,
    sort_order: sortOrder,
  };
}

function toDraft(item: AudioItem): Draft {
  return {
    id: item.id,
    title: item.title,
    author: item.author ?? "",
    description: item.description ?? "",
    kind: item.kind,
    audio_url: item.audio_url,
    image_url: item.image_url ?? "",
    duration_seconds: item.duration_seconds ? String(item.duration_seconds) : "",
    source_label: item.source_label ?? "",
    source_url: item.source_url ?? "",
    published: item.published,
    in_radio: item.in_radio,
    sort_order: item.sort_order,
  };
}

/** Envoie un fichier dans le stockage existant et renvoie une URL signée longue durée. */
async function uploadAudio(file: File): Promise<string> {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const path = `audio/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage
    .from("article-files")
    .upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("article-files")
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data) throw signErr ?? new Error("URL indisponible");
  return data.signedUrl;
}

export function AudioAdmin() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"audio" | "image" | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-audio"],
    queryFn: fetchAllAudioItems,
  });

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.sort_order - b.sort_order),
    [items],
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-audio"] });
    queryClient.invalidateQueries({ queryKey: ["radio-playlist"] });
    queryClient.invalidateQueries({ queryKey: ["podcasts"] });
  };

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const payload = {
        title: d.title.trim(),
        author: d.author.trim() || null,
        description: d.description.trim() || null,
        kind: d.kind,
        audio_url: d.audio_url.trim(),
        image_url: d.image_url.trim() || null,
        duration_seconds: d.duration_seconds ? Number(d.duration_seconds) : null,
        source_label: d.source_label.trim() || null,
        source_url: d.source_url.trim() || null,
        published: d.published,
        in_radio: d.in_radio,
        sort_order: Number(d.sort_order) || 0,
      };
      if (d.id) {
        const { error } = await supabase
          .from("audio_items")
          .update(payload)
          .eq("id", d.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("audio_items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setDraft(null);
      setError(null);
      invalidate();
      toast.success("Contenu audio enregistré");
    },
    onError: (e) => {
      const message = describeDbError(e);
      setError(message);
      toast.error(message, { duration: 10000 });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("audio_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Contenu supprimé");
    },
    onError: (e) => toast.error(describeDbError(e), { duration: 10000 }),
  });

  if (draft) {
    return (
      <form
        className="mt-8 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.title.trim()) return setError("Le titre est obligatoire.");
          if (!draft.audio_url.trim())
            return setError("Un fichier ou une URL audio est obligatoire.");
          save.mutate(draft);
        }}
      >
        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="a-title">Titre</Label>
            <Input
              id="a-title"
              className="mt-1"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="a-author">Auteur / source</Label>
            <Input
              id="a-author"
              className="mt-1"
              value={draft.author}
              onChange={(e) => setDraft({ ...draft, author: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="a-desc">Description</Label>
          <Textarea
            id="a-desc"
            className="mt-1 min-h-24"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="a-kind">Type de contenu</Label>
            <select
              id="a-kind"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.kind}
              onChange={(e) => setDraft({ ...draft, kind: e.target.value })}
            >
              {AUDIO_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="a-order">Ordre de lecture</Label>
            <Input
              id="a-order"
              type="number"
              className="mt-1"
              value={draft.sort_order}
              onChange={(e) =>
                setDraft({ ...draft, sort_order: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div>
          <Label htmlFor="a-url">Fichier audio ou URL audio directe</Label>
          <Input
            id="a-url"
            className="mt-1"
            placeholder="https://… (.mp3, .m4a, .ogg)"
            value={draft.audio_url}
            onChange={(e) => setDraft({ ...draft, audio_url: e.target.value })}
          />
          <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-primary">
            {uploading === "audio" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Envoyer un fichier audio
            <input
              type="file"
              accept="audio/*"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setUploading("audio");
                try {
                  const url = await uploadAudio(file);
                  setDraft((d) => (d ? { ...d, audio_url: url } : d));
                  toast.success("Fichier audio envoyé");
                } catch (err) {
                  toast.error(describeDbError(err));
                } finally {
                  setUploading(null);
                }
              }}
            />
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Utilisez uniquement des fichiers dont vous détenez les droits. Aucune
            extraction depuis YouTube.
          </p>
        </div>

        <div>
          <Label htmlFor="a-image">Image (URL, facultatif)</Label>
          <Input
            id="a-image"
            className="mt-1"
            value={draft.image_url}
            onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
          />
          <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-primary">
            {uploading === "image" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Envoyer une image
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setUploading("image");
                try {
                  const url = await uploadAudio(file);
                  setDraft((d) => (d ? { ...d, image_url: url } : d));
                  toast.success("Image envoyée");
                } catch (err) {
                  toast.error(describeDbError(err));
                } finally {
                  setUploading(null);
                }
              }}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="a-duration">Durée (secondes, facultatif)</Label>
            <Input
              id="a-duration"
              type="number"
              className="mt-1"
              value={draft.duration_seconds}
              onChange={(e) =>
                setDraft({ ...draft, duration_seconds: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="a-source">Source / licence (facultatif)</Label>
            <Input
              id="a-source"
              className="mt-1"
              value={draft.source_label}
              onChange={(e) => setDraft({ ...draft, source_label: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="a-source-url">Lien de la source (facultatif)</Label>
            <Input
              id="a-source-url"
              className="mt-1"
              value={draft.source_url}
              onChange={(e) => setDraft({ ...draft, source_url: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
            />
            Publié (visible sur le site)
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={draft.in_radio}
              onChange={(e) => setDraft({ ...draft, in_radio: e.target.checked })}
            />
            Diffusé dans SKINGOMZ (playlist radio)
          </label>
          <p className="text-xs text-muted-foreground">
            Les contenus de type « Podcast » publiés apparaissent dans « Mes podcasts ».
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraft(null);
              setError(null);
            }}
          >
            Annuler
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-8">
      <Button
        size="sm"
        onClick={() => setDraft(emptyDraft((sorted.at(-1)?.sort_order ?? 0) + 10))}
      >
        <Plus className="mr-2 h-4 w-4" /> Ajouter un contenu audio
      </Button>

      {isLoading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : sorted.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Aucun contenu audio pour le moment.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {sorted.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {[kindLabel(item.kind), item.author].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                    {item.published ? "Publié" : "Brouillon"}
                  </span>
                  {item.in_radio && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                      SKINGOMZ
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Modifier"
                  onClick={() => setDraft(toDraft(item))}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Supprimer"
                  onClick={() => {
                    if (confirm(`Supprimer « ${item.title} » ?`)) remove.mutate(item.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
