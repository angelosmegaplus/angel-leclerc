import { createFileRoute } from "@tanstack/react-router";
import { angelEventLog, angelMemoryIndex, angelNodeGateway } from "@/lib/angel-runtime.server";
import { getOpenAiCredential, getTmdbCredential } from "@/lib/vercel-connect-credentials.server";
import { getVaultSecretSync, getVaultSecretSource, warmVaultSecrets } from "@/lib/angel-vault.server";
import { readIntegrations } from "@/lib/system.server";

type DependencyHealth = {
  configured: boolean;
  reachable: boolean | null;
  source?: string | null;
  reason?: string | null;
  latencyMs?: number | null;
};

async function timed<T>(work: (signal: AbortSignal) => Promise<T>, timeoutMs = 2800): Promise<{ value: T; latencyMs: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  try {
    const value = await work(controller.signal);
    return { value, latencyMs: Math.round((performance.now() - started) * 10) / 10 };
  } finally {
    clearTimeout(timer);
  }
}

async function checkOpenAI(): Promise<DependencyHealth> {
  const credential = await getOpenAiCredential();
  if (!credential) return { configured: false, reachable: null, reason: "credential_missing", latencyMs: null };
  try {
    const { value: response, latencyMs } = await timed((signal) => fetch("https://api.openai.com/v1/models", {
      signal,
      headers: { Authorization: `Bearer ${credential.value}` },
    }));
    return { configured: true, reachable: response.ok, source: credential.source, latencyMs, reason: response.ok ? null : `http_${response.status}` };
  } catch (error) {
    return { configured: true, reachable: false, source: credential.source, latencyMs: null, reason: error instanceof Error ? error.name : "request_failed" };
  }
}

async function checkTmdb(): Promise<DependencyHealth> {
  const credential = await getTmdbCredential();
  if (!credential) return { configured: false, reachable: null, reason: "credential_missing", latencyMs: null };
  try {
    const url = credential.kind === "api-key"
      ? `https://api.themoviedb.org/3/configuration?api_key=${encodeURIComponent(credential.value)}`
      : "https://api.themoviedb.org/3/configuration";
    const { value: response, latencyMs } = await timed((signal) => fetch(url, {
      signal,
      headers: credential.kind === "bearer" ? { Authorization: `Bearer ${credential.value}`, Accept: "application/json" } : { Accept: "application/json" },
    }));
    return { configured: true, reachable: response.ok, source: credential.source, latencyMs, reason: response.ok ? null : `http_${response.status}` };
  } catch (error) {
    return { configured: true, reachable: false, source: credential.source, latencyMs: null, reason: error instanceof Error ? error.name : "request_failed" };
  }
}

async function checkSupabaseAuth(): Promise<DependencyHealth> {
  const url = getVaultSecretSync("SUPABASE_URL") || import.meta.env.VITE_SUPABASE_URL?.trim();
  const publishableKey = getVaultSecretSync("SUPABASE_PUBLISHABLE_KEY") || getVaultSecretSync("SUPABASE_ANON_KEY") || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  const source = getVaultSecretSync("SUPABASE_URL")
    ? `${getVaultSecretSource("SUPABASE_URL")}+${getVaultSecretSource("SUPABASE_PUBLISHABLE_KEY")}`
    : "bundled-public-config";
  if (!url || !publishableKey) return { configured: false, reachable: null, source, reason: "public_config_missing", latencyMs: null };
  try {
    const { value: response, latencyMs } = await timed((signal) => fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      signal,
      headers: { apikey: publishableKey },
    }));
    return { configured: true, reachable: response.ok, source, latencyMs, reason: response.ok ? null : `http_${response.status}` };
  } catch (error) {
    return { configured: true, reachable: false, source, latencyMs: null, reason: error instanceof Error ? error.name : "request_failed" };
  }
}

export const Route = createFileRoute("/api/angel-os/health")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date().toISOString();
        const node = angelNodeGateway.select();
        const prewarm = warmVaultSecrets([
          "SUPABASE_URL",
          "SUPABASE_PUBLISHABLE_KEY",
          "SUPABASE_SERVICE_ROLE_KEY",
          "OPENAI_API_KEY",
          "TMDB_READ_TOKEN",
          "TMDB_API_KEY",
          "GOOGLE_CLIENT_ID",
          "GOOGLE_CLIENT_SECRET",
        ]);
        const google = readIntegrations().find((item) => item.key === "google");
        const [openai, tmdb, supabaseAuth] = await Promise.all([checkOpenAI(), checkTmdb(), checkSupabaseAuth()]);
        return Response.json(
          {
            service: "angel-os",
            layer: "angel-os",
            healthy: openai.reachable !== false && tmdb.reachable !== false && supabaseAuth.reachable !== false,
            checkedAt: now,
            release: process.env["VERCEL_GIT_COMMIT_SHA"] ?? process.env["GITHUB_SHA"] ?? null,
            vault: {
              configured: Boolean(process.env.ANGEL_OS_VAULT_KEY?.trim()),
              warmupMs: prewarm.durationMs,
              loadedCount: prewarm.loaded.length,
              missing: prewarm.missing,
            },
            runtime: {
              memoryDocuments: angelMemoryIndex.stats().total,
              recentEvents: angelEventLog.list({ limit: 20 }).length,
              selectedNode: node?.id ?? null,
            },
            dependencies: {
              openai,
              tmdb,
              supabaseAuth,
              google: {
                configured: google?.status === "ready",
                reachable: null,
                source: "oauth-google-general",
                reason: google?.status === "ready" ? "oauth_account_tested_after_connection" : `missing:${google?.missing.join(",") || "configuration"}`,
                latencyMs: null,
              } satisfies DependencyHealth,
            },
            angelOsIaRequired: false,
          },
          { headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" } },
        );
      },
    },
  },
});
