/** Anti-robot local : petit calcul signé côté serveur. */

const TTL_MS = 15 * 60 * 1000;

function localSecret(): string {
  // Utilise un secret Vercel s'il existe, sinon un fallback local afin que le CAPTCHA
  // reste immédiatement fonctionnel sans configuration externe.
  return process.env["CAPTCHA_SECRET"] || "angel-leclerc-local-captcha-v1";
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(localSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type Challenge = { question: string; token: string };

export async function createChallenge(): Promise<Challenge> {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  const plus = Math.random() > 0.4 || b > a;
  const answer = plus ? a + b : a - b;
  const question = plus ? `${a} + ${b}` : `${a} - ${b}`;
  const expiry = Date.now() + TTL_MS;
  const signature = await sign(`${expiry}.${answer}`);
  return { question, token: `${expiry}.${signature}` };
}

export async function verifyChallenge(token: string, answer: string): Promise<boolean> {
  const [rawExpiry, signature] = token.split(".");
  const expiry = Number(rawExpiry);
  if (!signature || !Number.isFinite(expiry) || expiry < Date.now()) return false;

  const parsed = Number(answer.trim());
  if (!Number.isInteger(parsed)) return false;

  const expected = await sign(`${expiry}.${parsed}`);
  if (expected.length !== signature.length) return false;

  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}
