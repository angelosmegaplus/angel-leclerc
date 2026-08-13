/** Vérification minimale du calcul local, sans clé, secret ni service externe. */
export async function verifyChallenge(token: string, answer: string): Promise<boolean> {
  const expected = Number(token.trim());
  const parsed = Number(answer.trim());

  if (!Number.isInteger(expected) || !Number.isInteger(parsed)) return false;
  return parsed === expected;
}
