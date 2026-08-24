const DB_NAME = "flamme-social-crypto";
const DB_VERSION = 1;
const KEY_STORE = "identityKeys";
const META_STORE = "meta";
const CONVERSATION_STORE = "conversationKeys";

function requireBrowserCrypto() {
  if (typeof window === "undefined" || !window.crypto?.subtle || !window.indexedDB) {
    throw new Error("Le chiffrement de Flamme nécessite un navigateur moderne avec Web Crypto et IndexedDB.");
  }
}

function openCryptoDb(): Promise<IDBDatabase> {
  requireBrowserCrypto();
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KEY_STORE)) db.createObjectStore(KEY_STORE);
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE);
      if (!db.objectStoreNames.contains(CONVERSATION_STORE)) db.createObjectStore(CONVERSATION_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Impossible d’ouvrir le coffre local Flamme."));
  });
}

async function idbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openCryptoDb();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const request = tx.objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error ?? new Error("Lecture du coffre local impossible."));
    });
  } finally {
    db.close();
  }
}

async function idbSet(storeName: string, key: string, value: unknown): Promise<void> {
  const db = await openCryptoDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Écriture du coffre local impossible."));
      tx.onabort = () => reject(tx.error ?? new Error("Écriture du coffre local annulée."));
    });
  } finally {
    db.close();
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

function randomIv() {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  return iv;
}

export type LocalIdentity = {
  privateKey: CryptoKey;
  publicJwk: JsonWebKey;
};

export async function getOrCreateLocalIdentity(userId: string): Promise<LocalIdentity> {
  requireBrowserCrypto();
  const key = `identity:${userId}`;
  const existing = await idbGet<LocalIdentity>(KEY_STORE, key);
  if (existing?.privateKey && existing?.publicJwk) return existing;

  const pair = (await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"],
  )) as CryptoKeyPair;
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const identity: LocalIdentity = { privateKey: pair.privateKey, publicJwk };
  await idbSet(KEY_STORE, key, identity);
  return identity;
}

export async function getStoredDeviceId(userId: string): Promise<string | null> {
  return (await idbGet<string>(META_STORE, `device:${userId}`)) ?? null;
}

export async function setStoredDeviceId(userId: string, deviceId: string): Promise<void> {
  await idbSet(META_STORE, `device:${userId}`, deviceId);
}

export async function saveConversationKey(conversationId: string, key: CryptoKey): Promise<void> {
  await idbSet(CONVERSATION_STORE, `conversation:${conversationId}`, key);
}

export async function getConversationKey(conversationId: string): Promise<CryptoKey | null> {
  return (await idbGet<CryptoKey>(CONVERSATION_STORE, `conversation:${conversationId}`)) ?? null;
}

export async function generateConversationKey(): Promise<CryptoKey> {
  requireBrowserCrypto();
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

async function deriveWrappingKey(
  ownPrivateKey: CryptoKey,
  remotePublicJwk: JsonWebKey,
  conversationId: string,
): Promise<CryptoKey> {
  const remotePublicKey = await crypto.subtle.importKey(
    "jwk",
    remotePublicJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: remotePublicKey },
    ownPrivateKey,
    256,
  );
  const hkdfBase = await crypto.subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey"]);
  const salt = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`flamme:${conversationId}`));
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt,
      info: new TextEncoder().encode("flamme-conversation-key-v1"),
    },
    hkdfBase,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function wrapConversationKey(
  conversationKey: CryptoKey,
  ownPrivateKey: CryptoKey,
  remotePublicJwk: JsonWebKey,
  conversationId: string,
): Promise<{ wrappedKey: string; iv: string }> {
  const wrappingKey = await deriveWrappingKey(ownPrivateKey, remotePublicJwk, conversationId);
  const rawConversationKey = await crypto.subtle.exportKey("raw", conversationKey);
  const iv = randomIv();
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, wrappingKey, rawConversationKey);
  return {
    wrappedKey: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  };
}

export async function unwrapConversationKey(
  wrappedKey: string,
  iv: string,
  ownPrivateKey: CryptoKey,
  remotePublicJwk: JsonWebKey,
  conversationId: string,
): Promise<CryptoKey> {
  const wrappingKey = await deriveWrappingKey(ownPrivateKey, remotePublicJwk, conversationId);
  const raw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    wrappingKey,
    base64ToBytes(wrappedKey),
  );
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

export async function encryptMessage(key: CryptoKey, plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  requireBrowserCrypto();
  const iv = randomIv();
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return { ciphertext: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv) };
}

export async function decryptMessage(key: CryptoKey, ciphertext: string, iv: string): Promise<string> {
  requireBrowserCrypto();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ciphertext),
  );
  return new TextDecoder().decode(decrypted);
}
