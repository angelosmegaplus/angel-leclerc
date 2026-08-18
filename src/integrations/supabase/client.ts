// Browser/SSR Supabase client. Public configuration only.
import { createClient, type Session } from '@supabase/supabase-js';
import type { Database } from './types';
import { lovableArticleArchive } from '@/content/lovable-archive';
import { saveGitHubArticle, deleteGitHubArticle } from '@/lib/github-article-cms.functions';

const PUBLIC_SUPABASE_URL = 'https://timygavajdestkbdzuyk.supabase.co';
const PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_8IG8jsDj3yWH7u7urAQPig_r2V8Wd9s';

const RECOVERED_ARTICLE_BY_ID: Record<string, string> = Object.fromEntries(
  lovableArticleArchive
    .filter((article) => typeof article.id === 'string' && typeof article.slug === 'string')
    .map((article) => [article.id, article.slug]),
);

Object.assign(RECOVERED_ARTICLE_BY_ID, {
  'political-salaries-20260815': 'salaires-politiques-france-combien-coutent-elus',
  '9b51d8a2-7cf4-4d9b-a9d0-202608131438':
    'macron-2017-philippe-2027-reseaux-attali-president-par-defaut',
  '4f948fd6-424d-4fc2-9d0b-202608131420':
    'meilleurs-films-horreur-classement-allocine-avis',
});

function articleSlugFromId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (value.startsWith('github:')) return value.slice('github:'.length);
  return RECOVERED_ARTICLE_BY_ID[value] || null;
}

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

type ArticleMutationKind = 'insert' | 'update' | 'delete';
type Filter = { op: 'eq' | 'neq' | 'is'; column: string; value: unknown };

function createArticleMutation(kind: ArticleMutationKind, payload?: any) {
  const filters: Filter[] = [];

  const execute = async () => {
    try {
      if (kind === 'insert') {
        await saveGitHubArticle({ data: payload });
        return { data: null, error: null };
      }

      const idFilter = filters.find((filter) => filter.op === 'eq' && filter.column === 'id');
      const slug = payload?.slug || articleSlugFromId(idFilter?.value);

      if (kind === 'delete') {
        if (!slug) throw new Error('Slug GitHub introuvable pour cet article.');
        await deleteGitHubArticle({ data: { slug } });
        return { data: null, error: null };
      }

      // Les mises à jour globales auxiliaires (ex. retirer "à la une" des autres
      // articles) ne doivent pas recréer une base de données. Elles sont ignorées
      // ici ; l'enregistrement principal de l'article reste atomique dans Git.
      if (!slug || !payload?.title || typeof payload?.content !== 'string') {
        return { data: null, error: null };
      }

      await saveGitHubArticle({ data: { ...payload, slug } });
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const mutation: any = {
    eq(column: string, value: unknown) {
      filters.push({ op: 'eq', column, value });
      return mutation;
    },
    neq(column: string, value: unknown) {
      filters.push({ op: 'neq', column, value });
      return mutation;
    },
    is(column: string, value: unknown) {
      filters.push({ op: 'is', column, value });
      return mutation;
    },
    then(resolve: (value: any) => any, reject?: (reason: unknown) => any) {
      return execute().then(resolve, reject);
    },
  };

  return mutation;
}

function proxiedFrom(table: string) {
  if (!_supabase) _supabase = createSupabaseClient();
  const query = (_supabase as any).from(table);
  if (table !== 'articles') return query;

  return new Proxy(query, {
    get(target, prop, receiver) {
      if (prop === 'insert') {
        return (payload: unknown) => createArticleMutation('insert', payload);
      }
      if (prop === 'update') {
        return (payload: unknown) => createArticleMutation('update', payload);
      }
      if (prop === 'delete') {
        return () => createArticleMutation('delete');
      }
      return Reflect.get(target, prop, receiver);
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
