import { createFileRoute } from "@tanstack/react-router";
import { angelEventLog, angelMemoryIndex, angelNodeGateway } from "@/lib/angel-runtime.server";
import { getOpenAiCredential, getTmdbCredential } from "@/lib/vercel-connect-credentials.server";
import { readIntegrations } from "@/lib/system.server";

type DependencyHealth = {
  configured: boolean;
  reachable: boolean | null;
  source?: string | null;
  reason?: string | null;
};

async function withTimeout<T>(work: (signal: AbortSignal) => Promise<T>, timeoutMs = 4500): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await work(controller.signal); } finally { clearTimeout(timer); }
}

async function checkOpenAI(): Promise<DependencyHealth> {
  const credential = await getOpenAiCredential();
  if (!credential) return { configured: false, reachable: null, reason: "credential_missing" };
  try {
    const response = await withTimeout((signal) => fetch("https://api.openai.com/v1/models", {
      signal,
      headers: { Authorization: `Bearer ${credential.value}` },
    }));
    return { configured: true, reachable: response.ok, source: credential.source, reason: response.ok ? null : `http_${response.status}` };
  } catch (error) {
    return { configured: true, reachable: false, source: credential.source, reason: error instanceof Error ? error.name : "request_failed" };
  }
}

async function checkTmdb(): Promise<DependencyHealth> {
  const credential = await getTmdbCredential();
  if (!credential) return { configured: false, reachable: null, reason: "credential_missing" };
  try {
    const url = credential.kind === "api-key"
      ? `https://api.themoviedb.org/3/configuration?api_key=${encodeURIComponent(credential.value)}`
      : "https://api.themoviedb.org/3/configuration";
    const response = await withTimeout((signal) => fetch(url, {
      signal,
      headers: credential.kind === "bearer" ? { Authorization: `Bearer ${credential.value}` } : undefined,
    }));
    return { configured: true, reachable: response.ok, source: credential.source, reason: response.ok ? null : `http_${response.status}` };
  } catch (error) {
    return { configured: true, reachable: false, source: credential.source, reason: error instanceof Error ? error.name : "request_failed" };
  }
}

async function checkSupabaseAuth(): Promise<DependencyHealth> {
  const runtimeUrl = process.env.SUPABASE_URL?.trim();
  const runtimeKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  const url = runtimeUrl || import.meta.env.VITE_SUPABASE_URL?.trim();
  const publishableKey = runtimeKey || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  const source = runtimeUrl && runtimeKey ? "runtime-env" : "bundled-public-config";
  if (!url || !publishableKey) return { configured: false, reachable: null, source, reason: "public_config_missing" };
  try {
    const response = await withTimeout((signal) => fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      signal,
      headers: { apikey: publishableKey },
    }));
    return { configured: true, reachable: response.ok, source, reason: response.ok ? null : `http_${response.status}` };
  } catch (error) {
    return { configured: true, reachable: false, source, reason: error instanceof Error ? error.name : "request_failed" };
  }
}

export const Route = createFileRoute("/api/angel-os/health")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date().toISOString();
        const node = angelNodeGateway.select();
        const gmail = readIntegrations().find((item) => item.key === "google");
        const [openai, tmdb, supabaseAuth] = await Promise.all([checkOpenAI(), checkTmdb(), checkSupabaseAuth()]);
        return Response.json(
          {
            service: "angel-os",
            layer: "angel-os",
            healthy: openai.reachable !== false && tmdb.reachable !== false && supabaseAuth.reachable !== false,
            checkedAt: now,
            release: process.env["VERCEL_GIT_COMMIT_SHA"] ?? process.env["GITHUB_SHA"] ?? null,
            runtime: {
              memoryDocuments: angelMemoryIndex.stats().total,
              recentEvents: angelEventLog.list({ limit: 20 }).length,
              selectedNode: node?.id ?? null,
            },
            dependencies: {
              openai,
              tmdb,
              supabaseAuth,
              gmail: {
                configured: gmail?.status === "ready",
                reachable: null,
                source: "oauth-server-config",
                reason: gmail?.status === "ready" ? "oauth_account_checked_in_admin" : `missing:${gmail?.missing.join(",") || "configuration"}`,
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
