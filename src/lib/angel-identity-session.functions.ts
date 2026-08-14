import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

type AngelIdentityUser = { id: string; email: string; role: string };
type AngelIdentitySession = { user: AngelIdentityUser; expiresAt: string };

function requestToken(): string | null {
  const header = getRequest().headers.get('authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

async function getIdentity() {
  const [{ AngelOSAdapterRegistry }, { identityServerAdapter }] = await Promise.all([
    import('../../angel-os/core/adapter-registry'),
    import('../../angel-os/adapters/identity.server'),
  ]);
  const adapters = new AngelOSAdapterRegistry();
  adapters.register(identityServerAdapter);
  return adapters.connect<{
    session(token: string): Promise<AngelIdentitySession | null>;
    logout(token: string): Promise<void>;
  }>('angel.identity.native');
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
