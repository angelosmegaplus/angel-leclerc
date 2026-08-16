import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { supabase as browserSupabase } from './client'

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function publicSupabaseConfig() {
  // The browser creates the session with the VITE_* public project. ServerFn
  // authentication must validate that bearer token against the exact same
  // project; a stale server-only SUPABASE_URL must not override the browser
  // issuer and make every authenticated admin function reject a valid token.
  const url = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  return { url: url?.trim(), publishableKey: publishableKey?.trim() };
}

export const requireSupabaseAuth = createMiddleware({ type: 'function' })
  .client(async ({ next }) => {
    // TanStack server functions do not automatically inherit Supabase's
    // local-storage session. Attach the current access token to every RPC that
    // uses this middleware so the server can authenticate the actual browser
    // session instead of failing before the protected handler is reached.
    const { data, error } = await browserSupabase.auth.getSession();
    const token = data.session?.access_token?.trim();

    if (error || !token) {
      // Let the server middleware return the canonical Unauthorized error.
      return next();
    }

    return next({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  })
  .server(async ({ next }) => {
    const { url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY } = publicSupabaseConfig();

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error('Supabase public authentication configuration is unavailable');
    }

    const request = getRequest();

    if (!request?.headers) throw new Error('Unauthorized: No request headers available');
    const authHeader = request.headers.get('authorization');
    if (!authHeader) throw new Error('Unauthorized: No authorization header provided');
    if (!authHeader.startsWith('Bearer ')) throw new Error('Unauthorized: Only Bearer tokens are supported');

    const token = authHeader.replace('Bearer ', '');
    if (!token) throw new Error('Unauthorized: No token provided');
    if (token.split('.').length !== 3) throw new Error('Unauthorized: Invalid token');

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: {
        fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims) throw new Error('Unauthorized: Invalid token');
    if (!data.claims.sub) throw new Error('Unauthorized: No user ID found in token');

    return next({
      context: {
        supabase,
        userId: data.claims.sub,
        claims: data.claims,
      },
    });
  });
