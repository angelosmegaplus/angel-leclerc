// SPDX-License-Identifier: GPL-2.0-only

export type AngelOSCapability =
  | 'events'
  | 'configuration'
  | 'storage'
  | 'network'
  | 'identity'
  | 'ai'
  | 'automation'
  | string;

export interface AngelOSContext {
  readonly version: string;
  readonly platform: string;
  readonly capabilities: ReadonlySet<AngelOSCapability>;
  readonly config: Readonly<Record<string, unknown>>;
}

export interface AngelOSModule {
  readonly id: string;
  readonly version: string;
  readonly requires?: readonly AngelOSCapability[];
  readonly provides?: readonly AngelOSCapability[];
  start(context: AngelOSContext): void | Promise<void>;
  stop?(context: AngelOSContext): void | Promise<void>;
}

export interface AngelOSAdapter<T = unknown> {
  readonly id: string;
  readonly capability: AngelOSCapability;
  connect(): T | Promise<T>;
  disconnect?(): void | Promise<void>;
}

export interface AngelOSDistribution {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly modules: readonly AngelOSModule[];
  readonly adapters?: readonly AngelOSAdapter[];
}
