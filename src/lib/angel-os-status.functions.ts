import { createServerFn } from "@tanstack/react-start";

export type AngelOsPublicStatus = {
  checkedAt: string;
  repository: {
    available: boolean;
    fullName: string;
    url: string;
    defaultBranch: string | null;
    pushedAt: string | null;
    lastCommit: { sha: string; message: string; date: string | null; url: string } | null;
  };
  database: {
    available: boolean;
    publishedArticles: number | null;
    projects: number | null;
  };
  intelligence: {
    gatewayConfigured: boolean;
    provider: string;
  };
  deployment: {
    branch: string | null;
    commit: string | null;
  };
};

const REPO = "angelosmegaplus/angel-leclerc";

async function githubJson(path: string): Promise<any | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "angel-leclerc.fr" },
    });
    if (!response.ok) return null;
    return (await response.json()) as any;
  } catch {
    return null;
  }
}

async function countRows(table: string, query: string): Promise<number | null> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  try {
    const response = await fetch(`${url}/rest/v1/${table}?select=id&${query}`, {
      headers: { apikey: key, Prefer: "count=exact", Range: "0-0" },
    });
    if (!response.ok) return null;
    const range = response.headers.get("content-range");
    const total = range?.split("/")[1];
    if (!total || total === "*") return null;
    return Number(total);
  } catch {
    return null;
  }
}

export const getAngelOsPublicStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<AngelOsPublicStatus> => {
    const [repo, commits, publishedArticles, projects] = await Promise.all([
      githubJson(""),
      githubJson("/commits?per_page=1"),
      countRows("articles", "published=eq.true"),
      countRows("projects", "select=id"),
    ]);

    const head = Array.isArray(commits) && commits.length > 0 ? commits[0] : null;

    return {
      checkedAt: new Date().toISOString(),
      repository: {
        available: Boolean(repo),
        fullName: REPO,
        url: `https://github.com/${REPO}`,
        defaultBranch: repo?.default_branch ?? null,
        pushedAt: repo?.pushed_at ?? null,
        lastCommit: head
          ? {
              sha: String(head.sha ?? "").slice(0, 7),
              message: String(head.commit?.message ?? "").split("\n")[0].slice(0, 120),
              date: head.commit?.author?.date ?? null,
              url: head.html_url ?? `https://github.com/${REPO}`,
            }
          : null,
      },
      database: {
        available: publishedArticles !== null || projects !== null,
        publishedArticles,
        projects,
      },
      intelligence: {
        gatewayConfigured: Boolean(process.env["LOVABLE_API_KEY"]),
        provider: "Google Gemini via passerelle IA Lovable",
      },
      deployment: {
        branch: process.env["VERCEL_GIT_COMMIT_REF"] ?? null,
        commit: process.env["VERCEL_GIT_COMMIT_SHA"]?.slice(0, 7) ?? null,
      },
    };
  },
);
