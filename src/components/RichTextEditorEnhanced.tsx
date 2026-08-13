import { useState } from "react";
import { RichTextEditor as LegacyRichTextEditor, parseYouTubeId } from "./RichTextEditor";
import { RichEditorModeTabs, type RichEditorMode } from "./RichEditorModeTabs";
import { sanitizeArticleHtml } from "@/lib/sanitize-article-html";

export { parseYouTubeId };

type Props = { value: string; onChange: (html: string) => void };

export function RichTextEditor({ value, onChange }: Props) {
  const [mode, setMode] = useState<RichEditorMode>("visual");
  const [htmlDraft, setHtmlDraft] = useState(value);
  const [visualKey, setVisualKey] = useState(0);

  const changeMode = (next: RichEditorMode) => {
    if (next === "html") setHtmlDraft(value);
    if (mode === "html" && next !== "html") onChange(sanitizeArticleHtml(htmlDraft));
    if (next === "visual" && mode !== "visual") setVisualKey((v) => v + 1);
    setMode(next);
  };

  const safePreview = sanitizeArticleHtml(mode === "html" ? htmlDraft : value);

  return (
    <div className="overflow-visible rounded-lg border-2 border-border bg-background shadow-sm">
      <div className="sticky top-0 z-30 border-b border-border bg-card/95 p-2.5 backdrop-blur">
        <RichEditorModeTabs mode={mode} onChange={changeMode} />
      </div>
      {mode === "visual" && (
        <div className="[&>div]:rounded-none [&>div]:border-0 [&>div>div:first-child]:border-b-2 [&>div>div:first-child]:border-primary/30 [&>div>div:first-child]:bg-muted [&>div>div:first-child]:shadow-sm [&>div>div:first-child>button]:border [&>div>div:first-child>button]:border-border [&>div>div:first-child>button]:bg-background [&>div>div:first-child>button]:text-foreground [&>div>div:first-child>button:last-of-type]:hidden">
          <LegacyRichTextEditor key={visualKey} value={value} onChange={onChange} />
        </div>
      )}
      {mode === "html" && (
        <textarea value={htmlDraft} onChange={(e) => setHtmlDraft(e.target.value)} spellCheck={false} aria-label="Code HTML de l'article" className="min-h-[420px] w-full resize-y bg-muted/20 p-4 font-mono text-xs leading-relaxed text-foreground outline-none" />
      )}
      {mode === "preview" && (
        <iframe title="Aperçu de l'article" sandbox="allow-same-origin" srcDoc={`<!doctype html><html><body>${safePreview}</body></html>`} className="min-h-[480px] w-full border-0 bg-background" />
      )}
    </div>
  );
}
