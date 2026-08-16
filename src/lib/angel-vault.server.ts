import { createHash, createHmac } from "node:crypto";

const derivedKeyCache = new Map<string, Buffer>();

/**
 * Couche de compatibilité historique.
 * Angel OS ne lit plus aucun coffre ni fichier chiffré : toutes les valeurs
 * d'API viennent directement des variables d'environnement du serveur.
 */
export function getVaultSecretSync(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export async function getVaultSecret(name: string): Promise<string | undefined> {
  return getVaultSecretSync(name);
}

export function hasVaultSecretSync(name: string): boolean {
  return Boolean(getVaultSecretSync(name));
}

export function getVaultSecretSource(name: string): "env" | "missing" {
  return getVaultSecretSync(name) ? "env" : "missing";
}

function legacyOAuthRoot(): Buffer | null {
  let encoded = process.env.ANGEL_OS_VAULT_KEY?.trim();
  if (!encoded) return null;
  if (encoded.startsWith("ANGEL_OS_VAULT_KEY=")) encoded = encoded.slice("ANGEL_OS_VAULT_KEY=".length).trim();
  encoded = encoded.replace(/^['\"]|['\"]$/g, "");
  const key = Buffer.from(encoded, "base64");
  return key.length === 32 ? key : null;
}

/**
 * Compatibilité OAuth uniquement : l'ancienne clé maître peut encore relire
 * les jetons OAuth existants. Elle n'est jamais utilisée pour charger une API.
 */
export function deriveVaultKeySync(purpose: string): Buffer {
  const cached = derivedKeyCache.get(purpose);
  if (cached) return cached;

  const legacy = legacyOAuthRoot();
  if (legacy) {
    const key = createHmac("sha256", legacy)
      .update(`angel-os:derived:${purpose}:v1`, "utf8")
      .digest();
    derivedKeyCache.set(purpose, key);
    return key;
  }

  const explicit = process.env[purpose]?.trim();
  const base = explicit
    || process.env.OAUTH_TOKEN_SECRET?.trim()
    || process.env.OAUTH_STATE_SECRET?.trim()
    || process.env.GOOGLE_CLIENT_SECRET?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || process.env.SUPABASE_SECRET_KEY?.trim();

  if (!base) throw new Error(`Secret serveur manquant pour ${purpose}. Configure GOOGLE_CLIENT_SECRET ou OAUTH_TOKEN_SECRET dans Vercel.`);

  const root = createHash("sha256").update(base, "utf8").digest();
  const key = createHmac("sha256", root)
    .update(`angel-os:derived:${purpose}:v2`, "utf8")
    .digest();
  derivedKeyCache.set(purpose, key);
  return key;
}

export async function requireVaultSecret(name: string): Promise<string> {
  const value = getVaultSecretSync(name);
  if (!value) throw new Error(`Secret ${name} introuvable dans les variables d'environnement Vercel.`);
  return value;
}

export function warmVaultSecrets(names: string[]): { loaded: string[]; missing: string[]; durationMs: number } {
  const started = performance.now();
  const loaded: string[] = [];
  const missing: string[] = [];
  for (const name of names) {
    if (getVaultSecretSync(name)) loaded.push(name);
    else missing.push(name);
  }
  return { loaded, missing, durationMs: Math.round((performance.now() - started) * 100) / 100 };
}

export async function getVaultStatus() {
  return {
    configured: true,
    available: true,
    source: "vercel-environment",
    cipher: null,
    version: null,
    entries: [],
    cachedSecrets: 0,
  };
}
