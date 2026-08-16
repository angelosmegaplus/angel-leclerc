import {
  AngelApplicationRuntime,
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
  type IssuePriority,
} from "../../angel-os/core";
import { getOpenAiCredential } from "./vercel-connect-credentials.server";
import { SupabaseWorkflowStateStore } from "./supabase-workflow-state.server";

// Angel OS system runtime. These are system services, not Angel OS IA services.
// External providers remain complementary and are attached through adapters.
export const angelEventLog = new AngelEventLog(5000);
export const angelTelemetry = new AngelTelemetry();
export const angelMemoryIndex = new AngelMemoryIndex();
export const angelCache = new MemoryCache();
export const angelIssueRegistry = new AngelIssueRegistry(angelCache, angelEventLog, angelTelemetry);
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

angelApplicationRuntime.register({
  id: "angel-os-ia",
  name: "Angel OS IA",
  version: "0.2.1",
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
  provides: ["website", "admin", "blog", "movix"],
  health: async () => true,
});

angelNodeGateway.upsert({ id: "vercel-web", kind: "vercel", priority: 50, state: "unknown" });

function operationPriority(input: { type: string; source: string }): IssuePriority {
  const signature = `${input.type} ${input.source}`;
  if (/auth|security|database|production|deploy/i.test(signature)) return "P0";
  if (/ai|openai|gemini|serverfn|admin|workflow/i.test(signature)) return "P1";
  return "P2";
}

export async function recordAngelOperation(input: {
  type: string;
  source: string;
  ok: boolean;
  durationMs?: number;
  payload?: unknown;
}) {
  await angelEventLog.append(input.type, {
    source: input.source,
    ok: input.ok,
    durationMs: input.durationMs,
    payload: input.payload,
  });
  angelTelemetry.increment(input.ok ? "angel.operation.success" : "angel.operation.failure", 1, {
    source: input.source,
    type: input.type,
  });
  if (typeof input.durationMs === "number") {
    angelTelemetry.observe("angel.operation.duration_ms", input.durationMs, {
      source: input.source,
      type: input.type,
    });
  }

  if (!input.ok) {
    await angelIssueRegistry.report({
      title: `${input.source} · ${input.type} failed`,
      type: `operation-failure:${input.type}`,
      priority: operationPriority(input),
      evidence: {
        source: input.source,
        message: `Angel OS recorded a failed ${input.type} operation`,
        data: typeof input.durationMs === "number" ? { durationMs: input.durationMs } : undefined,
      },
    });
  }
}

export async function getAngelMaintenanceSnapshot() {
  return angelIssueRegistry.maintenanceSnapshot();
}

export async function getAngelMaintenanceMarkdown() {
  return angelIssueRegistry.exportMaintenanceMarkdown();
}
