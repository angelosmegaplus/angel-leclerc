import { getVaultSecretSync } from "./angel-vault.server";

export type CredentialCandidate = {
  value: string;
  name: string;
  slot: number;
  source: "env" | "angel-vault";
};

export type CredentialPairCandidate = {
  first: CredentialCandidate;
  second: CredentialCandidate;
  slot: number;
};

const preferred = new Map<string, { name: string; until: number }>();
const quarantined = new Map<string, number>();

const PREFERRED_TTL_MS = 10 * 60_000;
const QUARANTINE_MS = 45_000;

function variants(base: string, slots = 5) {
  return Array.from({ length: slots }, (_, i) => i === 0 ? base : `${base}_${i + 1}`);
}

function read(name: string): CredentialCandidate | null {
  const env = process.env[name]?.trim();
  if (env) return { value: env, name, slot: slotFromName(name), source: "env" };
  const vault = getVaultSecretSync(name)?.trim();
  if (vault) return { value: vault, name, slot: slotFromName(name), source: "angel-vault" };
  return null;
}

function slotFromName(name: string) {
  const match = name.match(/_(\d+)$/);
  return match ? Number(match[1]) : 1;
}

function healthyNow(name: string, now = Date.now()) {
  const until = quarantined.get(name) ?? 0;
  if (until <= now) {
    if (until) quarantined.delete(name);
    return true;
  }
  return false;
}

function prioritize(poolId: string, items: CredentialCandidate[]) {
  const now = Date.now();
  const preferredName = preferred.get(poolId);
  const currentPreferred = preferredName && preferredName.until > now ? preferredName.name : null;
  if (preferredName && preferredName.until <= now) preferred.delete(poolId);

  return [...items]
    .filter((item) => healthyNow(item.name, now))
    .sort((a, b) => {
      if (a.name === currentPreferred) return -1;
      if (b.name === currentPreferred) return 1;
      return a.slot - b.slot;
    });
}

export function getCredentialPoolSync(poolId: string, bases: string | string[], slots = 5): CredentialCandidate[] {
  const names = (Array.isArray(bases) ? bases : [bases]).flatMap((base) => variants(base, slots));
  const seen = new Set<string>();
  const values: CredentialCandidate[] = [];
  for (const name of names) {
    const item = read(name);
    if (!item || seen.has(item.value)) continue;
    seen.add(item.value);
    values.push(item);
  }
  return prioritize(poolId, values);
}

export function getCredentialPairPoolSync(poolId: string, firstBase: string, secondBase: string, slots = 5): CredentialPairCandidate[] {
  const pairs: CredentialPairCandidate[] = [];
  for (let i = 1; i <= slots; i += 1) {
    const suffix = i === 1 ? "" : `_${i}`;
    const first = read(`${firstBase}${suffix}`);
    const second = read(`${secondBase}${suffix}`);
    if (first && second) pairs.push({ first, second, slot: i });
  }

  const now = Date.now();
  const pref = preferred.get(poolId);
  const preferredName = pref && pref.until > now ? pref.name : null;
  if (pref && pref.until <= now) preferred.delete(poolId);

  return pairs
    .filter((pair) => healthyNow(`${pair.first.name}+${pair.second.name}`, now))
    .sort((a, b) => {
      const aName = `${a.first.name}+${a.second.name}`;
      const bName = `${b.first.name}+${b.second.name}`;
      if (aName === preferredName) return -1;
      if (bName === preferredName) return 1;
      return a.slot - b.slot;
    });
}

export function markCredentialHealthy(poolId: string, candidate: CredentialCandidate | CredentialPairCandidate) {
  const name = "value" in candidate
    ? candidate.name
    : `${candidate.first.name}+${candidate.second.name}`;
  preferred.set(poolId, { name, until: Date.now() + PREFERRED_TTL_MS });
  quarantined.delete(name);
}

export function quarantineCredential(candidate: CredentialCandidate | CredentialPairCandidate, cooldownMs = QUARANTINE_MS) {
  const name = "value" in candidate
    ? candidate.name
    : `${candidate.first.name}+${candidate.second.name}`;
  quarantined.set(name, Date.now() + cooldownMs);
}

export async function selectHealthyCredential<T extends CredentialCandidate>(params: {
  poolId: string;
  candidates: T[];
  test: (candidate: T, signal: AbortSignal) => Promise<boolean>;
  timeoutMs?: number;
}): Promise<T | null> {
  for (const candidate of params.candidates) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), params.timeoutMs ?? 1800);
    try {
      if (await params.test(candidate, controller.signal)) {
        markCredentialHealthy(params.poolId, candidate);
        return candidate;
      }
      quarantineCredential(candidate);
    } catch {
      quarantineCredential(candidate);
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

export function credentialPoolSnapshot(poolId: string, bases: string | string[], slots = 5) {
  const candidates = getCredentialPoolSync(poolId, bases, slots);
  return candidates.map(({ name, slot, source }) => ({ name, slot, source }));
}
