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
  type GuardDecision,
  type GuardSignal,
  type HealthProbeResult,
  type IssuePriority,
} from "../../angel-os/core";
import { getLovableAiKey } from "./lovable-ai.server";
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

angelNodeGateway.upsert({ id: "vercel-web", kind: "vercel", priority: 50, state: "unknown" });

angelGuardOS.registerExecutor({
  id: "control-plane-auto-recovery",
  action: "recover",
  execute: async () => {
    const snapshot = await angelAutonomousCore.inspect({ autoRecover: true });
    return {
      ok: snapshot.state !== "down",
      detail: `Control plane recovery finished with state ${snapshot.state}`,
    };
  },
});

angelGuardOS.registerExecutor({
  id: "node-gateway-isolation",
  action: "isolate",
  execute: async (signal) => {
    const targetId = typeof signal.metadata?.targetId === "string" ? signal.metadata.targetId : signal.source;
    const target = angelNodeGateway.list().find((node) => node.id === targetId);
    if (!target) {
      return { ok: false, detail: `No registered Angel OS node matches isolation target ${targetId}` };
    }
    const isolated = angelNodeGateway.mark(target.id, "offline", {
      metadata: {
        ...target.metadata,
        isolatedBy: "angel-guard-os",
        isolationReason: signal.message,
        isolatedAt: Date.now(),
      },
    });
    return { ok: isolated.state === "offline", detail: `Node ${isolated.id} isolated from routing` };
  },
});

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
    return Boolean(getLovableAiKey());
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

function operationPriority(input: { type: string; source: string }): IssuePriority {
  const signature = `${input.type} ${input.source}`;
  if (/auth|security|database|production|deploy/i.test(signature)) return "P0";
  if (/ai|openai|gemini|serverfn|admin|workflow/i.test(signature)) return "P1";
  return "P2";
}

async function executeGuardDecision(signal: GuardSignal, decision: GuardDecision) {
  await angelEventLog.append("angel-guard.decision", decision);
  angelTelemetry.increment("angel.guard.decision", 1, { action: decision.action });

  const execution = await angelGuardOS.enforce(signal, decision);
  await angelEventLog.append(`angel-guard.action.${execution.status}`, execution);
  angelTelemetry.increment("angel.guard.action", 1, {
    action: decision.action,
    status: execution.status,
    executor: execution.executorId ?? "none",
  });
  return execution;
}

export async function recordAngelOperation(input: { type: string; source: string; ok: boolean; durationMs?: number; payload?: unknown; guardTargetId?: string; }) {
  await angelEventLog.append(input.type, { source: input.source, ok: input.ok, durationMs: input.durationMs, payload: input.payload, guardTargetId: input.guardTargetId });
  angelTelemetry.increment(input.ok ? "angel.operation.success" : "angel.operation.failure", 1, { source: input.source, type: input.type });
  if (typeof input.durationMs === "number") angelTelemetry.observe("angel.operation.duration_ms", input.durationMs, { source: input.source, type: input.type });

  if (!input.ok) {
    const priority = operationPriority(input);
    const signalMetadata: GuardSignal["metadata"] = {};
    if (typeof input.durationMs === "number") signalMetadata.durationMs = input.durationMs;
    if (input.guardTargetId) signalMetadata.targetId = input.guardTargetId;
    const signal: GuardSignal = {
      id: crypto.randomUUID(),
      source: input.source,
      type: input.type,
      severity: priority === "P0" ? "critical" : priority === "P1" ? "warning" : "info",
      at: Date.now(),
      message: `Angel OS recorded a failed ${input.type} operation`,
      metadata: Object.keys(signalMetadata).length ? signalMetadata : undefined,
    };
    const decision = angelGuardOS.evaluate(signal);
    const execution = await executeGuardDecision(signal, decision);
    await angelIssueRegistry.report({
      title: `${input.source} · ${input.type} failed`,
      type: `operation-failure:${input.type}`,
      priority,
      evidence: {
        source: input.source,
        message: `Angel OS recorded a failed ${input.type} operation`,
        data: {
          ...(typeof input.durationMs === "number" ? { durationMs: input.durationMs } : {}),
          ...(input.guardTargetId ? { guardTargetId: input.guardTargetId } : {}),
          guardAction: decision.action,
          guardExecutionStatus: execution.status,
          guardExecutor: execution.executorId ?? null,
        },
      },
    });
  }
}

export async function getAngelMaintenanceSnapshot() {
  await angelAutonomousCore.inspect({ autoRecover: true });
  return angelIssueRegistry.maintenanceSnapshot();
}

export async function getAngelMaintenanceMarkdown() { return angelIssueRegistry.exportMaintenanceMarkdown(); }
