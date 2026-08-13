import { Code2, Eye, Pencil } from "lucide-react";

export type RichEditorMode = "visual" | "html" | "preview";

export function RichEditorModeTabs({ mode, onChange }: { mode: RichEditorMode; onChange: (mode: RichEditorMode) => void }) {
  const items = [
    ["visual", "Visuel", Pencil],
    ["html", "HTML", Code2],
    ["preview", "Aperçu", Eye],
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-2 sm:flex sm:justify-end">
      {items.map(([key, label, Icon]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 text-xs font-semibold transition-colors ${mode === key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-muted"}`}
        >
          <Icon className="h-4 w-4" /> {label}
        </button>
      ))}
    </div>
  );
}
