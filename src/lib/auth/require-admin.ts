import { resolveUserRole } from './roles';

export async function assertAngelAdmin(context: any) {
  const role = await resolveUserRole(context);
  if (role !== 'admin') throw new Error("Accès réservé à l'administrateur.");
  return role;
}
