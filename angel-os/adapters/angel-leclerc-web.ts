// SPDX-License-Identifier: GPL-2.0-only
import type { AngelOSAdapter } from '../core/types';

export type AngelLeclercWebConnection = {
  product: 'angel-leclerc.fr';
  platform: 'web';
  publicBaseUrl: 'https://www.angel-leclerc.fr';
  adminPath: '/admin';
};

export const angelLeclercWebAdapter: AngelOSAdapter<AngelLeclercWebConnection> = {
  id: 'angel-leclerc.fr.web',
  capability: 'network',
  connect() {
    return {
      product: 'angel-leclerc.fr',
      platform: 'web',
      publicBaseUrl: 'https://www.angel-leclerc.fr',
      adminPath: '/admin',
    };
  },
};

export default angelLeclercWebAdapter;
