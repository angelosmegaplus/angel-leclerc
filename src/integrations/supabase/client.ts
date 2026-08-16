// Browser/SSR Supabase client. Public configuration only.
import { createClient, type Session } from '@supabase/supabase-js';
import type { Database } from './types';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }
    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    const missing = [
      ...(!url ? ['VITE_SUPABASE_URL'] : []),
      ...(!publishableKey ? ['VITE_SUPABASE_PUBLISHABLE_KEY'] : []),
    ];
    const message = `Configuration Supabase publique absente : ${missing.join(', ')}. Configure les variables d’environnement du déploiement.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(url, publishableKey, {
    global: { fetch: createSupabaseFetch(publishableKey) },
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;
let refreshInFlight: Promise<Session | null> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});

/**
 * Return a session whose access token is actually usable, not merely present in
 * localStorage. This prevents TanStack server functions from receiving an old
 * Supabase JWT after a long-lived admin tab, sleep/resume or auth migration.
 */
export async function getFreshSupabaseSession(): Promise<Session | null> {
  if (typeof window === 'undefined') return null;

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;

  const session = data.session;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresSoon = !session.expires_at || session.expires_at <= nowSeconds + 60;

  if (!expiresSoon) {
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(session.access_token);
    if (!claimsError && claimsData?.claims?.sub) return session;
  }

  // Deduplicate simultaneous dashboard requests: one refresh should repair all
  // server-function calls instead of racing several refresh-token rotations.
  if (!refreshInFlight) {
    refreshInFlight = supabase.auth.refreshSession()
      .then(({ data: refreshed, error: refreshError }) => {
        if (refreshError || !refreshed.session) return null;
        return refreshed.session;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}
