import { createServerFn } from "@tanstack/react-start";
import { getTmdbCredential } from "./runtime-credentials.server";

const BASE = "https://api.themoviedb.org/3";

type CredentialInput = { apiKey?: string; readToken?: string };

async function validateCredential(value: string, kind: "api-key" | "read-token") {
  const url = new URL(`${BASE}/configuration`);
  if (kind === "api-key") url.searchParams.set("api_key", value);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: kind === "read-token"
        ? { Authorization: `Bearer ${value}`, Accept: "application/json" }
        : { Accept: "application/json" },
    });
    if (!response.ok) {
      let detail = "";
      try {
        const body = await response.json() as { status_message?: string };
        detail = body.status_message ? ` — ${body.status_message}` : "";
      } catch {}
      throw new Error(`TMDB_${kind === "read-token" ? "READ_TOKEN" : "API_KEY"}_INVALID_${response.status}${detail}`);
    }
    return true;
  } finally {
    clearTimeout(timer);
  }
}

export const getTmdbCredentialStatus = createServerFn({ method: "GET" }).handler(async () => {
  const credential = await getTmdbCredential();
  return {
    envReadToken: Boolean(process.env.TMDB_READ_TOKEN?.trim() || process.env.TMDB_READ_ACCESS_TOKEN?.trim()),
    envApiKey: Boolean(process.env.TMDB_API_KEY?.trim()),
    vaultReadToken: false,
    vaultApiKey: false,
    cookieReadToken: false,
    cookieApiKey: false,
    activeSource: credential?.source ?? null,
  };
});

// Conservé uniquement pour les anciens imports de l’admin.
// Les identifiants TMDB sont fournis par les secrets du runtime Lovable.
export const saveTmdbCredentials = createServerFn({ method: "POST" })
  .validator((input: CredentialInput) => ({
    apiKey: String(input?.apiKey ?? "").trim(),
    readToken: String(input?.readToken ?? "").trim(),
  }))
  .handler(async () => {
    throw new Error("La configuration TMDB se fait dans les secrets du projet Lovable.");
  });

export const clearTmdbCredentials = createServerFn({ method: "POST" }).handler(async () => ({ ok: true as const }));

export const testActiveTmdbCredential = createServerFn({ method: "GET" }).handler(async () => {
  const credential = await getTmdbCredential();
  if (!credential) return { ok: false as const, source: null, error: "TMDB_READ_TOKEN/TMDB_API_KEY absent des secrets du runtime Lovable." };

  try {
    await validateCredential(credential.value, credential.kind === "bearer" ? "read-token" : "api-key");
    return { ok: true as const, source: credential.source, error: null };
  } catch (error) {
    return {
      ok: false as const,
      source: credential.source,
      error: error instanceof Error ? error.message : "Erreur TMDB inconnue.",
    };
  }
});
