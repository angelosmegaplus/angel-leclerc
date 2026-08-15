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

type SerializableEvent = { id: string; type: string; at: number; payload: string | null };
type SerializableNode = { id: string; kind: string; endpoint: string | null; priority: number; state: string; latencyMs: number | null; releaseId: string | null; updatedAt: number };
type SerializableRelease = { id: string; version: string; commit: string; checksum: string; createdAt: number; targets: Record<string, string> } | null;
type SerializableFinding = { id: string; type: string; severity: string; message: string; at: number };

export type AngelSupervisorSnapshot = {
  checkedAt: string;
  angelOs: {
    runtime: {
      memory: ReturnType<typeof angelMemoryIndex.stats>;
      recentEvents: SerializableEvent[];
      telemetry: ReturnType<typeof angelTelemetry.snapshot>;
      nodes: SerializableNode[];
      selectedNode: SerializableNode | null;
      currentRelease: SerializableRelease;
      guardianFindings: SerializableFinding[];
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

function safePayload(value: unknown) {
  if (value == null) return null;
  try { return JSON.stringify(value).slice(0, 2000); } catch { return String(value).slice(0, 2000); }
}

function serializeNode(node: ReturnType<typeof angelNodeGateway.select>): SerializableNode | null {
  if (!node) return null;
  return {
    id: node.id,
    kind: node.kind,
    endpoint: node.endpoint ?? null,
    priority: node.priority,
    state: node.state,
    latencyMs: node.latencyMs ?? null,
    releaseId: node.releaseId ?? null,
    updatedAt: node.updatedAt,
  };
}

export const getAngelSupervisorSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<AngelSupervisorSnapshot> => {
    const memory = angelMemoryIndex.stats();
    const rawEvents = angelEventLog.list({ limit: 50 });
    const recentEvents: SerializableEvent[] = rawEvents.map((event) => ({ id: event.id, type: event.type, at: event.at, payload: safePayload(event.payload) }));
    const telemetry = angelTelemetry.snapshot();
    const rawNodes = angelNodeGateway.list();
    const nodes = rawNodes.map((node) => serializeNode(node)!).filter(Boolean);
    const selectedNode = serializeNode(angelNodeGateway.select());
    const rawRelease = angelReleaseManager.current();
    const currentRelease: SerializableRelease = rawRelease ? {
      id: rawRelease.id,
      version: rawRelease.version,
      commit: rawRelease.commit,
      checksum: rawRelease.checksum,
      createdAt: rawRelease.createdAt,
      targets: { ...rawRelease.targets },
    } : null;
    const rawFindings = angelGuardian.active(50);
    const guardianFindings: SerializableFinding[] = rawFindings.map((finding) => ({
      id: finding.id,
      type: finding.type,
      severity: finding.severity,
      message: finding.message,
      at: finding.at,
    }));
    const osWarnings: string[] = [];

    const recentFailures = rawEvents.filter((event) => {
      const payload = event.payload as { ok?: boolean } | null;
      return payload?.ok === false && Date.now() - event.at < 15 * 60_000;
    }).length;
    if (recentFailures >= 3) osWarnings.push(`${recentFailures} échecs système sur les 15 dernières minutes`);
    if (rawNodes.length && !selectedNode) osWarnings.push("Aucun nœud d'exécution sélectionnable");
    const criticalGuardian = rawFindings.filter((finding) => finding.severity === "critical").length;
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
