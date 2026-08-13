import { Sparkles } from "lucide-react";
import type { AiDisclosure } from "@/lib/articles";
import { hasAiDisclosure } from "@/lib/articles";

export function AiTransparency({
  disclosure,
  className = "",
}: {
  disclosure: AiDisclosure;
  className?: string;
}) {
  if (!hasAiDisclosure(disclosure)) return null;

  const lines: string[] = [];
  if (disclosure.personal)
    lines.push("Cet article repose sur une réflexion et un travail d'écriture personnels.");
  if (disclosure.chatgpt)
    lines.push(
      "ChatGPT a été utilisé pour reformuler certains passages et améliorer la lisibilité.",
    );
  if (disclosure.otherAi) {
    const name = disclosure.otherAiName.trim();
    lines.push(
      name
        ? `${name} a été utilisé pour reformuler certains passages et améliorer la lisibilité.`
        : "Une autre intelligence artificielle a été utilisée pour reformuler certains passages et améliorer la lisibilité.",
    );
  }
  if (disclosure.images) {
    const tool = disclosure.imagesTool.trim();
    lines.push(
      tool
        ? `Certaines images ont été générées ou retouchées avec une intelligence artificielle (${tool}).`
        : "Certaines images ont été générées ou retouchées avec une intelligence artificielle.",
    );
  }

  return (
    <aside className={`rounded-xl border border-border/70 bg-muted/40 px-4 py-3 ${className}`}>
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Transparence éditoriale
      </p>
      <ul className="mt-2 space-y-1">
        {lines.map((l) => (
          <li key={l} className="text-[13px] leading-relaxed text-muted-foreground">
            {l}
          </li>
        ))}
      </ul>
    </aside>
  );
}
