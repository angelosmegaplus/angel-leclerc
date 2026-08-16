import { createDecipheriv, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type VaultEntry = {
  nonce: string;
  ciphertext: string;
  aad: string;
};

type VaultFile = {
  version: 1;
  cipher: "AES-256-GCM";
  kdf: "raw-base64-32";
  entries: Record<string, VaultEntry>;
};

let vaultCache: VaultFile | null = null;
let vaultUnavailable = false;
let masterKeyCache: Buffer | null = null;
const decryptedCache = new Map<string, string>();
const derivedKeyCache = new Map<string, Buffer>();

function loadVaultSync(): VaultFile | null {
  if (vaultCache) return vaultCache;
  if (vaultUnavailable) return null;

  try {
    const raw = readFileSync(resolve(process.cwd(), "config/angel-os-secrets.enc.json"), "utf8");
    vaultCache = JSON.parse(raw) as VaultFile;
    return vaultCache;
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
    if (code === "ENOENT") {
      // Vercel/Nitro can omit non-imported config files from the server bundle.
      // Direct environment variables remain the primary runtime source, so a
      // missing optional vault file must never crash unrelated integrations.
      vaultUnavailable = true;
      return null;
    }
    throw error;
  }
}

function masterKey(): Buffer {
  if (masterKeyCache) return masterKeyCache;
  const encoded = process.env.ANGEL_OS_VAULT_KEY?.trim();
  if (!encoded) throw new Error("ANGEL_OS_VAULT_KEY manquante.");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("ANGEL_OS_VAULT_KEY doit contenir exactement 32 octets en base64.");
  masterKeyCache = key;
  return key;
}

/**
 * Résolution serveur ultra-courte :
 * 1. variable d'environnement directe ;
 * 2. secret déjà déchiffré en mémoire ;
 * 3. déchiffrement AES-256-GCM une seule fois par instance serveur.
 */
export function getVaultSecretSync(name: string): string | undefined {
  const envValue = process.env[name]?.trim();
  if (envValue) return envValue;

  const cached = decryptedCache.get(name);
  if (cached) return cached;

  const vault = loadVaultSync();
  if (!vault) return undefined;
  const entry = vault.entries[name];
  if (!entry) return undefined;

  const encrypted = Buffer.from(entry.ciphertext, "base64");
  if (encrypted.length < 17) throw new Error(`Entrée de coffre invalide : ${name}`);
  const tag = encrypted.subarray(encrypted.length - 16);
  const ciphertext = encrypted.subarray(0, encrypted.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", masterKey(), Buffer.from(entry.nonce, "base64"));
  decipher.setAAD(Buffer.from(entry.aad, "utf8"));
  decipher.setAuthTag(tag);
  const value = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  decryptedCache.set(name, value);
  return value;
}

export async function getVaultSecret(name: string): Promise<string | undefined> {
  return getVaultSecretSync(name);
}

export function hasVaultSecretSync(name: string): boolean {
  if (process.env[name]?.trim() || decryptedCache.has(name)) return true;
  if (!process.env.ANGEL_OS_VAULT_KEY?.trim()) return false;
  try {
    return Boolean(loadVaultSync()?.entries[name]);
  } catch {
    return false;
  }
}

export function getVaultSecretSource(name: string): "env" | "vault" | "missing" {
  if (process.env[name]?.trim()) return "env";
  if (hasVaultSecretSync(name)) return "vault";
  return "missing";
}

/** Sous-clés séparées, calculées une seule fois par instance serveur. */
export function deriveVaultKeySync(purpose: string): Buffer {
  const cached = derivedKeyCache.get(purpose);
  if (cached) return cached;
  const key = createHmac("sha256", masterKey())
    .update(`angel-os:derived:${purpose}:v1`, "utf8")
    .digest();
  derivedKeyCache.set(purpose, key);
  return key;
}

export async function requireVaultSecret(name: string): Promise<string> {
  const value = getVaultSecretSync(name);
  if (!value) throw new Error(`Secret ${name} introuvable dans l'environnement ou Angel Vault.`);
  return value;
}

export function warmVaultSecrets(names: string[]): { loaded: string[]; missing: string[]; durationMs: number } {
  const started = performance.now();
  const loaded: string[] = [];
  const missing: string[] = [];
  for (const name of names) {
    try {
      if (getVaultSecretSync(name)) loaded.push(name);
      else missing.push(name);
    } catch {
      missing.push(name);
    }
  }
  return { loaded, missing, durationMs: Math.round((performance.now() - started) * 100) / 100 };
}

export async function getVaultStatus() {
  const vault = loadVaultSync();
  return {
    configured: Boolean(process.env.ANGEL_OS_VAULT_KEY),
    available: Boolean(vault),
    cipher: vault?.cipher ?? null,
    version: vault?.version ?? null,
    entries: vault ? Object.keys(vault.entries) : [],
    cachedSecrets: decryptedCache.size,
  };
}
