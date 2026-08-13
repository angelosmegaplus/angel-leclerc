// SPDX-License-Identifier: GPL-2.0-only
import type { AngelOSAdapter } from '../core/types';

export const webRuntimeAdapter: AngelOSAdapter<{ runtime: 'web' }> = {
  id: 'angel.web.runtime',
  capability: 'network',
  connect: () => ({ runtime: 'web' }),
};
