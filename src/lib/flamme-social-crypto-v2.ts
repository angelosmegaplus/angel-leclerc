const DB_NAME = "flamme-social-crypto";
const DB_VERSION = 1;
const KEY_STORE = "identityKeys";
const META_STORE = "meta";
const CONVERSATION_STORE = "conversationKeys";

function requireBrowserCrypto() {
  if (typeof window === "undefined" || !window.crypto?.subtle || !window.indexedDB) throw new Error("Le chiffrement de Flamme nécessite Web Crypto et IndexedDB.");
}

function openDb(): Promise<IDBDatabase> {
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
    request.onerror = () => reject(request.error ?? new Error("Coffre local indisponible."));
  });
}

async function getValue<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDb();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const request = db.transaction(store, "readonly").objectStore(store).get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

async function setValue(store: string, key: string, value: unknown) {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + 0x8000, bytes.length)));
  return btoa(binary);
}

function base64ToBuffer(value: string): ArrayBuffer {
  const binary = atob(value);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) view[i] = binary.charCodeAt(i);
  return buffer;
}

function newIv(): Uint8Array<ArrayBuffer> {
  const iv = new Uint8Array(new ArrayBuffer(12));
  crypto.getRandomValues(iv);
  return iv;
}

export type LocalIdentity = { privateKey: CryptoKey; publicJwk: JsonWebKey };

export async function getOrCreateLocalIdentity(userId: string): Promise<LocalIdentity> {
  const storageKey = `identity:${userId}`;
  const existing = await getValue<LocalIdentity>(KEY_STORE, storageKey);
  if (existing?.privateKey && existing.publicJwk) return existing;
  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]) as CryptoKeyPair;
  const identity = { privateKey: pair.privateKey, publicJwk: await crypto.subtle.exportKey("jwk", pair.publicKey) };
  await setValue(KEY_STORE, storageKey, identity);
  return identity;
}

export async function getStoredDeviceId(userId: string) { return (await getValue<string>(META_STORE, `device:${userId}`)) ?? null; }
export async function setStoredDeviceId(userId: string, deviceId: string) { await setValue(META_STORE, `device:${userId}`, deviceId); }
export async function saveConversationKey(conversationId: string, key: CryptoKey) { await setValue(CONVERSATION_STORE, `conversation:${conversationId}`, key); }
export async function getConversationKey(conversationId: string) { return (await getValue<CryptoKey>(CONVERSATION_STORE, `conversation:${conversationId}`)) ?? null; }
export async function generateConversationKey() { return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]); }

async function deriveWrappingKey(privateKey: CryptoKey, remoteJwk: JsonWebKey, conversationId: string) {
  const remoteKey = await crypto.subtle.importKey("jwk", remoteJwk, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = await crypto.subtle.deriveBits({ name: "ECDH", public: remoteKey }, privateKey, 256);
  const base = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
  const salt = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`flamme:${conversationId}`));
  return crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt, info: new TextEncoder().encode("flamme-conversation-key-v1") }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export async function wrapConversationKey(key: CryptoKey, privateKey: CryptoKey, remoteJwk: JsonWebKey, conversationId: string) {
  const wrapping = await deriveWrappingKey(privateKey, remoteJwk, conversationId);
  const iv = newIv();
  const raw = await crypto.subtle.exportKey("raw", key);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, wrapping, raw);
  return { wrappedKey: bytesToBase64(new Uint8Array(ciphertext)), iv: bytesToBase64(iv) };
}

export async function unwrapConversationKey(wrapped: string, ivValue: string, privateKey: CryptoKey, remoteJwk: JsonWebKey, conversationId: string) {
  const wrapping = await deriveWrappingKey(privateKey, remoteJwk, conversationId);
  const raw = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBuffer(ivValue) }, wrapping, base64ToBuffer(wrapped));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

export async function encryptMessage(key: CryptoKey, plaintext: string) {
  const iv = newIv();
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
  return { ciphertext: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv) };
}

export async function decryptMessage(key: CryptoKey, ciphertext: string, ivValue: string) {
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBuffer(ivValue) }, key, base64ToBuffer(ciphertext));
  return new TextDecoder().decode(decrypted);
}
