import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { AngelOSAdapterRegistry } from '../../angel-os/core/adapter-registry';
import { identityServerAdapter, type AngelIdentityClient } from '../../angel-os/adapters/identity.server';

const adapters = new AngelOSAdapterRegistry();
adapters.register(identityServerAdapter);

const inputSchema = z.object({ identifier: z.string().email(), secret: z.string().min(8) });

export const openAngelIdentitySession = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    if (!process.env.ANGEL_IDENTITY_URL) return { ok: false as const, unavailable: true as const };
    try {
      const client = await adapters.connect<AngelIdentityClient>('angel.identity.native');
      const session = await client.login(data.identifier, data.secret);
      return { ok: true as const, ...session };
    } catch {
      return { ok: false as const, unavailable: false as const };
    }
  });
