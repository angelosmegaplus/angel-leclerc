/** Anti-robot local autonome : petit calcul avec expiration. */

export async function verifyChallenge(token: string, answer: string): Promise<boolean> {
  const [rawExpiry, rawExpected] = token.split(".");
  const expiry = Number(rawExpiry);
  const expected = Number(rawExpected);
  const parsed = Number(answer.trim());

  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  if (!Number.isInteger(expected) || !Number.isInteger(parsed)) return false;

  return parsed === expected;
}
