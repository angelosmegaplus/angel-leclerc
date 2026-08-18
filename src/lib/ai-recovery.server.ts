export type RecoveryReason = "provider" | "budget" | "circuit_open" | "disabled" | "not_configured";

export type RecoveryDecision = {
  action: "retry" | "use_cache" | "use_fallback_model" | "wait";
  delayMs?: number;
  explanation: string;
};

export function chooseRecovery(input: {
  reason: RecoveryReason;
  attempt: number;
  status?: number;
  hasFreshCache?: boolean;
  hasStaleCache?: boolean;
  hasFallbackModel?: boolean;
}): RecoveryDecision {
  if (input.hasFreshCache) {
    return { action: "use_cache", explanation: "Réponse Angel OS IA déjà calculée disponible." };
  }
  if (input.reason === "budget") {
    return input.hasStaleCache
      ? { action: "use_cache", explanation: "Budget IA atteint : réutilisation temporaire d'une réponse Angel OS IA récente." }
      : { action: "wait", delayMs: 60_000, explanation: "Budget Angel OS IA atteint : pas de remplacement par une IA locale." };
  }
  if (input.reason === "disabled" || input.reason === "not_configured") {
    return { action: "wait", delayMs: 60_000, explanation: "OpenAI n'est pas disponible : le système attend au lieu de produire une réponse IA locale." };
  }
  if (input.reason === "circuit_open") {
    return input.hasStaleCache
      ? { action: "use_cache", explanation: "Circuit temporairement ouvert : utilisation d'une réponse Angel OS IA en cache." }
      : { action: "wait", delayMs: 30_000, explanation: "Circuit temporairement ouvert : nouvel appel Angel OS IA différé." };
  }
  const transient = input.status === 0 || input.status === 408 || input.status === 429 || (input.status ?? 0) >= 500;
  if (transient && input.attempt < 2) {
    return { action: "retry", delayMs: input.attempt === 0 ? 350 : 900, explanation: "Erreur transitoire Angel OS IA : nouvelle tentative contrôlée." };
  }
  if (input.hasFallbackModel) {
    return { action: "use_fallback_model", explanation: "Le modèle Angel OS IA principal échoue : bascule vers le modèle Angel OS IA de secours." };
  }
  if (input.hasStaleCache) {
    return { action: "use_cache", explanation: "OpenAI est momentanément indisponible : continuité via une réponse Angel OS IA récente." };
  }
  return { action: "wait", delayMs: 60_000, explanation: "Aucune réponse Angel OS IA disponible : la demande est différée, sans génération IA locale." };
}
