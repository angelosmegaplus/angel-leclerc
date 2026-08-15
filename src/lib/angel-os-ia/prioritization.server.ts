import { searchPersonalContext, rememberPersonalContext } from "./personal-context.server";
import { recordAngelOperation } from "@/lib/angel-runtime.server";

export type AngelOsIaPriority = {
  id: string;
  title: string;
  reason: string;
  score: number;
  domain: "applications" | "mail" | "agenda" | "news" | "media" | "preferences";
};

export type AngelOsIaFocus = {
  generatedAt: string;
  focus: AngelOsIaPriority[];
};

function scoreText(text: string) {
  let score = 0;
  const normalized = text.toLowerCase();
  if (/urgent|aujourd'hui|today|rappel|relance|retard|échec|failed|important/.test(normalized)) score += 40;
  if (/demain|prochain|rendez-vous|entretien|deadline|échéance/.test(normalized)) score += 25;
  if (/refus|réponse|message|mail|candidature/.test(normalized)) score += 15;
  if (/nouveau|changed|mise à jour|actualit/.test(normalized)) score += 8;
  return score;
}

function domainOf(source: string): AngelOsIaPriority["domain"] {
  const value = source.split(":").at(-1);
  if (value === "applications" || value === "mail" || value === "agenda" || value === "news" || value === "media" || value === "preferences") return value;
  return "preferences";
}

export async function buildAngelOsIaFocus(): Promise<AngelOsIaFocus> {
  const contexts = searchPersonalContext("urgent aujourd'hui demain relance rendez-vous candidature mail actualités préférence film", 24);
  const focus = contexts
    .map((item) => ({
      id: item.id,
      title: item.title,
      reason: item.text.slice(0, 260),
      score: scoreText(`${item.title} ${item.text}`),
      domain: domainOf(item.source),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const result = { generatedAt: new Date().toISOString(), focus };
  await rememberPersonalContext({
    id: "daily-focus",
    domain: "preferences",
    title: "Priorités actuelles Angel OS IA",
    text: JSON.stringify(result),
    tags: ["prioritization", "focus"],
    metadata: { count: focus.length },
  });
  await recordAngelOperation({
    type: "angel-os-ia.prioritization.completed",
    source: "angel-os-ia",
    ok: true,
    payload: { count: focus.length },
  });
  return result;
}
