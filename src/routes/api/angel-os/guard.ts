import { createFileRoute } from "@tanstack/react-router";
import { angelAutonomousCore, angelGuardOS } from "@/lib/angel-runtime.server";

export const Route = createFileRoute("/api/angel-os/guard")({
  server: {
    handlers: {
      GET: async () => {
        const guard = angelGuardOS.snapshot();
        const controlPlane = angelAutonomousCore.status().health;

        return Response.json(
          {
            service: "angel-guard-os",
            active: guard.automation === true && guard.policies.length > 0,
            mode: "automatic",
            checkedAt: new Date().toISOString(),
            policies: guard.policies,
            enforcement: {
              recover: "automatic-control-plane",
              observe: "automatic",
              rateLimit: "policy-decision",
              isolate: "policy-decision",
              rollback: "policy-decision",
              block: "policy-decision",
            },
            activity: {
              recentSignals: guard.recentSignals.length,
              recentDecisions: guard.recentDecisions.length,
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
