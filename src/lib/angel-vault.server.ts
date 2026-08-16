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

let cache: VaultFile | null = null;

function loadVaultSync(): VaultFile {
  if (cache) return cache;
  const raw = readFileSync(resolve(process.cwd(), "config/angel-os-secrets.enc.json"), "utf8");
  cache = JSON.parse(raw) as VaultFile;
  return cache;
}

function masterKey(): Buffer {
  const encoded = process.env.ANGEL_OS_VAULT_KEY?.trim();
  if (!encoded) throw new Error("ANGEL_OS_VAULT_KEY manquante.");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("ANGEL_OS_VAULT_KEY doit contenir exactement 32 octets en base64.");
  return key;
}

/**
 * Retourne un secret depuis l'environnement puis, en repli, depuis Angel Vault.
 * Cette variante synchrone permet aux clients serveur initialisés au chargement
 * (Supabase/OAuth notamment) de profiter du coffre sans exposer les valeurs.
 */
export function getVaultSecretSync(name: string): string | undefined {
  const envValue = process.env[name]?.trim();
  if (envValue) return envValue;

  const vault = loadVaultSync();
  const entry = vault.entries[name];
  if (!entry) return undefined;

  const encrypted = Buffer.from(entry.ciphertext, "base64");
  if (encrypted.length < 17) throw new Error(`Entrée de coffre invalide : ${name}`);
  const tag = encrypted.subarray(encrypted.length - 16);
  const ciphertext = encrypted.subarray(0, encrypted.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", masterKey(), Buffer.from(entry.nonce, "base64"));
  decipher.setAAD(Buffer.from(entry.aad, "utf8"));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export async function getVaultSecret(name: string): Promise<string | undefined> {
  return getVaultSecretSync(name);
}

export function hasVaultSecretSync(name: string): boolean {
  if (process.env[name]?.trim()) return true;
  if (!process.env.ANGEL_OS_VAULT_KEY?.trim()) return false;
  try {
    return Boolean(loadVaultSync().entries[name]);
  } catch {
    return false;
  }
}

/**
 * Sous-clé déterministe dérivée de la clé maître. Cela évite de multiplier les
 * secrets racine dans Vercel tout en séparant cryptographiquement les usages.
 */
export function deriveVaultKeySync(purpose: string): Buffer {
  return createHmac("sha256", masterKey())
    .update(`angel-os:derived:${purpose}:v1`, "utf8")
    .digest();
}

export async function requireVaultSecret(name: string): Promise<string> {
  const value = getVaultSecretSync(name);
  if (!value) throw new Error(`Secret ${name} introuvable dans l'environnement ou Angel Vault.`);
  return value;
}

export async function getVaultStatus() {
  const vault = loadVaultSync();
  return {
    configured: Boolean(process.env.ANGEL_OS_VAULT_KEY),
    cipher: vault.cipher,
    version: vault.version,
    entries: Object.keys(vault.entries),
  };
}
