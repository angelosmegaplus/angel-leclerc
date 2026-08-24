// Browser/SSR Supabase client. Public configuration only.
import { createClient, type Session } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

// Configuration native du projet uniquement : plus aucun repli vers une base externe.
const PUBLIC_SUPABASE_URL = 'https://mzlxscmgxrylfkofjwzn.supabase.co';
const PUBLIC_SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bHhzY21neHJ5bGZrb2Zqd3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NjU3NzEsImV4cCI6MjEwMDE0MTc3MX0.j__ZNL-KZtnqnZt16g7HNdt1ONzWfEAmblEl6IjierU';

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
  const url = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || PUBLIC_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return createClient<Database>(url, publishableKey, {
    global: { fetch: createSupabaseFetch(publishableKey) },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;
let refreshInFlight: Promise<Session | null> | null = null;
let validatedToken: string | null = null;
let validatedAt = 0;
const VALIDATION_TTL_MS = 30_000;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});

async function validateSession(session: Session): Promise<boolean> {
  if (validatedToken === session.access_token && Date.now() - validatedAt < VALIDATION_TTL_MS) return true;
  const { data, error } = await supabase.auth.getUser(session.access_token);
  if (error || !data.user || data.user.id !== session.user.id) return false;
  validatedToken = session.access_token;
  validatedAt = Date.now();
  return true;
}

/**
 * Return a session whose access token is accepted by Supabase Auth itself.
 * Signature-only claim validation is insufficient because a revoked/stale token
 * can still be cryptographically valid while being rejected by authenticated RPCs.
 */
export async function getFreshSupabaseSession(): Promise<Session | null> {
  if (typeof window === 'undefined') return null;

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;

  const session = data.session;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresSoon = !session.expires_at || session.expires_at <= nowSeconds + 60;

  if (!expiresSoon && await validateSession(session)) return session;

  if (!refreshInFlight) {
    refreshInFlight = supabase.auth.refreshSession()
      .then(async ({ data: refreshed, error: refreshError }) => {
        if (refreshError || !refreshed.session) return null;
        if (!(await validateSession(refreshed.session))) return null;
        return refreshed.session;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  const refreshed = await refreshInFlight;
  if (refreshed) return refreshed;

  validatedToken = null;
  validatedAt = 0;
  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  return null;
}
