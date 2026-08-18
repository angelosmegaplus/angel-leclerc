import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AiMessage } from "./ai-gateway.server";
import { resilientAngelAi } from "./ai-resilient.server";

const Schema = z.object({
  question: z.string().trim().min(2).max(400),
  draft: z.string().trim().max(2_000).optional(),
  track: z.enum(["projet", "alternance", "autre"]),
  context: z.array(z.object({ question: z.string().max(300), answer: z.string().max(800) })).max(12).optional(),
});

export type ContactAssistResult = {
  /** Proposition de réponse rédigée, prête à être insérée. */
  text: string | null;
  /** Pistes courtes à cliquer. */
  hints: string[];
};

/**
 * Aide à la rédaction dans le formulaire de contact : l'IA reformule ou propose
 * une réponse à partir de ce que le visiteur a déjà indiqué.
 */
export const assistContactAnswer = createServerFn({ method: "POST" })
  .validator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }): Promise<ContactAssistResult> => {
    const { getRequestIP } = await import("@tanstack/react-start/server");
    const { checkAssistantRate } = await import("./assistant-rate.server");
    let ip = "unknown";
    try { ip = getRequestIP({ xForwardedFor: true }) ?? "unknown"; } catch { /* hors requête */ }
    if (!checkAssistantRate(ip)) return { text: null, hints: [] };

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

    const result = await resilientAngelAi({
      messages,
      priority: "interactive",
      maxTokens: 500,
      temperature: 0.4,
    });
    if (!result.text) return { text: null, hints: [] };

    const [body, hintLine] = result.text.split(/PISTES\s*:/i);
    const hints = (hintLine ?? "")
      .split("|")
      .map((hint) => hint.replace(/^[-•\s]+/, "").trim())
      .filter((hint) => hint.length > 2)
      .slice(0, 3);
    return { text: (body ?? "").trim().slice(0, 1_200) || null, hints };
  });
