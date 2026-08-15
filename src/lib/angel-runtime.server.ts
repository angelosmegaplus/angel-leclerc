import {
  AngelApplicationRuntime,
  AngelDeployEngine,
  AngelEventLog,
  AngelGuardian,
  AngelMemoryIndex,
  AngelNodeGateway,
  AngelRecovery,
  AngelReleaseManager,
  AngelSyncEngine,
  AngelTelemetry,
  DurableWorkflowEngine,
  HybridOrchestrator,
  MemoryCache,
  MemoryWorkflowStateStore,
  NativeTaskWorker,
} from "../../angel-os/core";

// Angel OS system runtime. These are system services, not Angel OS IA services.
// External providers remain complementary and are attached through adapters.
export const angelEventLog = new AngelEventLog(5000);
export const angelTelemetry = new AngelTelemetry();
export const angelMemoryIndex = new AngelMemoryIndex();
export const angelCache = new MemoryCache();
export const angelNativeWorker = new NativeTaskWorker();
export const angelWorkflowEngine = new DurableWorkflowEngine(new MemoryWorkflowStateStore(), angelEventLog, angelTelemetry);
export const angelHybridOrchestrator = new HybridOrchestrator(angelCache, [angelNativeWorker], angelEventLog, angelTelemetry);
export const angelReleaseManager = new AngelReleaseManager();
export const angelDeployEngine = new AngelDeployEngine(angelReleaseManager, angelEventLog, angelTelemetry);
export const angelNodeGateway = new AngelNodeGateway();
export const angelGuardian = new AngelGuardian(angelEventLog, angelTelemetry);
export const angelRecovery = new AngelRecovery();
export const angelSyncEngine = new AngelSyncEngine();
export const angelApplicationRuntime = new AngelApplicationRuntime();

angelApplicationRuntime.register({
  id: "angel-os-ia",
  name: "Angel OS IA",
  version: "0.2.0",
  layer: "angel-os-ia",
  requires: ["angel-os", "events", "memory", "workflows", "hybrid-orchestrator"],
  provides: ["ai-providers", "conversation", "analysis", "generation", "agents", "intelligent-automation"],
  health: async () => Boolean(process.env["OPENAI_API_KEY"]) && !["0", "false", "off", "disabled"].includes(String(process.env["ANGEL_AI_ENABLED"] ?? "true").toLowerCase()),
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

// Known web target. Health is updated by deployment/integrity adapters when data exists.
angelNodeGateway.upsert({ id: "vercel-web", kind: "vercel", priority: 50, state: "unknown" });

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
}
