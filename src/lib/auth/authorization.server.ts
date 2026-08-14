import { AngelOSAdapterRegistry } from '../../../angel-os/core/adapter-registry';
import { angelDataServerAdapter, type AngelDataClient } from '../../../angel-os/adapters/data.server';

type HybridAuthContext = {
  userId: string;
  authProvider?: 'angel-identity' | 'supabase';
  role?: string | null;
  supabase?: { from: (table: string) => any } | null;
};

type RoleDocument = {
  roles: string[];
  source: 'angel-identity' | 'supabase' | 'angel-data';
  updatedAt: string;
};

const adapters = new AngelOSAdapterRegistry();
adapters.register(angelDataServerAdapter);

async function dataClient(): Promise<AngelDataClient | null> {
  if (!process.env.ANGEL_DATA_TOKEN) return null;
  try {
    return await adapters.connect<AngelDataClient>('angel.data.native');
  } catch {
    return null;
  }
}

export async function getUserRoles(context: HybridAuthContext): Promise<string[]> {
  const data = await dataClient();

  if (data) {
    try {
      const native = await data.get<RoleDocument>('auth.roles', context.userId);
      if (native?.roles?.length) return native.roles;
    } catch (error) {
      console.warn('[Angel OS] lecture auth.roles impossible', error);
    }
  }

  if (context.authProvider === 'angel-identity' && context.role) {
    const roles = [context.role];
    if (data) {
      await data.set<RoleDocument>('auth.roles', context.userId, {
        roles,
        source: 'angel-identity',
        updatedAt: new Date().toISOString(),
      }).catch(() => undefined);
    }
    return roles;
  }

  if (context.supabase) {
    const { data: rows, error } = await context.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', context.userId);
    if (error) throw error;
    const roles = Array.isArray(rows) ? rows.map((row: { role: string }) => row.role) : [];
    if (roles.length && data) {
      await data.set<RoleDocument>('auth.roles', context.userId, {
        roles,
        source: 'supabase',
        updatedAt: new Date().toISOString(),
      }).catch(() => undefined);
    }
    return roles;
  }

  return [];
}

export async function assertRole(context: HybridAuthContext, role: string): Promise<void> {
  const roles = await getUserRoles(context);
  if (!roles.includes(role)) throw new Error(`Accès réservé au rôle ${role}.`);
}

export async function assertAdmin(context: HybridAuthContext): Promise<void> {
  await assertRole(context, 'admin');
}
