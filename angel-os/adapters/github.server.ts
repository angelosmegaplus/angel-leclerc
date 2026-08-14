// SPDX-License-Identifier: GPL-2.0-only
import type { AngelOSAdapter } from '../core/types';

export interface AngelGitHubClient {
  get<T = unknown>(path: string): Promise<T>;
  post<T = unknown>(path: string, body?: unknown): Promise<T>;
  dispatchWorkflow(owner: string, repo: string, workflow: string, ref?: string): Promise<void>;
}

function requireToken(): string {
  const token = process.env.GITHUB_TOKEN ?? process.env.ANGEL_GITHUB_TOKEN;
  if (!token) throw new Error('Missing GITHUB_TOKEN or ANGEL_GITHUB_TOKEN');
  return token;
}

async function githubRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = requireToken();
  const response = await fetch(`https://api.github.com${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub API ${response.status}: ${detail.slice(0, 500)}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const githubServerAdapter: AngelOSAdapter<AngelGitHubClient> = {
  id: 'angel.provider.github',
  capability: 'network',
  connect: () => ({
    get: <T>(path: string) => githubRequest<T>(path),
    post: <T>(path: string, body?: unknown) => githubRequest<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    async dispatchWorkflow(owner, repo, workflow, ref = 'main') {
      await githubRequest(`/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`, {
        method: 'POST',
        body: JSON.stringify({ ref }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
  }),
};
