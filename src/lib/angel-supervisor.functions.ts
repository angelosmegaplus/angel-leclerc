import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { angelEventLog, angelMemoryIndex, angelTelemetry } from "./angel-runtime.server";
import { angelAiSupervisorSnapshot } from "./ai-gateway.server";

export type AngelSupervisorSnapshot = {
  checkedAt: string;
  ai: ReturnType<typeof angelAiSupervisorSnapshot>;
  runtime: {
    memory: ReturnType<typeof angelMemoryIndex.stats>;
    recentEvents: ReturnType<typeof angelEventLog.list>;
    telemetry: ReturnType<typeof angelTelemetry.snapshot>;
  };
  health: {
    level: "ok" | "warning" | "critical";
    warnings: string[];
  };
};

export const getAngelSupervisorSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<AngelSupervisorSnapshot> => {
    const ai = angelAiSupervisorSnapshot();
    const memory = angelMemoryIndex.stats();
    const recentEvents = angelEventLog.list({ limit: 50 });
    const telemetry = angelTelemetry.snapshot();
    const warnings: string[] = [];

    if (!ai.enabled) warnings.push("Angel AI est désactivée");
    if (!ai.providerConfigured) warnings.push("OPENAI_API_KEY absente");
    if (ai.circuitOpen) warnings.push("Circuit OpenAI temporairement ouvert");
    if (ai.lastReason !== "ok" && ai.lastFailureAt) warnings.push(`Dernier état IA : ${ai.lastReason}`);

    const recentFailures = recentEvents.filter((event) => {
      const payload = event.payload as { ok?: boolean } | null;
      return payload?.ok === false && Date.now() - event.at < 15 * 60_000;
    }).length;
    if (recentFailures >= 3) warnings.push(`${recentFailures} échecs runtime sur les 15 dernières minutes`);

    return {
      checkedAt: new Date().toISOString(),
      ai,
      runtime: { memory, recentEvents, telemetry },
      health: {
        level: !ai.enabled || !ai.providerConfigured ? "critical" : warnings.length ? "warning" : "ok",
        warnings,
      },
    };
  });
