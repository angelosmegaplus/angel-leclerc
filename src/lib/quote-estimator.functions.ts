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

export type QuoteLine = {
  label: string;
  low: number;
  high: number;
  note?: string;
};

export type QuoteSimulation = {
  /** Estimation rédigée, jamais contractuelle. */
  summary: string;
  /** Étapes proposées. */
  steps: string[];
  /** Détail chiffré, toujours renseigné. */
  lines: QuoteLine[];
  /** Montants simulés en euros. */
  low: number;
  high: number;
  /** Formulation lisible de la fourchette (« 200 € à 380 € »). */
  range: string;
  /** Vrai lorsque le texte vient de l'IA, faux si repli local. */
  assisted: boolean;
  /** Facturation récurrente détectée (abonnement mensuel). */
  recurring: boolean;
  /** Hypothèses retenues pour arriver à ce montant. */
  assumptions: string[];
};

/** Tarif horaire public (accompagnement personnel : 50 € pour 1 h). */
const HOURLY = 50;

type Rule = {
  key: string;
  label: string;
  low: number;
  high: number;
  recurring?: boolean;
  note?: string;
  match: RegExp;
};

/**
 * Règles de simulation. Les montants s'appuient sur les tarifs publiés
 * (rédaction dès 30 €, affiche/flyer dès 50 €, identité visuelle dès 150 €,
 * accompagnement 50 €/h, communication externalisée 173,33 à 390 €/mois).
 * Pour les besoins sans tarif public, l'estimation est calculée en heures
 * au tarif horaire de 50 €, et l'hypothèse est affichée au visiteur.
 */
const RULES: Rule[] = [
  { key: "logo", label: "Identité visuelle simple (logo et déclinaisons de base)", low: 150, high: 320, match: /\blogos?\b|identit[ée] visuelle|charte graphique|branding/i },
  { key: "flyer", label: "Affiche ou flyer (création et mise en page)", low: 50, high: 130, match: /flyer|affiche|prospectus|tract|dépliant|depliant|brochure|plaquette|carte de visite/i },
  { key: "redaction", label: "Rédaction de textes (page, article ou présentation)", low: 30, high: 150, match: /r[ée]daction|texte|article|slogan|accroche|newsletter|communiqu[ée]/i },
  { key: "web", label: "Page web simple (mise en place et contenus)", low: 6 * HOURLY, high: 16 * HOURLY, note: "Estimé en heures au tarif horaire de 50 €", match: /site|page web|internet|landing|vitrine|wordpress|boutique en ligne/i },
  { key: "reseaux", label: "Communication externalisée (réseaux sociaux et messages)", low: 173, high: 390, recurring: true, note: "Formules mensuelles publiées : 173,33 €, 260 € ou 390 € par mois", match: /r[ée]seaux sociaux|instagram|facebook|community|publications? r[ée]guli[èe]re|permanence|appels?|standard|accueil client/i },
  { key: "video", label: "Contenu photo ou vidéo (tournage léger et montage)", low: 4 * HOURLY, high: 12 * HOURLY, note: "Estimé en heures au tarif horaire de 50 €", match: /vid[ée]o|photo|reportage|montage|podcast|audio|reel/i },
  { key: "event", label: "Coordination d’un événement ou d’un projet", low: 5 * HOURLY, high: 14 * HOURLY, note: "Estimé en heures au tarif horaire de 50 €", match: /[ée]v[ée]nement|inauguration|salon|porte ouverte|festival|lancement|coordination/i },
  { key: "conseil", label: "Accompagnement en communication (échange d’1 h)", low: 50, high: 150, note: "Tarif publié : 50 € l’heure", match: /conseil|accompagnement|strat[ée]gie|aide|clarifier|r[ée]flexion|id[ée]es/i },
];

function round5(value: number) {
  return Math.max(0, Math.round(value / 5) * 5);
}

function euro(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} €`;
}

/** Calcul déterministe : produit toujours un montant simulé. */
function computeEstimate(input: { need: string; structure?: string; deadline?: string }) {
  const need = input.need;
  const matched = RULES.filter((rule) => rule.match.test(need));
  const assumptions: string[] = [];

  const selected = matched.length > 0
    ? matched
    : [{ key: "base", label: "Accompagnement sur mesure (analyse du besoin et réalisation)", low: 2 * HOURLY, high: 8 * HOURLY, note: "Estimé en heures au tarif horaire de 50 €", match: /./ } as Rule];

  if (matched.length === 0) {
    assumptions.push("Votre demande ne correspond pas exactement à une prestation affichée : l’estimation part d’un accompagnement sur mesure facturé à l’heure.");
  }

  const lines: QuoteLine[] = selected.map((rule) => ({
    label: rule.label,
    low: rule.low,
    high: rule.high,
    ...(rule.note ? { note: rule.note } : {}),
  }));

  const recurring = selected.some((rule) => rule.recurring);
  let low = selected.reduce((sum, rule) => sum + rule.low, 0);
  let high = selected.reduce((sum, rule) => sum + rule.high, 0);

  if (/urgen|rapide|imm[ée]diat/i.test(need) || input.deadline === "Dès que possible") {
    low *= 1.1;
    high *= 1.2;
    assumptions.push("Délai court pris en compte : un supplément d’organisation est intégré.");
  }

  if (input.structure === "Association" || input.structure === "Particulier") {
    low *= 0.9;
    high *= 0.95;
    assumptions.push("Structure associative ou particulier : l’estimation est ajustée vers le bas.");
  }

  low = Math.max(round5(low), 70);
  high = Math.max(round5(high), low + 50);

  assumptions.push("Le nombre exact de supports, de pages et d’allers-retours n’est pas connu : le montant final peut être plus bas ou plus haut.");

  return { lines, low, high, recurring, assumptions };
}

/**
 * Simulation de devis. Un montant est toujours calculé localement à partir des
 * tarifs publiés ; l'IA ne sert qu'à rédiger l'explication et les étapes.
 * Le résultat reste explicitement indicatif et non contractuel.
 */
export const simulateQuote = createServerFn({ method: "POST" })
  .validator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }): Promise<QuoteSimulation> => {
    const estimate = computeEstimate({
      need: data.need,
      ...(data.structure ? { structure: data.structure } : {}),
      ...(data.deadline ? { deadline: data.deadline } : {}),
    });

    const suffix = estimate.recurring ? " par mois" : "";
    const range = `${euro(estimate.low)} à ${euro(estimate.high)}${suffix}`;

    const base: QuoteSimulation = {
      summary: `D’après votre description, la prestation la plus proche coûterait environ ${range}. Ce montant est une simulation automatique : il peut évoluer selon le nombre de supports, le niveau de détail et les échanges nécessaires.`,
      steps: [
        "Premier échange gratuit pour préciser le besoin",
        "Proposition écrite et chiffrée, sans engagement",
        "Réalisation puis validation ensemble",
      ],
      lines: estimate.lines,
      low: estimate.low,
      high: estimate.high,
      range,
      assisted: false,
      recurring: estimate.recurring,
      assumptions: estimate.assumptions,
    };

    try {
      const { getRequestIP } = await import("@tanstack/react-start/server");
      const { checkAssistantRate } = await import("./assistant-rate.server");
      let ip = "unknown";
      try {
        ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
      } catch {
        ip = "unknown";
      }
      if (!checkAssistantRate(ip)) return base;
    } catch (error) {
      console.warn("[quote] contrôle de débit indisponible", error);
    }

    const system = [
      "Tu rédiges l'explication d'une simulation de devis pour Angel Leclerc Communication (Sarlat-la-Canéda).",
      "Le montant est DÉJÀ calculé : tu ne le modifies pas et tu ne proposes aucun autre tarif.",
      "Tu expliques simplement, en français courant, ce qui serait fait pour ce montant.",
      "Réponds en deux blocs exactement :",
      "RESUME: 2 à 4 phrases claires, sans jargon, rappelant que le montant est une estimation et non un devis.",
      "ETAPES: 3 à 5 étapes concrètes séparées par « | ».",
      "",
      PUBLIC_SITE_CONTEXT,
    ].join("\n");

    const user = [
      `Besoin décrit : ${data.need}`,
      data.structure ? `Type de structure : ${data.structure}` : "",
      data.deadline ? `Délai souhaité : ${data.deadline}` : "",
      `Montant simulé retenu : ${range}`,
      `Détail retenu : ${estimate.lines.map((line) => `${line.label} (${euro(line.low)}–${euro(line.high)})`).join(" ; ")}`,
    ]
      .filter(Boolean)
      .join("\n");

    const messages: AiMessage[] = [
      { role: "system", content: system },
      { role: "user", content: user },
    ];

    try {
      const { resilientAngelAi } = await import("./ai-resilient.server");
      const result = await resilientAngelAi({ messages, priority: "interactive", maxTokens: 600, temperature: 0.3 });
      const text = result.text?.trim();
      if (!text) return base;

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

      return {
        ...base,
        summary: summary.slice(0, 1200),
        steps: steps.length > 0 ? steps : base.steps,
        assisted: true,
      };
    } catch (error) {
      console.warn("[quote] rédaction IA indisponible", error);
      return base;
    }
  });
