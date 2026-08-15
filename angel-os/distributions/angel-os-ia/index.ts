// SPDX-License-Identifier: GPL-2.0-only
import type { AngelOSContext, AngelOSDistribution, AngelOSModule } from '../../core/types';

function module(id: string, provides: string[]): AngelOSModule {
  return {
    id: `angel-os-ia.${id}`,
    version: '0.2.0',
    requires: ['events', 'configuration'],
    provides,
    start(_context: AngelOSContext) {
      // Angel OS IA consumes Angel OS services through adapters. It must never
      // become a dependency of the Angel OS core itself.
    },
  };
}

const aiProviderModule = module('providers', ['ai-providers']);
const conversationModule = module('conversation', ['conversation', 'contextual-assistance']);
const analysisModule = module('analysis', ['ai-analysis', 'recommendations']);
const generationModule = module('generation', ['content-generation']);
const agentModule = module('agents', ['ai-agents', 'ai-orchestration']);
const automationModule = module('automation', ['intelligent-automation']);

export const ANGEL_OS_IA_BOUNDARY = {
  dependsOn: 'angel-os',
  coreDependencyDirection: 'angel-os-ia -> angel-os',
  forbiddenDirection: 'angel-os -> angel-os-ia',
  systemCapabilitiesRemainInAngelOs: true,
} as const;

export const angelOSIA: AngelOSDistribution = {
  id: 'angel-os-ia',
  name: 'Angel OS IA',
  version: '0.2.0',
  modules: [aiProviderModule, conversationModule, analysisModule, generationModule, agentModule, automationModule],
};

export default angelOSIA;
