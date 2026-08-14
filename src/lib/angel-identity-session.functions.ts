import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { AngelOSAdapterRegistry } from '../../angel-os/core/adapter-registry';
import { identityServerAdapter, type AngelIdentityClient } from '../../angel-os/adapters/identity.server';

const adapters = new AngelOSAdapterRegistry();
adapters.register(identityServerAdapter);

async function getIdentity(): Promise<AngelIdentityClient> {
  return adapters.connect<AngelIdentityClient>('angel.identity.native');
}

function requestToken(): string | null {
  const header = getRequest().headers.get('authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

export const readAngelIdentitySession = createServerFn({ method: 'GET' }).handler(async () => {
  const token = requestToken();
  if (!token || !process.env.ANGEL_IDENTITY_URL) return null;
  try {
    return await (await getIdentity()).session(token);
  } catch {
    return null;
  }
});

export const closeAngelIdentitySession = createServerFn({ method: 'POST' }).handler(async () => {
  const token = requestToken();
  if (token && process.env.ANGEL_IDENTITY_URL) {
    try { await (await getIdentity()).logout(token); } catch { /* local logout still succeeds */ }
  }
  return { ok: true as const };
});
