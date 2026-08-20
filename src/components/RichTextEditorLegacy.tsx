import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Code2, Eraser, Heading2, Heading3, Heading4,
  Image as ImageIcon, Italic, Link2, Link2Off, List, ListOrdered, ListChecks, Loader2,
  Maximize2, Minimize2, Minus, Pilcrow, Quote, Redo2, Replace, Strikethrough, Table2,
  Underline, Undo2, Highlighter, Youtube, AlertTriangle, Superscript, Subscript, Search,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const SYNC_DELAY = 500;

type Props = { value: string; onChange: (html: string) => void };

export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  const match = value.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match ? match[1] : null;
}

function safeUrl(value: string): string {
  const url = value.trim();
  if (!url) return "";
  if (url.startsWith("/") || url.startsWith("#") || url.startsWith("data:image/")) return url;
  try {
    const parsed = new URL(url.includes("://") ? url : `https://${url}`);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
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

type Btn = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  run: () => void;
  active?: string;
  shortcut?: string;
};

export function RichTextEditor({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // null signifie « jamais injecté ». L'ancienne initialisation avec `value`
  // empêchait précisément le premier chargement d'un article existant.
  const lastEmitted = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [uploading, setUploading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [stats, setStats] = useState({ words: 0, chars: 0, minutes: 0 });
  const [, forceRender] = useState(0);

  const computeStats = useCallback((root: HTMLElement) => {
    const text = (root.innerText || "").trim();
    const words = text ? text.split(/\s+/).length : 0;
    setStats({ words, chars: text.length, minutes: Math.max(1, Math.round(words / 220)) });
  }, []);

  const emit = useCallback(() => {
    const root = ref.current;
    if (!root) return;
    const html = root.innerHTML.trim();
    lastEmitted.current = html;
    computeStats(root);
    onChange(html);
    setState("saved");
  }, [computeStats, onChange]);

  const schedule = useCallback(() => {
    setState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(emit, SYNC_DELAY);
  }, [emit]);

  // Contenu initial et synchronisation externe.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (value === lastEmitted.current && root.innerHTML === (value || "")) return;
    lastEmitted.current = value;
    root.innerHTML = value || "";
    computeStats(root);
  }, [computeStats, value]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const focusEditor = () => ref.current?.focus();

  const exec = useCallback((command: string, arg?: string) => {
    focusEditor();
    document.execCommand(command, false, arg);
    schedule();
    forceRender((n) => n + 1);
  }, [schedule]);

  const insertHtml = useCallback((html: string) => {
    focusEditor();
    document.execCommand("insertHTML", false, html);
    schedule();
  }, [schedule]);

  const isActive = (command: string) => {
    try { return document.queryCommandState(command); } catch { return false; }
  };

  const wrapInline = (tag: "code" | "sup" | "sub") => {
    const selection = window.getSelection();
    const text = selection?.toString() ?? "";
    insertHtml(`<${tag}>${escapeHtml(text || "…")}</${tag}>&nbsp;`);
  };

  const insertLink = () => {
    const selection = window.getSelection();
    const selected = selection?.toString() ?? "";
    const raw = window.prompt("Adresse du lien (https://…)", "https://");
    if (!raw) return;
    const url = safeUrl(raw);
    if (!url) return toast.error("Adresse de lien invalide.");
    if (selected) exec("createLink", url);
    else insertHtml(`<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a>&nbsp;`);
  };

  const insertChecklist = () =>
    insertHtml('<ul class="article-checklist"><li data-checked="false">À faire</li></ul><p><br></p>');

  const insertCallout = (kind: "info" | "warning") =>
    insertHtml(
      `<aside class="article-warning" data-kind="${kind}"><strong>${kind === "warning" ? "Attention" : "À noter"}</strong><p>Votre message…</p></aside><p><br></p>`,
    );

  const insertCodeBlock = () => insertHtml("<pre><code>// votre code</code></pre><p><br></p>");

  const insertTable = () => {
    const cols = Number(window.prompt("Nombre de colonnes ?", "3") ?? 0);
    const rows = Number(window.prompt("Nombre de lignes ?", "3") ?? 0);
    if (!cols || !rows || cols > 10 || rows > 30) return;
    const head = `<tr>${Array.from({ length: cols }, (_, i) => `<th>Colonne ${i + 1}</th>`).join("")}</tr>`;
    const body = Array.from({ length: rows }, () => `<tr>${"<td>&nbsp;</td>".repeat(cols)}</tr>`).join("");
    insertHtml(`<div class="article-table-wrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div><p><br></p>`);
  };

  const insertYouTube = () => {
    const raw = window.prompt("Lien YouTube ou identifiant de la vidéo");
    if (!raw) return;
    const id = parseYouTubeId(raw);
    if (!id) return toast.error("Lien YouTube non reconnu.");
    insertHtml(
      `<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Vidéo YouTube" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><p><br></p>`,
    );
  };

  const insertImageFromUrl = () => {
    const raw = window.prompt("Adresse de l’image (https://…)");
    if (!raw) return;
    const url = safeUrl(raw);
    if (!url) return toast.error("Adresse d’image invalide.");
    const caption = window.prompt("Légende (facultatif)") ?? "";
    insertFigure(url, caption);
  };

  const insertFigure = (url: string, caption: string) =>
    insertHtml(
      `<figure class="article-editor-image"><img src="${escapeHtml(url)}" alt="${escapeHtml(caption)}" loading="lazy" />${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure><p><br></p>`,
    );

  const handleFiles = async (files: FileList | File[]) => {
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    setUploading(true);
    try {
      for (const file of images) {
        const url = await uploadMedia(file);
        insertFigure(url, "");
      }
      toast.success(images.length > 1 ? "Images ajoutées." : "Image ajoutée.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l’import de l’image.");
    } finally {
      setUploading(false);
    }
  };

  const runReplace = (all: boolean) => {
    const root = ref.current;
    if (!root || !find.trim()) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let done = 0;
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    for (const node of nodes) {
      if (!all && done > 0) break;
      const text = node.nodeValue ?? "";
      if (!text.toLowerCase().includes(find.toLowerCase())) continue;
      const pattern = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), all ? "gi" : "i");
      node.nodeValue = text.replace(pattern, replace);
      done += 1;
    }
    if (done === 0) toast.info("Aucune occurrence trouvée.");
    else { emit(); toast.success(`${done} remplacement${done > 1 ? "s" : ""}.`); }
  };

  /** Raccourcis markdown en début de ligne. */
  const handleMarkdown = () => {
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    if (!node) return false;
    const block = (node.nodeType === 3 ? node.parentElement : (node as HTMLElement))?.closest(
      "p,div,h1,h2,h3,h4,li,blockquote",
    );
    if (!block || block.tagName === "LI") return false;
    const text = block.textContent ?? "";
    const rules: [RegExp, () => void][] = [
      [/^# $/, () => exec("formatBlock", "h2")],
      [/^## $/, () => exec("formatBlock", "h3")],
      [/^### $/, () => exec("formatBlock", "h4")],
      [/^> $/, () => exec("formatBlock", "blockquote")],
      [/^- $/, () => exec("insertUnorderedList")],
      [/^\* $/, () => exec("insertUnorderedList")],
      [/^1\. $/, () => exec("insertOrderedList")],
      [/^```$/, () => { block.textContent = ""; insertCodeBlock(); }],
      [/^--- $/, () => { block.textContent = ""; exec("insertHorizontalRule"); }],
    ];
    for (const [pattern, action] of rules) {
      if (pattern.test(text)) {
        block.textContent = "";
        action();
        return true;
      }
    }
    return false;
  };

  const groups: Btn[][] = useMemo(() => [
    [
      { icon: Undo2, label: "Annuler", run: () => exec("undo"), shortcut: "Ctrl+Z" },
      { icon: Redo2, label: "Rétablir", run: () => exec("redo"), shortcut: "Ctrl+Y" },
    ],
    [
      { icon: Pilcrow, label: "Paragraphe", run: () => exec("formatBlock", "p") },
      { icon: Heading2, label: "Titre 2", run: () => exec("formatBlock", "h2") },
      { icon: Heading3, label: "Titre 3", run: () => exec("formatBlock", "h3") },
      { icon: Heading4, label: "Titre 4", run: () => exec("formatBlock", "h4") },
    ],
    [
      { icon: Bold, label: "Gras", run: () => exec("bold"), active: "bold", shortcut: "Ctrl+B" },
      { icon: Italic, label: "Italique", run: () => exec("italic"), active: "italic", shortcut: "Ctrl+I" },
      { icon: Underline, label: "Souligné", run: () => exec("underline"), active: "underline", shortcut: "Ctrl+U" },
      { icon: Strikethrough, label: "Barré", run: () => exec("strikeThrough"), active: "strikeThrough" },
      { icon: Highlighter, label: "Surligner", run: () => exec("hiliteColor", "#F7E2B5") },
      { icon: Code2, label: "Code en ligne", run: () => wrapInline("code") },
      { icon: Superscript, label: "Exposant", run: () => wrapInline("sup") },
      { icon: Subscript, label: "Indice", run: () => wrapInline("sub") },
    ],
    [
      { icon: List, label: "Liste à puces", run: () => exec("insertUnorderedList"), active: "insertUnorderedList" },
      { icon: ListOrdered, label: "Liste numérotée", run: () => exec("insertOrderedList"), active: "insertOrderedList" },
      { icon: ListChecks, label: "Liste de contrôle", run: insertChecklist },
      { icon: Quote, label: "Citation", run: () => exec("formatBlock", "blockquote") },
      { icon: AlertTriangle, label: "Encadré", run: () => insertCallout("info") },
      { icon: Minus, label: "Séparateur", run: () => exec("insertHorizontalRule") },
    ],
    [
      { icon: AlignLeft, label: "Aligner à gauche", run: () => exec("justifyLeft") },
      { icon: AlignCenter, label: "Centrer", run: () => exec("justifyCenter") },
      { icon: AlignRight, label: "Aligner à droite", run: () => exec("justifyRight") },
    ],
    [
      { icon: Link2, label: "Lien", run: insertLink, shortcut: "Ctrl+K" },
      { icon: Link2Off, label: "Retirer le lien", run: () => exec("unlink") },
      { icon: ImageIcon, label: "Image", run: () => fileRef.current?.click() },
      { icon: Youtube, label: "Vidéo YouTube", run: insertYouTube },
      { icon: Table2, label: "Tableau", run: insertTable },
      { icon: Code2, label: "Bloc de code", run: insertCodeBlock },
    ],
    [
      { icon: Search, label: "Rechercher / remplacer", run: () => setFindOpen((o) => !o) },
      { icon: Eraser, label: "Effacer la mise en forme", run: () => exec("removeFormat") },
      { icon: fullscreen ? Minimize2 : Maximize2, label: "Plein écran", run: () => setFullscreen((f) => !f) },
    ],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [exec, fullscreen]);

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-xl border border-input bg-background ${
        fullscreen ? "fixed inset-0 z-[100] rounded-none" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-2">
        {groups.map((group, gi) => (
          <div key={gi} className="flex flex-wrap items-center gap-1 pr-1 [&+div]:border-l [&+div]:border-border [&+div]:pl-1">
            {group.map((btn) => (
              <button
                key={btn.label}
                type="button"
                title={btn.shortcut ? `${btn.label} (${btn.shortcut})` : btn.label}
                aria-label={btn.label}
                aria-pressed={btn.active ? isActive(btn.active) : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onClick={btn.run}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-foreground transition hover:border-border hover:bg-background ${
                  btn.active && isActive(btn.active) ? "border-border bg-background text-primary" : ""
                }`}
              >
                <btn.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2 pl-2 text-[11px] text-muted-foreground">
          {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span>{stats.words} mots · {stats.minutes} min</span>
          <span className="hidden sm:inline">{state === "saving" ? "Enregistrement…" : state === "saved" ? "Enregistré" : "Prêt"}</span>
        </div>
      </div>

      {findOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-2 py-2">
          <input
            value={find}
            onChange={(e) => setFind(e.target.value)}
            placeholder="Rechercher"
            aria-label="Rechercher"
            className="min-h-9 flex-1 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"
          />
          <input
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
            placeholder="Remplacer par"
            aria-label="Remplacer par"
            className="min-h-9 flex-1 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"
          />
          <button type="button" onClick={() => runReplace(false)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs">
            <Replace className="h-3.5 w-3.5" /> Une
          </button>
          <button type="button" onClick={() => runReplace(true)} className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-xs">
            Tout
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Contenu de l'article"
        data-placeholder="Commencez à écrire… « # » pour un titre, « - » pour une liste, « > » pour une citation."
        spellCheck
        onInput={schedule}
        onBlur={emit}
        onKeyUp={() => forceRender((n) => n + 1)}
        onMouseUp={() => forceRender((n) => n + 1)}
        onKeyDown={(e) => {
          const meta = e.ctrlKey || e.metaKey;
          if (meta && e.key.toLowerCase() === "k") { e.preventDefault(); insertLink(); return; }
          if (meta && e.key.toLowerCase() === "s") { e.preventDefault(); emit(); toast.success("Contenu synchronisé."); return; }
          if (e.key === " " && handleMarkdown()) e.preventDefault();
          if (e.key === "Tab") { e.preventDefault(); exec(e.shiftKey ? "outdent" : "indent"); }
        }}
        onPaste={(e) => {
          const files = e.clipboardData?.files;
          if (files && files.length > 0 && files[0]?.type.startsWith("image/")) {
            e.preventDefault();
            void handleFiles(files);
            return;
          }
          e.preventDefault();
          const html = e.clipboardData.getData("text/html");
          const text = e.clipboardData.getData("text/plain");
          if (html) {
            const doc = new DOMParser().parseFromString(html, "text/html");
            doc.querySelectorAll("script,style,meta,link,object,embed").forEach((n) => n.remove());
            doc.querySelectorAll("*").forEach((el) => {
              for (const attr of Array.from(el.attributes)) {
                if (!["href", "src", "alt", "title", "colspan", "rowspan"].includes(attr.name)) {
                  el.removeAttribute(attr.name);
                }
              }
            });
            document.execCommand("insertHTML", false, doc.body.innerHTML);
          } else {
            document.execCommand("insertText", false, text);
          }
          schedule();
        }}
        onDrop={(e) => {
          if (e.dataTransfer?.files?.length) {
            e.preventDefault();
            void handleFiles(e.dataTransfer.files);
          }
        }}
        className={`article-content min-h-[420px] w-full overflow-y-auto px-4 py-5 text-[1.02rem] leading-[1.8] text-foreground outline-none sm:px-8 ${
          fullscreen ? "h-[calc(100vh-7rem)]" : ""
        } [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-bold [&_h4]:mt-4 [&_h4]:text-lg [&_h4]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-sm [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul.article-checklist]:list-none [&_ul.article-checklist]:pl-0 [&_a]:text-primary [&_a]:underline [&_aside.article-warning]:rounded-xl [&_aside.article-warning]:border [&_aside.article-warning]:border-border [&_aside.article-warning]:bg-muted/50 [&_aside.article-warning]:p-3 [&_figure]:my-4 [&_img]:max-w-full [&_img]:rounded-xl [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-xl [&:empty::before]:text-muted-foreground [&:empty::before]:content-[attr(data-placeholder)]`}
      />
    </div>
  );
}
