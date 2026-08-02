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
  Loader2,
  Undo2,
  Redo2,
  Eraser,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el && value !== el.innerHTML) el.innerHTML = value || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => onChange(ref.current?.innerHTML ?? "");

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

  const onPickImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      insertHtml(
        `<img src="${url}" alt="${file.name.replace(/"/g, "")}" style="max-width:100%;border-radius:12px" /><p><br/></p>`,
      );
      toast.success("Image ajoutée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
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
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
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
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickImage(e.target.files?.[0])}
        />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Contenu de l'article"
        onInput={sync}
        onBlur={sync}
        className="article-content min-h-[320px] w-full px-4 py-3 text-sm leading-relaxed text-foreground outline-none"
      />
    </div>
  );
}
