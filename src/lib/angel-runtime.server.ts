import {
  AngelApplicationRuntime,
  AngelAutonomousCore,
  AngelDeployEngine,
  AngelEventLog,
  AngelGuardian,
  AngelIssueRegistry,
  AngelMemoryIndex,
  AngelNodeGateway,
  AngelRecovery,
  AngelReleaseManager,
  AngelSyncEngine,
  AngelTelemetry,
  DurableWorkflowEngine,
  HybridOrchestrator,
  MemoryCache,
  NativeTaskWorker,
  createDefaultAngelGuard,
  type HealthProbeResult,
  type IssuePriority,
} from "../../angel-os/core";
import { getOpenAiCredential } from "./vercel-connect-credentials.server";
import { SupabaseKeyValueCache } from "./supabase-key-value-cache.server";
import { SupabaseWorkflowStateStore } from "./supabase-workflow-state.server";

export const angelEventLog = new AngelEventLog(5000);
export const angelTelemetry = new AngelTelemetry();
export const angelMemoryIndex = new AngelMemoryIndex();
export const angelCache = new MemoryCache();
export const angelIssueStore = new SupabaseKeyValueCache("maintenance:");
export const angelIssueRegistry = new AngelIssueRegistry(angelIssueStore, angelEventLog, angelTelemetry);
export const angelNativeWorker = new NativeTaskWorker();
export const angelWorkflowEngine = new DurableWorkflowEngine(new SupabaseWorkflowStateStore(), angelEventLog, angelTelemetry);
export const angelHybridOrchestrator = new HybridOrchestrator(angelCache, [angelNativeWorker], angelEventLog, angelTelemetry);
export const angelReleaseManager = new AngelReleaseManager();
export const angelDeployEngine = new AngelDeployEngine(angelReleaseManager, angelEventLog, angelTelemetry);
export const angelNodeGateway = new AngelNodeGateway();
export const angelGuardian = new AngelGuardian(angelEventLog, angelTelemetry, angelIssueRegistry);
export const angelRecovery = new AngelRecovery();
export const angelSyncEngine = new AngelSyncEngine();
export const angelApplicationRuntime = new AngelApplicationRuntime(angelIssueRegistry);
export const angelAutonomousCore = new AngelAutonomousCore({ memory: angelMemoryIndex });
export const angelGuardOS = createDefaultAngelGuard();

angelApplicationRuntime.register({
  id: "angel-os-ia",
  name: "Angel OS IA",
  version: "0.3.0",
  layer: "angel-os-ia",
  requires: ["angel-os", "events", "memory", "workflows", "hybrid-orchestrator"],
  provides: ["ai-providers", "conversation", "analysis", "generation", "agents", "intelligent-automation"],
  health: async () => {
    const enabled = !["0", "false", "off", "disabled"].includes(String(process.env["ANGEL_AI_ENABLED"] ?? "true").toLowerCase());
    if (!enabled) return false;
    return Boolean(await getOpenAiCredential());
  },
});

angelApplicationRuntime.register({
  id: "angel-leclerc-web",
  name: "angel-leclerc.fr",
  version: process.env["VERCEL_GIT_COMMIT_SHA"]?.slice(0, 8) ?? "development",
  layer: "application",
  requires: ["angel-os"],
  provides: ["website", "admin", "blog", "movix", "angel-guard-os"],
  health: async () => true,
});

function applicationHealthProbe(id: string): Promise<HealthProbeResult> {
  const startedAt = performance.now();
  return angelApplicationRuntime.checkHealth(id).then((healthy) => ({
    state: healthy ? "healthy" : "down",
    evidence: { checkedAt: Date.now(), latencyMs: Math.round(performance.now() - startedAt), message: healthy ? "Application health check passed" : "Application health check failed", details: { applicationId: id } },
  }));
}

angelAutonomousCore
  .registerHealthProbe({ id: "application:angel-os-ia", label: "Angel OS IA", critical: true, run: () => applicationHealthProbe("angel-os-ia"), recover: () => applicationHealthProbe("angel-os-ia") })
  .registerHealthProbe({ id: "application:angel-leclerc-web", label: "angel-leclerc.fr", critical: true, run: () => applicationHealthProbe("angel-leclerc-web"), recover: () => applicationHealthProbe("angel-leclerc-web") });

angelNodeGateway.upsert({ id: "vercel-web", kind: "vercel", priority: 50, state: "unknown" });

function operationPriority(input: { type: string; source: string }): IssuePriority {
  const signature = `${input.type} ${input.source}`;
  if (/auth|security|database|production|deploy/i.test(signature)) return "P0";
  if (/ai|openai|gemini|serverfn|admin|workflow/i.test(signature)) return "P1";
  return "P2";
}

export async function recordAngelOperation(input: { type: string; source: string; ok: boolean; durationMs?: number; payload?: unknown; }) {
  await angelEventLog.append(input.type, { source: input.source, ok: input.ok, durationMs: input.durationMs, payload: input.payload });
  angelTelemetry.increment(input.ok ? "angel.operation.success" : "angel.operation.failure", 1, { source: input.source, type: input.type });
  if (typeof input.durationMs === "number") angelTelemetry.observe("angel.operation.duration_ms", input.durationMs, { source: input.source, type: input.type });

  if (!input.ok) {
    const priority = operationPriority(input);
    angelGuardOS.evaluate({
      id: crypto.randomUUID(),
      source: input.source,
      type: input.type,
      severity: priority === "P0" ? "critical" : priority === "P1" ? "warning" : "info",
      at: Date.now(),
      message: `Angel OS recorded a failed ${input.type} operation`,
      metadata: typeof input.durationMs === "number" ? { durationMs: input.durationMs } : undefined,
    });
    await angelIssueRegistry.report({
      title: `${input.source} · ${input.type} failed`,
      type: `operation-failure:${input.type}`,
      priority,
      evidence: { source: input.source, message: `Angel OS recorded a failed ${input.type} operation`, data: typeof input.durationMs === "number" ? { durationMs: input.durationMs } : undefined },
    });
  }
}

export async function getAngelMaintenanceSnapshot() {
  await angelAutonomousCore.inspect({ autoRecover: true });
  return angelIssueRegistry.maintenanceSnapshot();
}

export async function getAngelMaintenanceMarkdown() { return angelIssueRegistry.exportMaintenanceMarkdown(); }
