// SPDX-License-Identifier: GPL-2.0-only
import type { AngelOSAdapter } from '../core/types';

export type AngelStorageClient = {
  put(path: string, body: ArrayBuffer | Uint8Array | Blob): Promise<{ size: number; updatedAt: string }>;
  get(path: string): Promise<ArrayBuffer | null>;
  delete(path: string): Promise<void>;
  list(prefix?: string): Promise<Array<{ name: string; directory: boolean; size: number; updatedAt: string }>>;
  health(): Promise<boolean>;
};

export const storageServerAdapter: AngelOSAdapter<AngelStorageClient> = {
  id: 'angel.storage.native',
  capability: 'storage',
  connect() {
    const baseUrl = process.env.ANGEL_STORAGE_URL ?? 'http://angel-storage:3300';
    const token = process.env.ANGEL_STORAGE_TOKEN;
    if (!token) throw new Error('ANGEL_STORAGE_TOKEN is required');
    const auth = { authorization: `Bearer ${token}` };
    return {
      async put(path, body) {
        const response = await fetch(`${baseUrl}/v1/files/${encodeURIComponent(path)}`, { method: 'PUT', headers: auth, body: body as BodyInit });
        if (!response.ok) throw new Error(`Angel Storage put failed: ${response.status}`);
        return response.json();
      },
      async get(path) {
        const response = await fetch(`${baseUrl}/v1/files/${encodeURIComponent(path)}`, { headers: auth });
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`Angel Storage get failed: ${response.status}`);
        return response.arrayBuffer();
      },
      async delete(path) {
        const response = await fetch(`${baseUrl}/v1/files/${encodeURIComponent(path)}`, { method: 'DELETE', headers: auth });
        if (!response.ok && response.status !== 204) throw new Error(`Angel Storage delete failed: ${response.status}`);
      },
      async list(prefix = '') {
        const response = await fetch(`${baseUrl}/v1/files?prefix=${encodeURIComponent(prefix)}`, { headers: auth });
        if (!response.ok) throw new Error(`Angel Storage list failed: ${response.status}`);
        const payload = await response.json() as { items: Array<{ name: string; directory: boolean; size: number; updatedAt: string }> };
        return payload.items;
      },
      async health() {
        const response = await fetch(`${baseUrl}/health`);
        return response.ok;
      },
    };
  },
};
