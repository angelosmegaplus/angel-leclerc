// SPDX-License-Identifier: GPL-2.0-only
import type { AngelOSAdapter } from '../core/types';

export interface AngelSiteClient {
  request<T = unknown>(path: string, init?: RequestInit): Promise<T>;
  health(): Promise<{ ok: boolean; status: number }>;
}

function normalizePath(path: string): string {
  if (/^https?:\/\//i.test(path)) throw new Error('Angel site adapter only accepts same-origin paths');
  return path.startsWith('/') ? path : `/${path}`;
}

export const angelSiteAdapter: AngelOSAdapter<AngelSiteClient> = {
  id: 'angel.site.http',
  capability: 'network',
  connect: () => ({
    async request<T>(path: string, init?: RequestInit): Promise<T> {
      const response = await fetch(normalizePath(path), {
        ...init,
        headers: {
          Accept: 'application/json',
          ...init?.headers,
        },
      });
      if (!response.ok) throw new Error(`Site request failed (${response.status}) for ${path}`);
      const type = response.headers.get('content-type') ?? '';
      return (type.includes('application/json') ? response.json() : response.text()) as Promise<T>;
    },
    async health() {
      try {
        const response = await fetch('/', { method: 'HEAD', cache: 'no-store' });
        return { ok: response.ok, status: response.status };
      } catch {
        return { ok: false, status: 0 };
      }
    },
  }),
};
