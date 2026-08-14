// SPDX-License-Identifier: GPL-2.0-only
import type { AngelOSAdapter } from '../core/types';

export interface AngelOSKeyValueStore {
  get<T = unknown>(key: string): T | null;
  set<T = unknown>(key: string, value: T): void;
  remove(key: string): void;
  list(prefix?: string): string[];
}

function createMemoryStore(): AngelOSKeyValueStore {
  const data = new Map<string, string>();
  return {
    get: <T>(key: string) => {
      const value = data.get(key);
      return value == null ? null : JSON.parse(value) as T;
    },
    set: (key, value) => data.set(key, JSON.stringify(value)),
    remove: (key) => data.delete(key),
    list: (prefix = '') => [...data.keys()].filter((key) => key.startsWith(prefix)),
  };
}

export const browserStorageAdapter: AngelOSAdapter<AngelOSKeyValueStore> = {
  id: 'angel.storage.local',
  capability: 'storage',
  connect: () => {
    if (typeof window === 'undefined' || !window.localStorage) return createMemoryStore();
    const namespace = 'angel-os:';
    return {
      get: <T>(key: string) => {
        const value = window.localStorage.getItem(namespace + key);
        return value == null ? null : JSON.parse(value) as T;
      },
      set: (key, value) => window.localStorage.setItem(namespace + key, JSON.stringify(value)),
      remove: (key) => window.localStorage.removeItem(namespace + key),
      list: (prefix = '') => Object.keys(window.localStorage)
        .filter((key) => key.startsWith(namespace + prefix))
        .map((key) => key.slice(namespace.length)),
    };
  },
};
