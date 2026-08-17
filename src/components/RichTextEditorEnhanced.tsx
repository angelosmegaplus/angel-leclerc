import { useState } from "react";
import { RichTextEditor as LegacyRichTextEditor, parseYouTubeId } from "./RichTextEditor.tsx";
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
    <section
      data-article-editor="lovable"
      className="overflow-hidden rounded-[1.35rem] border border-[#E6DED2] bg-[#FFFDF9] text-[#181716] shadow-[0_18px_55px_rgba(55,42,28,.10)]"
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
      <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-[#E6DED2] bg-[#FFFDF9]/95 px-3 py-3 backdrop-blur-xl sm:flex-row sm:items-center sm:px-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#CE654B]">Éditeur</p>
          <p className="mt-0.5 text-sm font-semibold tracking-[-.01em] text-[#181716]">Rédaction de l’article</p>
        </div>
        <RichEditorModeTabs mode={mode} onChange={changeMode} />
      </header>

      {mode === "visual" && (
        <div className="bg-[#FFFDF9] text-[#181716] [&>div]:rounded-none [&>div]:border-0 [&>div]:bg-[#FFFDF9] [&>div]:text-[#181716] [&>div>div:first-child]:sticky [&>div>div:first-child]:top-[4.55rem] [&>div>div:first-child]:z-20 [&>div>div:first-child]:border-b [&>div>div:first-child]:border-[#E6DED2] [&>div>div:first-child]:bg-[#F6F0E8]/95 [&>div>div:first-child]:px-2 [&>div>div:first-child]:py-2 [&>div>div:first-child]:shadow-[0_8px_22px_rgba(55,42,28,.06)] [&>div>div:first-child]:backdrop-blur-xl [&>div>div:first-child>button]:h-11 [&>div>div:first-child>button]:w-11 [&>div>div:first-child>button]:rounded-xl [&>div>div:first-child>button]:border [&>div>div:first-child>button]:border-[#E6DED2] [&>div>div:first-child>button]:bg-[#FFFDF9] [&>div>div:first-child>button]:text-[#181716] [&>div>div:first-child>button:hover]:bg-white [&>div>div:first-child>button:last-of-type]:hidden [&_[contenteditable]]:min-h-[56vh] [&_[contenteditable]]:bg-[#FFFDF9] [&_[contenteditable]]:px-4 [&_[contenteditable]]:py-6 [&_[contenteditable]]:text-[1.02rem] [&_[contenteditable]]:leading-[1.8] [&_[contenteditable]]:text-[#181716] sm:[&_[contenteditable]]:min-h-[34rem] sm:[&_[contenteditable]]:px-8 sm:[&_[contenteditable]]:py-8 sm:[&_[contenteditable]]:text-[1.05rem] lg:[&_[contenteditable]]:px-12 [&_.article-content]:mx-auto [&_.article-content]:max-w-[54rem] [&_.article-content]:bg-[#FFFDF9] [&_.article-content]:text-[#181716]">
          <LegacyRichTextEditor key={visualKey} value={value} onChange={onChange} />
        </div>
      )}

      {mode === "html" && (
        <div className="bg-[#F6F0E8] p-2 sm:p-4">
          <div className="mx-auto max-w-[70rem] overflow-hidden rounded-xl border border-[#D9D0C4] bg-[#FFFDF9] shadow-sm">
            <div className="border-b border-[#E6DED2] px-4 py-2 text-[11px] text-[#706D68]">
              Le HTML est nettoyé avant de revenir à l’édition visuelle.
            </div>
            <textarea
              value={htmlDraft}
              onChange={(e) => setHtmlDraft(e.target.value)}
              spellCheck={false}
              aria-label="Code HTML de l'article"
              className="min-h-[62vh] w-full resize-y bg-[#FFFDF9] p-4 font-mono text-xs leading-relaxed text-[#181716] outline-none sm:min-h-[36rem] sm:p-6"
            />
          </div>
        </div>
      )}

      {mode === "preview" && (
        <div className="bg-[#F1EAE0] p-2 sm:p-5">
          <div className="mx-auto max-w-[68rem] overflow-hidden rounded-xl border border-[#D9D0C4] bg-white shadow-[0_18px_50px_rgba(55,42,28,.10)]">
            <div className="flex items-center gap-2 border-b border-[#E6DED2] bg-[#FFFDF9] px-4 py-2.5 text-[11px] font-medium text-[#706D68]">
              <span className="h-2 w-2 rounded-full bg-[#CE654B]" /> Aperçu du rendu public
            </div>
            <iframe
              title="Aperçu de l'article"
              sandbox="allow-same-origin"
              srcDoc={`<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:clamp(22px,5vw,64px);background:#fffdf9;color:#181716;font-family:Inter,system-ui,sans-serif;line-height:1.75}main{max-width:850px;margin:auto}img,video,iframe{max-width:100%}a{color:#CE654B}h1,h2,h3{line-height:1.15;letter-spacing:-.02em}blockquote{margin-left:0;border-left:3px solid #CE654B;padding-left:18px;color:#5f5952}</style></head><body><main>${safePreview || "<p>Aucun contenu pour le moment.</p>"}</main></body></html>`}
              className="min-h-[68vh] w-full border-0 bg-[#FFFDF9] sm:min-h-[42rem]"
            />
          </div>
        </div>
      )}
    </section>
  );
}
