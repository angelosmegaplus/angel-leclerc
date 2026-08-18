// Browser/SSR Supabase client. Public configuration only.
import { createClient, type Session } from '@supabase/supabase-js';
import type { Database } from './types';
import { lovableArticleArchive } from '@/content/lovable-archive';

const PUBLIC_SUPABASE_URL = 'https://timygavajdestkbdzuyk.supabase.co';
const PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_8IG8jsDj3yWH7u7urAQPig_r2V8Wd9s';

// Les articles récupérés depuis l'ancien site peuvent être affichés dans l'admin
// avant leur restauration native dans public.articles. Dans ce cas un DELETE par
// id toucherait zéro ligne et l'article réapparaîtrait via le fallback historique.
// On transforme donc la suppression de TOUT article d'archive en tombstone
// persistant dans git_article_state. Les lecteurs d'articles respectent déjà ces
// tombstones, ce qui empêche toute résurrection involontaire.
const RECOVERED_ARTICLE_BY_ID: Record<string, string> = Object.fromEntries(
  lovableArticleArchive
    .filter((article) => typeof article.id === 'string' && typeof article.slug === 'string')
    .map((article) => [article.id, article.slug]),
);

// Quelques articles historiques maintenus directement dans Git ne font pas
// forcément partie du snapshot Lovable : conserver leur compatibilité explicite.
Object.assign(RECOVERED_ARTICLE_BY_ID, {
  'political-salaries-20260815': 'salaires-politiques-france-combien-coutent-elus',
  '9b51d8a2-7cf4-4d9b-a9d0-202608131438':
    'macron-2017-philippe-2027-reseaux-attali-president-par-defaut',
  '4f948fd6-424d-4fc2-9d0b-202608131420':
    'meilleurs-films-horreur-classement-allocine-avis',
});

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
      storage: typeof window !== 'undefined' ? localStorage : undefined,
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

function proxiedFrom(table: string) {
  if (!_supabase) _supabase = createSupabaseClient();
  const query = (_supabase as any).from(table);
  if (table !== 'articles') return query;

  return new Proxy(query, {
    get(target, prop, receiver) {
      if (prop !== 'delete') return Reflect.get(target, prop, receiver);
      return (...args: unknown[]) => {
        const deleteQuery = target.delete(...args);
        return new Proxy(deleteQuery, {
          get(deleteTarget, deleteProp, deleteReceiver) {
            if (deleteProp !== 'eq') return Reflect.get(deleteTarget, deleteProp, deleteReceiver);
            return (column: string, value: unknown) => {
              if (column === 'id' && typeof value === 'string') {
                const slug = RECOVERED_ARTICLE_BY_ID[value];
                if (slug) {
                  return (_supabase as any)
                    .from('git_article_state')
                    .upsert(
                      { slug, deleted: true, deleted_at: new Date().toISOString() },
                      { onConflict: 'slug' },
                    );
                }
              }
              return deleteTarget.eq(column, value);
            };
          },
        });
      };
    },
  });
}

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    if (prop === 'from') return (table: string) => proxiedFrom(table);
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
