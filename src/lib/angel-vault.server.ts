import { createDecipheriv, createHmac } from "node:crypto";
import encryptedVault from "../../config/angel-os-secrets.enc.json";

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
let masterKeyCache: Buffer | null = null;
const decryptedCache = new Map<string, string>();
const derivedKeyCache = new Map<string, Buffer>();

function isVaultFile(value: unknown): value is VaultFile {
  if (!value || typeof value !== "object") return false;
  const raw = value as Partial<VaultFile>;
  return raw.version === 1
    && raw.cipher === "AES-256-GCM"
    && raw.kdf === "raw-base64-32"
    && Boolean(raw.entries && typeof raw.entries === "object");
}

function parseVaultBundle(raw: string): VaultFile | null {
  try {
    const text = raw.trim().startsWith("{")
      ? raw.trim()
      : Buffer.from(raw.trim(), "base64").toString("utf8");
    const parsed = JSON.parse(text) as unknown;
    return isVaultFile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function loadVaultSync(): VaultFile | null {
  if (vaultCache) return vaultCache;

  // Override d'urgence possible sans nouveau build : JSON ou JSON encodé base64.
  const runtimeBundle = process.env.ANGEL_OS_VAULT_BUNDLE?.trim();
  if (runtimeBundle) {
    const parsed = parseVaultBundle(runtimeBundle);
    if (parsed) {
      vaultCache = parsed;
      return vaultCache;
    }
    console.warn("[angel-vault] ANGEL_OS_VAULT_BUNDLE invalide, utilisation du coffre embarqué.");
  }

  // Import statique : Vite/Nitro est obligé d'embarquer ce JSON dans le bundle
  // SSR. On ne dépend donc plus de /var/task/config ni de readFileSync().
  const bundled = encryptedVault as unknown;
  if (isVaultFile(bundled)) {
    vaultCache = bundled;
    return vaultCache;
  }

  console.error("[angel-vault] coffre embarqué invalide ou absent");
  return null;
}

function masterKey(): Buffer {
  if (masterKeyCache) return masterKeyCache;
  let encoded = process.env.ANGEL_OS_VAULT_KEY?.trim();
  if (!encoded) throw new Error("ANGEL_OS_VAULT_KEY manquante.");

  // Accepte aussi par sécurité une valeur copiée depuis un fichier
  // `ANGEL_OS_VAULT_KEY=...` au lieu de la seule valeur base64.
  if (encoded.startsWith("ANGEL_OS_VAULT_KEY=")) encoded = encoded.slice("ANGEL_OS_VAULT_KEY=".length).trim();
  encoded = encoded.replace(/^['\"]|['\"]$/g, "");

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
    source: process.env.ANGEL_OS_VAULT_BUNDLE?.trim() ? "runtime-bundle" : "build-bundle",
    cipher: vault?.cipher ?? null,
    version: vault?.version ?? null,
    entries: vault ? Object.keys(vault.entries) : [],
    cachedSecrets: decryptedCache.size,
  };
}
