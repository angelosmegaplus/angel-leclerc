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
}) {
  let attempt = 0;
  let result = await angelAi(options);

  while (!result.text && attempt < 2) {
    const decision = chooseRecovery({
      reason: result.reason === "provider" || result.reason === "budget" || result.reason === "circuit_open" || result.reason === "disabled" || result.reason === "not_configured"
        ? result.reason
        : "provider",
      attempt,
      hasFallbackModel: Boolean(process.env["OPENAI_FALLBACK_MODEL"]),
    });

    if (decision.action !== "retry") {
      return { ...result, recoveryAction: decision.action, recoveryExplanation: decision.explanation };
    }

    if (decision.delayMs) await sleep(decision.delayMs);
    attempt += 1;
    result = await angelAi(options);
  }

  return {
    ...result,
    recoveryAction: result.text ? (attempt > 0 ? "retry" : "none") : "use_local",
    recoveryExplanation: result.text
      ? attempt > 0
        ? `Récupération automatique réussie après ${attempt} nouvelle(s) tentative(s).`
        : "Fonctionnement normal."
      : "Le fournisseur reste indisponible : le module appelant doit utiliser son moteur local de secours.",
  };
}
