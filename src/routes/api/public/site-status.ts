import { createFileRoute } from "@tanstack/react-router";

const GITHUB_BRANCH_API = "https://api.github.com/repos/angelosmegaplus/angel-leclerc/commits/main";
const headers = { "Cache-Control": "public, max-age=5, s-maxage=20, stale-while-revalidate=20", "Content-Type": "application/json; charset=utf-8" };

type GithubCommitResponse = { sha?: string };

// Le routeTree est généré par TanStack pendant le build. La chaîne doit rester un littéral brut
// pour que le générateur puisse découvrir cette nouvelle route.
// @ts-expect-error route ajoutée avant régénération de routeTree.gen.ts
export const Route = createFileRoute("/api/public/site-status")({
  server: {
    handlers: {
      GET: async () => {
        const deployedSha = process.env.ANGEL_GIT_COMMIT_SHA?.trim() || process.env.VERCEL_GIT_COMMIT_SHA?.trim() || null;
        if (!deployedSha) return Response.json({ maintenance: false, reason: "deployment-sha-unavailable", deployedSha: null, latestSha: null }, { headers });
        try {
          const response = await fetch(GITHUB_BRANCH_API, { headers: { Accept: "application/vnd.github+json", "User-Agent": "angel-os-site-status" } });
          if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
          const latest = (await response.json()) as GithubCommitResponse;
          const latestSha = latest.sha?.trim() || null;
          if (!latestSha) throw new Error("GitHub response did not include a commit SHA");
          return Response.json({ maintenance: latestSha !== deployedSha, reason: latestSha !== deployedSha ? "deployment-in-progress" : "up-to-date", deployedSha, latestSha }, { headers });
        } catch (error) {
          console.error("[site-status] unable to compare deployment state", error);
          return Response.json({ maintenance: false, reason: "status-check-unavailable", deployedSha, latestSha: null }, { headers });
        }
      },
    },
  },
});
