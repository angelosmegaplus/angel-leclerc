import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import { AngelOSAdapterRegistry } from '../../../angel-os/core/adapter-registry';
import { identityServerAdapter, type AngelIdentityClient } from '../../../angel-os/adapters/identity.server';
import type { Database } from '@/integrations/supabase/types';

const adapters = new AngelOSAdapterRegistry();
adapters.register(identityServerAdapter);

export const requireAngelAuth = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const request = getRequest();
  const header = request.headers.get('authorization') ?? '';
  if (!header.startsWith('Bearer ')) throw new Error('Unauthorized: bearer token required');
  const token = header.slice(7);

  if (process.env.ANGEL_IDENTITY_URL && token.split('.').length !== 3) {
    try {
      const identity = await adapters.connect<AngelIdentityClient>('angel.identity.native');
      const session = await identity.session(token);
      if (session?.user) {
        return next({
          context: {
            authProvider: 'angel-identity' as const,
            userId: session.user.id,
            role: session.user.role,
            user: session.user,
          },
        });
      }
    } catch {
      // Continue to the compatibility provider.
    }
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Unauthorized: no compatible identity provider available');

  const supabase = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) throw new Error('Unauthorized: invalid session');

  return next({
    context: {
      authProvider: 'supabase' as const,
      userId: data.claims.sub,
      role: null,
      claims: data.claims,
      supabase,
    },
  });
});
