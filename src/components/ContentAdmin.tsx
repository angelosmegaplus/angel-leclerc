import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { describeDbError } from "@/lib/db-error";
import {
  CONTENT_ICON_NAMES,
  CONTENT_SECTIONS,
  fetchAllContent,
  toStringList,
  toVideoList,
  type ContentItem,
  type ContentSection,
} from "@/lib/content";

type Draft = {
  id: string | null;
  section: ContentSection;
  title: string;
  subtitle: string;
  period: string;
  description: string;
  bullets: string;
  tags: string;
  videos: string;
  extra_label: string;
  extra_value: string;
  logo_domain: string;
  icon: string;
  url: string;
  link_label: string;
  sort_order: number;
  published: boolean;
};

function emptyDraft(section: ContentSection, sortOrder: number): Draft {
  return {
    id: null,
    section,
    title: "",
    subtitle: "",
    period: "",
    description: "",
    bullets: "",
    tags: "",
    videos: "",
    extra_label: "",
    extra_value: "",
    logo_domain: "",
    icon: "",
    url: "",
    link_label: "",
    sort_order: sortOrder,
    published: true,
  };
}

function toDraft(item: ContentItem): Draft {
  return {
    id: item.id,
    section: item.section as ContentSection,
    title: item.title,
    subtitle: item.subtitle ?? "",
    period: item.period ?? "",
    description: item.description ?? "",
    bullets: toStringList(item.bullets).join("\n"),
    tags: toStringList(item.tags).join("\n"),
    videos: toVideoList(item.videos)
      .map((v) => (v.title ? `${v.id} | ${v.title}` : v.id))
      .join("\n"),
    extra_label: item.extra_label ?? "",
    extra_value: item.extra_value ?? "",
    logo_domain: item.logo_domain ?? "",
    icon: item.icon ?? "",
    url: item.url ?? "",
    link_label: item.link_label ?? "",
    sort_order: item.sort_order,
    published: item.published,
  };
}

const lines = (value: string) =>
  value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

function parseVideos(value: string) {
  return lines(value).map((line) => {
    const [raw, ...rest] = line.split("|");
    const url = (raw ?? "").trim();
    const match = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{6,})/);
    return { id: match ? match[1] : url, title: rest.join("|").trim() || undefined };
  });
}

function extraLabels(section: ContentSection) {
  if (section === "projet") return { label: "Outils utilisés", value: "Résultats obtenus" };
  if (section === "service_extra") return { label: "", value: "Tarif indicatif" };
  return { label: "Information complémentaire (intitulé)", value: "Information complémentaire" };
}

export function ContentAdmin() {
  const queryClient = useQueryClient();
  const [section, setSection] = useState<ContentSection>("experience");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["content-admin"],
    queryFn: fetchAllContent,
  });

  const sectionItems = useMemo(
    () => items.filter((i) => i.section === section).sort((a, b) => a.sort_order - b.sort_order),
    [items, section],
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["content-admin"] });
    queryClient.invalidateQueries({ queryKey: ["content"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (d: Draft) => {
      const payload = {
        section: d.section,
        title: d.title.trim(),
        subtitle: d.subtitle.trim() || null,
        period: d.period.trim() || null,
        description: d.description.trim() || null,
        bullets: lines(d.bullets),
        tags: lines(d.tags),
        videos: parseVideos(d.videos),
        extra_label: d.extra_label.trim() || null,
        extra_value: d.extra_value.trim() || null,
        logo_domain: d.logo_domain.trim() || null,
        icon: d.icon.trim() || null,
        url: d.url.trim() || null,
        link_label: d.link_label.trim() || null,
        sort_order: Number(d.sort_order) || 0,
        published: d.published,
      };
      if (d.id) {
        const { error } = await supabase.from("content_items").update(payload).eq("id", d.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("content_items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setDraft(null);
      setError(null);
      invalidate();
      toast.success("Contenu enregistré");
    },
    onError: (e) => {
      const message = describeDbError(e);
      setError(message);
      toast.error(message, { duration: 10000 });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Élément supprimé");
    },
    onError: (e) => toast.error(describeDbError(e), { duration: 10000 }),
  });

  const patchMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Partial<{ published: boolean; sort_order: number }>;
    }) => {
      const { error } = await supabase.from("content_items").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e) => toast.error(describeDbError(e), { duration: 10000 }),
  });

  const move = (index: number, direction: -1 | 1) => {
    const current = sectionItems[index];
    const target = sectionItems[index + direction];
    if (!current || !target) return;
    patchMutation.mutate({ id: current.id, values: { sort_order: target.sort_order } });
    patchMutation.mutate({ id: target.id, values: { sort_order: current.sort_order } });
  };

  const labels = extraLabels(draft?.section ?? section);

  if (draft) {
    return (
      <form
        className="mt-8 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.title.trim()) {
            setError("Le titre est obligatoire.");
            return;
          }
          saveMutation.mutate(draft);
        }}
      >
        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="c-section">Rubrique</Label>
            <select
              id="c-section"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.section}
              onChange={(e) => setDraft({ ...draft, section: e.target.value as ContentSection })}
            >
              {CONTENT_SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.page} — {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="c-order">Ordre d'affichage</Label>
            <Input
              id="c-order"
              type="number"
              className="mt-1"
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="c-title">Titre (poste, diplôme, projet…)</Label>
          <Input
            id="c-title"
            className="mt-1"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="c-subtitle">Structure / organisme</Label>
            <Input
              id="c-subtitle"
              className="mt-1"
              value={draft.subtitle}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="c-period">Période</Label>
            <Input
              id="c-period"
              className="mt-1"
              placeholder="2023 – 2025"
              value={draft.period}
              onChange={(e) => setDraft({ ...draft, period: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="c-desc">Description</Label>
          <Textarea
            id="c-desc"
            className="mt-1 min-h-24"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="c-bullets">Points clés (une ligne = une puce)</Label>
          <Textarea
            id="c-bullets"
            className="mt-1 min-h-28"
            value={draft.bullets}
            onChange={(e) => setDraft({ ...draft, bullets: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="c-tags">Étiquettes (une par ligne)</Label>
          <Textarea
            id="c-tags"
            className="mt-1 min-h-16"
            value={draft.tags}
            onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="c-videos">
            Vidéos YouTube (une par ligne : lien ou identifiant, puis « | titre »)
          </Label>
          <Textarea
            id="c-videos"
            className="mt-1 min-h-16"
            value={draft.videos}
            onChange={(e) => setDraft({ ...draft, videos: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {labels.label && (
            <div>
              <Label htmlFor="c-extra-label">{labels.label}</Label>
              <Input
                id="c-extra-label"
                className="mt-1"
                value={draft.extra_label}
                onChange={(e) => setDraft({ ...draft, extra_label: e.target.value })}
              />
            </div>
          )}
          <div>
            <Label htmlFor="c-extra-value">{labels.value}</Label>
            <Input
              id="c-extra-value"
              className="mt-1"
              value={draft.extra_value}
              onChange={(e) => setDraft({ ...draft, extra_value: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="c-logo">Logo — nom de domaine (ex. sarlat.fr)</Label>
            <Input
              id="c-logo"
              className="mt-1"
              value={draft.logo_domain}
              onChange={(e) => setDraft({ ...draft, logo_domain: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="c-icon">Icône (si pas de logo)</Label>
            <select
              id="c-icon"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.icon}
              onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
            >
              <option value="">Aucune</option>
              {CONTENT_ICON_NAMES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="c-url">Lien (facultatif)</Label>
            <Input
              id="c-url"
              className="mt-1"
              placeholder="https://…"
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="c-link-label">Texte du lien</Label>
            <Input
              id="c-link-label"
              className="mt-1"
              placeholder="Voir le projet"
              value={draft.link_label}
              onChange={(e) => setDraft({ ...draft, link_label: e.target.value })}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
          />
          Visible sur le site
        </label>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={section}
          onChange={(e) => setSection(e.target.value as ContentSection)}
        >
          {CONTENT_SECTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.page} — {s.label}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          onClick={() => setDraft(emptyDraft(section, (sectionItems.at(-1)?.sort_order ?? 0) + 10))}
        >
          <Plus className="mr-2 h-4 w-4" /> Ajouter
        </Button>
      </div>

      {isLoading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : sectionItems.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Aucun élément dans cette rubrique pour le moment.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {sectionItems.map((item, index) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {[item.subtitle, item.period].filter(Boolean).join(" · ")}
                </p>
                {!item.published && (
                  <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Masqué
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Monter"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Descendre"
                  disabled={index === sectionItems.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={item.published ? "Masquer" : "Afficher"}
                  onClick={() =>
                    patchMutation.mutate({
                      id: item.id,
                      values: { published: !item.published },
                    })
                  }
                >
                  {item.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
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
                    if (confirm(`Supprimer « ${item.title} » ?`)) deleteMutation.mutate(item.id);
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
