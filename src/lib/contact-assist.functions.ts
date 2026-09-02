import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AiMessage } from "./ai-gateway.server";

const Schema = z.object({
  question: z.string().trim().min(2).max(400),
  draft: z.string().trim().max(2_000).optional(),
  track: z.enum(["projet", "alternance", "autre"]),
  context: z.array(z.object({ question: z.string().max(300), answer: z.string().max(800) })).max(12).optional(),
});

type ContactAssistInput = z.infer<typeof Schema>;

export type ContactAssistResult = {
  /** Proposition de réponse rédigée, prête à être insérée. */
  text: string | null;
  /** Pistes courtes à cliquer. */
  hints: string[];
};

function sentence(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const normalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return /[.!?…]$/.test(normalized) ? normalized : `${normalized}.`;
}

/**
 * Secours local conservateur : aucune donnée n'est inventée. Il garantit que
 * le bouton reste utilisable même si la couche IA distante est indisponible.
 */
function localAssist(data: ContactAssistInput): ContactAssistResult {
  const draft = data.draft?.trim() ?? "";
  const contextAnswers = (data.context ?? [])
    .map((row) => row.answer.trim())
    .filter(Boolean);

  if (draft) {
    return {
      text: sentence(draft).slice(0, 1_200),
      hints: [],
    };
  }

  if (contextAnswers.length > 0) {
    const text = contextAnswers
      .slice(-3)
      .map(sentence)
      .filter(Boolean)
      .join(" ")
      .slice(0, 1_200);
    return { text: text || null, hints: [] };
  }

  const genericByTrack: Record<ContactAssistInput["track"], string> = {
    projet: "Je souhaite vous présenter mon projet et échanger avec vous afin de voir comment vous pourriez m’accompagner.",
    alternance: "Je souhaite vous contacter au sujet d’une opportunité professionnelle et pouvoir vous présenter plus précisément ma démarche.",
    autre: "Je souhaite vous contacter afin de vous présenter ma demande plus précisément et pouvoir échanger avec vous à ce sujet.",
  };

  return {
    text: genericByTrack[data.track],
    hints: [],
  };
}

/**
 * Aide à la rédaction dans le formulaire de contact.
 *
 * Important : aucune dépendance à la passerelle IA n'est chargée au niveau du
 * module. Toute la couche distante est importée à la demande et enfermée dans
 * un try/catch. Ainsi, une erreur d'initialisation du fournisseur, de quota,
 * de configuration ou d'import ne peut plus casser le formulaire.
 */
export const assistContactAnswer = createServerFn({ method: "POST" })
  .validator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }): Promise<ContactAssistResult> => {
    const fallback = localAssist(data);

    // La protection de débit est elle aussi facultative pour la disponibilité
    // du formulaire : en cas de problème d'infrastructure, on utilise le secours.
    try {
      const { getRequestIP } = await import("@tanstack/react-start/server");
      const { checkAssistantRate } = await import("./assistant-rate.server");
      let ip = "unknown";
      try {
        ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
      } catch {
        ip = "unknown";
      }
      if (!checkAssistantRate(ip)) return fallback;
    } catch (error) {
      console.warn("[contact-assist] contrôle de débit indisponible, poursuite avec secours garanti", error);
    }

    const context = (data.context ?? [])
      .filter((row) => row.answer.trim().length > 0)
      .map((row) => `- ${row.question} → ${row.answer}`)
      .join("\n");

    const system = [
      "Tu aides un visiteur à remplir le formulaire de contact d'Angel Leclerc (communication, Sarlat-la-Canéda).",
      "Tu écris À LA PLACE du visiteur, à la première personne, en français clair, sans formule de politesse ni signature.",
      "Réponds uniquement à la question posée, en 2 à 5 phrases maximum, factuel, concret, sans inventer d'informations non fournies.",
      "Si le brouillon existe, tu le reformules et le complètes sans en changer le sens.",
      "Retourne d'abord la proposition, puis une ligne « PISTES: » avec 2 ou 3 précisions utiles séparées par « | ».",
    ].join(" ");

    const user = [
      `Type de demande : ${data.track}`,
      context ? `Éléments déjà donnés :\n${context}` : "",
      `Question du formulaire : ${data.question}`,
      data.draft ? `Brouillon du visiteur : ${data.draft}` : "Le visiteur n'a rien écrit pour l'instant.",
    ].filter(Boolean).join("\n\n");

    const messages: AiMessage[] = [
      { role: "system", content: system },
      { role: "user", content: user },
    ];

    try {
      // Import volontairement tardif : si toute la pile IA échoue à charger,
      // le formulaire conserve quand même une réponse exploitable.
      const { resilientAngelAi } = await import("./ai-resilient.server");
      const result = await resilientAngelAi({
        messages,
        priority: "interactive",
        maxTokens: 500,
        temperature: 0.4,
      });

      if (!result.text?.trim()) return fallback;

      const [body, hintLine] = result.text.split(/PISTES\s*:/i);
      const text = (body ?? "").trim().slice(0, 1_200);
      if (!text) return fallback;

      const hints = (hintLine ?? "")
        .split("|")
        .map((hint) => hint.replace(/^[-•\s]+/, "").trim())
        .filter((hint) => hint.length > 2)
        .slice(0, 3);

      return { text, hints };
    } catch (error) {
      console.warn("[contact-assist] pile IA distante indisponible, secours local utilisé", error);
      return fallback;
    }
  });
