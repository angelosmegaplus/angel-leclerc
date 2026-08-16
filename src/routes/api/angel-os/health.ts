import { createFileRoute } from "@tanstack/react-router";
import { angelEventLog, angelMemoryIndex, angelNodeGateway } from "@/lib/angel-runtime.server";
import { getOpenAiCredential, getTmdbCredential } from "@/lib/vercel-connect-credentials.server";
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
  if (!credential) return { configured: false, reachable: null, source: "env:OPENAI_API_KEY", reason: "credential_missing", latencyMs: null };
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
  if (!credential) return { configured: false, reachable: null, source: "env:TMDB_READ_TOKEN", reason: "credential_missing", latencyMs: null };
  try {
    const url = credential.kind === "api-key"
      ? `https://api.themoviedb.org/3/configuration?api_key=${encodeURIComponent(credential.value)}`
      : "https://api.themoviedb.org/3/configuration";
    const { value: response, latencyMs } = await timed((signal) => fetch(url, {
      signal,
      headers: credential.kind === "bearer"
        ? { Authorization: `Bearer ${credential.value}`, Accept: "application/json" }
        : { Accept: "application/json" },
    }));
    return { configured: true, reachable: response.ok, source: credential.source, latencyMs, reason: response.ok ? null : `http_${response.status}` };
  } catch (error) {
    return { configured: true, reachable: false, source: credential.source, latencyMs: null, reason: error instanceof Error ? error.name : "request_failed" };
  }
}

async function checkSupabaseAuth(): Promise<DependencyHealth> {
  const url = process.env.SUPABASE_URL?.trim() || import.meta.env.VITE_SUPABASE_URL?.trim();
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.SUPABASE_ANON_KEY?.trim()
    || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) return { configured: false, reachable: null, source: "environment", reason: "public_config_missing", latencyMs: null };
  try {
    const { value: response, latencyMs } = await timed((signal) => fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      signal,
      headers: { apikey: publishableKey },
    }));
    return { configured: true, reachable: response.ok, source: "environment", latencyMs, reason: response.ok ? null : `http_${response.status}` };
  } catch (error) {
    return { configured: true, reachable: false, source: "environment", latencyMs: null, reason: error instanceof Error ? error.name : "request_failed" };
  }
}

export const Route = createFileRoute("/api/angel-os/health")({
  server: {
    handlers: {
      GET: async () => {
        const node = angelNodeGateway.select();
        const google = readIntegrations().find((item) => item.key === "google");
        const [openai, tmdb, supabaseAuth] = await Promise.all([checkOpenAI(), checkTmdb(), checkSupabaseAuth()]);
        const missingEnvironment = [
          "OPENAI_API_KEY",
          "TMDB_READ_TOKEN",
          "SUPABASE_URL",
          "SUPABASE_SERVICE_ROLE_KEY",
          "GOOGLE_CLIENT_ID",
          "GOOGLE_CLIENT_SECRET",
        ].filter((name) => !process.env[name]?.trim() && !(name === "TMDB_READ_TOKEN" && process.env.TMDB_API_KEY?.trim()));

        return Response.json({
          service: "angel-os",
          healthy: openai.reachable !== false && tmdb.reachable !== false && supabaseAuth.reachable !== false,
          checkedAt: new Date().toISOString(),
          release: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null,
          configuration: {
            source: "vercel-environment",
            missing: missingEnvironment,
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
              source: "oauth-google",
              reason: google?.status === "ready" ? "ready_for_oauth" : `missing:${google?.missing.join(",") || "configuration"}`,
              latencyMs: null,
            } satisfies DependencyHealth,
          },
        }, { headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" } });
      },
    },
  },
});
