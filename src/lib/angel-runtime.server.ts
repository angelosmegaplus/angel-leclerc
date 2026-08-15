import { AngelEventLog, AngelTelemetry, AngelMemoryIndex } from "../../angel-os/core";

// Process-local runtime shared by server routes. It complements existing external
// services: it does not replace OpenAI, Supabase, Google or GitHub.
export const angelEventLog = new AngelEventLog(5000);
export const angelTelemetry = new AngelTelemetry();
export const angelMemoryIndex = new AngelMemoryIndex();

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
