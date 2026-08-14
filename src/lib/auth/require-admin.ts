export async function assertAngelAdmin(context: any) {
  const { assertAdmin } = await import('./authorization.server');
  await assertAdmin(context);
  return 'admin' as const;
}
