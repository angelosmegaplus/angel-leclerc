import { angelAi, type AiMessage, type AiPriority } from "./ai-gateway.server";
import { chooseRecovery } from "./ai-recovery.server";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function resilientAngelAi(options: {
  messages: AiMessage[];
  priority?: AiPriority;
  maxTokens?: number;
  temperature?: number;
  cacheKey?: string;
  cacheTtlMs?: number;
  model?: string;
}) {
  let attempt = 0;
  let usedFallbackModel = false;
  let currentOptions = options;
  let result = await angelAi(currentOptions);
  const fallbackModel = process.env["OPENAI_FALLBACK_MODEL"]?.trim();
  const primaryModel = options.model || process.env["OPENAI_MODEL"] || "gpt-4o-mini";

  while (!result.text && attempt < 2) {
    if (
      result.reason === "provider" &&
      fallbackModel &&
      fallbackModel !== primaryModel &&
      !usedFallbackModel
    ) {
      usedFallbackModel = true;
      attempt += 1;
      currentOptions = { ...options, model: fallbackModel, cacheKey: options.cacheKey ? `${options.cacheKey}:fallback` : undefined };
      result = await angelAi(currentOptions);
      continue;
    }

    const decision = chooseRecovery({
      reason:
        result.reason === "provider" ||
        result.reason === "budget" ||
        result.reason === "circuit_open" ||
        result.reason === "disabled" ||
        result.reason === "not_configured"
          ? result.reason
          : "provider",
      attempt,
      hasFallbackModel: Boolean(fallbackModel),
    });

    if (decision.action !== "retry") {
      return {
        ...result,
        recoveryAction: decision.action,
        recoveryExplanation: decision.explanation,
        usedFallbackModel,
      };
    }

    if (decision.delayMs) await sleep(decision.delayMs);
    attempt += 1;
    result = await angelAi(currentOptions);
  }

  return {
    ...result,
    recoveryAction: result.text ? (attempt > 0 ? "retry" : "none") : "wait",
    recoveryExplanation: result.text
      ? usedFallbackModel
        ? "Récupération réussie via le modèle de secours configuré."
        : attempt > 0
          ? `Récupération réussie après ${attempt} nouvelle(s) tentative(s).`
          : "Fonctionnement normal."
      : "Le fournisseur reste indisponible : le module appelant doit différer la génération ou utiliser uniquement des données déterministes.",
    usedFallbackModel,
  };
}
