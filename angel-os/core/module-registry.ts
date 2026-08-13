// SPDX-License-Identifier: GPL-2.0-only
import type { AngelOSContext, AngelOSModule } from './types';

export class AngelOSModuleRegistry {
  private readonly modules = new Map<string, AngelOSModule>();
  register(module: AngelOSModule): void {
    if (this.modules.has(module.id)) throw new Error(`Duplicate module: ${module.id}`);
    this.modules.set(module.id, module);
  }
  list(): readonly AngelOSModule[] { return [...this.modules.values()]; }
  async startAll(context: AngelOSContext): Promise<void> {
    for (const module of this.modules.values()) await module.start(context);
  }
  async stopAll(context: AngelOSContext): Promise<void> {
    for (const module of [...this.modules.values()].reverse()) await module.stop?.(context);
  }
}
