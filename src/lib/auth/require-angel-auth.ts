import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createClient, type JwtPayload, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type AngelIdentityUser = { id: string; email: string; role: string };

export type HybridAuthContext = {
  authProvider: 'angel-identity' | 'supabase';
  userId: string;
  role: string | null;
  user: AngelIdentityUser | null;
  claims: JwtPayload | null;
  supabase: SupabaseClient<Database> | null;
};

export const requireAngelAuth = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const request = getRequest();
  const header = request.headers.get('authorization') ?? '';
  if (!header.startsWith('Bearer ')) throw new Error('Unauthorized: bearer token required');
  const token = header.slice(7);
  let authContext: HybridAuthContext | null = null;

  if (process.env.ANGEL_IDENTITY_URL && token.split('.').length !== 3) {
    try {
      const [{ AngelOSAdapterRegistry }, { identityServerAdapter }] = await Promise.all([
        import('../../../angel-os/core/adapter-registry'),
        import('../../../angel-os/adapters/identity.server'),
      ]);
      const adapters = new AngelOSAdapterRegistry();
      adapters.register(identityServerAdapter);
      const identity = await adapters.connect<{
        session(value: string): Promise<{ user: AngelIdentityUser; expiresAt: string } | null>;
      }>('angel.identity.native');
      const session = await identity.session(token);
      if (session?.user) {
        authContext = {
          authProvider: 'angel-identity',
          userId: session.user.id,
          role: session.user.role,
          user: session.user,
          claims: null,
          supabase: null,
        };
      }
    } catch {
      authContext = null;
    }
  }

  if (!authContext) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error('Unauthorized: no compatible identity provider available');
    const supabase = createClient<Database>(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims?.sub) throw new Error('Unauthorized: invalid session');
    authContext = {
      authProvider: 'supabase',
      userId: data.claims.sub,
      role: null,
      user: null,
      claims: data.claims,
      supabase,
    };
  }

  return next({ context: authContext });
});
