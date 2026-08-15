import { useState } from "react";
import { RichTextEditor as VisualEditor, parseYouTubeId } from "./RichTextEditor.tsx";
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
    if (next === "visual" && mode !== "visual") setVisualKey((key) => key + 1);
    setMode(next);
  };

  const safePreview = sanitizeArticleHtml(mode === "html" ? htmlDraft : value);

  return (
    <div
      className="overflow-visible rounded-xl border-2 border-[#E6DED2] bg-[#FFFDF9] text-[#181716] shadow-sm"
      style={{
        "--background": "#FFFDF9",
        "--foreground": "#181716",
        "--card": "#FFFDF9",
        "--card-foreground": "#181716",
        "--muted": "#F1EAE0",
        "--muted-foreground": "#706D68",
        "--border": "#E6DED2",
        "--input": "#E6DED2",
        "--primary": "#CE654B",
        "--primary-foreground": "#FFFDF9",
      } as React.CSSProperties}
    >
      <div className="sticky top-0 z-30 border-b border-[#E6DED2] bg-[#FFFDF9]/95 p-2.5 text-[#181716] backdrop-blur">
        <RichEditorModeTabs mode={mode} onChange={changeMode} />
      </div>

      {mode === "visual" && (
        <div className="bg-[#FFFDF9] text-[#181716] [&>div]:rounded-none [&>div]:border-0 [&>div]:bg-[#FFFDF9] [&>div]:text-[#181716] [&>div>div:first-child]:border-b-2 [&>div>div:first-child]:border-[#CE654B]/30 [&>div>div:first-child]:bg-[#F1EAE0] [&>div>div:first-child]:shadow-sm [&>div>div:first-child>button]:border [&>div>div:first-child>button]:border-[#E6DED2] [&>div>div:first-child>button]:bg-[#FFFDF9] [&>div>div:first-child>button]:text-[#181716] [&>div>div:first-child>button:last-of-type]:hidden [&_[contenteditable]]:bg-[#FFFDF9] [&_[contenteditable]]:text-[#181716] [&_.article-content]:bg-[#FFFDF9] [&_.article-content]:text-[#181716]">
          <VisualEditor key={visualKey} value={value} onChange={onChange} />
        </div>
      )}

      {mode === "html" && (
        <textarea
          value={htmlDraft}
          onChange={(event) => setHtmlDraft(event.target.value)}
          spellCheck={false}
          aria-label="Code HTML de l'article"
          className="min-h-[420px] w-full resize-y bg-[#FFFDF9] p-4 font-mono text-xs leading-relaxed text-[#181716] outline-none"
        />
      )}

      {mode === "preview" && (
        <iframe
          title="Aperçu de l'article"
          sandbox="allow-same-origin"
          srcDoc={`<!doctype html><html><head><style>body{margin:0;padding:24px;background:#FFFDF9;color:#181716;font-family:Inter,system-ui,sans-serif}a{color:#CE654B}</style></head><body>${safePreview}</body></html>`}
          className="min-h-[480px] w-full border-0 bg-[#FFFDF9]"
        />
      )}
    </div>
  );
}
