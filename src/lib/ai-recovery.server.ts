export type RecoveryReason = "provider" | "budget" | "circuit_open" | "disabled" | "not_configured";

export type RecoveryDecision = {
  action: "retry" | "use_cache" | "use_fallback_model" | "use_local" | "wait";
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
    return { action: "use_cache", explanation: "Réponse déjà calculée disponible." };
  }
  if (input.reason === "budget") {
    return input.hasStaleCache
      ? { action: "use_cache", explanation: "Budget IA atteint : réutilisation d'une réponse encore exploitable." }
      : { action: "use_local", explanation: "Budget IA atteint : bascule sur le moteur local." };
  }
  if (input.reason === "disabled" || input.reason === "not_configured") {
    return { action: "use_local", explanation: "Fournisseur IA indisponible : continuité assurée localement." };
  }
  if (input.reason === "circuit_open") {
    return input.hasStaleCache
      ? { action: "use_cache", explanation: "Circuit temporairement ouvert : utilisation du cache." }
      : { action: "wait", delayMs: 30_000, explanation: "Circuit temporairement ouvert : pas de nouvel appel fournisseur." };
  }
  const transient = input.status === 0 || input.status === 408 || input.status === 429 || (input.status ?? 0) >= 500;
  if (transient && input.attempt < 2) {
    return { action: "retry", delayMs: input.attempt === 0 ? 350 : 900, explanation: "Erreur transitoire : nouvelle tentative contrôlée." };
  }
  if (input.hasFallbackModel) {
    return { action: "use_fallback_model", explanation: "Le modèle principal échoue : bascule vers le modèle de secours." };
  }
  if (input.hasStaleCache) {
    return { action: "use_cache", explanation: "Fournisseur en échec : continuité via cache récent." };
  }
  return { action: "use_local", explanation: "Aucune récupération distante disponible : bascule locale." };
}
