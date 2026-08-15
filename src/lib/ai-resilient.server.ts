import { angelAi, type AiMessage, type AiPriority } from "./ai-gateway.server";
import { chooseRecovery } from "./ai-recovery.server";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPrivateAdminConversation(messages: AiMessage[]) {
  return messages.some(
    (message) =>
      message.role === "system" &&
      /espace administrateur privé Angel OS|assistant principal de l'espace administrateur/i.test(message.content),
  );
}

function adminFailureMessage(result: { reason?: string; detail?: string | null; recoveryExplanation?: string | null }) {
  const labels: Record<string, string> = {
    disabled: "IA intégrée désactivée",
    not_configured: "configuration OpenAI absente ou inaccessible",
    budget: "limite interne de budget IA atteinte",
    circuit_open: "circuit de protection IA temporairement ouvert",
    provider: "échec du fournisseur OpenAI",
  };
  const label = labels[result.reason ?? ""] ?? "échec de l'IA intégrée";
  const detail = result.detail?.trim() || result.recoveryExplanation?.trim() || "Aucun détail technique supplémentaire n'a été fourni.";
  return `Impossible d'obtenir une réponse de l'IA intégrée. Problème détecté : ${label}.\n\nDétail technique : ${detail}\n\nAucune réponse locale n'a été substituée dans l'espace administrateur.`;
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
      const failure = {
        ...result,
        recoveryAction: decision.action,
        recoveryExplanation: decision.explanation,
        usedFallbackModel,
      };
      if (options.priority === "interactive" && isPrivateAdminConversation(options.messages)) {
        return {
          ...failure,
          text: adminFailureMessage(failure),
          fallbackRequired: false,
          adminFailure: true,
        };
      }
      return failure;
    }

    if (decision.delayMs) await sleep(decision.delayMs);
    attempt += 1;
    result = await angelAi(currentOptions);
  }

  const finalResult = {
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

  if (!finalResult.text && options.priority === "interactive" && isPrivateAdminConversation(options.messages)) {
    return {
      ...finalResult,
      text: adminFailureMessage(finalResult),
      fallbackRequired: false,
      adminFailure: true,
    };
  }

  return finalResult;
}
