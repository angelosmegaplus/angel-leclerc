import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PUBLIC_SITE_CONTEXT } from "./assistant-context";
import type { AiMessage } from "./ai-gateway.server";

const Schema = z.object({
  need: z.string().trim().min(10).max(1200),
  structure: z.string().trim().max(120).optional().or(z.literal("")),
  deadline: z.string().trim().max(80).optional().or(z.literal("")),
  budget: z.string().trim().max(80).optional().or(z.literal("")),
});

export type QuoteSimulation = {
  /** Estimation rédigée, jamais contractuelle. */
  summary: string;
  /** Étapes proposées, telles que renvoyées par l'IA. */
  steps: string[];
  /** Fourchette indicative si l'IA a pu en produire une. */
  range: string | null;
  /** Vrai lorsque l'estimation vient de l'IA, faux si repli local. */
  assisted: boolean;
};

const FALLBACK: QuoteSimulation = {
  summary:
    "L’estimation automatique n’est pas disponible pour le moment. Décrivez votre besoin dans le formulaire de contact : Angel vous répond avec une proposition écrite et chiffrée, sans engagement.",
  steps: [],
  range: null,
  assisted: false,
};

/**
 * Simulation de devis assistée par IA. Le résultat est explicitement indicatif :
 * aucun montant n'est engagé, seul un devis écrit signé par Angel fait foi.
 */
export const simulateQuote = createServerFn({ method: "POST" })
  .validator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }): Promise<QuoteSimulation> => {
    try {
      const { getRequestIP } = await import("@tanstack/react-start/server");
      const { checkAssistantRate } = await import("./assistant-rate.server");
      let ip = "unknown";
      try {
        ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
      } catch {
        ip = "unknown";
      }
      if (!checkAssistantRate(ip)) return FALLBACK;
    } catch (error) {
      console.warn("[quote] contrôle de débit indisponible", error);
    }

    const system = [
      "Tu aides un visiteur à estimer le coût d'une prestation d'Angel Leclerc Communication (Sarlat-la-Canéda).",
      "Tu t'appuies UNIQUEMENT sur les tarifs et prestations réellement publiés ci-dessous. N'invente jamais un tarif absent.",
      "Si le besoin ne correspond à aucune prestation publiée, dis-le simplement et propose un échange.",
      "Réponds en français simple, sans jargon, en trois blocs exactement :",
      "RESUME: 2 à 4 phrases expliquant ce qui serait fait.",
      "ETAPES: 3 à 5 étapes séparées par « | ».",
      "FOURCHETTE: une fourchette indicative en euros basée sur les tarifs publiés, ou « à définir ensemble ».",
      "Rappelle implicitement que ce n'est pas un devis contractuel.",
      "",
      PUBLIC_SITE_CONTEXT,
    ].join("\n");

    const user = [
      `Besoin décrit : ${data.need}`,
      data.structure ? `Type de structure : ${data.structure}` : "",
      data.deadline ? `Délai souhaité : ${data.deadline}` : "",
      data.budget ? `Budget évoqué : ${data.budget}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const messages: AiMessage[] = [
      { role: "system", content: system },
      { role: "user", content: user },
    ];

    try {
      const { resilientAngelAi } = await import("./ai-resilient.server");
      const result = await resilientAngelAi({
        messages,
        priority: "interactive",
        maxTokens: 700,
        temperature: 0.3,
      });
      const text = result.text?.trim();
      if (!text) return FALLBACK;

      const pick = (label: string) => {
        const match = text.match(new RegExp(`${label}\\s*:?\\s*([\\s\\S]*?)(?=\\n?(?:RESUME|ETAPES|FOURCHETTE)\\s*:|$)`, "i"));
        return (match?.[1] ?? "").trim();
      };

      const summary = pick("RESUME") || text.slice(0, 700);
      const steps = pick("ETAPES")
        .split(/\||\n/)
        .map((step) => step.replace(/^[-•\d.\s]+/, "").trim())
        .filter(Boolean)
        .slice(0, 6);
      const range = pick("FOURCHETTE").replace(/\s+/g, " ").trim();

      return {
        summary: summary.slice(0, 1200),
        steps,
        range: range ? range.slice(0, 160) : null,
        assisted: true,
      };
    } catch (error) {
      console.warn("[quote] estimation IA indisponible", error);
      return FALLBACK;
    }
  });
