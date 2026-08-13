// SPDX-License-Identifier: GPL-2.0-only
export type AngelOSConfig = Record<string, unknown>;

export function createConfig(defaults: AngelOSConfig, overrides: AngelOSConfig = {}): Readonly<AngelOSConfig> {
  return Object.freeze({ ...defaults, ...overrides });
}
