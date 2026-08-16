// Trusted server-side Supabase client.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function createSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !key) {
    const missing = [
      ...(!url ? ['SUPABASE_URL'] : []),
      ...(!key ? ['SUPABASE_SERVICE_ROLE_KEY'] : []),
    ];
    throw new Error(`Missing Supabase server credential(s): ${missing.join(', ')}. Configure them in Vercel Environment Variables.`);
  }

  return createClient<Database>(url, key, {
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
