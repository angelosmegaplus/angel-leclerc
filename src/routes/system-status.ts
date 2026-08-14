import { createFileRoute } from "@tanstack/react-router";

const GITHUB_BRANCH_API =
  "https://api.github.com/repos/angelosmegaplus/angel-leclerc/commits/main";
const MAINTENANCE_ISSUE_API =
  "https://api.github.com/repos/angelosmegaplus/angel-leclerc/issues/17";

const headers = {
  "Cache-Control": "public, max-age=5, s-maxage=20, stale-while-revalidate=20",
  "Content-Type": "application/json; charset=utf-8",
};

type GithubCommitResponse = {
  sha?: string;
  commit?: {
    committer?: {
      date?: string;
    };
  };
};

type GithubIssueResponse = {
  state?: "open" | "closed";
  updated_at?: string;
};

async function fetchGithubJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "angel-leclerc-site-status",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status} for ${url}`);
  }

  return (await response.json()) as T;
}

function parseTime(value?: string | null) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

export const Route = createFileRoute("/system-status")({
  server: {
    handlers: {
      GET: async () => {
        const deployedSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || null;

        try {
          const [maintenanceIssue, latest] = await Promise.all([
            fetchGithubJson<GithubIssueResponse>(MAINTENANCE_ISSUE_API),
            fetchGithubJson<GithubCommitResponse>(GITHUB_BRANCH_API),
          ]);

          const latestSha = latest.sha?.trim() || null;
          const deploymentInProgress = Boolean(
            deployedSha && latestSha && latestSha !== deployedSha,
          );

          const issueUpdatedAt = parseTime(maintenanceIssue.updated_at);
          const latestCommitAt = parseTime(latest.commit?.committer?.date);

          // An open issue starts maintenance immediately. Once a newer commit has
          // reached production, the open issue is considered stale so a forgotten
          // close action can never leave the public site locked indefinitely.
          const forcedMaintenance = Boolean(
            maintenanceIssue.state === "open" &&
              (deploymentInProgress ||
                !latestCommitAt ||
                !issueUpdatedAt ||
                issueUpdatedAt >= latestCommitAt),
          );

          const maintenance = forcedMaintenance || deploymentInProgress;

          let reason = "up-to-date";
          if (forcedMaintenance) reason = "angel-os-maintenance";
          else if (deploymentInProgress) reason = "deployment-in-progress";
          else if (maintenanceIssue.state === "open") reason = "stale-maintenance-auto-released";
          else if (!deployedSha) reason = "deployment-sha-unavailable";
          else if (!latestSha) reason = "latest-sha-unavailable";

          return Response.json(
            {
              maintenance,
              reason,
              forcedMaintenance,
              deploymentInProgress,
              staleMaintenanceAutoReleased:
                maintenanceIssue.state === "open" && !forcedMaintenance && !deploymentInProgress,
              deployedSha,
              latestSha,
            },
            { headers },
          );
        } catch (error) {
          console.error("[site-status] unable to resolve maintenance state", error);

          // Keep the site available if GitHub itself cannot be reached.
          return Response.json(
            {
              maintenance: false,
              reason: "status-check-unavailable",
              forcedMaintenance: false,
              deploymentInProgress: false,
              staleMaintenanceAutoReleased: false,
              deployedSha,
              latestSha: null,
            },
            { headers },
          );
        }
      },
    },
  },
});
