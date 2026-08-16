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

function projectRef(url: string | undefined | null) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    return host.endsWith(".supabase.co") ? host.slice(0, -".supabase.co".length) : host;
  } catch {
    return null;
  }
}

async function checkOpenAI(): Promise<DependencyHealth> {
  const credential = await getOpenAiCredential();
  if (!credential) return { configured: false, reachable: false, source: "env:OPENAI_API_KEY", reason: "credential_missing", latencyMs: null };
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
  if (!credential) return { configured: false, reachable: false, source: "environment-or-build", reason: "credential_missing", latencyMs: null };
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

function publicSupabaseConfig() {
  const serverUrl = process.env.SUPABASE_URL?.trim() || null;
  const buildUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || null;
  const url = serverUrl || buildUrl;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.SUPABASE_ANON_KEY?.trim()
    || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
    || null;
  return { serverUrl, buildUrl, url, publishableKey };
}

async function checkSupabaseAuth(): Promise<DependencyHealth> {
  const { url, publishableKey } = publicSupabaseConfig();
  if (!url || !publishableKey) return { configured: false, reachable: false, source: "environment-or-build", reason: "public_config_missing", latencyMs: null };
  try {
    const { value: response, latencyMs } = await timed((signal) => fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      signal,
      headers: { apikey: publishableKey },
    }));
    return { configured: true, reachable: response.ok, source: "environment-or-build", latencyMs, reason: response.ok ? null : `http_${response.status}` };
  } catch (error) {
    return { configured: true, reachable: false, source: "environment-or-build", latencyMs: null, reason: error instanceof Error ? error.name : "request_failed" };
  }
}

async function checkSupabaseServer(): Promise<DependencyHealth> {
  const { url } = publicSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !serviceKey) return { configured: false, reachable: false, source: "vercel-environment", reason: "server_config_missing", latencyMs: null };

  const headers = new Headers({ apikey: serviceKey, Accept: "application/json" });
  if (!serviceKey.startsWith("sb_secret_")) headers.set("Authorization", `Bearer ${serviceKey}`);
  try {
    const { value: response, latencyMs } = await timed((signal) => fetch(`${url.replace(/\/$/, "")}/rest/v1/user_roles?select=user_id&limit=1`, {
      signal,
      headers,
    }));
    return {
      configured: true,
      reachable: response.ok,
      source: "vercel-environment",
      latencyMs,
      reason: response.ok ? null : `user_roles_http_${response.status}`,
    };
  } catch (error) {
    return { configured: true, reachable: false, source: "vercel-environment", latencyMs: null, reason: error instanceof Error ? error.name : "request_failed" };
  }
}

export const Route = createFileRoute("/api/angel-os/health")({
  server: {
    handlers: {
      GET: async () => {
        const node = angelNodeGateway.select();
        const google = readIntegrations().find((item) => item.key === "google");
        const [openai, tmdb, supabaseAuth, supabaseServer] = await Promise.all([
          checkOpenAI(),
          checkTmdb(),
          checkSupabaseAuth(),
          checkSupabaseServer(),
        ]);

        const { serverUrl, buildUrl, url: publicUrl, publishableKey } = publicSupabaseConfig();
        const tmdbConfigured = Boolean(
          process.env.TMDB_READ_TOKEN?.trim()
          || process.env.TMDB_READ_ACCESS_TOKEN?.trim()
          || process.env.TMDB_API_KEY?.trim()
          || import.meta.env.VITE_TMDB_API_KEY?.trim(),
        );
        const serverProjectRef = projectRef(serverUrl);
        const buildProjectRef = projectRef(buildUrl);
        const supabaseProjectAligned = !serverProjectRef || !buildProjectRef || serverProjectRef === buildProjectRef;
        const supabasePublicConfigured = Boolean(publicUrl && publishableKey);
        const checks = {
          OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY?.trim()),
          TMDB: tmdbConfigured,
          SUPABASE_PUBLIC: supabasePublicConfigured,
          SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim()),
          SUPABASE_PROJECT_ALIGNED: supabaseProjectAligned,
          GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID?.trim()),
          GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim()),
        };
        const missingEnvironment = Object.entries(checks).filter(([, present]) => !present).map(([name]) => name);
        const googleConfigured = google?.status === "ready";
        const healthy = missingEnvironment.length === 0
          && openai.reachable === true
          && tmdb.reachable === true
          && supabaseAuth.reachable === true
          && supabaseServer.reachable === true
          && googleConfigured;

        return Response.json({
          service: "angel-os",
          healthy,
          checkedAt: new Date().toISOString(),
          release: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null,
          configuration: {
            source: "vercel-environment+build",
            missing: missingEnvironment,
            supabase: {
              projectAligned: supabaseProjectAligned,
              serverProjectRef,
              buildProjectRef,
            },
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
            supabaseServer,
            google: {
              configured: googleConfigured,
              reachable: googleConfigured ? null : false,
              source: "oauth-google",
              reason: googleConfigured ? "ready_for_oauth" : `missing:${google?.missing.join(",") || "configuration"}`,
              latencyMs: null,
            } satisfies DependencyHealth,
          },
        }, { headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" } });
      },
    },
  },
});
