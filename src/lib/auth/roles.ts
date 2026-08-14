import { AngelOSAdapterRegistry } from '../../../angel-os/core/adapter-registry';
import { angelDataServerAdapter, type AngelDataClient } from '../../../angel-os/adapters/data.server';

const adapters = new AngelOSAdapterRegistry();
adapters.register(angelDataServerAdapter);

type AuthContext = {
  userId: string;
  role?: string | null;
  authProvider?: 'angel-identity' | 'supabase';
  supabase?: { from: (table: string) => any };
};

export async function resolveUserRole(context: AuthContext): Promise<string | null> {
  if (process.env.ANGEL_DATA_TOKEN) {
    try {
      const data = await adapters.connect<AngelDataClient>('angel.data.native');
      const existing = await data.get<{ role: string }>('auth.roles', context.userId);
      if (existing?.role) return existing.role;

      if (context.role) {
        await data.set('auth.roles', context.userId, { role: context.role, migratedAt: new Date().toISOString() });
        return context.role;
      }

      if (context.supabase) {
        const { data: legacy } = await context.supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', context.userId)
          .eq('role', 'admin')
          .maybeSingle();
        if (legacy?.role) {
          await data.set('auth.roles', context.userId, { role: legacy.role, migratedAt: new Date().toISOString(), source: 'supabase' });
          return legacy.role;
        }
      }
    } catch (error) {
      console.error('[Angel OS] role resolution via Angel Data failed', error);
    }
  }

  if (context.role) return context.role;
  if (context.supabase) {
    const { data } = await context.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', context.userId)
      .eq('role', 'admin')
      .maybeSingle();
    return data?.role ?? null;
  }
  return null;
}
