// SPDX-License-Identifier: GPL-2.0-only
import type { AngelOSAdapter } from '../core/types';

export type AngelDataClient = {
  get<T = unknown>(namespace: string, key: string): Promise<T | null>;
  list<T = unknown>(namespace: string): Promise<Array<{ key: string; value: T }>>;
  set<T = unknown>(namespace: string, key: string, value: T): Promise<T>;
  delete(namespace: string, key: string): Promise<void>;
  health(): Promise<boolean>;
};

export const angelDataServerAdapter: AngelOSAdapter<AngelDataClient> = {
  id: 'angel.data.native',
  capability: 'storage',
  connect: () => {
    const baseUrl = process.env.ANGEL_DATA_URL ?? 'http://angel-data:3100';
    const token = process.env.ANGEL_DATA_TOKEN;
    if (!token) throw new Error('ANGEL_DATA_TOKEN is required');

    async function request<T>(path: string, init?: RequestInit): Promise<T> {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
          ...(init?.headers ?? {}),
        },
      });
      if (response.status === 404) return null as T;
      if (!response.ok) throw new Error(`Angel Data ${response.status}: ${await response.text()}`);
      if (response.status === 204) return undefined as T;
      return response.json() as Promise<T>;
    }

    return {
      async get<T>(namespace: string, key: string) {
        const result = await request<{ value: T } | null>(`/v1/documents/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`);
        return result?.value ?? null;
      },
      async list<T>(namespace: string) {
        const result = await request<{ items: Array<{ key: string; value: T }> }>(`/v1/documents/${encodeURIComponent(namespace)}`);
        return result.items;
      },
      async set<T>(namespace: string, key: string, value: T) {
        const result = await request<{ value: T }>(`/v1/documents/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`, {
          method: 'PUT', body: JSON.stringify({ value }),
        });
        return result.value;
      },
      async delete(namespace: string, key: string) {
        await request<void>(`/v1/documents/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`, { method: 'DELETE' });
      },
      async health() {
        const response = await fetch(`${baseUrl}/health`);
        return response.ok;
      },
    };
  },
};
