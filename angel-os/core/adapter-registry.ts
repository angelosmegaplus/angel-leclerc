// SPDX-License-Identifier: GPL-2.0-only
import type { AngelOSAdapter, AngelOSCapability } from './types';

type ConnectedAdapter = {
  adapter: AngelOSAdapter;
  client: unknown;
};

export class AngelOSAdapterRegistry {
  private readonly adapters = new Map<string, AngelOSAdapter>();
  private readonly connected = new Map<string, ConnectedAdapter>();

  register(adapter: AngelOSAdapter): void {
    if (this.adapters.has(adapter.id)) throw new Error(`Duplicate adapter: ${adapter.id}`);
    this.adapters.set(adapter.id, adapter);
  }

  list(): readonly AngelOSAdapter[] {
    return [...this.adapters.values()];
  }

  byCapability(capability: AngelOSCapability): readonly AngelOSAdapter[] {
    return this.list().filter((adapter) => adapter.capability === capability);
  }

  async connect<T = unknown>(id: string): Promise<T> {
    const cached = this.connected.get(id);
    if (cached) return cached.client as T;

    const adapter = this.adapters.get(id);
    if (!adapter) throw new Error(`Unknown adapter: ${id}`);

    const client = await adapter.connect();
    this.connected.set(id, { adapter, client });
    return client as T;
  }

  get<T = unknown>(id: string): T | undefined {
    return this.connected.get(id)?.client as T | undefined;
  }

  async disconnectAll(): Promise<void> {
    for (const { adapter } of [...this.connected.values()].reverse()) {
      await adapter.disconnect?.();
    }
    this.connected.clear();
  }
}
