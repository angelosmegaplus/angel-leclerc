import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Loader2, Pencil, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const AUTOSAVE_DELAY = 1200;

type Props = {
  value: string;
  onChange: (html: string) => void;
};

type EditorBlock = {
  id?: string;
  type: string;
  data: Record<string, unknown>;
};

type EditorOutput = {
  time?: number;
  blocks: EditorBlock[];
  version?: string;
};

type EditorInstance = {
  isReady: Promise<void>;
  save: () => Promise<EditorOutput>;
  render: (data: EditorOutput) => Promise<void>;
  destroy: () => void;
};

type EditorBundle = {
  EditorJS: new (config: Record<string, unknown>) => EditorInstance;
  tools: Record<string, unknown>;
};

let bundlePromise: Promise<EditorBundle> | null = null;

/**
 * L'éditeur est embarqué dans l'application (aucun CDN externe) :
 * les modules sont installés localement et chargés à la demande côté navigateur.
 */
async function loadEditorBundle(): Promise<EditorBundle> {
  bundlePromise ??= (async () => {
    const [
      editorjs, header, list, quote, image, checklist, delimiter,
      raw, table, embed, marker, inlineCode, linkTool, code, warning,
    ] = await Promise.all([
      import("@editorjs/editorjs"),
      import("@editorjs/header"),
      import("@editorjs/list"),
      import("@editorjs/quote"),
      import("@editorjs/image"),
      import("@editorjs/checklist"),
      import("@editorjs/delimiter"),
      import("@editorjs/raw"),
      import("@editorjs/table"),
      import("@editorjs/embed"),
      import("@editorjs/marker"),
      import("@editorjs/inline-code"),
      import("@editorjs/link"),
      import("@editorjs/code"),
      import("@editorjs/warning"),
    ]);
    const pick = (mod: unknown) => (mod as { default?: unknown })?.default ?? mod;
    return {
      EditorJS: pick(editorjs) as EditorBundle["EditorJS"],
      tools: {
        header: pick(header),
        list: pick(list),
        quote: pick(quote),
        image: pick(image),
        checklist: pick(checklist),
        delimiter: pick(delimiter),
        raw: pick(raw),
        table: pick(table),
        embed: pick(embed),
        marker: pick(marker),
        inlineCode: pick(inlineCode),
        linkTool: pick(linkTool),
        code: pick(code),
        warning: pick(warning),
      },
    };
  })().catch((error) => {
    bundlePromise = null;
    throw error;
  });
  return bundlePromise;
}

export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  const match = value.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match ? match[1] : null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const url = value.trim();
  if (!url) return "";
  if (url.startsWith("/") || url.startsWith("data:image/")) return url;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? url : "";
  } catch {
    return "";
  }
}

function normaliseListItems(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const content = (item as { content?: unknown }).content;
        return typeof content === "string" ? content : "";
      }
      return "";
    })
    .filter(Boolean);
}

function blocksToHtml(output: EditorOutput): string {
  return output.blocks
    .map((block) => {
      const data = block.data ?? {};
      switch (block.type) {
        case "header":
        case "heading": {
          const level = Math.min(6, Math.max(2, Number(data.level) || 2));
          return `<h${level}>${String(data.text ?? "")}</h${level}>`;
        }
        case "paragraph":
          return `<p>${String(data.text ?? "")}</p>`;
        case "quote": {
          const text = String(data.text ?? "");
          const caption = String(data.caption ?? "");
          return `<blockquote><p>${text}</p>${caption ? `<cite>${caption}</cite>` : ""}</blockquote>`;
        }
        case "list": {
          const style = data.style === "ordered" ? "ol" : "ul";
          const items = normaliseListItems(data.items);
          return `<${style}>${items.map((item) => `<li>${item}</li>`).join("")}</${style}>`;
        }
        case "checklist": {
          const items = Array.isArray(data.items) ? data.items : [];
          return `<ul class="article-checklist">${items
            .map((item) => {
              if (!item || typeof item !== "object") return "";
              const row = item as { text?: unknown; checked?: unknown };
              return `<li data-checked="${Boolean(row.checked)}">${Boolean(row.checked) ? "✓ " : ""}${String(row.text ?? "")}</li>`;
            })
            .join("")}</ul>`;
        }
        case "image": {
          const file = data.file && typeof data.file === "object" ? (data.file as { url?: unknown }) : null;
          const url = safeUrl(file?.url ?? data.url);
          if (!url) return "";
          const caption = String(data.caption ?? "");
          const classes = [
            "article-editor-image",
            data.withBorder ? "with-border" : "",
            data.withBackground ? "with-background" : "",
            data.stretched ? "is-stretched" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return `<figure class="${classes}"><img src="${escapeHtml(url)}" alt="${escapeHtml(caption.replace(/<[^>]*>/g, ""))}" loading="lazy" />${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
        }
        case "delimiter":
          return "<hr />";
        case "raw":
          return String(data.html ?? "");
        case "code":
          return `<pre><code>${escapeHtml(String(data.code ?? ""))}</code></pre>`;
        case "warning":
          return `<aside class="article-warning"><strong>${escapeHtml(String(data.title ?? "Note"))}</strong><p>${escapeHtml(String(data.message ?? ""))}</p></aside>`;
        case "table": {
          const rows = Array.isArray(data.content) ? data.content : [];
          return `<div class="article-table-wrap"><table><tbody>${rows
            .map((row) => {
              const cells = Array.isArray(row) ? row : [];
              return `<tr>${cells.map((cell) => `<td>${String(cell ?? "")}</td>`).join("")}</tr>`;
            })
            .join("")}</tbody></table></div>`;
        }
        case "embed": {
          const source = safeUrl(data.embed ?? data.source);
          if (!source) return "";
          const caption = escapeHtml(String(data.caption ?? "Média intégré"));
          return `<div class="video-embed"><iframe src="${escapeHtml(source)}" title="${caption}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
        }
        case "linkTool": {
          const link = safeUrl(data.link);
          if (!link) return "";
          const meta = data.meta && typeof data.meta === "object" ? (data.meta as Record<string, unknown>) : {};
          const title = escapeHtml(String(meta.title ?? link));
          const description = escapeHtml(String(meta.description ?? ""));
          return `<p class="article-link-card"><a href="${escapeHtml(link)}" target="_blank" rel="noreferrer nofollow"><strong>${title}</strong>${description ? `<span>${description}</span>` : ""}</a></p>`;
        }
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n");
}

function htmlToBlocks(html: string): EditorOutput {
  if (!html.trim()) return { blocks: [] };
  if (typeof window === "undefined") {
    return { blocks: [{ type: "paragraph", data: { text: html } }] };
  }

  const doc = new DOMParser().parseFromString(`<main>${html}</main>`, "text/html");
  const root = doc.querySelector("main");
  if (!root) return { blocks: [{ type: "paragraph", data: { text: html } }] };

  const blocks: EditorBlock[] = [];
  const pushParagraph = (node: Element) => {
    const text = node.innerHTML.trim();
    if (text && text !== "<br>") blocks.push({ type: "paragraph", data: { text } });
  };

  Array.from(root.children).forEach((node) => {
    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      blocks.push({
        type: "header",
        data: { text: node.innerHTML, level: Math.max(2, Number(tag.slice(1)) || 2) },
      });
      return;
    }
    if (tag === "p") {
      pushParagraph(node);
      return;
    }
    if (tag === "blockquote") {
      const cite = node.querySelector("cite");
      const clone = node.cloneNode(true) as HTMLElement;
      clone.querySelector("cite")?.remove();
      blocks.push({
        type: "quote",
        data: { text: clone.innerHTML, caption: cite?.innerHTML ?? "", alignment: "left" },
      });
      return;
    }
    if (tag === "ul" || tag === "ol") {
      blocks.push({
        type: "list",
        data: {
          style: tag === "ol" ? "ordered" : "unordered",
          items: Array.from(node.querySelectorAll(":scope > li")).map((item) => item.innerHTML),
        },
      });
      return;
    }
    if (tag === "hr") {
      blocks.push({ type: "delimiter", data: {} });
      return;
    }
    if (tag === "pre") {
      blocks.push({ type: "code", data: { code: node.textContent ?? "" } });
      return;
    }
    if (tag === "figure" && node.querySelector("img")) {
      const img = node.querySelector("img") as HTMLImageElement;
      blocks.push({
        type: "image",
        data: {
          file: { url: img.getAttribute("src") ?? "" },
          caption: node.querySelector("figcaption")?.innerHTML ?? img.getAttribute("alt") ?? "",
          withBorder: node.classList.contains("with-border"),
          withBackground: node.classList.contains("with-background"),
          stretched: node.classList.contains("is-stretched"),
        },
      });
      return;
    }
    if (tag === "img") {
      const img = node as HTMLImageElement;
      blocks.push({
        type: "image",
        data: { file: { url: img.getAttribute("src") ?? "" }, caption: img.getAttribute("alt") ?? "" },
      });
      return;
    }
    if (tag === "table" || node.querySelector("table")) {
      const table = tag === "table" ? node : node.querySelector("table");
      const rows = table
        ? Array.from(table.querySelectorAll("tr")).map((row) =>
            Array.from(row.querySelectorAll("th,td")).map((cell) => cell.innerHTML),
          )
        : [];
      blocks.push({ type: "table", data: { content: rows } });
      return;
    }

    blocks.push({ type: "raw", data: { html: node.outerHTML } });
  });

  if (blocks.length === 0 && root.textContent?.trim()) {
    blocks.push({ type: "paragraph", data: { text: root.innerHTML } });
  }

  return { blocks };
}

async function uploadMedia(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Seuls les fichiers image sont acceptés.");
  if (file.size > 12 * 1024 * 1024) throw new Error("L’image est trop volumineuse (12 Mo maximum).");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `editor/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("article-images")
    .upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;

  const { data, error: signErr } = await supabase.storage
    .from("article-images")
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data) throw signErr ?? new Error("Impossible de créer l’URL de l’image.");
  return data.signedUrl;
}

export function RichTextEditor({ value, onChange }: Props) {
  const holderId = useMemo(() => `editorjs-${crypto.randomUUID()}`, []);
  const editorRef = useRef<EditorInstance | null>(null);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmittedRef = useRef(value);
  const mountedRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(value);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const initialise = async () => {
      setLoading(true);
      setError(null);
      try {
        const bundle = await loadEditorBundle();
        if (cancelled || !mountedRef.current) return;

        const tools: Record<string, unknown> = {};
        const {
          header, list, quote, image, checklist, delimiter, raw,
          table, embed, marker, inlineCode, linkTool, code, warning,
        } = bundle.tools;

        if (header) tools.header = { class: header, inlineToolbar: ["bold", "italic", "link", "marker"] };
        if (list) tools.list = { class: list, inlineToolbar: true };
        if (quote) tools.quote = { class: quote, inlineToolbar: true, config: { quotePlaceholder: "Saisissez une citation", captionPlaceholder: "Auteur ou source de la citation" } };
        if (image) {
          tools.image = {
            class: image,
            config: {
              captionPlaceholder: "Légende de l’image",
              buttonContent: "Choisir une image",
              uploader: {
                uploadByFile: async (file: File) => {
                  try {
                    const url = await uploadMedia(file);
                    return { success: 1, file: { url } };
                  } catch (uploadError) {
                    toast.error(uploadError instanceof Error ? uploadError.message : "Échec de l’import de l’image.");
                    return { success: 0 };
                  }
                },
                uploadByUrl: async (url: string) => {
                  const validated = safeUrl(url);
                  return validated ? { success: 1, file: { url: validated } } : { success: 0 };
                },
              },
            },
          };
        }
        if (checklist) tools.checklist = { class: checklist, inlineToolbar: true };
        if (delimiter) tools.delimiter = delimiter;
        if (raw) tools.raw = raw;
        if (table) tools.table = { class: table, inlineToolbar: true };
        if (embed) tools.embed = embed;
        if (marker) tools.marker = marker;
        if (inlineCode) tools.inlineCode = inlineCode;
        if (linkTool) tools.linkTool = linkTool;
        if (code) tools.code = code;
        if (warning) tools.warning = warning;

        const editor = new bundle.EditorJS({
          holder: holderId,
          autofocus: true,
          data: htmlToBlocks(value),
          placeholder: "Commencez à écrire votre article…",
          logLevel: "ERROR",
          inlineToolbar: ["bold", "italic", "link", "marker", "inlineCode"],
          tools,
          i18n: {
            messages: {
              ui: {
                toolbar: { toolbox: { Add: "Ajouter" } },
                popover: { Filter: "Rechercher", "Nothing found": "Aucun résultat", "Convert to": "Convertir en" },
                inlineToolbar: { converter: { "Convert to": "Convertir en" } },
                blockTunes: { toggler: { "Click to tune": "Paramètres du bloc", "or drag to move": "ou faites glisser pour déplacer" } },
              },
              toolNames: {
                Text: "Texte",
                Heading: "Titre",
                "Ordered List": "Liste numérotée",
                "Unordered List": "Liste à puces",
                Checklist: "Liste de contrôle",
                Quote: "Citation",
                Code: "Code",
                Delimiter: "Séparateur",
                "Raw HTML": "HTML brut",
                Table: "Tableau",
                Link: "Lien",
                Marker: "Surlignage",
                Bold: "Gras",
                Italic: "Italique",
                InlineCode: "Code intégré",
                Image: "Image",
                Warning: "Encadré",
                Embed: "Intégration",
              },
              tools: {
                image: {
                  Caption: "Légende",
                  "Select an Image": "Choisir une image",
                  "With border": "Ajouter une bordure",
                  "Stretch image": "Pleine largeur",
                  "With background": "Ajouter un arrière-plan",
                },
                quote: { "Enter a quote": "Saisissez une citation", "Quote caption": "Auteur ou source de la citation" },
                link: { "Add a link": "Ajouter un lien" },
                stub: { "The block can not be displayed correctly.": "Ce bloc ne peut pas être affiché correctement." },
                code: { "Enter a code": "Saisissez du code" },
                header: {
                  "Heading 1": "Titre 1",
                  "Heading 2": "Titre 2",
                  "Heading 3": "Titre 3",
                  "Heading 4": "Titre 4",
                  "Heading 5": "Titre 5",
                  "Heading 6": "Titre 6",
                },
                paragraph: { "Enter something": "Commencez à écrire…" },
                list: { Ordered: "Numérotée", Unordered: "À puces", Checklist: "Liste de contrôle" },
              },
              blockTunes: {
                delete: { Delete: "Supprimer", "Click to delete": "Cliquez à nouveau pour supprimer" },
                moveUp: { "Move up": "Déplacer vers le haut" },
                moveDown: { "Move down": "Déplacer vers le bas" },
              },
            },
          },
          onReady: () => {
            if (!mountedRef.current) return;
            setLoading(false);
            setSaveState("saved");
          },
          onChange: () => {
            if (autosaveRef.current) clearTimeout(autosaveRef.current);
            setSaveState("saving");
            autosaveRef.current = setTimeout(async () => {
              try {
                const output = await editorRef.current?.save();
                if (!output) return;
                const html = blocksToHtml(output);
                lastEmittedRef.current = html;
                setPreviewHtml(html);
                onChange(html);
                setSaveState("saved");
              } catch (saveError) {
                console.error("Editor.js autosave failed", saveError);
                setSaveState("error");
              }
            }, AUTOSAVE_DELAY);
          },
        });

        editorRef.current = editor;
        await editor.isReady;
      } catch (initialiseError) {
        console.error("Editor.js initialisation failed", initialiseError);
        if (!cancelled && mountedRef.current) {
          setLoading(false);
          setError(initialiseError instanceof Error ? initialiseError.message : "Editor.js n’a pas pu être initialisé.");
        }
      }
    };

    void initialise();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
      try {
        editorRef.current?.destroy();
      } catch {
        // Editor may already be destroyed during hot reload.
      }
      editorRef.current = null;
    };
    // The editor is intentionally created once per mounted article editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holderId]);

  useEffect(() => {
    if (!editorRef.current || loading) return;
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    setPreviewHtml(value);
    void editorRef.current.render(htmlToBlocks(value)).catch((renderError) => {
      console.error("Editor.js external content render failed", renderError);
      setError("Le contenu de l’article n’a pas pu être rechargé dans Editor.js.");
    });
  }, [loading, value]);

  const refreshPreview = async () => {
    try {
      const output = await editorRef.current?.save();
      if (!output) return;
      const html = blocksToHtml(output);
      setPreviewHtml(html);
      lastEmittedRef.current = html;
      onChange(html);
      setSaveState("saved");
    } catch (refreshError) {
      console.error("Editor.js preview refresh failed", refreshError);
      toast.error("Impossible d’actualiser l’aperçu de l’article.");
    }
  };

  const togglePreview = async () => {
    if (!preview) await refreshPreview();
    setPreview((current) => !current);
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-input bg-background">
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border bg-muted/40 px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">Editor.js</p>
          <p className="truncate text-[11px] text-muted-foreground">
            Éditeur par blocs · sauvegarde automatique · images · tableaux · intégrations · citations · listes
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`hidden text-[11px] sm:inline ${
              saveState === "error" ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {saveState === "saving"
              ? "Enregistrement…"
              : saveState === "saved"
                ? "Enregistré"
                : saveState === "error"
                  ? "Échec de la sauvegarde automatique"
                  : "Prêt"}
          </span>
          <button
            type="button"
            onClick={() => void togglePreview()}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted"
          >
            {preview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {preview ? "Modifier" : "Aperçu"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold text-destructive">Editor.js est indisponible</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Recharger l’éditeur
          </button>
        </div>
      ) : (
        <>
          {loading && (
            <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement d’Editor.js…
            </div>
          )}
          <div className={preview || loading ? "hidden" : "block"}>
            <div
              id={holderId}
              className="editorjs-angel-studio min-h-[420px] px-3 py-5 text-foreground sm:px-5 [&_.ce-block__content]:max-w-none [&_.ce-toolbar__content]:max-w-none [&_.ce-paragraph]:text-[15px] [&_.ce-paragraph]:leading-7 [&_.ce-header]:font-display [&_.ce-header]:font-bold [&_.cdx-block]:max-w-none"
            />
          </div>
          {preview && (
            <div className="p-5 sm:p-7">
              <div
                className="article-content text-left text-[15px] leading-[1.8] text-foreground/90"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
