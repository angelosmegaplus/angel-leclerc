import { Code2, Eye, Pencil } from "lucide-react";

export type RichEditorMode = "visual" | "html" | "preview";

export function RichEditorModeTabs({
  mode,
  onChange,
}: {
  mode: RichEditorMode;
  onChange: (mode: RichEditorMode) => void;
}) {
  const items = [
    ["visual", "Écrire", Pencil],
    ["html", "HTML", Code2],
    ["preview", "Aperçu", Eye],
  ] as const;

  return (
    <div className="grid w-full grid-cols-3 gap-1 rounded-xl bg-[#F1EAE0] p-1 sm:ml-auto sm:w-auto sm:min-w-[22rem]">
      {items.map(([key, label, Icon]) => {
        const active = mode === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(key)}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-all active:scale-[.98] ${
              active
                ? "border-[#D9D0C4] bg-[#FFFDF9] text-[#181716] shadow-sm"
                : "border-transparent bg-transparent text-[#706D68] hover:bg-[#FFFDF9]/65 hover:text-[#181716]"
            }`}
          >
            <Icon className={`h-4 w-4 ${active ? "text-[#CE654B]" : ""}`} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
