import { createFileRoute } from "@tanstack/react-router";
import { angelAutonomousCore, angelGuardOS, angelNodeGateway } from "@/lib/angel-runtime.server";

export const Route = createFileRoute("/api/angel-os/guard")({
  server: {
    handlers: {
      GET: async () => {
        const guard = angelGuardOS.snapshot();
        const controlPlane = angelAutonomousCore.status().health;
        const executableActions = new Set(guard.executors.map((executor) => executor.action));
        const nodes = angelNodeGateway.list();

        return Response.json(
          {
            service: "angel-guard-os",
            active: guard.automation === true && guard.policies.length > 0,
            mode: "automatic",
            checkedAt: new Date().toISOString(),
            policies: guard.policies,
            executors: guard.executors,
            enforcement: {
              recover: executableActions.has("recover") ? "automatic" : "unavailable",
              observe: "automatic-noop",
              rateLimit: executableActions.has("rate-limit") ? "automatic" : "unavailable",
              isolate: executableActions.has("isolate") ? "automatic-targeted" : "unavailable",
              rollback: executableActions.has("rollback") ? "automatic" : "unavailable",
              block: executableActions.has("block") ? "automatic" : "unavailable",
            },
            routing: {
              selectedNode: angelNodeGateway.select()?.id ?? null,
              nodes: nodes.map((node) => ({ id: node.id, kind: node.kind, state: node.state, updatedAt: node.updatedAt })),
              isolatedNodes: nodes.filter((node) => node.state === "offline").map((node) => node.id),
            },
            activity: {
              recentSignals: guard.recentSignals.length,
              recentDecisions: guard.recentDecisions.length,
              recentExecutions: guard.recentExecutions.length,
              executed: guard.recentExecutions.filter((execution) => execution.status === "executed").length,
              failed: guard.recentExecutions.filter((execution) => execution.status === "failed").length,
              unavailable: guard.recentExecutions.filter((execution) => execution.status === "unavailable").length,
            },
            controlPlane,
            release: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null,
          },
          {
            headers: {
              "Cache-Control": "no-store",
              "Content-Type": "application/json; charset=utf-8",
            },
          },
        );
      },
    },
  },
});
