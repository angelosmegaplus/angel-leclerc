import { createServerFn } from "@tanstack/react-start";

// Angel OS n'utilise plus Angel OS IA : le moteur IA est la passerelle IA Lovable (modèles Google Gemini).
// Ces fonctions conservent leurs noms historiques pour ne pas casser les écrans d'administration.

export const getOpenAiCredentialStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getLovableAiKey, LOVABLE_AI_SOURCE } = await import("./lovable-ai.server");
  const configured = Boolean(getLovableAiKey());
  return {
    envApiKey: configured,
    vaultApiKey: false,
    cookieApiKey: false,
    activeSource: configured ? LOVABLE_AI_SOURCE : null,
  };
});

export const saveOpenAiCredential = createServerFn({ method: "POST" })
  .validator((input: { apiKey?: string }) => ({ apiKey: String(input?.apiKey ?? "").trim() }))
  .handler(async () => {
    throw new Error("Le moteur IA d’Angel OS est fourni par la passerelle IA Lovable : aucune clé à saisir.");
  });

export const clearOpenAiCredential = createServerFn({ method: "POST" }).handler(async () => ({ ok: true as const }));

export const testActiveOpenAiCredential = createServerFn({ method: "GET" }).handler(async () => {
  const { getLovableAiKey, probeLovableAi, LOVABLE_AI_SOURCE } = await import("./lovable-ai.server");
  if (!getLovableAiKey()) return { ok: false as const, source: null, error: "LOVABLE_API_KEY absente côté serveur." };
  const probe = await probeLovableAi();
  return { ok: probe.healthy, source: LOVABLE_AI_SOURCE, error: probe.healthy ? null : probe.detail };
});
