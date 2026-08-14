// SPDX-License-Identifier: GPL-2.0-only
import type { AngelOSAdapter } from '../core/types';

export type AngelIdentityUser = { id: string; email: string; role: string };
export type AngelIdentitySession = { user: AngelIdentityUser; expiresAt: string };

export type AngelIdentityClient = {
  login(email: string, password: string): Promise<{ token: string; expiresAt: string; user: AngelIdentityUser }>;
  session(token: string): Promise<AngelIdentitySession | null>;
  logout(token: string): Promise<void>;
};

export const identityServerAdapter: AngelOSAdapter<AngelIdentityClient> = {
  id: 'angel.identity.native',
  capability: 'identity',
  connect() {
    const baseUrl = process.env.ANGEL_IDENTITY_URL;
    if (!baseUrl) throw new Error('ANGEL_IDENTITY_URL is required');

    async function request(path: string, init: RequestInit = {}) {
      return fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
        ...init,
        headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
      });
    }

    return {
      async login(email, password) {
        const response = await request('/v1/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        if (!response.ok) throw new Error(`Angel Identity login failed: ${response.status}`);
        return response.json();
      },
      async session(token) {
        const response = await request('/v1/session', { headers: { authorization: `Bearer ${token}` } });
        if (response.status === 401) return null;
        if (!response.ok) throw new Error(`Angel Identity session failed: ${response.status}`);
        return response.json();
      },
      async logout(token) {
        const response = await request('/v1/logout', { method: 'POST', headers: { authorization: `Bearer ${token}` } });
        if (!response.ok && response.status !== 204) throw new Error(`Angel Identity logout failed: ${response.status}`);
      },
    };
  },
};
