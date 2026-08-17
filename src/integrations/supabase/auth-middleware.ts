import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { getFreshSupabaseSession } from './client'

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
    // Never forward a token merely because it exists in localStorage. Validate
    // it first and, when required, perform one deduplicated refresh so a stale
    // long-lived admin tab repairs itself before the server function runs.
    const session = await getFreshSupabaseSession();
    const token = session?.access_token?.trim();

    if (!token) {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        const target = `/auth?reason=session-expired&returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        window.location.replace(target);
        throw new Error('AUTH_SESSION_EXPIRED');
      }
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

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) throw new Error('Unauthorized: No token provided');

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

    // Do not assume a particular access-token serialization. Supabase Auth is
    // the authority that issued the session, so validate the bearer directly
    // against /auth/v1/user. This accepts the project's current token format
    // and avoids rejecting a valid session locally before Supabase sees it.
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user?.id) throw new Error('Unauthorized: Invalid or expired session token');

    // Claims are useful to downstream functions but must not be a hard gate.
    // Populate them when the token can be decoded/verified as a JWT; otherwise
    // keep the authenticated user context valid based on getUser().
    let claims: Record<string, unknown> = { sub: user.id, email: user.email ?? undefined };
    if (token.split('.').length === 3) {
      const { data: claimsData } = await supabase.auth.getClaims(token);
      if (claimsData?.claims) claims = claimsData.claims as Record<string, unknown>;
    }

    return next({
      context: {
        supabase,
        userId: user.id,
        claims,
      },
    });
  });
