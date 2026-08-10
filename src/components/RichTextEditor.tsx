import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  ImagePlus,
  Youtube,
  Film,
  Music2,
  Radio,
  LayoutGrid,
  Loader2,
  Undo2,
  Redo2,
  Eraser,
  Eye,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { buildEmbedHtml } from "@/lib/embeds";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Extrait l'identifiant d'une vidéo YouTube depuis n'importe quelle forme d'URL. */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  const match = value.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match ? match[1] : null;
}

async function uploadMedia(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("article-images")
    .upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("article-images")
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data) throw signErr ?? new Error("URL indisponible");
  return data.signedUrl;
}

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export function RichTextEditor({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<null | "image" | "video" | "audio">(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && value !== el.innerHTML) el.innerHTML = value || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => onChange(ref.current?.innerHTML ?? "");

  /** Sélection d'une image déjà insérée dans le contenu. */
  const onEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      const img = target as HTMLImageElement;
      ref.current?.querySelectorAll("img").forEach((i) => i.classList.remove("is-selected"));
      img.classList.add("is-selected");
      img.style.outline = "2px solid var(--primary, #CE654B)";
      setSelectedImg(img);
    } else if (selectedImg) {
      selectedImg.style.outline = "";
      selectedImg.classList.remove("is-selected");
      setSelectedImg(null);
    }
  };

  const resizeSelected = (width: string) => {
    if (!selectedImg) return;
    selectedImg.style.width = width;
    selectedImg.style.maxWidth = "100%";
    sync();
  };

  const deleteSelected = () => {
    if (!selectedImg) return;
    selectedImg.remove();
    setSelectedImg(null);
    sync();
  };

  const replaceSelected = async (file: File | undefined, input: HTMLInputElement | null) => {
    if (!file || !selectedImg) return;
    setUploading("image");
    try {
      const url = await uploadMedia(file);
      selectedImg.src = url;
      selectedImg.alt = file.name.replace(/"/g, "");
      sync();
      toast.success("Image remplacée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setUploading(null);
      if (input) input.value = "";
    }
  };

  const cmd = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    sync();
  };

  const insertHtml = (html: string) => {
    ref.current?.focus();
    document.execCommand("insertHTML", false, html);
    sync();
  };

  const onInsertVideo = () => {
    const url = prompt("Lien de la vidéo YouTube (https://youtu.be/…)");
    if (!url) return;
    const id = parseYouTubeId(url);
    if (!id) {
      toast.error("Lien YouTube non reconnu");
      return;
    }
    insertHtml(
      `<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Vidéo YouTube" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><p><br/></p>`,
    );
    toast.success("Vidéo ajoutée");
  };

  const onInsertEmbed = () => {
    const url = prompt(
      "Collez un lien Spotify, Deezer, SoundCloud, Apple Music/Podcasts, Vimeo, Dailymotion, Ausha, YouTube ou un fichier MP4/MP3",
    );
    if (!url) return;
    const embed = buildEmbedHtml(url);
    if (!embed) {
      toast.error("Lien non reconnu ou plateforme non prise en charge");
      return;
    }
    insertHtml(embed.html);
    toast.success(`Contenu ${embed.label} intégré`);
  };

  /** Insère un bloc dédié ne contenant que des vidéos / intégrations externes. */
  const onInsertEmbedSection = () => {
    const title = prompt("Titre du bloc (laissez vide pour aucun titre)", "En vidéo") ?? "";
    const raw = prompt(
      "Collez un lien par ligne (YouTube, Vimeo, Spotify, Deezer, SoundCloud, Apple, Dailymotion, Ausha, MP4/MP3…)",
    );
    if (!raw) return;
    const links = raw
      .split(/[\n\s]+/)
      .map((l) => l.trim())
      .filter(Boolean);
    const parts: string[] = [];
    const rejected: string[] = [];
    for (const link of links) {
      const embed = buildEmbedHtml(link);
      if (embed) parts.push(embed.html.replace(/<p><br\/><\/p>$/, ""));
      else rejected.push(link);
    }
    if (parts.length === 0) {
      toast.error("Aucun lien reconnu");
      return;
    }
    const heading = title.trim()
      ? `<h3>${title.trim().replace(/[<>]/g, "")}</h3>`
      : "";
    const grid = parts.length > 1 ? " is-grid" : "";
    insertHtml(
      `<section class="embed-section${grid}">${heading}${parts.join("")}</section><p><br/></p>`,
    );
    if (rejected.length > 0) {
      toast.warning(`${rejected.length} lien(s) non reconnu(s)`);
    }
    toast.success(`Bloc créé avec ${parts.length} intégration(s)`);
  };

  const onPickMedia = async (
    kind: "image" | "video" | "audio",
    file: File | undefined,
    input: HTMLInputElement | null,
  ) => {
    if (!file) return;
    setUploading(kind);
    try {
      const url = await uploadMedia(file);
      const name = file.name.replace(/"/g, "");
      if (kind === "image") {
        insertHtml(
          `<img src="${url}" alt="${name}" style="max-width:100%;border-radius:12px" /><p><br/></p>`,
        );
        toast.success("Image ajoutée");
      } else if (kind === "video") {
        insertHtml(
          `<video class="media-video" src="${url}" controls playsinline preload="metadata"></video><p><br/></p>`,
        );
        toast.success("Vidéo ajoutée");
      } else {
        insertHtml(
          `<figure class="media-audio"><figcaption>${name}</figcaption><audio src="${url}" controls preload="metadata"></audio></figure><p><br/></p>`,
        );
        toast.success("Audio ajouté");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setUploading(null);
      if (input) input.value = "";
    }
  };

  const btn =
    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <div className="overflow-hidden rounded-md border border-input bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-1.5">
        <button type="button" className={btn} title="Gras" onClick={() => cmd("bold")}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Italique" onClick={() => cmd("italic")}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Souligné" onClick={() => cmd("underline")}>
          <Underline className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={btn} title="Titre" onClick={() => cmd("formatBlock", "<h2>")}>
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Sous-titre" onClick={() => cmd("formatBlock", "<h3>")}>
          <Heading3 className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Citation" onClick={() => cmd("formatBlock", "<blockquote>")}>
          <Quote className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={btn} title="Liste à puces" onClick={() => cmd("insertUnorderedList")}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Liste numérotée" onClick={() => cmd("insertOrderedList")}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button
          type="button"
          className={btn}
          title="Lien"
          onClick={() => {
            const url = prompt("Adresse du lien (https://…)");
            if (url) cmd("createLink", url);
          }}
        >
          <Link2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btn}
          title="Insérer une image"
          onClick={() => fileRef.current?.click()}
          disabled={uploading !== null}
        >
          {uploading === "image" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </button>
        <button
          type="button"
          className={btn}
          title="Insérer une vidéo (MP4)"
          onClick={() => videoRef.current?.click()}
          disabled={uploading !== null}
        >
          {uploading === "video" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
        </button>
        <button
          type="button"
          className={btn}
          title="Insérer un son (MP3, WAV…)"
          onClick={() => audioRef.current?.click()}
          disabled={uploading !== null}
        >
          {uploading === "audio" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Music2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          className={btn}
          title="Insérer une vidéo YouTube"
          onClick={onInsertVideo}
        >
          <Youtube className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btn}
          title="Intégrer Spotify, Deezer, SoundCloud, Apple Music, Vimeo…"
          onClick={onInsertEmbed}
        >
          <Radio className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btn}
          title="Bloc dédié : plusieurs vidéos ou intégrations"
          onClick={onInsertEmbedSection}
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={btn} title="Annuler" onClick={() => cmd("undo")}>
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Rétablir" onClick={() => cmd("redo")}>
          <Redo2 className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Effacer la mise en forme" onClick={() => cmd("removeFormat")}>
          <Eraser className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button
          type="button"
          className={`${btn} ${preview ? "bg-primary/10 text-primary" : ""}`}
          title={preview ? "Revenir à l'édition" : "Aperçu de l'article"}
          onClick={() => setPreview((v) => !v)}
        >
          {preview ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="ml-1.5 text-xs font-medium">
            {preview ? "Éditer" : "Aperçu"}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickMedia("image", e.target.files?.[0], fileRef.current)}
        />
        <input
          ref={videoRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/*"
          className="hidden"
          onChange={(e) => onPickMedia("video", e.target.files?.[0], videoRef.current)}
        />
        <input
          ref={audioRef}
          type="file"
          accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/*"
          className="hidden"
          onChange={(e) => onPickMedia("audio", e.target.files?.[0], audioRef.current)}
        />
      </div>
      {selectedImg && !preview && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary/5 px-3 py-2 text-xs">
          <span className="font-medium text-foreground">Image sélectionnée :</span>
          {(["25%", "50%", "75%", "100%"] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => resizeSelected(w)}
              className="rounded-md border border-border bg-background px-2 py-1 text-foreground hover:bg-muted"
            >
              {w}
            </button>
          ))}
          <button
            type="button"
            onClick={() => replaceRef.current?.click()}
            className="rounded-md border border-border bg-background px-2 py-1 text-foreground hover:bg-muted"
          >
            Remplacer
          </button>
          <button
            type="button"
            onClick={deleteSelected}
            className="rounded-md border border-border bg-background px-2 py-1 text-destructive hover:bg-muted"
          >
            Supprimer
          </button>
          <input
            ref={replaceRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void replaceSelected(e.target.files?.[0], replaceRef.current)}
          />
        </div>
      )}
      {preview && (
        <div className="border-t border-border bg-background px-4 py-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Aperçu — rendu tel qu'il apparaîtra sur le site
          </p>
          <div
            className="article-content text-sm leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: value || "<p>Aucun contenu pour le moment.</p>" }}
          />
        </div>
      )}
      <div
        hidden={preview}
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Contenu de l'article"
        onInput={sync}
        onBlur={sync}
        onClick={onEditorClick}
        className="article-content min-h-[320px] w-full px-4 py-3 text-sm leading-relaxed text-foreground outline-none"
      />
    </div>
  );
}
