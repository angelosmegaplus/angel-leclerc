import { createFileRoute } from "@tanstack/react-router";
import { angelEventLog, angelMemoryIndex, angelNodeGateway } from "@/lib/angel-runtime.server";

export const Route = createFileRoute("/api/angel-os/health")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date().toISOString();
        const node = angelNodeGateway.select();
        return Response.json(
          {
            service: "angel-os",
            layer: "angel-os",
            healthy: true,
            checkedAt: now,
            release: process.env["VERCEL_GIT_COMMIT_SHA"] ?? process.env["GITHUB_SHA"] ?? null,
            runtime: {
              memoryDocuments: angelMemoryIndex.stats().total,
              recentEvents: angelEventLog.list({ limit: 20 }).length,
              selectedNode: node?.id ?? null,
            },
            angelOsIaRequired: false,
          },
          { headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" } },
        );
      },
    },
  },
});
