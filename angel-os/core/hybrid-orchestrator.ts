// SPDX-License-Identifier: GPL-2.0-only

import type { KeyValueCache, TaskWorker } from './service-adapters';

export type HybridProvider<TInput = unknown, TOutput = unknown> = {
  id: string;
  kind: 'external' | 'native';
  priority?: number;
  health?: () => Promise<boolean>;
  run: (input: TInput) => Promise<TOutput>;
};

export type HybridStrategy = 'race' | 'cascade' | 'merge';

export type HybridRunOptions<TOutput> = {
  strategy?: HybridStrategy;
  cacheKey?: string;
  cacheTtlSeconds?: number;
  merge?: (results: TOutput[]) => TOutput;
  validate?: (result: TOutput) => boolean;
};

export type HybridRunReport<TOutput> = {
  result: TOutput;
  providerIds: string[];
  usedNative: boolean;
  usedExternal: boolean;
  fromCache: boolean;
  failures: Array<{ providerId: string; message: string }>;
};

function sortedProviders<TInput, TOutput>(providers: HybridProvider<TInput, TOutput>[]) {
  return [...providers].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

export class HybridOrchestrator {
  constructor(
    private readonly cache: KeyValueCache,
    private readonly workers: TaskWorker[] = [],
  ) {}

  private async isHealthy<TInput, TOutput>(provider: HybridProvider<TInput, TOutput>) {
    if (!provider.health) return true;
    try {
      return await provider.health();
    } catch {
      return false;
    }
  }

  async run<TInput, TOutput>(
    input: TInput,
    providers: HybridProvider<TInput, TOutput>[],
    options: HybridRunOptions<TOutput> = {},
  ): Promise<HybridRunReport<TOutput>> {
    const strategy = options.strategy ?? 'cascade';
    const failures: Array<{ providerId: string; message: string }> = [];

    if (options.cacheKey) {
      const cached = await this.cache.get<TOutput>(options.cacheKey);
      if (cached !== null) {
        return {
          result: cached,
          providerIds: ['cache'],
          usedNative: true,
          usedExternal: false,
          fromCache: true,
          failures,
        };
      }
    }

    const healthy: HybridProvider<TInput, TOutput>[] = [];
    for (const provider of sortedProviders(providers)) {
      if (await this.isHealthy(provider)) healthy.push(provider);
    }

    if (!healthy.length) throw new Error('No healthy provider available');

    let result: TOutput;
    let used: HybridProvider<TInput, TOutput>[] = [];

    if (strategy === 'race') {
      const wrapped = healthy.map(async (provider) => {
        try {
          const value = await provider.run(input);
          if (options.validate && !options.validate(value)) throw new Error('Result rejected by validator');
          return { provider, value };
        } catch (error) {
          failures.push({ providerId: provider.id, message: error instanceof Error ? error.message : String(error) });
          throw error;
        }
      });
      const winner = await Promise.any(wrapped);
      result = winner.value;
      used = [winner.provider];
    } else if (strategy === 'merge') {
      const successful: Array<{ provider: HybridProvider<TInput, TOutput>; value: TOutput }> = [];
      await Promise.all(healthy.map(async (provider) => {
        try {
          const value = await provider.run(input);
          if (!options.validate || options.validate(value)) successful.push({ provider, value });
        } catch (error) {
          failures.push({ providerId: provider.id, message: error instanceof Error ? error.message : String(error) });
        }
      }));
      if (!successful.length) throw new Error('All hybrid providers failed');
      used = successful.map((entry) => entry.provider);
      result = options.merge ? options.merge(successful.map((entry) => entry.value)) : successful[0].value;
    } else {
      let selected: { provider: HybridProvider<TInput, TOutput>; value: TOutput } | null = null;
      for (const provider of healthy) {
        try {
          const value = await provider.run(input);
          if (options.validate && !options.validate(value)) throw new Error('Result rejected by validator');
          selected = { provider, value };
          break;
        } catch (error) {
          failures.push({ providerId: provider.id, message: error instanceof Error ? error.message : String(error) });
        }
      }
      if (!selected) throw new Error('All hybrid providers failed');
      used = [selected.provider];
      result = selected.value;
    }

    if (options.cacheKey) await this.cache.set(options.cacheKey, result, options.cacheTtlSeconds);

    return {
      result,
      providerIds: used.map((provider) => provider.id),
      usedNative: used.some((provider) => provider.kind === 'native'),
      usedExternal: used.some((provider) => provider.kind === 'external'),
      fromCache: false,
      failures,
    };
  }

  async enrich<TInput, TOutput>(task: string, input: TInput): Promise<TOutput[]> {
    const outputs: TOutput[] = [];
    for (const worker of this.workers) {
      try {
        if (await worker.health()) outputs.push(await worker.run<TInput, TOutput>(task, input));
      } catch {
        // Optional workers never block the main external/native flow.
      }
    }
    return outputs;
  }
}
