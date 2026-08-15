// SPDX-License-Identifier: GPL-2.0-only

import type { AngelLayer } from './system-contract';

export type AngelApplication = {
  id: string;
  name: string;
  version: string;
  layer: Extract<AngelLayer, 'angel-os-ia' | 'application'>;
  requires: string[];
  provides: string[];
  health?: () => Promise<boolean>;
  start?: () => Promise<void> | void;
  stop?: () => Promise<void> | void;
};

export type AngelApplicationState = 'registered' | 'starting' | 'running' | 'degraded' | 'stopped' | 'failed';

export class AngelApplicationRuntime {
  private readonly apps = new Map<string, AngelApplication>();
  private readonly states = new Map<string, AngelApplicationState>();

  register(app: AngelApplication) {
    if (this.apps.has(app.id)) throw new Error(`Application already registered: ${app.id}`);
    this.apps.set(app.id, app);
    this.states.set(app.id, 'registered');
    return app;
  }

  async start(id: string) {
    const app = this.apps.get(id);
    if (!app) throw new Error(`Unknown application: ${id}`);
    this.states.set(id, 'starting');
    try {
      await app.start?.();
      const healthy = app.health ? await app.health() : true;
      this.states.set(id, healthy ? 'running' : 'degraded');
    } catch (error) {
      this.states.set(id, 'failed');
      throw error;
    }
    return this.snapshot(id);
  }

  async stop(id: string) {
    const app = this.apps.get(id);
    if (!app) throw new Error(`Unknown application: ${id}`);
    await app.stop?.();
    this.states.set(id, 'stopped');
    return this.snapshot(id);
  }

  snapshot(id: string) {
    const app = this.apps.get(id);
    if (!app) return null;
    return { ...app, state: this.states.get(id) ?? 'registered' };
  }

  list() { return [...this.apps.keys()].map((id) => this.snapshot(id)!).filter(Boolean); }
}
