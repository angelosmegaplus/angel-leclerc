import { createElement, useState } from "react";
import { RichTextEditor as VisualEditor, parseYouTubeId } from "./RichTextEditor.tsx";
import { sanitizeArticleHtml } from "@/lib/sanitize-article-html";

export { parseYouTubeId };

type Props = { value: string; onChange: (html: string) => void };

export function RichTextEditor({ value, onChange }: Props) {
  const [htmlMode, setHtmlMode] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState(value);
  const [visualKey, setVisualKey] = useState(0);

  const switchToHtml = () => {
    setHtmlDraft(value);
    setHtmlMode(true);
  };
  const switchToVisual = () => {
    onChange(sanitizeArticleHtml(htmlDraft));
    setVisualKey((key) => key + 1);
    setHtmlMode(false);
  };

  const button = (active: boolean) =>
    `min-h-10 rounded-md border px-4 text-xs font-semibold ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`;

  return createElement(
    "div",
    { className: "overflow-visible rounded-lg border-2 border-border bg-background shadow-sm" },
    createElement(
      "div",
      { className: "sticky top-0 z-30 flex gap-2 border-b border-border bg-card/95 p-2.5 backdrop-blur" },
      createElement("button", { type: "button", className: button(!htmlMode), onClick: switchToVisual }, "Visuel"),
      createElement("button", { type: "button", className: button(htmlMode), onClick: switchToHtml }, "HTML"),
    ),
    htmlMode
      ? createElement(
          "div",
          { className: "p-3" },
          createElement("p", { className: "mb-2 text-xs text-muted-foreground" }, "Modifiez le HTML puis revenez sur Visuel pour corriger directement le rendu normal."),
          createElement("textarea", {
            value: htmlDraft,
            onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => setHtmlDraft(event.target.value),
            spellCheck: false,
            "aria-label": "Code HTML de l'article",
            className: "min-h-[420px] w-full resize-y rounded-md border border-input bg-muted/20 p-4 font-mono text-xs leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-ring",
          }),
        )
      : createElement(
          "div",
          { className: "[&>div]:rounded-none [&>div]:border-0 [&>div>div:first-child]:border-b-2 [&>div>div:first-child]:border-primary/30 [&>div>div:first-child]:bg-muted [&>div>div:first-child]:shadow-sm [&>div>div:first-child>button]:border [&>div>div:first-child>button]:border-border [&>div>div:first-child>button]:bg-background [&>div>div:first-child>button]:text-foreground" },
          createElement(VisualEditor, { key: visualKey, value, onChange }),
        ),
  );
}
