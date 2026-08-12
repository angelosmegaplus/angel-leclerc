import { useMemo, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { ARTICLE_TOPICS } from "@/lib/articles";

export type SuggestionTarget = {
  title: string;
  excerpt: string;
  content: string;
  topics: string[];
  category: string;
};

type Suggestion = {
  id: string;
  label: string;
  detail: string;
  apply: (d: SuggestionTarget) => Partial<SuggestionTarget>;
};

const TOPIC_HINTS: Record<string, string[]> = {
  Politique: ["élu", "maire", "commune", "conseil", "politique", "état"],
  Société: ["société", "citoyen", "social", "famille", "jeunes"],
  "Emploi & formation": ["alternance", "bts", "emploi", "stage", "formation", "école"],
  "Entreprise & économie": ["entreprise", "économie", "client", "marché", "auto-entrepreneur"],
  "Communication & médias": ["communication", "média", "presse", "réseaux sociaux", "rédaction"],
  "International & géopolitique": ["international", "europe", "guerre", "géopolitique"],
  Religion: ["église", "paroisse", "religion", "foi", "orgue"],
  Scoutisme: ["scout", "scoutisme", "camp", "unité"],
  "Technologie & numérique": ["numérique", "ia", "intelligence artificielle", "site web", "logiciel"],
  "Culture & idées": ["culture", "patrimoine", "livre", "musique", "histoire"],
};

function plainText(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Suggestions locales, non destructives : rien n'est appliqué sans clic « Valider ». */
function buildSuggestions(d: SuggestionTarget): Suggestion[] {
  const out: Suggestion[] = [];
  const text = plainText(d.content);
  const haystack = `${d.title} ${text}`.toLowerCase();

  if (!d.excerpt.trim() && text.length > 60) {
    const chapo = text.slice(0, 180).replace(/\s+\S*$/, "") + "…";
    out.push({
      id: "chapo",
      label: "Ajouter un chapô",
      detail: chapo,
      apply: () => ({ excerpt: chapo }),
    });
  }

  if (d.excerpt.length > 200) {
    const short = d.excerpt.slice(0, 175).replace(/\s+\S*$/, "") + "…";
    out.push({
      id: "chapo-court",
      label: "Raccourcir le chapô pour le SEO (≤ 160-180 caractères)",
      detail: short,
      apply: () => ({ excerpt: short }),
    });
  }

  const suggestedTopics = ARTICLE_TOPICS.filter(
    (t) =>
      !d.topics.includes(t) &&
      (TOPIC_HINTS[t] ?? []).some((k) => haystack.includes(k)),
  );
  if (suggestedTopics.length) {
    out.push({
      id: "topics",
      label: "Ajouter des catégories thématiques",
      detail: suggestedTopics.join(", "),
      apply: (cur) => ({ topics: [...cur.topics, ...suggestedTopics] }),
    });
  }

  if (d.title.length > 70) {
    out.push({
      id: "titre",
      label: "Titre long pour le référencement",
      detail: `${d.title.length} caractères — viser 60-70 pour un affichage complet dans Google. À raccourcir manuellement.`,
      apply: () => ({}),
    });
  }

  const words = text.split(" ").length;
  if (words > 350 && !/<h[23]/i.test(d.content)) {
    out.push({
      id: "intertitres",
      label: "Ajouter des intertitres",
      detail:
        "Article long sans sous-titre : découpez le texte avec des titres de niveau 2 depuis la barre d'outils pour améliorer la lecture.",
      apply: () => ({}),
    });
  }

  return out;
}

export function AiSuggestions({
  draft,
  onApply,
}: {
  draft: SuggestionTarget;
  onApply: (patch: Partial<SuggestionTarget>) => void;
}) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const suggestions = useMemo(
    () => buildSuggestions(draft).filter((s) => !dismissed.includes(s.id)),
    [draft, dismissed],
  );

  return (
    <div className="space-y-2 rounded-lg border border-border bg-background p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Sparkles className="h-4 w-4 text-primary" /> Suggestions Angel AI
      </p>
      <p className="text-[11px] text-muted-foreground">
        Analyse locale du brouillon. Aucune suggestion n'est appliquée sans votre
        validation ; la publication reste toujours explicite.
      </p>
      {suggestions.length === 0 ? (
        <p className="pt-1 text-sm text-muted-foreground">
          Rien à signaler pour l'instant.
        </p>
      ) : (
        <ul className="space-y-2 pt-1">
          {suggestions.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-border/70 bg-card p-3"
            >
              <p className="text-sm font-medium text-foreground">{s.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onApply(s.apply(draft));
                    setDismissed((x) => [...x, s.id]);
                  }}
                  className="inline-flex min-h-9 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground"
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Valider
                </button>
                <button
                  type="button"
                  onClick={() => setDismissed((x) => [...x, s.id])}
                  className="inline-flex min-h-9 items-center rounded-lg border border-input px-3 text-xs font-medium text-muted-foreground"
                >
                  <X className="mr-1.5 h-3.5 w-3.5" /> Refuser
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}