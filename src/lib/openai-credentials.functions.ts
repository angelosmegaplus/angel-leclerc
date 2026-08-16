import { createServerFn } from "@tanstack/react-start";
import { getOpenAiCredential } from "./vercel-connect-credentials.server";

async function validateOpenAiKey(value: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${value}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      let detail = "";
      try {
        const body = await response.json() as { error?: { message?: string; type?: string; code?: string | null } };
        const message = body.error?.message?.trim();
        const code = body.error?.code || body.error?.type;
        detail = message ? ` — ${message}${code ? ` (${code})` : ""}` : "";
      } catch {
        // Keep the public error concise when the provider returns a non-JSON body.
      }
      throw new Error(`OPENAI_API_KEY_INVALID_${response.status}${detail}`);
    }
    return true;
  } finally {
    clearTimeout(timer);
  }
}

export const getOpenAiCredentialStatus = createServerFn({ method: "GET" }).handler(async () => {
  const credential = await getOpenAiCredential();
  return {
    envApiKey: Boolean(process.env.OPENAI_API_KEY?.trim()),
    vaultApiKey: false,
    cookieApiKey: false,
    activeSource: credential?.source ?? null,
  };
});

// Legacy admin actions kept only so old imports cannot crash a build.
// Credentials are configured exclusively in Vercel Environment Variables.
export const saveOpenAiCredential = createServerFn({ method: "POST" })
  .validator((input: { apiKey?: string }) => ({ apiKey: String(input?.apiKey ?? "").trim() }))
  .handler(async () => {
    throw new Error("La configuration OpenAI se fait uniquement dans les variables d’environnement Vercel.");
  });

export const clearOpenAiCredential = createServerFn({ method: "POST" }).handler(async () => ({ ok: true as const }));

export const testActiveOpenAiCredential = createServerFn({ method: "GET" }).handler(async () => {
  const credential = await getOpenAiCredential();
  if (!credential) return { ok: false as const, source: null, error: "OPENAI_API_KEY absente des variables Vercel." };

  try {
    await validateOpenAiKey(credential.value);
    return { ok: true as const, source: credential.source, error: null };
  } catch (error) {
    return {
      ok: false as const,
      source: credential.source,
      error: error instanceof Error ? error.message : "Erreur OpenAI inconnue.",
    };
  }
});
