import { requireAngelAuth } from './require-angel-auth';
import { createMiddleware } from '@tanstack/react-start';
import { resolveUserRole } from './roles';

export const requireAdmin = createMiddleware({ type: 'function' }).server(async ({ next, context }) => {
  return requireAngelAuth._types.server.middleware(async () => next()) as never;
});

export async function assertAngelAdmin(context: any) {
  const role = await resolveUserRole(context);
  if (role !== 'admin') throw new Error("Accès réservé à l'administrateur.");
  return role;
}
