// Server-side Supabase client with service-role/secret-key failover.
// Trusted server operations only.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import {
  getCredentialPoolSync,
  markCredentialHealthy,
  quarantineCredential,
  type CredentialCandidate,
} from '@/lib/credential-pool.server';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function serviceKeyPool() {
  return getCredentialPoolSync(
    'supabase-service',
    ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY'],
  );
}

function createSupabaseFetch(initial: CredentialCandidate): typeof fetch {
  let active = initial;

  return async (input, init) => {
    const pool = serviceKeyPool();
    const ordered = [active, ...pool.filter((candidate) => candidate.value !== active.value)];
    let lastResponse: Response | null = null;
    let lastError: unknown = null;

    for (const candidate of ordered) {
      const headers = new Headers(
        typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
      );
      if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));

      headers.set('apikey', candidate.value);
      if (isNewSupabaseApiKey(candidate.value)) headers.delete('Authorization');
      else headers.set('Authorization', `Bearer ${candidate.value}`);

      try {
        const response = await fetch(input, { ...init, headers });
        lastResponse = response;
        if (response.ok || ![401, 403, 429, 500, 502, 503, 504].includes(response.status)) {
          active = candidate;
          markCredentialHealthy('supabase-service', candidate);
          return response;
        }
        quarantineCredential(candidate);
      } catch (error) {
        lastError = error;
        quarantineCredential(candidate);
      }
    }

    if (lastResponse) return lastResponse;
    throw lastError instanceof Error ? lastError : new Error('Supabase indisponible après test des clés de secours.');
  };
}

function createSupabaseAdminClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
  const keys = serviceKeyPool();
  const first = keys[0];

  if (!SUPABASE_URL || !first) {
    const missing = [
      ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
      ...(!first ? ['SUPABASE_SERVICE_ROLE_KEY'] : []),
    ];
    throw new Error(`Missing Supabase server credential(s): ${missing.join(', ')}. Configure them in Vercel Environment Variables.`);
  }

  return createClient<Database>(SUPABASE_URL, first.value, {
    global: { fetch: createSupabaseFetch(first) },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
