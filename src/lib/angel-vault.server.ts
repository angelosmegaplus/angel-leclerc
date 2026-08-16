import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const VERSION = 1 as const;
const ALGORITHM = "aes-256-gcm" as const;
const IV_BYTES = 12;
const TAG_BYTES = 16;

export type AngelVaultEnvelope = {
  v: typeof VERSION;
  alg: typeof ALGORITHM;
  kid: string;
  iv: string;
  tag: string;
  ciphertext: string;
  createdAt: string;
};

function getMasterKey(): Buffer {
  const raw = process.env.ANGEL_OS_VAULT_KEY?.trim();
  if (!raw) {
    throw new Error("ANGEL_OS_VAULT_KEY is missing. Configure it only in the server environment or secret manager.");
  }

  let key: Buffer;
  try {
    key = Buffer.from(raw, "base64");
  } catch {
    throw new Error("ANGEL_OS_VAULT_KEY must be a base64-encoded 32-byte key.");
  }

  if (key.length !== 32) {
    throw new Error("ANGEL_OS_VAULT_KEY must decode to exactly 32 bytes.");
  }

  return key;
}

function keyId(key: Buffer): string {
  return createHash("sha256").update(key).digest("hex").slice(0, 16);
}

export function encryptAngelSecret(value: string, context = "angel-os"): AngelVaultEnvelope {
  const key = getMasterKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(Buffer.from(context, "utf8"));

  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(value, "utf8")),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    v: VERSION,
    alg: ALGORITHM,
    kid: keyId(key),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: encrypted.toString("base64"),
    createdAt: new Date().toISOString(),
  };
}

export function decryptAngelSecret(envelope: AngelVaultEnvelope, context = "angel-os"): string {
  if (envelope.v !== VERSION || envelope.alg !== ALGORITHM) {
    throw new Error("Unsupported Angel OS vault envelope.");
  }

  const key = getMasterKey();
  if (envelope.kid !== keyId(key)) {
    throw new Error("ANGEL_OS_VAULT_KEY does not match this encrypted secret.");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(envelope.iv, "base64"),
    { authTagLength: TAG_BYTES },
  );
  decipher.setAAD(Buffer.from(context, "utf8"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));

  const clear = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64")),
    decipher.final(),
  ]);

  return clear.toString("utf8");
}

export function isAngelVaultConfigured(): boolean {
  try {
    getMasterKey();
    return true;
  } catch {
    return false;
  }
}
