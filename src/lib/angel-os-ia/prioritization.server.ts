import { searchPersonalContext, rememberPersonalContext } from "./personal-context.server";
import { recordAngelOperation } from "@/lib/angel-runtime.server";

export type AngelOsIaPriority = {
  id: string;
  title: string;
  reason: string;
  score: number;
  domain: "studies-work" | "applications" | "mail" | "agenda" | "news" | "media" | "preferences";
};

export type AngelOsIaFocus = {
  generatedAt: string;
  focus: AngelOsIaPriority[];
};

function scoreText(text: string) {
  let score = 0;
  const normalized = text.toLowerCase();

  // Priorité actuelle : revenu, emploi compatible, BTS CNED, mobilité et échéances.
  if (/urgent|aujourd'hui|today|rappel|retard|échec|failed|important/.test(normalized)) score += 40;
  if (/demain|prochain|rendez-vous|deadline|échéance|stage/.test(normalized)) score += 25;
  if (/cned|bts|communication|cours|devoir|révision|médiathèque|étude/.test(normalized)) score += 30;
  if (/intérim|travail|emploi|mission|cdd|salaire|revenu|épargne/.test(normalized)) score += 30;
  if (/scooter|vélo|mobilité|mission locale|transport/.test(normalized)) score += 22;
  if (/mail|message|réponse/.test(normalized)) score += 10;
  if (/candidature|alternance/.test(normalized)) score += 3;
  if (/nouveau|changed|mise à jour|actualit/.test(normalized)) score += 8;
  return score;
}

function domainOf(source: string, text: string): AngelOsIaPriority["domain"] {
  const normalized = text.toLowerCase();
  if (/cned|bts|communication|cours|devoir|stage|intérim|travail|emploi|mission locale|scooter|vélo|mobilité|épargne|revenu/.test(normalized)) {
    return "studies-work";
  }

  const value = source.split(":").at(-1);
  if (
    value === "applications" ||
    value === "mail" ||
    value === "agenda" ||
    value === "news" ||
    value === "media" ||
    value === "preferences"
  ) {
    return value;
  }
  return "preferences";
}

export async function buildAngelOsIaFocus(): Promise<AngelOsIaFocus> {
  const contexts = searchPersonalContext(
    "BTS Communication CNED cours devoir stage travail intérim emploi CDD revenu épargne mobilité scooter vélo Mission Locale agenda rendez-vous mail",
    32,
  );

  const focus = contexts
    .map((item) => {
      const text = `${item.title} ${item.text}`;
      return {
        id: item.id,
        title: item.title,
        reason: item.text.slice(0, 260),
        score: scoreText(text),
        domain: domainOf(item.source, text),
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const result = { generatedAt: new Date().toISOString(), focus };
  await rememberPersonalContext({
    id: "daily-focus",
    domain: "preferences",
    title: "Priorités actuelles Angel OS IA",
    text: JSON.stringify(result),
    tags: ["prioritization", "focus", "studies-work"],
    metadata: { count: focus.length },
  });
  await recordAngelOperation({
    type: "angel-os-ia.prioritization.completed",
    source: "angel-os-ia",
    ok: true,
    payload: { count: focus.length, strategy: "studies-work" },
  });
  return result;
}
