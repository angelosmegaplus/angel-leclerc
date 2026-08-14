// SPDX-License-Identifier: GPL-2.0-only
import type { AngelOSContext, AngelOSDistribution, AngelOSModule } from '../../core/types';

const aiModule: AngelOSModule = {
  id: 'angel-os-ia.ai',
  version: '0.1.0',
  requires: ['events', 'configuration'],
  provides: ['ai'],
  start(_context: AngelOSContext) {
    // Provider-specific AI remains behind application adapters.
  },
};

const automationModule: AngelOSModule = {
  id: 'angel-os-ia.automation',
  version: '0.1.0',
  requires: ['events', 'configuration'],
  provides: ['automation'],
  start(_context: AngelOSContext) {
    // Schedulers and platform jobs are supplied by adapters/apps.
  },
};

export const angelOSIA: AngelOSDistribution = {
  id: 'angel-os-ia',
  name: 'Angel OS IA',
  version: '0.1.0',
  modules: [aiModule, automationModule],
};

export default angelOSIA;
