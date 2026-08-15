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
    `min-h-10 rounded-lg border px-4 text-xs font-semibold transition-colors ${
      active
        ? "border-[#ce654b] bg-[#ce654b] text-white shadow-sm"
        : "border-[#d8d1c8] bg-[#fffdf9] text-[#292522] hover:border-[#ce654b]/60 hover:bg-[#f8f1e9]"
    }`;

  return createElement(
    "div",
    {
      className:
        "overflow-visible rounded-xl border border-[#d8d1c8] bg-[#fffdf9] text-[#292522] shadow-sm",
    },
    createElement(
      "div",
      {
        className:
          "sticky top-0 z-30 flex gap-2 border-b border-[#ddd5cc] bg-[#f7f1e9]/95 p-2.5 backdrop-blur",
      },
      createElement(
        "button",
        { type: "button", className: button(!htmlMode), onClick: switchToVisual },
        "Visuel",
      ),
      createElement(
        "button",
        { type: "button", className: button(htmlMode), onClick: switchToHtml },
        "HTML",
      ),
    ),
    htmlMode
      ? createElement(
          "div",
          { className: "bg-[#fffdf9] p-3" },
          createElement(
            "p",
            { className: "mb-2 text-xs text-[#6f665e]" },
            "Modifiez le HTML puis revenez sur Visuel pour corriger directement le rendu normal.",
          ),
          createElement("textarea", {
            value: htmlDraft,
            onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setHtmlDraft(event.target.value),
            spellCheck: false,
            "aria-label": "Code HTML de l'article",
            className:
              "min-h-[420px] w-full resize-y rounded-lg border border-[#d8d1c8] bg-white p-4 font-mono text-xs leading-relaxed text-[#292522] outline-none placeholder:text-[#9b9188] focus:border-[#ce654b] focus:ring-2 focus:ring-[#ce654b]/20",
          }),
        )
      : createElement(
          "div",
          {
            className:
              "bg-[#fffdf9] [&>div]:rounded-none [&>div]:border-0 [&>div]:bg-[#fffdf9] [&>div>div:first-child]:border-b [&>div>div:first-child]:border-[#ded6cd] [&>div>div:first-child]:bg-[#f4ede5] [&>div>div:first-child]:shadow-none [&>div>div:first-child>button]:border-[#ddd5cc] [&>div>div:first-child>button]:bg-[#fffaf5] [&>div>div:first-child>button]:text-[#332d29] [&>div>div:first-child>button:hover]:bg-[#eee4da] [&_.article-content]:bg-[#fffdf9] [&_.article-content]:text-[#292522] [&_.article-content]:caret-[#ce654b]",
          },
          createElement(VisualEditor, { key: visualKey, value, onChange }),
        ),
  );
}
