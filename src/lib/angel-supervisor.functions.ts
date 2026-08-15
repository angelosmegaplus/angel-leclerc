import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  angelEventLog,
  angelGuardian,
  angelMemoryIndex,
  angelNodeGateway,
  angelReleaseManager,
  angelTelemetry,
} from "./angel-runtime.server";
import { angelAiSupervisorSnapshot } from "./ai-gateway.server";

export type AngelSupervisorSnapshot = {
  checkedAt: string;
  angelOs: {
    runtime: {
      memory: ReturnType<typeof angelMemoryIndex.stats>;
      recentEvents: ReturnType<typeof angelEventLog.list>;
      telemetry: ReturnType<typeof angelTelemetry.snapshot>;
      nodes: ReturnType<typeof angelNodeGateway.list>;
      selectedNode: ReturnType<typeof angelNodeGateway.select>;
      currentRelease: ReturnType<typeof angelReleaseManager.current>;
      guardianFindings: ReturnType<typeof angelGuardian.active>;
    };
    health: {
      level: "ok" | "warning" | "critical";
      warnings: string[];
    };
  };
  angelOsIa: {
    ai: ReturnType<typeof angelAiSupervisorSnapshot>;
    health: {
      level: "ok" | "warning" | "critical";
      warnings: string[];
    };
  };
};

export const getAngelSupervisorSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<AngelSupervisorSnapshot> => {
    const memory = angelMemoryIndex.stats();
    const recentEvents = angelEventLog.list({ limit: 50 });
    const telemetry = angelTelemetry.snapshot();
    const nodes = angelNodeGateway.list();
    const selectedNode = angelNodeGateway.select();
    const currentRelease = angelReleaseManager.current();
    const guardianFindings = angelGuardian.active(50);
    const osWarnings: string[] = [];

    const recentFailures = recentEvents.filter((event) => {
      const payload = event.payload as { ok?: boolean } | null;
      return payload?.ok === false && Date.now() - event.at < 15 * 60_000;
    }).length;
    if (recentFailures >= 3) osWarnings.push(`${recentFailures} échecs système sur les 15 dernières minutes`);
    if (nodes.length && !selectedNode) osWarnings.push("Aucun nœud d'exécution sélectionnable");
    const criticalGuardian = guardianFindings.filter((finding) => finding.severity === "critical").length;
    if (criticalGuardian) osWarnings.push(`${criticalGuardian} anomalie(s) Guardian critique(s)`);

    const ai = angelAiSupervisorSnapshot();
    const iaWarnings: string[] = [];
    if (!ai.enabled) iaWarnings.push("Angel OS IA est désactivé");
    if (!ai.providerConfigured) iaWarnings.push("OPENAI_API_KEY absente");
    if (ai.circuitOpen) iaWarnings.push("Circuit fournisseur IA temporairement ouvert");
    if (ai.lastReason !== "ok" && ai.lastFailureAt) iaWarnings.push(`Dernier état IA : ${ai.lastReason}`);

    return {
      checkedAt: new Date().toISOString(),
      angelOs: {
        runtime: { memory, recentEvents, telemetry, nodes, selectedNode, currentRelease, guardianFindings },
        health: {
          level: criticalGuardian ? "critical" : osWarnings.length ? "warning" : "ok",
          warnings: osWarnings,
        },
      },
      angelOsIa: {
        ai,
        health: {
          level: !ai.enabled || !ai.providerConfigured ? "critical" : iaWarnings.length ? "warning" : "ok",
          warnings: iaWarnings,
        },
      },
    };
  });
