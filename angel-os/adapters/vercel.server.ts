// SPDX-License-Identifier: GPL-2.0-only
import type { AngelOSAdapter } from '../core/types';

export interface AngelVercelClient {
  getProject(projectId: string, teamId: string): Promise<unknown>;
  listDeployments(projectId: string, teamId: string): Promise<unknown>;
}

function requireToken(): string {
  const token = process.env.VERCEL_TOKEN ?? process.env.ANGEL_VERCEL_TOKEN;
  if (!token) throw new Error('Missing VERCEL_TOKEN or ANGEL_VERCEL_TOKEN');
  return token;
}

async function vercelRequest<T>(path: string): Promise<T> {
  const token = requireToken();
  const response = await fetch(`https://api.vercel.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Vercel API ${response.status}: ${detail.slice(0, 500)}`);
  }
  return response.json() as Promise<T>;
}

export const vercelServerAdapter: AngelOSAdapter<AngelVercelClient> = {
  id: 'angel.provider.vercel',
  capability: 'network',
  connect: () => ({
    getProject: (projectId, teamId) => vercelRequest(`/v9/projects/${encodeURIComponent(projectId)}?teamId=${encodeURIComponent(teamId)}`),
    listDeployments: (projectId, teamId) => vercelRequest(`/v6/deployments?projectId=${encodeURIComponent(projectId)}&teamId=${encodeURIComponent(teamId)}`),
  }),
};
