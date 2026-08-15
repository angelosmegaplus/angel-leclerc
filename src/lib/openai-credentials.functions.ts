import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { OPENAI_API_KEY_COOKIE } from "./vercel-connect-credentials.server";

const COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  maxAge: 60 * 60 * 24 * 180,
};

async function validateOpenAiKey(value: string) {
  const response = await fetch("https://api.openai.com/v1/models", {
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
      // no-op
    }
    throw new Error(`OPENAI_API_KEY_INVALID_${response.status}${detail}`);
  }
  return true;
}

export const getOpenAiCredentialStatus = createServerFn({ method: "GET" }).handler(async () => {
  const envApiKey = Boolean(process.env["OPENAI_API_KEY"]?.trim());
  const cookieApiKey = Boolean(getCookie(OPENAI_API_KEY_COOKIE));

  let activeSource: string | null = null;
  try {
    const { getOpenAiCredential } = await import("./vercel-connect-credentials.server");
    activeSource = (await getOpenAiCredential())?.source ?? null;
  } catch {
    activeSource = null;
  }

  return { envApiKey, cookieApiKey, activeSource };
});

export const saveOpenAiCredential = createServerFn({ method: "POST" })
  .validator((input: { apiKey?: string }) => ({
    apiKey: String(input?.apiKey ?? "").trim().slice(0, 4096),
  }))
  .handler(async ({ data }) => {
    if (!data.apiKey) throw new Error("Renseigne une clé API OpenAI.");
    await validateOpenAiKey(data.apiKey);
    setCookie(OPENAI_API_KEY_COOKIE, data.apiKey, COOKIE_OPTIONS);
    return {
      ok: true as const,
      message: "Clé OpenAI vérifiée et enregistrée côté serveur pour ce navigateur.",
    };
  });

export const clearOpenAiCredential = createServerFn({ method: "POST" }).handler(async () => {
  setCookie(OPENAI_API_KEY_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return { ok: true as const };
});

export const testActiveOpenAiCredential = createServerFn({ method: "GET" }).handler(async () => {
  const { getOpenAiCredential } = await import("./vercel-connect-credentials.server");
  const credential = await getOpenAiCredential();
  if (!credential) return { ok: false as const, source: null, error: "Aucun identifiant OpenAI disponible." };

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
