import { createMiddleware } from '@tanstack/react-start';
import { supabase } from './client';
import { getAngelIdentityToken } from '@/lib/angel-auth-client';

// Hybrid transition middleware:
// 1. Native Angel Identity session when present.
// 2. Existing Supabase bearer token as compatibility fallback.
export const attachSupabaseAuth = createMiddleware({ type: 'function' }).client(
  async ({ next }) => {
    const nativeToken = getAngelIdentityToken();
    if (nativeToken) {
      return next({ headers: { Authorization: `Bearer ${nativeToken}` } });
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
